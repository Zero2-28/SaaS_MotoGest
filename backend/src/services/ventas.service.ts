import prisma from "../lib/prisma";
import { AppError } from "../lib/appError";
import type { Prisma } from "@prisma/client";
import { enviarComprobanteVenta } from "./email.service";
import { notificarAdminsService, notificarVendedoresSucursalService } from "./notificaciones.service";

// Genera el número correlativo dentro de la transacción para evitar duplicados concurrentes
const generateNumeroVenta = async (tx: Prisma.TransactionClient): Promise<string> => {
  const year = new Date().getFullYear();
  const prefix = `VTA-${year}-`;
  const last = await tx.venta.findFirst({
    where: { numeroVenta: { startsWith: prefix } },
    orderBy: { numeroVenta: "desc" },
  });
  const lastSeq = last ? Number(last.numeroVenta.slice(-4)) : 0;
  return `${prefix}${String(lastSeq + 1).padStart(4, "0")}`;
};

// Campos de detalle con producto incluido para respuestas completas
const includeDetalleProducto = {
  detalles: { include: { producto: { select: { id: true, codigo: true, nombre: true } } } },
  cliente: { select: { id: true, nombre: true, email: true } },
  sucursal: { select: { id: true, nombre: true, ubicacion: true } },
} as const;

export const createVentaService = async (input: {
  clienteId?: number;
  sucursalId: number;
  detalles: Array<{ productoId: number; cantidad: number; precioUnitario: number }>;
  descuento?: number;
  metodoPago?: string;
}) => {
  if (input.detalles.length === 0) {
    throw new AppError("Detalle de venta requerido", 400);
  }

  const venta = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    // Verificar stock antes de crear
    const inventarioItems = await tx.inventarioSucursal.findMany({
      where: {
        sucursalId: input.sucursalId,
        productoId: { in: input.detalles.map((d) => d.productoId) },
      },
    });

    type InvItem = (typeof inventarioItems)[number];
    for (const detalle of input.detalles) {
      const inv = inventarioItems.find((i: InvItem) => i.productoId === detalle.productoId);
      if (!inv || inv.cantidad < detalle.cantidad) {
        throw new AppError(
          `Stock insuficiente para productoId ${detalle.productoId}`,
          400
        );
      }
    }

    const subtotal = input.detalles.reduce(
      (sum, d) => sum + d.cantidad * d.precioUnitario,
      0
    );
    const impuesto = 0;
    const descuento = input.descuento ?? 0;
    const total = subtotal + impuesto - descuento;

    const numeroVenta = await generateNumeroVenta(tx);

    const venta = await tx.venta.create({
      data: {
        numeroVenta,
        clienteId: input.clienteId ?? null,
        sucursalId: input.sucursalId,
        estado: "completada",
        subtotal,
        impuesto,
        descuento,
        total,
        metodoPago: input.metodoPago,
        detalles: {
          create: input.detalles.map((d) => ({
            productoId: d.productoId,
            cantidad: d.cantidad,
            precioUnitario: d.precioUnitario,
            subtotal: d.cantidad * d.precioUnitario,
          })),
        },
      },
      include: includeDetalleProducto,
    });

    // Descontar stock y registrar movimientos
    for (const detalle of input.detalles) {
      await tx.inventarioSucursal.update({
        where: {
          productoId_sucursalId: {
            productoId: detalle.productoId,
            sucursalId: input.sucursalId,
          },
        },
        data: { cantidad: { decrement: detalle.cantidad } },
      });

      await tx.movimientoInventario.create({
        data: {
          productoId: detalle.productoId,
          sucursalId: input.sucursalId,
          tipo: "salida",
          cantidad: detalle.cantidad,
          motivo: "venta",
          referenciaId: venta.id,
        },
      });
    }

    return venta;
  });

  // Fire-and-forget: enviar comprobante al cliente si tiene email
  if (venta.cliente?.email) {
    void enviarComprobanteVenta(
      {
        numeroVenta: venta.numeroVenta,
        total: venta.total,
        subtotal: venta.subtotal,
        descuento: venta.descuento,
        metodoPago: venta.metodoPago,
        detalles: venta.detalles,
      },
      { nombre: venta.cliente.nombre, email: venta.cliente.email }
    ).catch((err: unknown) => console.error("Error email comprobante venta:", err));
  }

  // Fire-and-forget: notificar nueva venta online a admins y vendedores de la sucursal
  if (input.clienteId != null) {
    void Promise.all([
      notificarAdminsService({
        tipo: "pedido_nuevo",
        titulo: "Nueva venta online",
        mensaje: `Venta ${venta.numeroVenta} — S/. ${venta.total.toFixed(2)}`,
      }),
      notificarVendedoresSucursalService({
        sucursalId: input.sucursalId,
        tipo: "pedido_nuevo",
        titulo: "Nueva venta online",
        mensaje: `Venta ${venta.numeroVenta} — S/. ${venta.total.toFixed(2)}`,
      }),
    ]).catch((err: unknown) => console.error("Error notificación nueva venta:", err));
  }

  // Fire-and-forget: notificar stock bajo si algún producto quedó bajo el mínimo
  void (async () => {
    const productoIds = input.detalles.map((d) => d.productoId);
    const inventarios = await prisma.inventarioSucursal.findMany({
      where: { sucursalId: input.sucursalId, productoId: { in: productoIds } },
      include: { producto: { select: { nombre: true, codigo: true } } },
    });
    const bajos = inventarios.filter((inv) => inv.cantidad <= inv.stockMinimo);
    await Promise.all(
      bajos.flatMap((inv) => {
        const notifData = {
          tipo: "stock_bajo",
          titulo: "Stock bajo detectado",
          mensaje: `Producto "${inv.producto.nombre}" (${inv.producto.codigo ?? ""}) tiene ${inv.cantidad} unidades (mínimo: ${inv.stockMinimo}).`,
        };
        return [
          notificarAdminsService(notifData),
          notificarVendedoresSucursalService({ sucursalId: input.sucursalId, ...notifData }),
        ];
      })
    );
  })().catch((err: unknown) => console.error("Error notificación stock bajo post-venta:", err));

  return venta;
};

export const listVentasService = async (input?: {
  sucursalId?: number;
  desde?: Date;
  hasta?: Date;
}) => {
  const where: Prisma.VentaWhereInput = {};

  if (input?.sucursalId) where.sucursalId = input.sucursalId;

  if (input?.desde ?? input?.hasta) {
    where.fechaVenta = {
      ...(input?.desde ? { gte: input.desde } : {}),
      ...(input?.hasta ? { lte: input.hasta } : {}),
    };
  }

  return prisma.venta.findMany({
    where,
    orderBy: { id: "desc" },
    include: includeDetalleProducto,
  });
};

export const getVentaByIdService = async (id: number) => {
  const venta = await prisma.venta.findUnique({
    where: { id },
    include: {
      ...includeDetalleProducto,
      pagos: true,
      comprobante: true,
    },
  });
  if (!venta) throw new AppError("Venta no encontrada", 404);
  return venta;
};

// Totales por día, agrupando en JS para evitar SQL raw
const groupByDay = (ventas: Array<{ total: number; fechaVenta: Date }>) => {
  const map = new Map<string, { ventas: number; monto: number }>();
  for (const v of ventas) {
    const key = v.fechaVenta.toISOString().slice(0, 10);
    const prev = map.get(key) ?? { ventas: 0, monto: 0 };
    map.set(key, { ventas: prev.ventas + 1, monto: prev.monto + v.total });
  }
  return Array.from(map.entries())
    .map(([fecha, data]) => ({ fecha, ...data }))
    .sort((a, b) => a.fecha.localeCompare(b.fecha));
};

export const reportesVentasService = async (sucursalId?: number) => {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const selectFields = { total: true, fechaVenta: true } as const;
  const excluirCanceladas = { estado: { not: "cancelada" } } as const;
  const filtroSucursal = sucursalId ? { sucursalId } : {};

  const [ventasHoy, ventasSemana, ventasMes] = await Promise.all([
    prisma.venta.findMany({
      where: { ...excluirCanceladas, ...filtroSucursal, fechaVenta: { gte: startOfToday } },
      select: selectFields,
    }),
    prisma.venta.findMany({
      where: { ...excluirCanceladas, ...filtroSucursal, fechaVenta: { gte: startOfWeek } },
      select: selectFields,
    }),
    prisma.venta.findMany({
      where: { ...excluirCanceladas, ...filtroSucursal, fechaVenta: { gte: startOfMonth } },
      select: selectFields,
    }),
  ]);

  const sumar = (arr: Array<{ total: number }>) =>
    arr.reduce((s, v) => s + v.total, 0);

  return {
    hoy: {
      totalVentas: ventasHoy.length,
      montoTotal: sumar(ventasHoy),
    },
    semana: {
      totalVentas: ventasSemana.length,
      montoTotal: sumar(ventasSemana),
      porDia: groupByDay(ventasSemana),
    },
    mes: {
      totalVentas: ventasMes.length,
      montoTotal: sumar(ventasMes),
      porDia: groupByDay(ventasMes),
    },
  };
};

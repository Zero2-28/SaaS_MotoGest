import prisma from "../lib/prisma";
import { AppError } from "../lib/appError";
import type { Prisma } from "@prisma/client";
import { enviarConfirmacionPedido, enviarCambioEstadoPedido } from "./email.service";
import { notificarPorRolService } from "./notificaciones.service";

// Genera el código correlativo dentro de la transacción para evitar duplicados concurrentes
const generateCodigoPedido = async (tx: Prisma.TransactionClient): Promise<string> => {
  const year = new Date().getFullYear();
  const prefix = `CT-${year}-`;
  const last = await tx.pedido.findFirst({
    where: { codigoPedido: { startsWith: prefix } },
    orderBy: { codigoPedido: "desc" },
  });
  const lastSeq = last ? Number(last.codigoPedido.slice(-4)) : 0;
  return `${prefix}${String(lastSeq + 1).padStart(4, "0")}`;
};

export const createPedidoService = async (input: {
  clienteId: number;
  detalles: Array<{ productoId: number; cantidad: number }>;
  observaciones?: string;
}) => {
  const pedido = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    // Verificar que el cliente exista
    const cliente = await tx.cliente.findUnique({
      where: { id: input.clienteId },
      select: { id: true, nombre: true, email: true },
    });
    if (!cliente) throw new AppError("Cliente no encontrado", 404);

    // Obtener precios de los productos para calcular el total
    const productoIds = input.detalles.map((d) => d.productoId);
    const productos = await tx.producto.findMany({
      where: { id: { in: productoIds }, activo: true },
      select: { id: true, nombre: true, precioVenta: true },
    });

    if (productos.length !== productoIds.length) {
      throw new AppError("Uno o más productos no encontrados o inactivos", 400);
    }

    type ProductoRow = (typeof productos)[number];

    // Construir detalles enriquecidos y calcular subtotal
    const detallesEnriquecidos = input.detalles.map((d) => {
      const p = productos.find((x: ProductoRow) => x.id === d.productoId);
      return {
        productoId: d.productoId,
        nombre: p?.nombre ?? "",
        cantidad: d.cantidad,
        precioUnitario: p?.precioVenta ?? 0,
        subtotal: (p?.precioVenta ?? 0) * d.cantidad,
      };
    });

    const subtotal = detallesEnriquecidos.reduce((sum, d) => sum + d.subtotal, 0);
    const total = subtotal; // sin impuesto adicional

    const codigoPedido = await generateCodigoPedido(tx);

    // Pedido no tiene tabla de detalles propia; se serializan en observaciones
    // si el usuario no proporcionó notas propias
    const observacionesFinales =
      input.observaciones ?? JSON.stringify(detallesEnriquecidos);

    return tx.pedido.create({
      data: {
        codigoPedido,
        clienteId: input.clienteId,
        estado: "pendiente",
        subtotal,
        impuesto: 0,
        total,
        observaciones: observacionesFinales,
        historial: {
          create: [{ estado: "pendiente", comentario: "Pedido creado" }],
        },
      },
      include: {
        historial: { orderBy: { fecha: "asc" } },
        cliente: { select: { id: true, nombre: true, email: true } },
      },
    });
  });

  // Fire-and-forget: email de confirmación al cliente
  if (pedido.cliente.email) {
    void enviarConfirmacionPedido(
      { codigoPedido: pedido.codigoPedido, total: pedido.total, observaciones: pedido.observaciones },
      { nombre: pedido.cliente.nombre, email: pedido.cliente.email }
    ).catch((err: unknown) => console.error("Error email confirmación pedido:", err));
  }

  // Fire-and-forget: notificación interna a vendedores del nuevo pedido
  void notificarPorRolService({
    rolId: 2,
    tipo: "pedido_nuevo",
    titulo: "Nuevo pedido recibido",
    mensaje: `Pedido ${pedido.codigoPedido} de ${pedido.cliente.nombre} por S/ ${pedido.total.toFixed(2)}.`,
  }).catch((err: unknown) => console.error("Error notificación pedido nuevo:", err));

  return pedido;
};

export const listPedidosService = async (input?: { clienteId?: number }) => {
  return prisma.pedido.findMany({
    where: input?.clienteId ? { clienteId: input.clienteId } : undefined,
    orderBy: { id: "desc" },
    include: {
      cliente: { select: { id: true, nombre: true, email: true } },
      usuario: { select: { id: true, nombre: true } },
      historial: { orderBy: { fecha: "asc" } },
    },
  });
};

export const getPedidoPublicoService = async (codigo: string) => {
  const pedido = await prisma.pedido.findUnique({
    where: { codigoPedido: codigo },
    select: {
      codigoPedido: true,
      estado: true,
      fechaPedido: true,
      fechaEntrega: true,
      total: true,
      observaciones: true,
      cliente: { select: { direccion: true } },
      usuario: { select: { nombre: true } },
      historial: {
        select: { estado: true, fecha: true, comentario: true },
        orderBy: { fecha: "asc" },
      },
    },
  });

  if (pedido) {
    const { cliente, usuario, ...rest } = pedido;
    return {
      ...rest,
      direccionEntrega: cliente?.direccion ?? null,
      repartidorNombre: usuario?.nombre ?? null,
    };
  }

  // Fallback: buscar por número de venta (VTA-...)
  const venta = await prisma.venta.findUnique({
    where: { numeroVenta: codigo },
    select: {
      numeroVenta: true,
      estado: true,
      fechaVenta: true,
      total: true,
      detalles: {
        select: {
          cantidad: true,
          precioUnitario: true,
          subtotal: true,
          producto: { select: { nombre: true } },
        },
      },
    },
  });

  if (!venta) throw new AppError("Pedido no encontrado", 404);

  const observaciones = JSON.stringify(
    venta.detalles.map((d) => ({
      nombre: d.producto.nombre,
      cantidad: d.cantidad,
      precioUnitario: d.precioUnitario,
      subtotal: d.subtotal,
    }))
  );

  return {
    codigoPedido: venta.numeroVenta,
    estado: venta.estado,
    fechaPedido: venta.fechaVenta,
    fechaEntrega: null as Date | null,
    total: venta.total,
    observaciones,
    historial: [] as { estado: string; fecha: Date; comentario: string | null }[],
    direccionEntrega: null as string | null,
    repartidorNombre: null as string | null,
  };
};

export const updateEstadoPedidoService = async (input: {
  id: number;
  estado: string;
  comentario?: string;
  repartidorId?: number;
}) => {
  const pedidoActual = await prisma.pedido.findUnique({ where: { id: input.id } });
  if (!pedidoActual) throw new AppError("Pedido no encontrado", 404);
  const estadoAnterior = pedidoActual.estado;

  // Si se proporciona repartidorId, verificar que tenga rol repartidor
  if (input.repartidorId) {
    const repartidor = await prisma.usuario.findUnique({
      where: { id: input.repartidorId },
      include: { rol: true },
    });
    if (!repartidor) throw new AppError("Repartidor no encontrado", 404);
    if (repartidor.rol.name !== "repartidor") {
      throw new AppError("El usuario seleccionado no tiene rol de repartidor", 400);
    }
  }

  const updated = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const pedidoData: { estado: string; usuarioId?: number } = { estado: input.estado };
    if (input.repartidorId !== undefined) pedidoData.usuarioId = input.repartidorId;

    const [result] = await Promise.all([
      tx.pedido.update({
        where: { id: input.id },
        data: pedidoData,
        include: {
          historial: { orderBy: { fecha: "asc" } },
          cliente: { select: { id: true, nombre: true, email: true } },
          usuario: { select: { id: true, nombre: true } },
        },
      }),
      tx.historialPedido.create({
        data: { pedidoId: input.id, estado: input.estado, comentario: input.comentario },
      }),
    ]);
    return result;
  });

  if (updated.cliente.email) {
    void enviarCambioEstadoPedido(
      { codigoPedido: updated.codigoPedido, estado: updated.estado },
      { nombre: updated.cliente.nombre, email: updated.cliente.email },
      estadoAnterior
    ).catch((err: unknown) => console.error("Error email cambio estado pedido:", err));
  }

  return updated;
};

// Crea un Pedido (CT) a partir de una venta online, sin email ni notificación.
// Los side-effects de notificación ya los maneja createVentaService.
export const createPedidoDesdeVentaService = async (input: {
  clienteId: number;
  detalles: Array<{ productoId: number; cantidad: number }>;
}): Promise<{ codigoPedido: string }> => {
  return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const productoIds = input.detalles.map((d) => d.productoId);
    const productos = await tx.producto.findMany({
      where: { id: { in: productoIds }, activo: true },
      select: { id: true, nombre: true, precioVenta: true },
    });

    type ProductoRow = (typeof productos)[number];

    const detallesEnriquecidos = input.detalles.map((d) => {
      const p = productos.find((x: ProductoRow) => x.id === d.productoId);
      return {
        productoId: d.productoId,
        nombre: p?.nombre ?? "",
        cantidad: d.cantidad,
        precioUnitario: p?.precioVenta ?? 0,
        subtotal: (p?.precioVenta ?? 0) * d.cantidad,
      };
    });

    const subtotal = detallesEnriquecidos.reduce((sum, d) => sum + d.subtotal, 0);
    const codigoPedido = await generateCodigoPedido(tx);

    await tx.pedido.create({
      data: {
        codigoPedido,
        clienteId: input.clienteId,
        estado: "pendiente",
        subtotal,
        impuesto: 0,
        total: subtotal,
        observaciones: JSON.stringify(detallesEnriquecidos),
        historial: {
          create: [{ estado: "pendiente", comentario: "Pedido generado desde venta online" }],
        },
      },
    });

    return { codigoPedido };
  });
};

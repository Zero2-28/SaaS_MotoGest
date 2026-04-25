import prisma from "../lib/prisma";
import { AppError } from "../lib/appError";
import type { Prisma } from "@prisma/client";

// Tipo base de devolución con relaciones incluidas
const devolucionInclude = {
  detalles: {
    include: { producto: { select: { id: true, nombre: true, codigo: true } } },
  },
  venta: { select: { id: true, numeroVenta: true, sucursalId: true } },
} satisfies Prisma.DevolucionInclude;

type DevolucionConRelaciones = Prisma.DevolucionGetPayload<{
  include: typeof devolucionInclude;
}>;

const generateNumeroDevolucion = async (): Promise<string> => {
  const year = new Date().getFullYear();
  const prefix = `DEV-${year}-`;
  const last = await prisma.devolucion.findFirst({
    where: { numeroDevolucion: { startsWith: prefix } },
    orderBy: { numeroDevolucion: "desc" },
  });
  const lastSeq = last ? Number(last.numeroDevolucion.slice(-4)) : 0;
  const nextSeq = String(lastSeq + 1).padStart(4, "0");
  return `${prefix}${nextSeq}`;
};

type DevolucionDetalleInput = { productoId: number; cantidad: number };
type DevolucionDetalleNormalized = {
  productoId: number;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
};

export const createDevolucionService = async (input: {
  ventaId: number;
  motivo: string;
  detalles: DevolucionDetalleInput[];
  observaciones?: string;
}): Promise<DevolucionConRelaciones> => {
  const numeroDevolucion = await generateNumeroDevolucion();
  const venta = await prisma.venta.findUnique({
    where: { id: input.ventaId },
    include: { detalles: true },
  });
  if (!venta) {
    throw new AppError("Venta no encontrada", 404);
  }

  type VentaDetalle = (typeof venta.detalles)[number];
  const detalleMap = new Map<number, VentaDetalle>(
    venta.detalles.map((detalle: VentaDetalle) => [detalle.productoId, detalle])
  );

  const detallesNormalizados: DevolucionDetalleNormalized[] = input.detalles.map(
    (detalle: DevolucionDetalleInput) => {
      const detalleVenta = detalleMap.get(detalle.productoId);
      if (!detalleVenta) {
        throw new AppError("Producto no pertenece a la venta", 400);
      }
      if (detalle.cantidad > detalleVenta.cantidad) {
        throw new AppError("Cantidad de devolución excede la venta", 400);
      }
      return {
        productoId: detalle.productoId,
        cantidad: detalle.cantidad,
        precioUnitario: detalleVenta.precioUnitario,
        subtotal: detalleVenta.precioUnitario * detalle.cantidad,
      };
    }
  );

  const subtotal = detallesNormalizados.reduce(
    (sum: number, item: DevolucionDetalleNormalized) => sum + item.subtotal,
    0
  );
  const impuesto = 0;
  const total = subtotal + impuesto;

  return prisma.devolucion.create({
    data: {
      numeroDevolucion,
      ventaId: input.ventaId,
      motivo: input.motivo,
      estado: "pendiente",
      subtotal,
      impuesto,
      total,
      observaciones: input.observaciones,
      detalles: {
        create: detallesNormalizados,
      },
    },
    include: devolucionInclude,
  });
};

export const listDevolucionesService = async (input?: {
  sucursalId?: number;
}): Promise<DevolucionConRelaciones[]> => {
  return prisma.devolucion.findMany({
    where: input?.sucursalId
      ? { venta: { sucursalId: input.sucursalId } }
      : undefined,
    orderBy: { id: "desc" },
    include: devolucionInclude,
  });
};

export const getDevolucionByIdService = async (
  id: number
): Promise<DevolucionConRelaciones> => {
  const devolucion = await prisma.devolucion.findUnique({
    where: { id },
    include: devolucionInclude,
  });
  if (!devolucion) {
    throw new AppError("Devolución no encontrada", 404);
  }
  return devolucion;
};

export const updateEstadoDevolucionService = async (input: {
  id: number;
  estado: string;
}): Promise<DevolucionConRelaciones> => {
  return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const devolucion = await tx.devolucion.findUnique({
      where: { id: input.id },
      include: devolucionInclude,
    });
    if (!devolucion) {
      throw new AppError("Devolución no encontrada", 404);
    }

    if (devolucion.estado === input.estado) {
      return devolucion;
    }

    const updated = await tx.devolucion.update({
      where: { id: input.id },
      data: { estado: input.estado },
      include: devolucionInclude,
    });

    if (input.estado === "aprobada") {
      for (const detalle of updated.detalles) {
        const existing = await tx.inventarioSucursal.findUnique({
          where: {
            productoId_sucursalId: {
              productoId: detalle.productoId,
              sucursalId: updated.venta.sucursalId,
            },
          },
        });

        if (existing) {
          await tx.inventarioSucursal.update({
            where: { id: existing.id },
            data: { cantidad: { increment: detalle.cantidad } },
          });
        } else {
          await tx.inventarioSucursal.create({
            data: {
              productoId: detalle.productoId,
              sucursalId: updated.venta.sucursalId,
              cantidad: detalle.cantidad,
            },
          });
        }

        await tx.movimientoInventario.create({
          data: {
            productoId: detalle.productoId,
            sucursalId: updated.venta.sucursalId,
            tipo: "devolucion",
            cantidad: detalle.cantidad,
            motivo: "devolucion",
            referenciaId: updated.id,
          },
        });
      }
    }

    return updated;
  });
};

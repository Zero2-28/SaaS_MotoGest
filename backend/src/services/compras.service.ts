import prisma from "../lib/prisma";
import { AppError } from "../lib/appError";
import type { Prisma } from "@prisma/client";

// ============================================================================
// TIPOS
// ============================================================================

// Compra creada — incluye detalles sin producto (uso interno post-creación)
type CompraConDetalles = Prisma.CompraGetPayload<{
  include: { detalles: true };
}>;

// Compra completa para listado y detalle — incluye proveedor y producto por ítem
type CompraCompleta = Prisma.CompraGetPayload<{
  include: { proveedor: true; detalles: { include: { producto: true } } };
}>;

// ============================================================================
// HELPERS
// ============================================================================

// Genera el correlativo CMP-YYYY-NNNN dentro de la misma tx para evitar duplicados
const generateNumeroCompra = async (
  tx: Prisma.TransactionClient
): Promise<string> => {
  const year = new Date().getFullYear();
  const prefix = `CMP-${year}-`;
  const last = await tx.compra.findFirst({
    where: { numeroCompra: { startsWith: prefix } },
    orderBy: { numeroCompra: "desc" },
  });
  const lastSeq = last ? Number(last.numeroCompra.slice(-4)) : 0;
  return `${prefix}${String(lastSeq + 1).padStart(4, "0")}`;
};

// ============================================================================
// CREAR COMPRA
// ============================================================================

// Crea orden de compra en estado 'pendiente'; no toca stock hasta que sea 'recibido'
export const createCompraService = async (input: {
  proveedorId: number;
  detalles: Array<{ productoId: number; cantidad: number; precioUnitario: number }>;
  observaciones?: string;
}): Promise<CompraConDetalles> => {
  return prisma.$transaction(async (tx) => {
    const subtotal = input.detalles.reduce(
      (sum, d) => sum + d.cantidad * d.precioUnitario,
      0
    );
    const impuesto = 0;
    const total = subtotal + impuesto;

    const numeroCompra = await generateNumeroCompra(tx);

    return tx.compra.create({
      data: {
        numeroCompra,
        proveedorId: input.proveedorId,
        estado: "pendiente",
        subtotal,
        impuesto,
        total,
        observaciones: input.observaciones,
        detalles: {
          create: input.detalles.map((d) => ({
            productoId: d.productoId,
            cantidad: d.cantidad,
            precioUnitario: d.precioUnitario,
            subtotal: d.cantidad * d.precioUnitario,
          })),
        },
      },
      include: { detalles: true },
    });
  });
};

// ============================================================================
// LISTAR COMPRAS
// ============================================================================

// Devuelve todas las compras con proveedor y productos por ítem (solo admin)
export const listComprasService = async (): Promise<CompraCompleta[]> => {
  return prisma.compra.findMany({
    orderBy: { id: "desc" },
    include: { proveedor: true, detalles: { include: { producto: true } } },
  });
};

// ============================================================================
// DETALLE POR ID
// ============================================================================

export const getCompraByIdService = async (
  id: number
): Promise<CompraCompleta> => {
  const compra = await prisma.compra.findUnique({
    where: { id },
    include: { proveedor: true, detalles: { include: { producto: true } } },
  });
  if (!compra) throw new AppError("Compra no encontrada", 404);
  return compra;
};

// ============================================================================
// ACTUALIZAR ESTADO
// ============================================================================

// Al pasar a 'recibido': incrementa stock con upsert y registra movimiento 'entrada'
export const updateEstadoCompraService = async (input: {
  id: number;
  estado: string;
  sucursalId: number;
}): Promise<CompraConDetalles> => {
  return prisma.$transaction(async (tx) => {
    const compra = await tx.compra.findUnique({
      where: { id: input.id },
      include: { detalles: true },
    });
    if (!compra) throw new AppError("Compra no encontrada", 404);

    if (compra.estado === "recibido" && input.estado !== "recibido") {
      throw new AppError("Compra ya recibida, no se puede cambiar el estado", 400);
    }
    if (compra.estado === "cancelado" && input.estado === "recibido") {
      throw new AppError("Compra cancelada no puede marcarse como recibida", 400);
    }
    // Sin cambio real de estado
    if (compra.estado === input.estado) return compra;

    const updated = await tx.compra.update({
      where: { id: input.id },
      data: { estado: input.estado },
      include: { detalles: true },
    });

    if (input.estado === "recibido") {
      for (const detalle of updated.detalles) {
        // upsert evita el find+if/else y mantiene atomicidad dentro de la tx
        await tx.inventarioSucursal.upsert({
          where: {
            productoId_sucursalId: {
              productoId: detalle.productoId,
              sucursalId: input.sucursalId,
            },
          },
          update: { cantidad: { increment: detalle.cantidad } },
          create: {
            productoId: detalle.productoId,
            sucursalId: input.sucursalId,
            cantidad: detalle.cantidad,
          },
        });

        await tx.movimientoInventario.create({
          data: {
            productoId: detalle.productoId,
            sucursalId: input.sucursalId,
            tipo: "entrada",
            cantidad: detalle.cantidad,
            motivo: "compra_recibida",
            referenciaId: updated.id,
          },
        });
      }
    }

    return updated;
  });
};

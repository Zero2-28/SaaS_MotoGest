import prisma from "../lib/prisma";
import { AppError } from "../lib/appError";
import type { Prisma, InventarioSucursal } from "@prisma/client";
import { notificarAdminsService, notificarVendedoresSucursalService } from "./notificaciones.service";

export const alertasInventarioService = async (input: {
  sucursalId?: number;
}): Promise<unknown[]> => {
  const inventario = await prisma.inventarioSucursal.findMany({
    where: {
      ...(input.sucursalId ? { sucursalId: input.sucursalId } : {}),
      producto: { activo: true },
    },
    include: {
      producto: { include: { categoria: true } },
      sucursal: true,
    },
    orderBy: { cantidad: "asc" },
  });

  type InventarioItem = (typeof inventario)[number];
  return inventario.filter(
    (item: InventarioItem) => item.cantidad < item.stockMinimo
  );
};

export const inventarioPorSucursalService = async (
  sucursalId: number
): Promise<unknown[]> => {
  const items = await prisma.inventarioSucursal.findMany({
    where: { sucursalId, producto: { activo: true } },
    include: {
      producto: { include: { categoria: true } },
      sucursal: true,
    },
    orderBy: { updatedAt: "desc" },
  });

  return items;
};

export const ajusteInventarioService = async (input: {
  productoId: number;
  sucursalId: number;
  cantidad: number;
  motivo?: string;
}): Promise<InventarioSucursal> => {
  const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const inventario = await tx.inventarioSucursal.findUnique({
      where: {
        productoId_sucursalId: {
          productoId: input.productoId,
          sucursalId: input.sucursalId,
        },
      },
    });

    if (!inventario && input.cantidad < 0) {
      throw new AppError("Inventario inexistente para ajuste negativo", 400);
    }

    const nuevoCantidad = (inventario?.cantidad ?? 0) + input.cantidad;
    if (nuevoCantidad < 0) {
      throw new AppError("Stock insuficiente para realizar ajuste", 400);
    }

    if (!inventario) {
      const [producto, sucursal] = await Promise.all([
        tx.producto.findUnique({ where: { id: input.productoId } }),
        tx.sucursal.findUnique({ where: { id: input.sucursalId } }),
      ]);
      if (!producto) {
        throw new AppError("Producto no encontrado", 404);
      }
      if (!sucursal) {
        throw new AppError("Sucursal no encontrada", 404);
      }
    }

    const updated = inventario
      ? await tx.inventarioSucursal.update({
          where: { id: inventario.id },
          data: { cantidad: nuevoCantidad },
        })
      : await tx.inventarioSucursal.create({
          data: {
            productoId: input.productoId,
            sucursalId: input.sucursalId,
            cantidad: nuevoCantidad,
          },
        });

    await tx.movimientoInventario.create({
      data: {
        productoId: input.productoId,
        sucursalId: input.sucursalId,
        tipo: "ajuste",
        cantidad: input.cantidad,
        motivo: input.motivo || "ajuste_manual",
        referenciaId: null,
      },
    });

    return updated;
  });

  // Fire-and-forget: notificar admins y vendedores de la sucursal si el stock quedó bajo
  if (result.cantidad <= result.stockMinimo) {
    const producto = await prisma.producto.findUnique({
      where: { id: input.productoId },
      select: { nombre: true, codigo: true },
    });
    const notifData = {
      tipo: "stock_bajo",
      titulo: "Stock bajo detectado",
      mensaje: `Producto "${producto?.nombre ?? input.productoId}" (${producto?.codigo ?? ""}) tiene ${result.cantidad} unidades (mínimo: ${result.stockMinimo}).`,
    };
    void Promise.all([
      notificarAdminsService(notifData),
      notificarVendedoresSucursalService({ sucursalId: input.sucursalId, ...notifData }),
    ]).catch((err: unknown) => console.error("Error notificación stock bajo:", err));
  }

  return result;
};

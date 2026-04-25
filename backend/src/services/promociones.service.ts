import prisma from "../lib/prisma";
import { AppError } from "../lib/appError";

export const listPromocionesService = async (): Promise<unknown[]> => {
  return prisma.promocion.findMany({ orderBy: { id: "desc" } });
};

export const getPromocionByIdService = async (id: number): Promise<unknown> => {
  const promocion = await prisma.promocion.findUnique({ where: { id } });
  if (!promocion) {
    throw new AppError("Promoción no encontrada", 404);
  }
  return promocion;
};

export const createPromocionService = async (data: {
  nombre: string;
  descripcion?: string;
  tipoDescuento: string;
  valor: number;
  fechaInicio: Date;
  fechaFin: Date;
  activa?: boolean;
}): Promise<unknown> => {
  return prisma.promocion.create({ data });
};

export const updatePromocionService = async (input: {
  id: number;
  data: {
    nombre?: string;
    descripcion?: string;
    tipoDescuento?: string;
    valor?: number;
    fechaInicio?: Date;
    fechaFin?: Date;
    activa?: boolean;
  };
}): Promise<unknown> => {
  const exists = await prisma.promocion.findUnique({ where: { id: input.id } });
  if (!exists) {
    throw new AppError("Promoción no encontrada", 404);
  }
  return prisma.promocion.update({ where: { id: input.id }, data: input.data });
};

export const deletePromocionService = async (id: number): Promise<unknown> => {
  const exists = await prisma.promocion.findUnique({ where: { id } });
  if (!exists) {
    throw new AppError("Promoción no encontrada", 404);
  }
  return prisma.promocion.delete({ where: { id } });
};

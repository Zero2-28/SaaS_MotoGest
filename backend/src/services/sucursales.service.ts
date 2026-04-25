import prisma from "../lib/prisma";
import { AppError } from "../lib/appError";

export const listSucursalesService = async (): Promise<unknown[]> => {
  return prisma.sucursal.findMany({ orderBy: { id: "desc" } });
};

export const getSucursalByIdService = async (id: number): Promise<unknown> => {
  const sucursal = await prisma.sucursal.findUnique({ where: { id } });
  if (!sucursal) {
    throw new AppError("Sucursal no encontrada", 404);
  }
  return sucursal;
};

export const createSucursalService = async (data: {
  nombre: string;
  ubicacion: string;
  telefono?: string;
}): Promise<unknown> => {
  return prisma.sucursal.create({ data });
};

export const updateSucursalService = async (input: {
  id: number;
  data: { nombre?: string; ubicacion?: string; telefono?: string };
}): Promise<unknown> => {
  const exists = await prisma.sucursal.findUnique({ where: { id: input.id } });
  if (!exists) {
    throw new AppError("Sucursal no encontrada", 404);
  }
  return prisma.sucursal.update({ where: { id: input.id }, data: input.data });
};

export const deleteSucursalService = async (id: number): Promise<unknown> => {
  const exists = await prisma.sucursal.findUnique({ where: { id } });
  if (!exists) {
    throw new AppError("Sucursal no encontrada", 404);
  }
  return prisma.sucursal.delete({ where: { id } });
};

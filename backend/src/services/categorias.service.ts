import prisma from "../lib/prisma";
import { AppError } from "../lib/appError";

export const listCategoriasService = async (): Promise<unknown[]> => {
  return prisma.categoria.findMany({ orderBy: { id: "desc" } });
};

export const getCategoriaByIdService = async (id: number): Promise<unknown> => {
  const categoria = await prisma.categoria.findUnique({ where: { id } });
  if (!categoria) {
    throw new AppError("Categoría no encontrada", 404);
  }
  return categoria;
};

export const createCategoriaService = async (data: {
  nombre: string;
  descripcion?: string;
  imagen_url?: string | null;
}): Promise<unknown> => {
  return prisma.categoria.create({ data });
};

export const updateCategoriaService = async (input: {
  id: number;
  data: { nombre?: string; descripcion?: string; imagen_url?: string | null };
}): Promise<unknown> => {
  const exists = await prisma.categoria.findUnique({ where: { id: input.id } });
  if (!exists) {
    throw new AppError("Categoría no encontrada", 404);
  }
  return prisma.categoria.update({ where: { id: input.id }, data: input.data });
};

export const deleteCategoriaService = async (id: number): Promise<unknown> => {
  const exists = await prisma.categoria.findUnique({ where: { id } });
  if (!exists) {
    throw new AppError("Categoría no encontrada", 404);
  }
  return prisma.categoria.delete({ where: { id } });
};

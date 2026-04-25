import prisma from "../lib/prisma";
import { AppError } from "../lib/appError";

export const listProveedoresService = async (): Promise<unknown[]> => {
  // Solo proveedores activos — el delete es lógico (activo: false)
  return prisma.proveedor.findMany({
    where:   { activo: true },
    orderBy: { id: "desc" },
  });
};

export const getProveedorByIdService = async (id: number): Promise<unknown> => {
  const proveedor = await prisma.proveedor.findUnique({ where: { id } });
  if (!proveedor) {
    throw new AppError("Proveedor no encontrado", 404);
  }
  return proveedor;
};

export const createProveedorService = async (data: {
  nombre: string;
  email?: string;
  telefono?: string;
  direccion?: string;
  tipoDocumento?: string;
  numeroDocumento?: string;
  contacto?: string;
}): Promise<unknown> => {
  return prisma.proveedor.create({ data });
};

export const updateProveedorService = async (input: {
  id: number;
  data: {
    nombre?: string;
    email?: string;
    telefono?: string;
    direccion?: string;
    tipoDocumento?: string;
    numeroDocumento?: string;
    contacto?: string;
    activo?: boolean;
  };
}): Promise<unknown> => {
  const exists = await prisma.proveedor.findUnique({ where: { id: input.id } });
  if (!exists) {
    throw new AppError("Proveedor no encontrado", 404);
  }
  return prisma.proveedor.update({ where: { id: input.id }, data: input.data });
};

export const deleteProveedorService = async (id: number): Promise<unknown> => {
  const exists = await prisma.proveedor.findUnique({ where: { id } });
  if (!exists) {
    throw new AppError("Proveedor no encontrado", 404);
  }
  return prisma.proveedor.update({ where: { id }, data: { activo: false } });
};

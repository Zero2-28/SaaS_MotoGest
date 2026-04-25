import bcrypt from "bcryptjs";
import prisma from "../lib/prisma";
import { AppError } from "../lib/appError";

export const listUsuariosService = async (): Promise<unknown[]> => {
  return prisma.usuario.findMany({
    orderBy: { id: "desc" },
    include: { rol: true, sucursal: true },
  });
};

export const getUsuarioByIdService = async (id: number): Promise<unknown> => {
  const usuario = await prisma.usuario.findUnique({
    where: { id },
    include: { rol: true, sucursal: true },
  });
  if (!usuario) {
    throw new AppError("Usuario no encontrado", 404);
  }
  return usuario;
};

export const createUsuarioService = async (data: {
  nombre: string;
  email: string;
  password: string;
  rolId: number;
  sucursalId?: number;
}): Promise<unknown> => {
  const passwordHash = await bcrypt.hash(data.password, 10);
  return prisma.usuario.create({
    data: {
      nombre: data.nombre,
      email: data.email,
      password: passwordHash,
      rolId: data.rolId,
      sucursalId: data.sucursalId ?? null,
      activo: true,
    },
  });
};

export const updateUsuarioService = async (input: {
  id: number;
  data: {
    nombre?: string;
    email?: string;
    password?: string;
    rolId?: number;
    sucursalId?: number | null;
    activo?: boolean;
  };
}): Promise<unknown> => {
  const exists = await prisma.usuario.findUnique({ where: { id: input.id } });
  if (!exists) {
    throw new AppError("Usuario no encontrado", 404);
  }

  const passwordHash = input.data.password
    ? await bcrypt.hash(input.data.password, 10)
    : undefined;

  return prisma.usuario.update({
    where: { id: input.id },
    data: {
      nombre: input.data.nombre,
      email: input.data.email,
      password: passwordHash,
      rolId: input.data.rolId,
      sucursalId: input.data.sucursalId ?? undefined,
      activo: input.data.activo,
    },
  });
};

export const deleteUsuarioService = async (id: number): Promise<unknown> => {
  const exists = await prisma.usuario.findUnique({ where: { id } });
  if (!exists) {
    throw new AppError("Usuario no encontrado", 404);
  }
  return prisma.usuario.update({ where: { id }, data: { activo: false } });
};

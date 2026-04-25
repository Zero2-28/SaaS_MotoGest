import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import prisma from "../lib/prisma";
import { AppError } from "../lib/appError";

const buildAccessToken = (payload: {
  usuarioId: number;
  email: string;
  rolId: number;
  sucursalId: number | null;
}): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new AppError("JWT_SECRET no configurado", 500);
  }
  return jwt.sign(payload, secret, { expiresIn: "15m" });
};

const generateRefreshToken = (): string => {
  return crypto.randomBytes(48).toString("hex");
};

const addDays = (days: number): Date => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
};

export const loginService = async (input: {
  email: string;
  password: string;
}): Promise<{
  accessToken: string;
  refreshToken: string;
  usuario: {
    id: number;
    nombre: string;
    email: string;
    rolId: number;
    sucursalId: number | null;
  };
}> => {
  const usuario = await prisma.usuario.findUnique({
    where: { email: input.email },
  });

  if (!usuario || !usuario.activo) {
    throw new AppError("Credenciales inválidas", 401);
  }

  const passwordOk = await bcrypt.compare(input.password, usuario.password);
  if (!passwordOk) {
    throw new AppError("Credenciales inválidas", 401);
  }

  const accessToken = buildAccessToken({
    usuarioId: usuario.id,
    email: usuario.email,
    rolId: usuario.rolId,
    sucursalId: usuario.sucursalId ?? null,
  });

  const refreshToken = generateRefreshToken();
  const expiresAt = addDays(7);

  await prisma.refreshToken.deleteMany({
    where: { usuarioId: usuario.id },
  });

  await prisma.refreshToken.create({
    data: {
      usuarioId: usuario.id,
      token: refreshToken,
      expiresAt,
    },
  });

  return {
    accessToken,
    refreshToken,
    usuario: {
      id: usuario.id,
      nombre: usuario.nombre,
      email: usuario.email,
      rolId: usuario.rolId,
      sucursalId: usuario.sucursalId,
    },
  };
};

export const logoutService = async (refreshToken: string): Promise<void> => {
  await prisma.refreshToken.deleteMany({
    where: { token: refreshToken },
  });
};

// ── Perfil del empleado autenticado ──────────────────────────────────────────

export const getMeService = async (
  usuarioId: number
): Promise<{
  id: number;
  nombre: string;
  email: string;
  activo: boolean;
  sucursalId: number | null;
  rol: { id: number; nombre: string };
  sucursal: { id: number; nombre: string; ubicacion: string } | null;
}> => {
  const usuario = await prisma.usuario.findUnique({
    where: { id: usuarioId },
    select: {
      id: true,
      nombre: true,
      email: true,
      activo: true,
      sucursalId: true,
      // El modelo Role usa 'name', no 'nombre' — lo mapeamos en el return
      rol: { select: { id: true, name: true } },
      sucursal: { select: { id: true, nombre: true, ubicacion: true } },
    },
  });
  if (!usuario) throw new AppError("Usuario no encontrado", 404);
  // Renombrar rol.name → rol.nombre para que coincida con la interfaz del frontend
  return {
    ...usuario,
    rol: { id: usuario.rol.id, nombre: usuario.rol.name },
  };
};

export const updateAvatarUrlService = async (
  usuarioId: number,
  avatarUrl: string
): Promise<void> => {
  await prisma.usuario.update({
    where: { id: usuarioId },
    data: { avatar_url: avatarUrl },
  });
};

export const changePasswordService = async (input: {
  usuarioId: number;
  passwordActual: string;
  passwordNuevo: string;
}): Promise<void> => {
  const usuario = await prisma.usuario.findUnique({
    where: { id: input.usuarioId },
    select: { id: true, password: true },
  });
  if (!usuario) throw new AppError("Usuario no encontrado", 404);

  const esValida = await bcrypt.compare(input.passwordActual, usuario.password);
  if (!esValida) throw new AppError("Contraseña actual incorrecta", 401);

  const hash = await bcrypt.hash(input.passwordNuevo, 10);
  await prisma.usuario.update({
    where: { id: input.usuarioId },
    data: { password: hash },
  });
};

// ── OAuth Google — genera tokens para un empleado ya autenticado vía Passport ─

export const oauthLoginService = async (
  usuarioId: number
): Promise<{
  accessToken: string;
  refreshToken: string;
  payload: string; // JSON base64 con datos del empleado para el redirect
}> => {
  const usuario = await prisma.usuario.findUnique({ where: { id: usuarioId } });
  if (!usuario) throw new AppError("Usuario no encontrado", 404);

  const secret = process.env.JWT_SECRET;
  if (!secret) throw new AppError("JWT_SECRET no configurado", 500);

  const accessToken = jwt.sign(
    {
      usuarioId: usuario.id,
      email: usuario.email,
      rolId: usuario.rolId,
      sucursalId: usuario.sucursalId ?? null,
    },
    secret,
    { expiresIn: "15m" }
  );

  const refreshToken = generateRefreshToken();
  const expiresAt = addDays(7);

  // Invalidar tokens anteriores y crear uno nuevo
  await prisma.refreshToken.deleteMany({ where: { usuarioId: usuario.id } });
  await prisma.refreshToken.create({
    data: { usuarioId: usuario.id, token: refreshToken, expiresAt },
  });

  // Payload codificado para pasar al frontend via URL
  const userJson = JSON.stringify({
    id: usuario.id,
    nombre: usuario.nombre,
    email: usuario.email,
    rolId: usuario.rolId,
    sucursalId: usuario.sucursalId ?? null,
    activo: usuario.activo,
    createdAt: usuario.createdAt.toISOString(),
  });
  const payload = Buffer.from(userJson).toString("base64url");

  return { accessToken, refreshToken, payload };
};

export const refreshService = async (refreshToken: string): Promise<{
  accessToken: string;
  refreshToken: string;
}> => {
  const tokenRecord = await prisma.refreshToken.findUnique({
    where: { token: refreshToken },
    include: { usuario: true },
  });

  if (!tokenRecord) {
    throw new AppError("Refresh token inválido", 401);
  }

  if (tokenRecord.expiresAt < new Date()) {
    await prisma.refreshToken.delete({ where: { id: tokenRecord.id } });
    throw new AppError("Refresh token expirado", 401);
  }

  const accessToken = buildAccessToken({
    usuarioId: tokenRecord.usuarioId,
    email: tokenRecord.usuario.email,
    rolId: tokenRecord.usuario.rolId,
    sucursalId: tokenRecord.usuario.sucursalId ?? null,
  });

  const newRefreshToken = generateRefreshToken();
  const newExpiresAt = addDays(7);

  await prisma.refreshToken.delete({ where: { id: tokenRecord.id } });
  await prisma.refreshToken.create({
    data: {
      usuarioId: tokenRecord.usuarioId,
      token: newRefreshToken,
      expiresAt: newExpiresAt,
    },
  });

  return { accessToken, refreshToken: newRefreshToken };
};

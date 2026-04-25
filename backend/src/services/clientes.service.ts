import prisma from "../lib/prisma";
import { AppError } from "../lib/appError";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { enviarBienvenidaCliente } from "./email.service";

const buildClienteAccessToken = (payload: {
  clienteId: number;
  email: string;
}): string => {
  const secret = process.env.CLIENTE_JWT_SECRET;
  if (!secret) {
    throw new AppError("CLIENTE_JWT_SECRET no configurado", 500);
  }
  return jwt.sign(payload, secret, { expiresIn: "15m" });
};

const generateClienteRefreshToken = (): string => {
  return crypto.randomBytes(48).toString("hex");
};

const addDays = (days: number): Date => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
};

export const listClientesService = async (): Promise<unknown[]> => {
  return prisma.cliente.findMany({ orderBy: { id: "desc" } });
};

export const getClienteByIdService = async (id: number): Promise<unknown> => {
  const cliente = await prisma.cliente.findUnique({ where: { id } });
  if (!cliente) {
    throw new AppError("Cliente no encontrado", 404);
  }
  return cliente;
};

export const createClienteService = async (data: {
  nombre: string;
  email?: string;
  telefono?: string;
  direccion?: string;
  ciudad?: string;
  tipoDocumento?: string;
  numeroDocumento?: string;
}): Promise<unknown> => {
  // Generar password temporal para clientes creados por empleados
  const tempPassword = crypto.randomBytes(16).toString("hex");
  const passwordHash = await bcrypt.hash(tempPassword, 10);

  return prisma.cliente.create({
    data: {
      nombre: data.nombre,
      email: data.email,
      password: passwordHash,
      telefono: data.telefono,
      direccion: data.direccion,
      ciudad: data.ciudad,
      tipoDocumento: data.tipoDocumento,
      numeroDocumento: data.numeroDocumento,
    },
  });
};

export const updateClienteService = async (input: {
  id: number;
  data: {
    nombre?: string;
    email?: string;
    telefono?: string;
    direccion?: string;
    ciudad?: string;
    tipoDocumento?: string;
    numeroDocumento?: string;
    activo?: boolean;
  };
}): Promise<unknown> => {
  const exists = await prisma.cliente.findUnique({ where: { id: input.id } });
  if (!exists) {
    throw new AppError("Cliente no encontrado", 404);
  }
  return prisma.cliente.update({ where: { id: input.id }, data: input.data });
};

export const deleteClienteService = async (id: number): Promise<unknown> => {
  const exists = await prisma.cliente.findUnique({ where: { id } });
  if (!exists) {
    throw new AppError("Cliente no encontrado", 404);
  }
  return prisma.cliente.update({ where: { id }, data: { activo: false } });
};

export const getClienteHistorialService = async (
  id: number
): Promise<unknown> => {
  const cliente = await prisma.cliente.findUnique({
    where: { id },
    include: {
      ventas: true,
      pedidos: true,
      puntosFidelizacion: true,
    },
  });
  if (!cliente) {
    throw new AppError("Cliente no encontrado", 404);
  }
  return cliente;
};

export const registerClienteService = async (data: {
  nombre: string;
  email: string;
  password: string;
  telefono?: string;
  direccion?: string;
  ciudad?: string;
  tipoDocumento?: string;
  numeroDocumento?: string;
}): Promise<{
  accessToken: string;
  refreshToken: string;
  cliente: {
    id: number;
    nombre: string;
    email: string;
  };
}> => {
  const exists = await prisma.cliente.findUnique({ where: { email: data.email } });
  if (exists) {
    throw new AppError("Email ya registrado", 400);
  }

  const passwordHash = await bcrypt.hash(data.password, 10);

  const cliente = await prisma.cliente.create({
    data: {
      nombre: data.nombre,
      email: data.email,
      password: passwordHash,
      telefono: data.telefono,
      direccion: data.direccion,
      ciudad: data.ciudad,
      tipoDocumento: data.tipoDocumento,
      numeroDocumento: data.numeroDocumento,
      activo: true,
    },
  });

  const accessToken = buildClienteAccessToken({
    clienteId: cliente.id,
    email: cliente.email || "",
  });

  const refreshToken = generateClienteRefreshToken();
  const expiresAt = addDays(7);

  await prisma.clienteRefreshToken.create({
    data: {
      clienteId: cliente.id,
      token: refreshToken,
      expiresAt,
    },
  });

  // Fire-and-forget: el email no bloquea el registro
  if (cliente.email) {
    void enviarBienvenidaCliente({ nombre: cliente.nombre, email: cliente.email }).catch(
      (err: unknown) => console.error("Error email bienvenida:", err)
    );
  }

  return {
    accessToken,
    refreshToken,
    cliente: {
      id: cliente.id,
      nombre: cliente.nombre,
      email: cliente.email || "",
    },
  };
};

export const loginClienteService = async (input: {
  email: string;
  password: string;
}): Promise<{
  accessToken: string;
  refreshToken: string;
  cliente: {
    id: number;
    nombre: string;
    email: string;
  };
}> => {
  const cliente = await prisma.cliente.findUnique({
    where: { email: input.email },
  });

  if (!cliente || !cliente.activo) {
    throw new AppError("Credenciales inválidas", 401);
  }

  const passwordOk = await bcrypt.compare(input.password, cliente.password);
  if (!passwordOk) {
    throw new AppError("Credenciales inválidas", 401);
  }

  const accessToken = buildClienteAccessToken({
    clienteId: cliente.id,
    email: cliente.email || "",
  });

  const refreshToken = generateClienteRefreshToken();
  const expiresAt = addDays(7);

  // Deletear tokens viejos
  await prisma.clienteRefreshToken.deleteMany({
    where: { clienteId: cliente.id },
  });

  // Crear nuevo token
  await prisma.clienteRefreshToken.create({
    data: {
      clienteId: cliente.id,
      token: refreshToken,
      expiresAt,
    },
  });

  return {
    accessToken,
    refreshToken,
    cliente: {
      id: cliente.id,
      nombre: cliente.nombre,
      email: cliente.email || "",
    },
  };
};

export const logoutClienteService = async (refreshToken: string): Promise<void> => {
  await prisma.clienteRefreshToken.deleteMany({
    where: { token: refreshToken },
  });
};

export const refreshClienteService = async (refreshToken: string): Promise<{
  accessToken: string;
  refreshToken: string;
}> => {
  const tokenRecord = await prisma.clienteRefreshToken.findUnique({
    where: { token: refreshToken },
    include: { cliente: true },
  });

  if (!tokenRecord) {
    throw new AppError("Refresh token inválido", 401);
  }

  if (tokenRecord.expiresAt < new Date()) {
    await prisma.clienteRefreshToken.delete({ where: { id: tokenRecord.id } });
    throw new AppError("Refresh token expirado", 401);
  }

  const accessToken = buildClienteAccessToken({
    clienteId: tokenRecord.clienteId,
    email: tokenRecord.cliente.email || "",
  });

  const newRefreshToken = generateClienteRefreshToken();
  const newExpiresAt = addDays(7);

  await prisma.clienteRefreshToken.delete({ where: { id: tokenRecord.id } });
  await prisma.clienteRefreshToken.create({
    data: {
      clienteId: tokenRecord.clienteId,
      token: newRefreshToken,
      expiresAt: newExpiresAt,
    },
  });

  return { accessToken, refreshToken: newRefreshToken };
};

// ── OAuth Google — genera tokens para un cliente ya autenticado vía Passport ──

export const oauthLoginClienteService = async (
  clienteId: number
): Promise<{
  accessToken: string;
  refreshToken: string;
  payload: string; // JSON base64 con datos del cliente para el redirect
}> => {
  const cliente = await prisma.cliente.findUnique({ where: { id: clienteId } });
  if (!cliente) throw new AppError("Cliente no encontrado", 404);

  const accessToken = buildClienteAccessToken({
    clienteId: cliente.id,
    email: cliente.email ?? "",
  });

  const refreshToken = generateClienteRefreshToken();
  const expiresAt = addDays(7);

  // Invalidar tokens anteriores y crear uno nuevo
  await prisma.clienteRefreshToken.deleteMany({ where: { clienteId: cliente.id } });
  await prisma.clienteRefreshToken.create({
    data: { clienteId: cliente.id, token: refreshToken, expiresAt },
  });

  // Payload codificado para pasar al frontend via URL
  const clienteJson = JSON.stringify({
    id: cliente.id,
    nombre: cliente.nombre,
    email: cliente.email ?? null,
    telefono: cliente.telefono ?? null,
    direccion: cliente.direccion ?? null,
    ciudad: cliente.ciudad ?? null,
    tipoDocumento: cliente.tipoDocumento ?? null,
    numeroDocumento: cliente.numeroDocumento ?? null,
    createdAt: cliente.createdAt.toISOString(),
  });
  const payload = Buffer.from(clienteJson).toString("base64url");

  return { accessToken, refreshToken, payload };
};

export const getMisPedidosService = async (
  clienteId: number
): Promise<unknown[]> => {
  return prisma.pedido.findMany({
    where: { clienteId },
    orderBy: { id: "desc" },
  });
};

export const getMisVentasService = async (clienteId: number) => {
  return prisma.venta.findMany({
    where: { clienteId },
    orderBy: { id: "desc" },
    include: {
      detalles: {
        include: {
          producto: {
            select: { id: true, codigo: true, nombre: true, imagen_url: true },
          },
        },
      },
      sucursal: { select: { id: true, nombre: true } },
    },
  });
};

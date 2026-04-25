import { Notificacion } from "@prisma/client";
import prisma from "../lib/prisma";
import { AppError } from "../lib/appError";

// ============================================================================
// CRUD BÁSICO
// ============================================================================

// Crea una notificación para un usuario específico
export const crearNotificacionService = async (data: {
  usuarioId: number;
  tipo: string;
  titulo: string;
  mensaje: string;
}): Promise<Notificacion> => {
  return prisma.notificacion.create({ data });
};

// Notifica a todos los administradores activos (rolId 1)
export const notificarAdminsService = async (data: {
  tipo: string;
  titulo: string;
  mensaje: string;
}): Promise<void> => {
  const admins = await prisma.usuario.findMany({
    where: { rolId: 1, activo: true },
    select: { id: true },
  });
  await Promise.all(
    admins.map((admin) =>
      prisma.notificacion.create({
        data: { usuarioId: admin.id, ...data },
      })
    )
  );
};

// Notifica a todos los usuarios activos de un rol determinado
export const notificarPorRolService = async (data: {
  rolId: number;
  tipo: string;
  titulo: string;
  mensaje: string;
}): Promise<void> => {
  const { rolId, ...notifData } = data;
  const usuarios = await prisma.usuario.findMany({
    where: { rolId, activo: true },
    select: { id: true },
  });
  await Promise.all(
    usuarios.map((u) =>
      prisma.notificacion.create({
        data: { usuarioId: u.id, ...notifData },
      })
    )
  );
};

// Notifica a los vendedores activos de una sucursal específica (rolId 2)
export const notificarVendedoresSucursalService = async (data: {
  sucursalId: number;
  tipo: string;
  titulo: string;
  mensaje: string;
}): Promise<void> => {
  const { sucursalId, ...notifData } = data;
  const vendedores = await prisma.usuario.findMany({
    where: { rolId: 2, sucursalId, activo: true },
    select: { id: true },
  });
  await Promise.all(
    vendedores.map((v) =>
      prisma.notificacion.create({
        data: { usuarioId: v.id, ...notifData },
      })
    )
  );
};

// ============================================================================
// CONSULTAS
// ============================================================================

// Devuelve solo las notificaciones no leídas → para badge en frontend
export const getNotificacionesNoLeidas = async (
  usuarioId: number
): Promise<Notificacion[]> => {
  return prisma.notificacion.findMany({
    where: { usuarioId, leida: false },
    orderBy: { createdAt: "desc" },
  });
};

// ============================================================================
// MARCAR COMO LEÍDA
// ============================================================================

// Marca una notificación como leída verificando la propiedad del usuario
export const marcarComoLeidaService = async (
  id: number,
  usuarioId: number
): Promise<Notificacion> => {
  const notif = await prisma.notificacion.findUnique({ where: { id } });
  if (!notif) throw new AppError("Notificación no encontrada", 404);
  if (notif.usuarioId !== usuarioId) throw new AppError("No autorizado", 403);
  return prisma.notificacion.update({ where: { id }, data: { leida: true } });
};

// Marca todas las notificaciones del usuario como leídas
export const marcarTodasLeidasService = async (
  usuarioId: number
): Promise<{ count: number }> => {
  const result = await prisma.notificacion.updateMany({
    where: { usuarioId, leida: false },
    data: { leida: true },
  });
  return { count: result.count };
};

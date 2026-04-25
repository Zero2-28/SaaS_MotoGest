import { Response } from "express";
import { z } from "zod";
import { AuthRequest } from "../middlewares/auth.middleware";
import { toAppError } from "../lib/appError";
import {
  getNotificacionesNoLeidas,
  marcarComoLeidaService,
  marcarTodasLeidasService,
} from "../services/notificaciones.service";

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
}

const sendSuccess = <T>(res: Response, data: T, statusCode = 200): void => {
  res.status(statusCode).json({ success: true, data } as ApiResponse<T>);
};

const sendError = (res: Response, message: string, statusCode = 400): void => {
  res.status(statusCode).json({ success: false, message } as ApiResponse);
};

const idParamSchema = z.object({
  id: z.string().regex(/^\d+$/, "ID inválido"),
});

// GET /notificaciones → devuelve solo las no leídas del usuario autenticado
export const listNotificaciones = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.usuarioId) {
      sendError(res, "Usuario no autenticado", 401);
      return;
    }
    const items = await getNotificacionesNoLeidas(req.usuarioId);
    sendSuccess(res, items);
  } catch (error: unknown) {
    const appError = toAppError(error);
    sendError(res, appError.message, appError.statusCode);
  }
};

// PUT /notificaciones/:id/leer → marca una notificación como leída
export const marcarLeida = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.usuarioId) {
      sendError(res, "Usuario no autenticado", 401);
      return;
    }
    const validation = idParamSchema.safeParse(req.params);
    if (!validation.success) {
      sendError(res, `Validación fallida: ${validation.error.errors[0].message}`);
      return;
    }
    const item = await marcarComoLeidaService(
      Number(validation.data.id),
      req.usuarioId
    );
    sendSuccess(res, item);
  } catch (error: unknown) {
    const appError = toAppError(error);
    sendError(res, appError.message, appError.statusCode);
  }
};

// PUT /notificaciones/leer-todas → marca todas las notificaciones del usuario como leídas
export const marcarTodasLeidas = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.usuarioId) {
      sendError(res, "Usuario no autenticado", 401);
      return;
    }
    const result = await marcarTodasLeidasService(req.usuarioId);
    sendSuccess(res, result);
  } catch (error: unknown) {
    const appError = toAppError(error);
    sendError(res, appError.message, appError.statusCode);
  }
};

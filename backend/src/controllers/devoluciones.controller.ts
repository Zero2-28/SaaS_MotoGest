import { Response } from "express";
import { z } from "zod";
import {
  createDevolucionSchema,
  updateDevolucionEstadoSchema,
} from "../schemas/schemas";
import { AuthRequest } from "../middlewares/auth.middleware";
import { toAppError } from "../lib/appError";
import {
  createDevolucionService,
  getDevolucionByIdService,
  listDevolucionesService,
  updateEstadoDevolucionService,
} from "../services/devoluciones.service";

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

export const listDevoluciones = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (req.rolId !== 1 && !req.sucursalId) {
      sendError(res, "Sucursal no asignada", 403);
      return;
    }

    const items =
      req.rolId === 1
        ? await listDevolucionesService()
        : await listDevolucionesService({ sucursalId: req.sucursalId ?? undefined });
    sendSuccess(res, items);
  } catch (error: unknown) {
    const appError = toAppError(error);
    sendError(res, appError.message, appError.statusCode);
  }
};

export const getDevolucionById = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const paramValidation = idParamSchema.safeParse(req.params);
    if (!paramValidation.success) {
      sendError(res, `Validación fallida: ${paramValidation.error.errors[0].message}`);
      return;
    }
    const devolucion = await getDevolucionByIdService(Number(paramValidation.data.id));

    // Vendedor solo puede ver devoluciones de su sucursal
    if (req.rolId !== 1 && devolucion.venta.sucursalId !== req.sucursalId) {
      sendError(res, "No autorizado para ver esta devolución", 403);
      return;
    }

    sendSuccess(res, devolucion);
  } catch (error: unknown) {
    const appError = toAppError(error);
    sendError(res, appError.message, appError.statusCode);
  }
};

export const createDevolucion = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const validation = createDevolucionSchema.safeParse(req.body);
    if (!validation.success) {
      sendError(res, `Validación fallida: ${validation.error.errors[0].message}`);
      return;
    }
    const item = await createDevolucionService(validation.data);
    sendSuccess(res, item, 201);
  } catch (error: unknown) {
    const appError = toAppError(error);
    sendError(res, appError.message, appError.statusCode);
  }
};

export const updateDevolucionEstado = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const paramValidation = idParamSchema.safeParse(req.params);
    if (!paramValidation.success) {
      sendError(res, `Validación fallida: ${paramValidation.error.errors[0].message}`);
      return;
    }
    const bodyValidation = updateDevolucionEstadoSchema.safeParse(req.body);
    if (!bodyValidation.success) {
      sendError(res, `Validación fallida: ${bodyValidation.error.errors[0].message}`);
      return;
    }
    const item = await updateEstadoDevolucionService({
      id: Number(paramValidation.data.id),
      estado: bodyValidation.data.estado,
    });
    sendSuccess(res, item);
  } catch (error: unknown) {
    const appError = toAppError(error);
    sendError(res, appError.message, appError.statusCode);
  }
};

import { Response } from "express";
import { z } from "zod";
import { inventarioAjusteSchema } from "../schemas/schemas";
import { AuthRequest } from "../middlewares/auth.middleware";
import { toAppError } from "../lib/appError";
import {
  ajusteInventarioService,
  alertasInventarioService,
  inventarioPorSucursalService,
} from "../services/inventario.service";

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

const querySucursalSchema = z.object({
  sucursalId: z.string().regex(/^\d+$/, "Sucursal inválida").optional(),
});

// ============================================================================
// GET /inventario/alertas (protected)
// ============================================================================

export const alertasInventario = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.rolId) {
      sendError(res, "Usuario no autenticado", 401);
      return;
    }

    const validation = querySucursalSchema.safeParse(req.query);
    if (!validation.success) {
      sendError(res, `Validación fallida: ${validation.error.errors[0].message}`);
      return;
    }

    const requestedSucursalId = validation.data.sucursalId
      ? Number(validation.data.sucursalId)
      : undefined;

    const sucursalId =
      req.rolId === 1 ? requestedSucursalId : req.sucursalId ?? undefined;

    if (req.rolId !== 1 && !sucursalId) {
      sendError(res, "Sucursal no asignada", 403);
      return;
    }

    const alertas = await alertasInventarioService({ sucursalId });
    sendSuccess(res, alertas);
  } catch (error: unknown) {
    console.error("Error en alertasInventario:", error);
    const appError = toAppError(error);
    sendError(res, appError.message, appError.statusCode);
  }
};

// ============================================================================
// GET /inventario/sucursal/:id (protected)
// ============================================================================

export const inventarioPorSucursal = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.rolId) {
      sendError(res, "Usuario no autenticado", 401);
      return;
    }

    const validation = idParamSchema.safeParse(req.params);
    if (!validation.success) {
      sendError(res, `Validación fallida: ${validation.error.errors[0].message}`);
      return;
    }

    const sucursalId = Number(validation.data.id);

    if (req.rolId !== 1 && req.sucursalId !== sucursalId) {
      sendError(res, "Permiso denegado para esta sucursal", 403);
      return;
    }

    const items = await inventarioPorSucursalService(sucursalId);
    sendSuccess(res, items);
  } catch (error: unknown) {
    console.error("Error en inventarioPorSucursal:", error);
    const appError = toAppError(error);
    sendError(res, appError.message, appError.statusCode);
  }
};

// ============================================================================
// POST /inventario/ajuste (protected)
// ============================================================================

export const ajusteInventario = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.rolId) {
      sendError(res, "Usuario no autenticado", 401);
      return;
    }

    const validation = inventarioAjusteSchema.safeParse(req.body);
    if (!validation.success) {
      sendError(res, `Validación fallida: ${validation.error.errors[0].message}`);
      return;
    }

    const { productoId, sucursalId, cantidad, motivo } = validation.data;

    if (req.rolId !== 1 && req.sucursalId !== sucursalId) {
      sendError(res, "Permiso denegado para esta sucursal", 403);
      return;
    }

    const result = await ajusteInventarioService({
      productoId,
      sucursalId,
      cantidad,
      motivo,
    });

    sendSuccess(res, result);
  } catch (error: unknown) {
    console.error("Error en ajusteInventario:", error);
    const appError = toAppError(error);
    sendError(res, appError.message, appError.statusCode);
  }
};

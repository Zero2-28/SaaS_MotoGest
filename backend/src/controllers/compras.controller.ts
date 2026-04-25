import { Response } from "express";
import { z } from "zod";
import {
  createCompraSchema,
  updateCompraEstadoSchema,
} from "../schemas/compras.schema";
import { AuthRequest } from "../middlewares/auth.middleware";
import { toAppError } from "../lib/appError";
import {
  createCompraService,
  getCompraByIdService,
  listComprasService,
  updateEstadoCompraService,
} from "../services/compras.service";

// ============================================================================
// HELPERS
// ============================================================================

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

// ============================================================================
// GET /compras  (solo admin)
// ============================================================================

export const listCompras = async (
  _req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const items = await listComprasService();
    sendSuccess(res, items);
  } catch (error: unknown) {
    const appError = toAppError(error);
    sendError(res, appError.message, appError.statusCode);
  }
};

// ============================================================================
// GET /compras/:id
// ============================================================================

export const getCompraById = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const validation = idParamSchema.safeParse(req.params);
    if (!validation.success) {
      sendError(res, `Validación fallida: ${validation.error.errors[0].message}`);
      return;
    }
    const item = await getCompraByIdService(Number(validation.data.id));
    sendSuccess(res, item);
  } catch (error: unknown) {
    const appError = toAppError(error);
    sendError(res, appError.message, appError.statusCode);
  }
};

// ============================================================================
// POST /compras
// ============================================================================

// Crea la orden en estado 'pendiente'; el stock se incrementa al pasar a 'recibido'
export const createCompra = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const validation = createCompraSchema.safeParse(req.body);
    if (!validation.success) {
      sendError(res, `Validación fallida: ${validation.error.errors[0].message}`);
      return;
    }
    const item = await createCompraService(validation.data);
    sendSuccess(res, item, 201);
  } catch (error: unknown) {
    const appError = toAppError(error);
    sendError(res, appError.message, appError.statusCode);
  }
};

// ============================================================================
// PUT /compras/:id/estado
// ============================================================================

// Admin pasa sucursalId en el body; vendedor/repartidor usa el del token
export const updateCompraEstado = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.rolId) {
      sendError(res, "Usuario no autenticado", 401);
      return;
    }

    const paramValidation = idParamSchema.safeParse(req.params);
    if (!paramValidation.success) {
      sendError(res, `Validación fallida: ${paramValidation.error.errors[0].message}`);
      return;
    }

    const bodyValidation = updateCompraEstadoSchema.safeParse(req.body);
    if (!bodyValidation.success) {
      sendError(res, `Validación fallida: ${bodyValidation.error.errors[0].message}`);
      return;
    }

    // rolId 1 = admin: puede especificar sucursalId en el body
    const sucursalId =
      req.rolId === 1
        ? bodyValidation.data.sucursalId
        : (req.sucursalId ?? undefined);

    if (!sucursalId) {
      sendError(res, "Sucursal requerida", 400);
      return;
    }

    const item = await updateEstadoCompraService({
      id: Number(paramValidation.data.id),
      estado: bodyValidation.data.estado,
      sucursalId,
    });
    sendSuccess(res, item);
  } catch (error: unknown) {
    const appError = toAppError(error);
    sendError(res, appError.message, appError.statusCode);
  }
};

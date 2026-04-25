import { Request, Response } from "express";
import { z } from "zod";
import {
  createPedidoSchema,
  updatePedidoEstadoSchema,
} from "../schemas/schemas";
import { AuthRequest } from "../middlewares/auth.middleware";
import { toAppError } from "../lib/appError";
import {
  createPedidoService,
  getPedidoPublicoService,
  listPedidosService,
  updateEstadoPedidoService,
} from "../services/pedidos.service";

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

const codigoParamSchema = z.object({
  codigo: z.string().min(1, "Código requerido"),
});

const idParamSchema = z.object({
  id: z.string().regex(/^\d+$/, "ID inválido"),
});

// GET /pedidos/:codigo — público, sin auth
export const getPedidoPublico = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const validation = codigoParamSchema.safeParse(req.params);
    if (!validation.success) {
      sendError(res, `Validación fallida: ${validation.error.errors[0].message}`);
      return;
    }
    const item = await getPedidoPublicoService(validation.data.codigo);
    sendSuccess(res, item);
  } catch (error: unknown) {
    const appError = toAppError(error);
    sendError(res, appError.message, appError.statusCode);
  }
};

// GET /pedidos — lista para empleados; admin ve todo, vendedor filtra por clienteId si se pasa
export const listPedidos = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const clienteIdRaw = req.query.clienteId;
    const clienteId =
      typeof clienteIdRaw === "string" && /^\d+$/.test(clienteIdRaw)
        ? Number(clienteIdRaw)
        : undefined;

    const items = await listPedidosService({ clienteId });
    sendSuccess(res, items);
  } catch (error: unknown) {
    const appError = toAppError(error);
    sendError(res, appError.message, appError.statusCode);
  }
};

// POST /pedidos
export const createPedido = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const validation = createPedidoSchema.safeParse(req.body);
    if (!validation.success) {
      sendError(res, `Validación fallida: ${validation.error.errors[0].message}`);
      return;
    }
    const item = await createPedidoService(validation.data);
    sendSuccess(res, item, 201);
  } catch (error: unknown) {
    const appError = toAppError(error);
    sendError(res, appError.message, appError.statusCode);
  }
};

// PUT /pedidos/:id/estado
export const updatePedidoEstado = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const paramValidation = idParamSchema.safeParse(req.params);
    if (!paramValidation.success) {
      sendError(res, `Validación fallida: ${paramValidation.error.errors[0].message}`);
      return;
    }
    const bodyValidation = updatePedidoEstadoSchema.safeParse(req.body);
    if (!bodyValidation.success) {
      sendError(res, `Validación fallida: ${bodyValidation.error.errors[0].message}`);
      return;
    }
    const item = await updateEstadoPedidoService({
      id: Number(paramValidation.data.id),
      estado: bodyValidation.data.estado,
      comentario: bodyValidation.data.comentario,
      repartidorId: bodyValidation.data.repartidorId,
    });
    sendSuccess(res, item);
  } catch (error: unknown) {
    const appError = toAppError(error);
    sendError(res, appError.message, appError.statusCode);
  }
};

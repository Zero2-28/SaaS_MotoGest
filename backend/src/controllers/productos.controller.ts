import { Request, Response } from "express";
import { z } from "zod";
import {
  createProductoSchema,
  updateProductoSchema,
} from "../schemas/schemas";
import { toAppError } from "../lib/appError";
import {
  createProductoService,
  deleteProductoService,
  getProductoByIdService,
  listProductosService,
  updateProductoService,
} from "../services/productos.service";

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

const parsePositiveInt = (value: string | undefined, fallback: number): number => {
  if (!value) return fallback;
  const num = Number(value);
  if (!Number.isFinite(num) || num <= 0) return fallback;
  return Math.floor(num);
};

const idParamSchema = z.object({
  id: z.string().regex(/^\d+$/, "ID inválido"),
});

// ============================================================================
// GET /productos (public catalog)
// ============================================================================

export const listProductos = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parsePositiveInt(req.query.page as string | undefined, 1);
    const limit = Math.min(
      parsePositiveInt(req.query.limit as string | undefined, 20),
      100
    );
    const search = typeof req.query.search === "string" ? req.query.search : undefined;
    const categoriaIdRaw = parsePositiveInt(req.query.categoriaId as string | undefined, 0);
    const categoriaId = categoriaIdRaw > 0 ? categoriaIdRaw : undefined;
    // activo: undefined → default true; "true" → true; "false" → false
    const activoRaw = req.query.activo;
    const activo = activoRaw === "false" ? false : activoRaw === "true" ? true : undefined;

    const result = await listProductosService({ page, limit, search, categoriaId, activo });
    sendSuccess(res, result);
  } catch (error: unknown) {
    console.error("Error en listProductos:", error);
    const appError = toAppError(error);
    sendError(res, appError.message, appError.statusCode);
  }
};

// ============================================================================
// GET /productos/:id (public catalog)
// ============================================================================

export const getProductoById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const validation = idParamSchema.safeParse(req.params);
    if (!validation.success) {
      sendError(res, `Validación fallida: ${validation.error.errors[0].message}`);
      return;
    }

    const id = Number(validation.data.id);
    const producto = await getProductoByIdService(id);
    sendSuccess(res, producto);
  } catch (error: unknown) {
    console.error("Error en getProductoById:", error);
    const appError = toAppError(error);
    sendError(res, appError.message, appError.statusCode);
  }
};

// ============================================================================
// POST /productos
// ============================================================================

export const createProducto = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const validation = createProductoSchema.safeParse(req.body);
    if (!validation.success) {
      sendError(res, `Validación fallida: ${validation.error.errors[0].message}`);
      return;
    }

    const producto = await createProductoService(validation.data);
    sendSuccess(res, producto, 201);
  } catch (error: unknown) {
    console.error("Error en createProducto:", error);
    const appError = toAppError(error);
    sendError(res, appError.message, appError.statusCode);
  }
};

// ============================================================================
// PUT /productos/:id
// ============================================================================

export const updateProducto = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const paramValidation = idParamSchema.safeParse(req.params);
    if (!paramValidation.success) {
      sendError(res, `Validación fallida: ${paramValidation.error.errors[0].message}`);
      return;
    }

    const bodyValidation = updateProductoSchema.safeParse(req.body);
    if (!bodyValidation.success) {
      sendError(res, `Validación fallida: ${bodyValidation.error.errors[0].message}`);
      return;
    }

    const id = Number(paramValidation.data.id);
    const updated = await updateProductoService({ id, data: bodyValidation.data });
    sendSuccess(res, updated);
  } catch (error: unknown) {
    console.error("Error en updateProducto:", error);
    const appError = toAppError(error);
    sendError(res, appError.message, appError.statusCode);
  }
};

// ============================================================================
// DELETE /productos/:id (soft delete)
// ============================================================================

export const deleteProducto = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const validation = idParamSchema.safeParse(req.params);
    if (!validation.success) {
      sendError(res, `Validación fallida: ${validation.error.errors[0].message}`);
      return;
    }

    const id = Number(validation.data.id);
    const updated = await deleteProductoService(id);
    sendSuccess(res, updated);
  } catch (error: unknown) {
    console.error("Error en deleteProducto:", error);
    const appError = toAppError(error);
    sendError(res, appError.message, appError.statusCode);
  }
};

import { Request, Response } from "express";
import { z } from "zod";
import { createCategoriaSchema, updateCategoriaSchema } from "../schemas/schemas";
import { toAppError } from "../lib/appError";
import {
  createCategoriaService,
  deleteCategoriaService,
  getCategoriaByIdService,
  listCategoriasService,
  updateCategoriaService,
} from "../services/categorias.service";

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

export const listCategorias = async (_req: Request, res: Response): Promise<void> => {
  try {
    const items = await listCategoriasService();
    sendSuccess(res, items);
  } catch (error: unknown) {
    const appError = toAppError(error);
    sendError(res, appError.message, appError.statusCode);
  }
};

export const getCategoriaById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const validation = idParamSchema.safeParse(req.params);
    if (!validation.success) {
      sendError(res, `Validación fallida: ${validation.error.errors[0].message}`);
      return;
    }
    const item = await getCategoriaByIdService(Number(validation.data.id));
    sendSuccess(res, item);
  } catch (error: unknown) {
    const appError = toAppError(error);
    sendError(res, appError.message, appError.statusCode);
  }
};

export const createCategoria = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const validation = createCategoriaSchema.safeParse(req.body);
    if (!validation.success) {
      sendError(res, `Validación fallida: ${validation.error.errors[0].message}`);
      return;
    }
    const item = await createCategoriaService(validation.data);
    sendSuccess(res, item, 201);
  } catch (error: unknown) {
    const appError = toAppError(error);
    sendError(res, appError.message, appError.statusCode);
  }
};

export const updateCategoria = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const paramValidation = idParamSchema.safeParse(req.params);
    if (!paramValidation.success) {
      sendError(res, `Validación fallida: ${paramValidation.error.errors[0].message}`);
      return;
    }
    const bodyValidation = updateCategoriaSchema.safeParse(req.body);
    if (!bodyValidation.success) {
      sendError(res, `Validación fallida: ${bodyValidation.error.errors[0].message}`);
      return;
    }
    const item = await updateCategoriaService({
      id: Number(paramValidation.data.id),
      data: bodyValidation.data,
    });
    sendSuccess(res, item);
  } catch (error: unknown) {
    const appError = toAppError(error);
    sendError(res, appError.message, appError.statusCode);
  }
};

export const deleteCategoria = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const validation = idParamSchema.safeParse(req.params);
    if (!validation.success) {
      sendError(res, `Validación fallida: ${validation.error.errors[0].message}`);
      return;
    }
    const item = await deleteCategoriaService(Number(validation.data.id));
    sendSuccess(res, item);
  } catch (error: unknown) {
    const appError = toAppError(error);
    sendError(res, appError.message, appError.statusCode);
  }
};

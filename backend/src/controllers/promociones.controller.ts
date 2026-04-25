import { Request, Response } from "express";
import { z } from "zod";
import { createPromocionSchema, updatePromocionSchema } from "../schemas/schemas";
import { toAppError } from "../lib/appError";
import {
  createPromocionService,
  deletePromocionService,
  getPromocionByIdService,
  listPromocionesService,
  updatePromocionService,
} from "../services/promociones.service";

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

export const listPromociones = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    const items = await listPromocionesService();
    sendSuccess(res, items);
  } catch (error: unknown) {
    const appError = toAppError(error);
    sendError(res, appError.message, appError.statusCode);
  }
};

export const getPromocionById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const validation = idParamSchema.safeParse(req.params);
    if (!validation.success) {
      sendError(res, `Validación fallida: ${validation.error.errors[0].message}`);
      return;
    }
    const item = await getPromocionByIdService(Number(validation.data.id));
    sendSuccess(res, item);
  } catch (error: unknown) {
    const appError = toAppError(error);
    sendError(res, appError.message, appError.statusCode);
  }
};

export const createPromocion = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const validation = createPromocionSchema.safeParse(req.body);
    if (!validation.success) {
      sendError(res, `Validación fallida: ${validation.error.errors[0].message}`);
      return;
    }
    const item = await createPromocionService(validation.data);
    sendSuccess(res, item, 201);
  } catch (error: unknown) {
    const appError = toAppError(error);
    sendError(res, appError.message, appError.statusCode);
  }
};

export const updatePromocion = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const paramValidation = idParamSchema.safeParse(req.params);
    if (!paramValidation.success) {
      sendError(res, `Validación fallida: ${paramValidation.error.errors[0].message}`);
      return;
    }
    const bodyValidation = updatePromocionSchema.safeParse(req.body);
    if (!bodyValidation.success) {
      sendError(res, `Validación fallida: ${bodyValidation.error.errors[0].message}`);
      return;
    }
    const item = await updatePromocionService({
      id: Number(paramValidation.data.id),
      data: bodyValidation.data,
    });
    sendSuccess(res, item);
  } catch (error: unknown) {
    const appError = toAppError(error);
    sendError(res, appError.message, appError.statusCode);
  }
};

export const deletePromocion = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const validation = idParamSchema.safeParse(req.params);
    if (!validation.success) {
      sendError(res, `Validación fallida: ${validation.error.errors[0].message}`);
      return;
    }
    const item = await deletePromocionService(Number(validation.data.id));
    sendSuccess(res, item);
  } catch (error: unknown) {
    const appError = toAppError(error);
    sendError(res, appError.message, appError.statusCode);
  }
};

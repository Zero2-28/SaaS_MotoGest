import { Request, Response } from "express";
import { toAppError } from "../lib/appError";
import {
  reporteComprasService,
  reporteDevolucionesService,
  reporteInventarioBajoService,
  reporteProductosTopService,
  reporteVentasService,
  reporteVentasSucursalService,
} from "../services/reportes.service";

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

const parseDate = (value: string | undefined): Date | undefined => {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
};

const parseLimit = (value: string | undefined, defaultVal: number): number => {
  const parsed = parseInt(value ?? "", 10);
  return Number.isNaN(parsed) || parsed < 1 ? defaultVal : parsed;
};

// ============================================================================
// GET /reportes/ventas?from=&to=
// ============================================================================

export const reporteVentas = async (req: Request, res: Response): Promise<void> => {
  try {
    const from = parseDate(req.query.from as string | undefined);
    const to = parseDate(req.query.to as string | undefined);
    const data = await reporteVentasService({ from, to });
    sendSuccess(res, data);
  } catch (error: unknown) {
    const appError = toAppError(error);
    sendError(res, appError.message, appError.statusCode);
  }
};

// ============================================================================
// GET /reportes/productos-top?from=&to=&limit=10
// ============================================================================

export const reporteProductosTop = async (req: Request, res: Response): Promise<void> => {
  try {
    const from = parseDate(req.query.from as string | undefined);
    const to = parseDate(req.query.to as string | undefined);
    const limit = parseLimit(req.query.limit as string | undefined, 10);
    const data = await reporteProductosTopService({ from, to, limit });
    sendSuccess(res, data);
  } catch (error: unknown) {
    const appError = toAppError(error);
    sendError(res, appError.message, appError.statusCode);
  }
};

// ============================================================================
// GET /reportes/inventario-bajo?sucursalId=
// ============================================================================

export const reporteInventarioBajo = async (req: Request, res: Response): Promise<void> => {
  try {
    const sucursalIdRaw = req.query.sucursalId as string | undefined;
    const sucursalId = sucursalIdRaw ? parseInt(sucursalIdRaw, 10) : undefined;
    if (sucursalIdRaw && (sucursalId === undefined || Number.isNaN(sucursalId))) {
      sendError(res, "sucursalId inválido");
      return;
    }
    const data = await reporteInventarioBajoService({ sucursalId });
    sendSuccess(res, data);
  } catch (error: unknown) {
    const appError = toAppError(error);
    sendError(res, appError.message, appError.statusCode);
  }
};

// ============================================================================
// GET /reportes/compras?from=&to=
// ============================================================================

export const reporteCompras = async (req: Request, res: Response): Promise<void> => {
  try {
    const from = parseDate(req.query.from as string | undefined);
    const to = parseDate(req.query.to as string | undefined);
    const data = await reporteComprasService({ from, to });
    sendSuccess(res, data);
  } catch (error: unknown) {
    const appError = toAppError(error);
    sendError(res, appError.message, appError.statusCode);
  }
};

// ============================================================================
// GET /reportes/ventas-sucursal?from=&to=
// ============================================================================

export const reporteVentasSucursal = async (req: Request, res: Response): Promise<void> => {
  try {
    const from = parseDate(req.query.from as string | undefined);
    const to = parseDate(req.query.to as string | undefined);
    const data = await reporteVentasSucursalService({ from, to });
    sendSuccess(res, data);
  } catch (error: unknown) {
    const appError = toAppError(error);
    sendError(res, appError.message, appError.statusCode);
  }
};

// ============================================================================
// GET /reportes/devoluciones?from=&to=
// ============================================================================

export const reporteDevoluciones = async (req: Request, res: Response): Promise<void> => {
  try {
    const from = parseDate(req.query.from as string | undefined);
    const to = parseDate(req.query.to as string | undefined);
    const data = await reporteDevolucionesService({ from, to });
    sendSuccess(res, data);
  } catch (error: unknown) {
    const appError = toAppError(error);
    sendError(res, appError.message, appError.statusCode);
  }
};

import { Request, Response } from "express";
import { z } from "zod";
import { crearIntentoPagoSchema } from "../schemas/pagos.schema";
import { toAppError } from "../lib/appError";
import {
  crearIntentoPagoService,
  getPagoByIdService,
  getMetodosPagoService,
  procesarWebhookStripeService,
} from "../services/pagos.service";

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
// POST /pagos/crear-intento
// ============================================================================

// Crea un PaymentIntent de Stripe y registra el pago como 'pendiente'
export const crearIntentoPago = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const validation = crearIntentoPagoSchema.safeParse(req.body);
    if (!validation.success) {
      sendError(res, `Validación fallida: ${validation.error.errors[0].message}`);
      return;
    }
    const result = await crearIntentoPagoService(validation.data);
    sendSuccess(res, result, 201);
  } catch (error: unknown) {
    const appError = toAppError(error);
    sendError(res, appError.message, appError.statusCode);
  }
};

// ============================================================================
// POST /pagos/webhook
// ============================================================================

// Recibe eventos de Stripe — requiere express.raw() para verificar la firma
export const webhookStripe = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const signature = req.headers["stripe-signature"];
    if (!signature || typeof signature !== "string") {
      sendError(res, "Firma Stripe inválida", 400);
      return;
    }
    const payload = req.body as Buffer;
    if (!Buffer.isBuffer(payload)) {
      sendError(res, "Payload inválido: el webhook requiere raw body", 400);
      return;
    }
    await procesarWebhookStripeService({ signature, payload });
    sendSuccess(res, { received: true });
  } catch (error: unknown) {
    const appError = toAppError(error);
    sendError(res, appError.message, appError.statusCode);
  }
};

// ============================================================================
// GET /pagos/metodos  (solo admin)
// ============================================================================

// Devuelve resumen de pagos completados agrupados por método de pago
export const getMetodosPago = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    const resumen = await getMetodosPagoService();
    sendSuccess(res, resumen);
  } catch (error: unknown) {
    const appError = toAppError(error);
    sendError(res, appError.message, appError.statusCode);
  }
};

// ============================================================================
// GET /pagos/:id
// ============================================================================

export const getPagoById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const validation = idParamSchema.safeParse(req.params);
    if (!validation.success) {
      sendError(res, `Validación fallida: ${validation.error.errors[0].message}`);
      return;
    }
    const item = await getPagoByIdService(Number(validation.data.id));
    sendSuccess(res, item);
  } catch (error: unknown) {
    const appError = toAppError(error);
    sendError(res, appError.message, appError.statusCode);
  }
};

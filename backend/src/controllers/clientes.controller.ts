import { NextFunction, Request, Response } from "express";
import { z } from "zod";
import passport from "passport";
import { Cliente } from "@prisma/client";
import {
  clienteLoginSchema,
  clienteRegisterSchema,
  createClienteSchema,
  updateClienteSchema,
  refreshTokenSchema,
} from "../schemas/schemas";
import { ClienteAuthRequest } from "../middlewares/clienteAuth.middleware";
import { toAppError } from "../lib/appError";
import {
  createClienteService,
  deleteClienteService,
  getClienteByIdService,
  getClienteHistorialService,
  getMisPedidosService,
  getMisVentasService,
  loginClienteService,
  listClientesService,
  registerClienteService,
  updateClienteService,
  logoutClienteService,
  refreshClienteService,
  oauthLoginClienteService,
} from "../services/clientes.service";

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

export const listClientes = async (_req: Request, res: Response): Promise<void> => {
  try {
    const items = await listClientesService();
    sendSuccess(res, items);
  } catch (error: unknown) {
    const appError = toAppError(error);
    sendError(res, appError.message, appError.statusCode);
  }
};

export const getClienteById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const validation = idParamSchema.safeParse(req.params);
    if (!validation.success) {
      sendError(res, `Validación fallida: ${validation.error.errors[0].message}`);
      return;
    }
    const item = await getClienteByIdService(Number(validation.data.id));
    sendSuccess(res, item);
  } catch (error: unknown) {
    const appError = toAppError(error);
    sendError(res, appError.message, appError.statusCode);
  }
};

export const getClienteHistorial = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const validation = idParamSchema.safeParse(req.params);
    if (!validation.success) {
      sendError(res, `Validación fallida: ${validation.error.errors[0].message}`);
      return;
    }
    const item = await getClienteHistorialService(Number(validation.data.id));
    sendSuccess(res, item);
  } catch (error: unknown) {
    const appError = toAppError(error);
    sendError(res, appError.message, appError.statusCode);
  }
};

export const createCliente = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const validation = createClienteSchema.safeParse(req.body);
    if (!validation.success) {
      sendError(res, `Validación fallida: ${validation.error.errors[0].message}`);
      return;
    }
    const item = await createClienteService(validation.data);
    sendSuccess(res, item, 201);
  } catch (error: unknown) {
    const appError = toAppError(error);
    sendError(res, appError.message, appError.statusCode);
  }
};

export const registerCliente = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const validation = clienteRegisterSchema.safeParse(req.body);
    if (!validation.success) {
      sendError(res, `Validación fallida: ${validation.error.errors[0].message}`);
      return;
    }
    const result = await registerClienteService(validation.data);
    sendSuccess(res, result, 201);
  } catch (error: unknown) {
    const appError = toAppError(error);
    sendError(res, appError.message, appError.statusCode);
  }
};

export const loginCliente = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const validation = clienteLoginSchema.safeParse(req.body);
    if (!validation.success) {
      sendError(res, `Validación fallida: ${validation.error.errors[0].message}`);
      return;
    }
    const result = await loginClienteService(validation.data);
    sendSuccess(res, result);
  } catch (error: unknown) {
    const appError = toAppError(error);
    sendError(res, appError.message, appError.statusCode);
  }
};

export const misPedidosCliente = async (
  req: ClienteAuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.clienteId) {
      sendError(res, "Cliente no autenticado", 401);
      return;
    }
    const items = await getMisPedidosService(req.clienteId);
    sendSuccess(res, items);
  } catch (error: unknown) {
    const appError = toAppError(error);
    sendError(res, appError.message, appError.statusCode);
  }
};

export const misComprasCliente = async (
  req: ClienteAuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.clienteId) {
      sendError(res, "Cliente no autenticado", 401);
      return;
    }
    const items = await getMisVentasService(req.clienteId);
    sendSuccess(res, items);
  } catch (error: unknown) {
    const appError = toAppError(error);
    sendError(res, appError.message, appError.statusCode);
  }
};

export const logoutCliente = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const validation = refreshTokenSchema.safeParse(req.body);
    if (!validation.success) {
      sendError(
        res,
        `Validación fallida: ${validation.error.errors[0].message}`,
        400
      );
      return;
    }

    const { refreshToken } = validation.data;
    await logoutClienteService(refreshToken);

    sendSuccess(res, { message: "Logout exitoso" });
  } catch (error: unknown) {
    console.error("Error en logout cliente:", error);
    const appError = toAppError(error);
    sendError(res, appError.message, appError.statusCode);
  }
};

export const refreshCliente = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const validation = refreshTokenSchema.safeParse(req.body);
    if (!validation.success) {
      sendError(
        res,
        `Validación fallida: ${validation.error.errors[0].message}`,
        400
      );
      return;
    }

    const { refreshToken } = validation.data;
    const result = await refreshClienteService(refreshToken);
    sendSuccess(res, result);
  } catch (error: unknown) {
    console.error("Error en refresh cliente:", error);
    const appError = toAppError(error);
    sendError(res, appError.message, appError.statusCode);
  }
};

export const updateCliente = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const paramValidation = idParamSchema.safeParse(req.params);
    if (!paramValidation.success) {
      sendError(res, `Validación fallida: ${paramValidation.error.errors[0].message}`);
      return;
    }
    const bodyValidation = updateClienteSchema.safeParse(req.body);
    if (!bodyValidation.success) {
      sendError(res, `Validación fallida: ${bodyValidation.error.errors[0].message}`);
      return;
    }
    const item = await updateClienteService({
      id: Number(paramValidation.data.id),
      data: bodyValidation.data,
    });
    sendSuccess(res, item);
  } catch (error: unknown) {
    const appError = toAppError(error);
    sendError(res, appError.message, appError.statusCode);
  }
};

export const deleteCliente = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const validation = idParamSchema.safeParse(req.params);
    if (!validation.success) {
      sendError(res, `Validación fallida: ${validation.error.errors[0].message}`);
      return;
    }
    const item = await deleteClienteService(Number(validation.data.id));
    sendSuccess(res, item);
  } catch (error: unknown) {
    const appError = toAppError(error);
    sendError(res, appError.message, appError.statusCode);
  }
};

// ============================================================================
// GET /auth/google/cliente/callback — callback de OAuth Google para clientes
// ============================================================================

export const googleClienteCallback = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const frontendUrl = process.env.FRONTEND_URL ?? "http://localhost:5173";

  passport.authenticate(
    "google-cliente",
    { session: false },
    (err: Error | null, cliente: Cliente | false) => {
      if (err || !cliente) {
        res.redirect(`${frontendUrl}/login?error=oauth`);
        return;
      }

      oauthLoginClienteService(cliente.id)
        .then(({ accessToken, refreshToken, payload }) => {
          const url =
            `${frontendUrl}/oauth/cliente` +
            `?token=${encodeURIComponent(accessToken)}` +
            `&refresh=${encodeURIComponent(refreshToken)}` +
            `&payload=${payload}`;
          res.redirect(url);
        })
        .catch((error: unknown) => {
          console.error("Error generando tokens OAuth cliente:", error);
          res.redirect(`${frontendUrl}/login?error=oauth`);
        });
    }
  )(req, res, next);
};

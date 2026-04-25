import { NextFunction, Request, Response } from "express";
import { z } from "zod";
import passport from "passport";
import { Usuario } from "@prisma/client";
import { loginSchema, refreshTokenSchema } from "../schemas/schemas";
import { toAppError } from "../lib/appError";
import { AuthRequest } from "../middlewares/auth.middleware";
import {
  loginService,
  logoutService,
  refreshService,
  getMeService,
  changePasswordService,
  updateAvatarUrlService,
  oauthLoginService,
} from "../services/auth.service";

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

// ============================================================================
// POST /auth/login
// ============================================================================

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const validation = loginSchema.safeParse(req.body);
    if (!validation.success) {
      sendError(
        res,
        `Validación fallida: ${validation.error.errors[0].message}`,
        400
      );
      return;
    }

    const { email, password } = validation.data;
    const result = await loginService({ email, password });
    sendSuccess(res, result);
  } catch (error: unknown) {
    console.error("Error en login:", error);
    const appError = toAppError(error);
    sendError(res, appError.message, appError.statusCode);
  }
};

// ============================================================================
// POST /auth/logout
// ============================================================================

export const logout = async (req: Request, res: Response): Promise<void> => {
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
    await logoutService(refreshToken);

    sendSuccess(res, { message: "Logout exitoso" });
  } catch (error: unknown) {
    console.error("Error en logout:", error);
    const appError = toAppError(error);
    sendError(res, appError.message, appError.statusCode);
  }
};

// ============================================================================
// GET /auth/me  — datos del empleado autenticado
// ============================================================================

export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.usuarioId) {
      sendError(res, "No autenticado", 401);
      return;
    }
    const usuario = await getMeService(req.usuarioId);
    sendSuccess(res, usuario);
  } catch (error: unknown) {
    const appError = toAppError(error);
    sendError(res, appError.message, appError.statusCode);
  }
};

// ============================================================================
// PUT /auth/me  — actualizar avatar_url del empleado autenticado
// ============================================================================

const updateMeSchema = z.object({
  avatarUrl: z.string().url("URL inválida"),
});

export const updateMe = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.usuarioId) {
      sendError(res, "No autenticado", 401);
      return;
    }
    const validation = updateMeSchema.safeParse(req.body);
    if (!validation.success) {
      sendError(res, validation.error.errors[0].message);
      return;
    }
    await updateAvatarUrlService(req.usuarioId, validation.data.avatarUrl);
    sendSuccess(res, { message: "Avatar actualizado" });
  } catch (error: unknown) {
    const appError = toAppError(error);
    sendError(res, appError.message, appError.statusCode);
  }
};

// ============================================================================
// PUT /auth/change-password
// ============================================================================

const changePasswordSchema = z.object({
  passwordActual: z.string().min(1, "Contraseña actual requerida"),
  passwordNuevo: z.string().min(6, "Mínimo 6 caracteres"),
});

export const changePassword = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.usuarioId) {
      sendError(res, "No autenticado", 401);
      return;
    }
    const validation = changePasswordSchema.safeParse(req.body);
    if (!validation.success) {
      sendError(
        res,
        `Validación fallida: ${validation.error.errors[0].message}`
      );
      return;
    }
    await changePasswordService({
      usuarioId: req.usuarioId,
      passwordActual: validation.data.passwordActual,
      passwordNuevo: validation.data.passwordNuevo,
    });
    sendSuccess(res, { message: "Contraseña actualizada" });
  } catch (error: unknown) {
    const appError = toAppError(error);
    sendError(res, appError.message, appError.statusCode);
  }
};

// ============================================================================
// POST /auth/refresh
// ============================================================================

export const refresh = async (req: Request, res: Response): Promise<void> => {
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
    const result = await refreshService(refreshToken);
    sendSuccess(res, result);
  } catch (error: unknown) {
    console.error("Error en refresh:", error);
    const appError = toAppError(error);
    sendError(res, appError.message, appError.statusCode);
  }
};

// ============================================================================
// GET /auth/google/callback — callback de OAuth Google para empleados
// ============================================================================

export const googleOAuthCallback = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const frontendUrl = process.env.FRONTEND_URL ?? "http://localhost:5173";

  passport.authenticate(
    "google",
    { session: false },
    (err: Error | null, usuario: Usuario | false) => {
      if (err || !usuario) {
        res.redirect(`${frontendUrl}/admin/login?error=oauth`);
        return;
      }

      oauthLoginService(usuario.id)
        .then(({ accessToken, refreshToken, payload }) => {
          const url =
            `${frontendUrl}/admin/oauth` +
            `?token=${encodeURIComponent(accessToken)}` +
            `&refresh=${encodeURIComponent(refreshToken)}` +
            `&payload=${payload}`;
          res.redirect(url);
        })
        .catch((error: unknown) => {
          console.error("Error generando tokens OAuth empleado:", error);
          res.redirect(`${frontendUrl}/admin/login?error=oauth`);
        });
    }
  )(req, res, next);
};

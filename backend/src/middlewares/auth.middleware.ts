import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthRequest extends Request {
  usuarioId?: number;
  email?: string;
  rolId?: number;
  sucursalId?: number | null;
}

export const authMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ success: false, message: "Token no proporcionado" });
      return;
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "") as {
      usuarioId: number;
      email: string;
      rolId: number;
      sucursalId: number | null;
    };

    req.usuarioId = decoded.usuarioId;
    req.email = decoded.email;
    req.rolId = decoded.rolId;
    req.sucursalId = decoded.sucursalId;

    next();
  } catch (error: unknown) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ success: false, message: "Token expirado" });
    } else if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ success: false, message: "Token inválido" });
    } else {
      res.status(500).json({ success: false, message: "Error autenticación" });
    }
  }
};

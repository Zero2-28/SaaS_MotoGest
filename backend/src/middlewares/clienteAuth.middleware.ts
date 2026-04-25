import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface ClienteAuthRequest extends Request {
  clienteId?: number;
  clienteEmail?: string;
}

export const clienteAuthMiddleware = (
  req: ClienteAuthRequest,
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
    const secret = process.env.CLIENTE_JWT_SECRET;
    if (!secret) {
      res.status(500).json({ success: false, message: "CLIENTE_JWT_SECRET no configurado" });
      return;
    }

    const decoded = jwt.verify(token, secret) as {
      clienteId: number;
      email: string;
    };

    req.clienteId = decoded.clienteId;
    req.clienteEmail = decoded.email;

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

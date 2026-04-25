import { Response, NextFunction } from "express";
import { AuthRequest } from "./auth.middleware";

export const roleMiddleware = (allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    try {
      if (!req.rolId) {
        res.status(401).json({ success: false, message: "Usuario no autenticado" });
        return;
      }

      // Map rolId to role name (1 = admin, 2 = vendedor, 3 = repartidor)
      const roleMap: Record<number, string> = {
        1: "admin",
        2: "vendedor",
        3: "repartidor",
      };

      const userRole = roleMap[req.rolId];
      if (!userRole || !allowedRoles.includes(userRole)) {
        res
          .status(403)
          .json({
            success: false,
            message: "Permiso denegado",
          });
        return;
      }

      next();
    } catch (error) {
      res.status(500).json({ success: false, message: "Error validación rol" });
    }
  };
};

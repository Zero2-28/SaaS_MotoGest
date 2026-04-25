import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { roleMiddleware } from "../middlewares/role.middleware";
import {
  ajusteInventario,
  alertasInventario,
  inventarioPorSucursal,
} from "../controllers/inventario.controller";

const router = Router();

router.use(authMiddleware);

router.get("/alertas", roleMiddleware(["admin", "vendedor"]), alertasInventario);
router.get(
  "/sucursal/:id",
  roleMiddleware(["admin", "vendedor"]),
  inventarioPorSucursal
);
router.post(
  "/ajuste",
  roleMiddleware(["admin", "vendedor"]),
  ajusteInventario
);

export default router;

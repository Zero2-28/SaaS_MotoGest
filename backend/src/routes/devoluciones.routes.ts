import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { roleMiddleware } from "../middlewares/role.middleware";
import {
  createDevolucion,
  getDevolucionById,
  listDevoluciones,
  updateDevolucionEstado,
} from "../controllers/devoluciones.controller";

const router = Router();

router.use(authMiddleware);

router.get("/", roleMiddleware(["admin", "vendedor"]), listDevoluciones);
router.get("/:id", roleMiddleware(["admin", "vendedor"]), getDevolucionById);
router.post("/", roleMiddleware(["admin", "vendedor"]), createDevolucion);
router.put("/:id/estado", roleMiddleware(["admin"]), updateDevolucionEstado);

export default router;

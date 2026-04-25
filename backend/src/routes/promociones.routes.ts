import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { roleMiddleware } from "../middlewares/role.middleware";
import {
  createPromocion,
  deletePromocion,
  getPromocionById,
  listPromociones,
  updatePromocion,
} from "../controllers/promociones.controller";

const router = Router();

router.use(authMiddleware);

// TODO: Implementar todos los endpoints de promociones
// - GET /promociones
// - GET /promociones/:id
// - POST /promociones
// - PUT /promociones/:id
// - DELETE /promociones/:id

router.get("/", roleMiddleware(["admin", "vendedor"]), listPromociones);
router.get("/:id", roleMiddleware(["admin", "vendedor"]), getPromocionById);
router.post("/", roleMiddleware(["admin", "vendedor"]), createPromocion);
router.put("/:id", roleMiddleware(["admin", "vendedor"]), updatePromocion);
router.delete("/:id", roleMiddleware(["admin"]), deletePromocion);

export default router;

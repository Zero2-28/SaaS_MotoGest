import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { roleMiddleware } from "../middlewares/role.middleware";
import {
  createSucursal,
  deleteSucursal,
  getSucursalById,
  listSucursales,
  updateSucursal,
} from "../controllers/sucursales.controller";

const router = Router();

router.use(authMiddleware);

// TODO: Implementar todos los endpoints de sucursales
// - GET /sucursales
// - GET /sucursales/:id
// - POST /sucursales
// - PUT /sucursales/:id
// - DELETE /sucursales/:id

router.get("/", roleMiddleware(["admin"]), listSucursales);
router.get("/:id", roleMiddleware(["admin"]), getSucursalById);
router.post("/", roleMiddleware(["admin"]), createSucursal);
router.put("/:id", roleMiddleware(["admin"]), updateSucursal);
router.delete("/:id", roleMiddleware(["admin"]), deleteSucursal);

export default router;

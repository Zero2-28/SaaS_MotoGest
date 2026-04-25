import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { roleMiddleware } from "../middlewares/role.middleware";
import {
  createProveedor,
  deleteProveedor,
  getProveedorById,
  listProveedores,
  updateProveedor,
} from "../controllers/proveedores.controller";

const router = Router();

router.use(authMiddleware);

router.get("/", roleMiddleware(["admin", "vendedor"]), listProveedores);
router.get("/:id", roleMiddleware(["admin", "vendedor"]), getProveedorById);
router.post("/", roleMiddleware(["admin", "vendedor"]), createProveedor);
router.put("/:id", roleMiddleware(["admin", "vendedor"]), updateProveedor);
router.delete("/:id", roleMiddleware(["admin"]), deleteProveedor);

export default router;

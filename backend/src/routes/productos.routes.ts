import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { roleMiddleware } from "../middlewares/role.middleware";
import {
  createProducto,
  deleteProducto,
  getProductoById,
  listProductos,
  updateProducto,
} from "../controllers/productos.controller";

const router = Router();

// Public catalog
router.get("/", listProductos);
router.get("/:id", getProductoById);

// Protected routes for employees
router.use(authMiddleware);
router.post("/", roleMiddleware(["admin", "vendedor"]), createProducto);
router.put("/:id", roleMiddleware(["admin", "vendedor"]), updateProducto);
router.delete("/:id", roleMiddleware(["admin", "vendedor"]), deleteProducto);

export default router;

import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { roleMiddleware } from "../middlewares/role.middleware";
import {
  createCompra,
  getCompraById,
  listCompras,
  updateCompraEstado,
} from "../controllers/compras.controller";

const router = Router();

router.use(authMiddleware);

// Lista de todas las compras — solo admin (incluye proveedor y productos)
router.get("/", roleMiddleware(["admin"]), listCompras);

// Detalle completo de una compra — admin y vendedor
router.get("/:id", roleMiddleware(["admin", "vendedor"]), getCompraById);

// Crear orden de compra en estado 'pendiente'
router.post("/", roleMiddleware(["admin", "vendedor"]), createCompra);

// Cambiar estado; si pasa a 'recibido' incrementa stock y registra movimiento
router.put("/:id/estado", roleMiddleware(["admin", "vendedor"]), updateCompraEstado);

export default router;

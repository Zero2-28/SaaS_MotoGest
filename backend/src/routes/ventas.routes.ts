import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { clienteAuthMiddleware } from "../middlewares/clienteAuth.middleware";
import { roleMiddleware } from "../middlewares/role.middleware";
import {
  createVenta,
  createVentaCliente,
  getVentaById,
  listVentas,
  reportesVentas,
} from "../controllers/ventas.controller";

const router = Router();

// Checkout público para clientes autenticados — debe ir antes del authMiddleware de empleados
router.post("/checkout", clienteAuthMiddleware, createVentaCliente);

router.use(authMiddleware);

// /reportes debe ir antes de /:id para que Express no lo interprete como un ID
router.get("/reportes", roleMiddleware(["admin", "vendedor"]), reportesVentas);
router.get("/", roleMiddleware(["admin", "vendedor"]), listVentas);
router.get("/:id", roleMiddleware(["admin", "vendedor"]), getVentaById);
router.post("/", roleMiddleware(["admin", "vendedor"]), createVenta);

export default router;

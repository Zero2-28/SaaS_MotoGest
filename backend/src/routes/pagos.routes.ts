import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { roleMiddleware } from "../middlewares/role.middleware";
import {
  crearIntentoPago,
  getMetodosPago,
  getPagoById,
  webhookStripe,
} from "../controllers/pagos.controller";

const router = Router();

// Webhook: sin auth y con raw body para que Stripe pueda verificar la firma
// Body ya parseado como Buffer en index.ts con express.raw() antes de express.json()
router.post("/webhook", webhookStripe);

// Rutas protegidas con JWT de empleado
router.use(authMiddleware);

// Resumen de pagos por método — /metodos antes de /:id para evitar conflicto
router.get("/metodos", roleMiddleware(["admin"]), getMetodosPago);

router.post("/crear-intento", roleMiddleware(["admin", "vendedor"]), crearIntentoPago);
router.get("/:id", roleMiddleware(["admin", "vendedor"]), getPagoById);

export default router;

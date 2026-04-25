import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { roleMiddleware } from "../middlewares/role.middleware";
import {
  createPedido,
  getPedidoPublico,
  listPedidos,
  updatePedidoEstado,
} from "../controllers/pedidos.controller";

const router = Router();

// Rastreo público — debe estar ANTES de authMiddleware para no requerir token
router.get("/:codigo", getPedidoPublico);

router.use(authMiddleware);

router.get("/", roleMiddleware(["admin", "vendedor"]), listPedidos);
router.post("/", roleMiddleware(["admin", "vendedor"]), createPedido);
// Repartidor también puede cambiar estado (ej: marcar como entregado)
router.put("/:id/estado", roleMiddleware(["admin", "vendedor", "repartidor"]), updatePedidoEstado);

export default router;

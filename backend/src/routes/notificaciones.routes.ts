import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import {
  listNotificaciones,
  marcarLeida,
  marcarTodasLeidas,
} from "../controllers/notificaciones.controller";

const router = Router();

router.use(authMiddleware);

router.get("/", listNotificaciones);
// leer-todas debe ir ANTES de /:id/leer para evitar que Express trate "leer-todas" como un id
router.put("/leer-todas", marcarTodasLeidas);
router.put("/:id/leer", marcarLeida);

export default router;

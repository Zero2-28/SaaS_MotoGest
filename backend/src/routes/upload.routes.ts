import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { roleMiddleware } from "../middlewares/role.middleware";
import {
  upload,
  uploadProducto,
  uploadCategoria,
  uploadAvatar,
} from "../controllers/upload.controller";

const router = Router();

// Todos los endpoints requieren empleado autenticado
router.use(authMiddleware);

// POST /upload/producto — admin o vendedor pueden subir imágenes de producto
router.post(
  "/producto",
  roleMiddleware(["admin", "vendedor"]),
  upload.single("imagen"),
  uploadProducto
);

// POST /upload/categoria — solo admin
router.post(
  "/categoria",
  roleMiddleware(["admin"]),
  upload.single("imagen"),
  uploadCategoria
);

// POST /upload/avatar — cualquier empleado autenticado
router.post("/avatar", upload.single("imagen"), uploadAvatar);

export default router;

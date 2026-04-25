import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { roleMiddleware } from "../middlewares/role.middleware";
import {
  createUsuario,
  deleteUsuario,
  getUsuarioById,
  listUsuarios,
  updateUsuario,
} from "../controllers/usuarios.controller";

const router = Router();

router.use(authMiddleware);

// TODO: Implementar todos los endpoints de usuarios
// - GET /usuarios
// - GET /usuarios/:id
// - POST /usuarios
// - PUT /usuarios/:id
// - DELETE /usuarios/:id

router.get("/", roleMiddleware(["admin", "vendedor"]), listUsuarios);
router.get("/:id", roleMiddleware(["admin"]), getUsuarioById);
router.post("/", roleMiddleware(["admin"]), createUsuario);
router.put("/:id", roleMiddleware(["admin"]), updateUsuario);
router.delete("/:id", roleMiddleware(["admin"]), deleteUsuario);

export default router;

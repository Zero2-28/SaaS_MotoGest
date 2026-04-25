import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { roleMiddleware } from "../middlewares/role.middleware";
import {
  createCategoria,
  deleteCategoria,
  getCategoriaById,
  listCategorias,
  updateCategoria,
} from "../controllers/categorias.controller";

const router = Router();

// Catálogo público necesita listar categorías para filtros — sin auth
router.get("/", listCategorias);

router.use(authMiddleware);

router.get("/:id", roleMiddleware(["admin", "vendedor"]), getCategoriaById);
router.get("/:id", roleMiddleware(["admin", "vendedor"]), getCategoriaById);
router.post("/",    roleMiddleware(["admin", "vendedor"]), createCategoria);
router.put("/:id",  roleMiddleware(["admin", "vendedor"]), updateCategoria);
router.delete("/:id", roleMiddleware(["admin"]),           deleteCategoria);

export default router;

import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { roleMiddleware } from "../middlewares/role.middleware";
import {
  reporteCompras,
  reporteDevoluciones,
  reporteInventarioBajo,
  reporteProductosTop,
  reporteVentas,
  reporteVentasSucursal,
} from "../controllers/reportes.controller";

const router = Router();

router.use(authMiddleware);

// Todos los reportes son exclusivos de admin
router.get("/ventas",           roleMiddleware(["admin"]), reporteVentas);
router.get("/productos-top",    roleMiddleware(["admin"]), reporteProductosTop);
router.get("/inventario-bajo",  roleMiddleware(["admin"]), reporteInventarioBajo);
router.get("/compras",          roleMiddleware(["admin"]), reporteCompras);
router.get("/ventas-sucursal",  roleMiddleware(["admin"]), reporteVentasSucursal);
router.get("/devoluciones",     roleMiddleware(["admin"]), reporteDevoluciones);

export default router;

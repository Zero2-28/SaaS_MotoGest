import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { clienteAuthMiddleware } from "../middlewares/clienteAuth.middleware";
import { roleMiddleware } from "../middlewares/role.middleware";
import {
  loginCliente,
  misPedidosCliente,
  misComprasCliente,
  registerCliente,
  logoutCliente,
  refreshCliente,
  createCliente,
  deleteCliente,
  getClienteById,
  getClienteHistorial,
  listClientes,
  updateCliente,
} from "../controllers/clientes.controller";

const router = Router();

// Cliente auth (público)
router.post("/register", registerCliente);
router.post("/login", loginCliente);
router.post("/logout", logoutCliente);
router.post("/refresh", refreshCliente);
router.get("/mis-pedidos", clienteAuthMiddleware, misPedidosCliente);
router.get("/mis-compras", clienteAuthMiddleware, misComprasCliente);

// Empleados
router.use(authMiddleware);

// TODO: Implementar todos los endpoints de clientes
// - GET /clientes
// - GET /clientes/:id
// - GET /clientes/:id/historial
// - POST /clientes
// - PUT /clientes/:id
// - DELETE /clientes/:id

router.get("/", roleMiddleware(["admin", "vendedor"]), listClientes);
router.get("/:id", roleMiddleware(["admin", "vendedor"]), getClienteById);
router.get("/:id/historial", roleMiddleware(["admin", "vendedor"]), getClienteHistorial);
router.post("/", roleMiddleware(["admin", "vendedor"]), createCliente);
router.put("/:id", roleMiddleware(["admin", "vendedor"]), updateCliente);
router.delete("/:id", roleMiddleware(["admin"]), deleteCliente);

export default router;

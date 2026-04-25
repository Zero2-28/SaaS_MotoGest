import { Router } from "express";
import passport from "passport";
import { authMiddleware } from "../middlewares/auth.middleware";
import {
  login, logout, refresh, getMe, updateMe, changePassword, googleOAuthCallback,
} from "../controllers/auth.controller";
import { googleClienteCallback } from "../controllers/clientes.controller";

const router = Router();

router.post("/login", login);
router.post("/logout", authMiddleware, logout);
router.post("/refresh", refresh);

// Perfil del empleado autenticado
router.get("/me", authMiddleware, getMe);
router.put("/me", authMiddleware, updateMe);
router.put("/change-password", authMiddleware, changePassword);

// ── OAuth Google — Empleados ──────────────────────────────────────────────────
// Inicia el flujo: redirige a Google
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"], session: false })
);
// Callback: Google redirige aquí; generamos JWT de empleado y vamos a /admin/oauth
router.get("/google/callback", googleOAuthCallback);

// ── OAuth Google — Clientes ───────────────────────────────────────────────────
// Inicia el flujo: redirige a Google con estrategia "google-cliente"
router.get(
  "/google/cliente",
  passport.authenticate("google-cliente", { scope: ["profile", "email"], session: false })
);
// Callback: Google redirige aquí; generamos JWT de cliente y vamos a /oauth/cliente
router.get("/google/cliente/callback", googleClienteCallback);

export default router;

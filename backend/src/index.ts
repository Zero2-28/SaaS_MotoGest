import express, { Express } from "express";
import cors from "cors";
import dotenv from "dotenv";
import passport from "passport";
import "./config/passport"; // registra las estrategias Google al importar
import authRouter from "./routes/auth.routes";
import categoriasRouter from "./routes/categorias.routes";
import clientesRouter from "./routes/clientes.routes";
import comprasRouter from "./routes/compras.routes";
import devolucionesRouter from "./routes/devoluciones.routes";
import inventarioRouter from "./routes/inventario.routes";
import notificacionesRouter from "./routes/notificaciones.routes";
import pagosRouter from "./routes/pagos.routes";
import pedidosRouter from "./routes/pedidos.routes";
import productosRouter from "./routes/productos.routes";
import promocionesRouter from "./routes/promociones.routes";
import proveedoresRouter from "./routes/proveedores.routes";
import reportesRouter from "./routes/reportes.routes";
import sucursalesRouter from "./routes/sucursales.routes";
import usuariosRouter from "./routes/usuarios.routes";
import ventasRouter from "./routes/ventas.routes";
import uploadRouter from "./routes/upload.routes";
import prisma from "./lib/prisma";

dotenv.config();

const app: Express = express();

// ============================================================================
// MIDDLEWARE
// ============================================================================

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  })
);

// Passport sin sesión — solo inicializa el middleware para que authenticate() funcione
app.use(passport.initialize());

// Webhook de Stripe requiere body en bytes crudos para verificar la firma HMAC
app.use((req, res, next) => {
  if (req.originalUrl === "/pagos/webhook") {
    return express.raw({ type: "application/json" })(req, res, next);
  }
  return express.json()(req, res, next);
});

app.use((req, res, next) => {
  if (req.originalUrl === "/pagos/webhook") {
    return next();
  }
  return express.urlencoded({ extended: true })(req, res, next);
});

// ============================================================================
// ROUTES
// ============================================================================

app.use("/auth", authRouter);
app.use("/usuarios", usuariosRouter);
app.use("/sucursales", sucursalesRouter);
app.use("/categorias", categoriasRouter);
app.use("/productos", productosRouter);
app.use("/inventario", inventarioRouter);
app.use("/notificaciones", notificacionesRouter);
app.use("/compras", comprasRouter);
app.use("/ventas", ventasRouter);
app.use("/pedidos", pedidosRouter);
app.use("/clientes", clientesRouter);
app.use("/promociones", promocionesRouter);
app.use("/proveedores", proveedoresRouter);
app.use("/devoluciones", devolucionesRouter);
app.use("/reportes", reportesRouter);
app.use("/pagos", pagosRouter);
app.use("/upload", uploadRouter);

// ============================================================================
// HEALTH CHECK
// ============================================================================

app.get("/health", (_req, res) => {
  res.status(200).json({ success: true, message: "Backend MOTOGEST PRO activo" });
});

// ============================================================================
// 404 HANDLER
// ============================================================================

app.use((_req, res) => {
  res.status(404).json({ success: false, message: "Ruta no encontrada" });
});

// ============================================================================
// ERROR HANDLER
// ============================================================================

app.use((err: Error, _req: express.Request, res: express.Response) => {
  console.error("Error no capturado:", err);
  res
    .status(500)
    .json({ success: false, message: "Error interno del servidor" });
});

// ============================================================================
// SERVER START
// ============================================================================

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`✅ Backend MOTOGEST PRO escuchando en puerto ${PORT}`);
  console.log(`📘 Documentación: http://localhost:${PORT}/api/docs`);
});

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("\n🛑 Desconectando Prisma...");
  await prisma.$disconnect();
  process.exit(0);
});

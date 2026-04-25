# MOTOGEST PRO — Frontend

## Contexto del proyecto
SaaS de gestión comercial para CALLE TUNING, tienda de
accesorios de motos en Ayacucho, Perú.

## Backend ya completado
El backend está en ../backend corriendo en Express + TypeScript
+ Prisma + Supabase PostgreSQL.

URL local: http://localhost:3000
URL producción: (pendiente deploy en Render)

## Endpoints disponibles en el backend

### Auth empleados
POST /auth/login → { email, password }
POST /auth/logout
POST /auth/refresh → { refreshToken }

### Auth clientes
POST /clientes/register → { nombre, email, password, telefono }
POST /clientes/login → { email, password }

### Productos (públicos)
GET  /productos → catálogo público paginado
GET  /productos/:id → detalle público

### Productos (protegidos admin/vendedor)
POST   /productos → crear
PUT    /productos/:id → editar
DELETE /productos/:id → desactivar

### Inventario
GET  /inventario/sucursal/:id → stock por sucursal
GET  /inventario/alertas → stock crítico (admin)
POST /inventario/ajuste → ajuste manual

### Ventas
POST /ventas → registrar venta
GET  /ventas → historial
GET  /ventas/:id → detalle
GET  /ventas/reportes → totales

### Pedidos
POST /pedidos → crear pedido
GET  /pedidos/:codigo → rastreo PÚBLICO sin auth
PUT  /pedidos/:id/estado → cambiar estado
GET  /pedidos → lista

### Pagos Stripe
POST /pagos/crear-intento → { ventaId, monto, moneda }
GET  /pagos/metodos → resumen por método (admin)

### Compras
POST /compras → orden de compra
PUT  /compras/:id/estado → cambiar estado
GET  /compras → lista (admin)
GET  /compras/:id → detalle

### Reportes
GET /ventas/reportes → totales por día/semana/mes

### Notificaciones
GET /notificaciones → no leídas del usuario
PUT /notificaciones/:id/leer → marcar leída
PUT /notificaciones/leer-todas → marcar todas

### Categorías y Proveedores
GET  /categorias
POST /categorias
GET  /proveedores
POST /proveedores

## Autenticación JWT
- Empleados: token via /auth/login → header Authorization: Bearer <token>
- Clientes: token via /clientes/login → header Authorization: Bearer <token>
- Access token expira en 15 minutos
- Refresh token expira en 7 días
- Al recibir 401 → llamar /auth/refresh automáticamente

## Roles de empleados
- admin → acceso total, todas las sucursales
- vendedor → solo su sucursal
- repartidor → solo gestión de entregas

## Stack frontend
- React + Vite + TypeScript
- React Router v6
- Axios para peticiones
- Zustand para estado global
- React Hook Form + Zod
- TanStack Table
- Recharts para gráficos
- shadcn/ui + Tailwind CSS

## Identidad visual
- Fondo: #0A0A0A dark mode
- Primario: Rojo #CC0000
- Acento: Naranja #FF6B00
- Texto: #FFFFFF y #A0A0A0
- Estilo: Industrial, mundo motor, Ducati/Honda/Yamaha

## Pantallas — 12 en total

PÚBLICAS:
1. Landing + Catálogo
2. Detalle de producto
3. Rastreo de pedido
4. Login cliente
5. Register cliente

ADMIN (sidebar):
6. Dashboard
7. Gestión de productos
8. Control de inventario
9. Punto de venta TPV
10. Gestión de pedidos
11. Gestión de clientes
12. Reportes

## Variables de entorno
VITE_API_URL=http://localhost:3000
VITE_STRIPE_PUBLIC_KEY=pk_test_...

## Reglas de trabajo
- Sin any en TypeScript
- Sin TODOs ni código a medias
- Comentarios breves e informativos
- Interceptor Axios para manejar refresh token automático
- Rutas admin protegidas — redirigir a login si no hay token
- Catálogo y rastreo son públicos sin auth
- Precios siempre en Soles (S/.)
- Actualizar ERRORS.md si corriges algún error

## Pendientes para después
- OAuth Google (clientes y empleados)
- Deploy Render (backend) + Vercel (frontend)
## Notificaciones internas (admin)
GET /notificaciones → devuelve { tipo, titulo, mensaje, leida }
tipos: 'general', 'stock_bajo', 'pedido_nuevo', 'pago_confirmado'
Mostrar badge en header admin con conteo de no leídas.
Ícono y color diferente según tipo.
## Endpoints nuevos agregados en Fase B
GET  /auth/me → datos del empleado autenticado
PUT  /auth/change-password → { passwordActual, passwordNuevo }

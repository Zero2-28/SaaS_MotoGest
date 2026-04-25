# MOTOGEST PRO

Sistema SaaS integral de gestión comercial para
**CALLE TUNING** — Tienda de accesorios para motocicletas
📍 Ayacucho, Perú

## Descripción
MOTOGEST PRO es una plataforma web completa que integra
ventas, control de inventario, gestión de clientes,
rastreo de pedidos y pagos en línea para optimizar
las operaciones de CALLE TUNING.

## Stack tecnológico

### Frontend
- React + Vite + TypeScript
- Tailwind CSS + shadcn/ui
- Zustand (estado global)
- Stripe.js (pagos)
- Deploy: Vercel

### Backend
- Node.js + Express + TypeScript
- Prisma ORM + PostgreSQL (Supabase)
- JWT + bcrypt (autenticación)
- Stripe SDK (pagos)
- Resend (emails)
- Deploy: Render

## Módulos principales
- Catálogo público de productos
- Carrito de compras y pagos con Stripe
- Rastreo de pedidos en tiempo real
- Panel admin con gestión completa
- Control de inventario multisucursal
- Gestión de empleados por roles
- Reportes y análisis de ventas
- Notificaciones automáticas por email

## Roles del sistema
| Rol | Acceso |
|---|---|
| Admin | Panel completo, todas las sucursales |
| Vendedor | Ventas, inventario, pedidos |
| Repartidor | Gestión de entregas |
| Cliente | Catálogo, compras, rastreo |

## Variables de entorno
Ver `backend/.env.example` y `frontend/.env.example`

## Instalación local

### Backend
```bash
cd backend
npm install
npx prisma generate
npx prisma db push
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Despliegue
- Frontend → Vercel (root: `frontend/`)
- Backend → Render (root: `backend/`)

---
Desarrollado como proyecto académico — 2026

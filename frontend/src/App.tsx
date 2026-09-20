import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { lazy, Suspense } from 'react'

// Layouts
import PublicLayout from '@/layouts/PublicLayout'
import AdminLayout from '@/layouts/AdminLayout'
import ProtectedRoute from '@/components/ProtectedRoute'

// Páginas públicas — lazy loading por ruta
const LandingPage       = lazy(() => import('@/pages/public/LandingPage'))
const CatalogoPage      = lazy(() => import('@/pages/public/CatalogoPage'))
const ProductoPage      = lazy(() => import('@/pages/public/ProductoPage'))
const RastreoPage       = lazy(() => import('@/pages/public/RastreoPage'))
const LoginClientePage  = lazy(() => import('@/pages/public/LoginClientePage'))
const RegisterPage      = lazy(() => import('@/pages/public/RegisterPage'))
const PagoPage          = lazy(() => import('@/pages/public/PagoPage'))
const PagoExitoPage     = lazy(() => import('@/pages/public/PagoExitoPage'))
const PagoErrorPage     = lazy(() => import('@/pages/public/PagoErrorPage'))
const MisComprasPage    = lazy(() => import('@/pages/public/MisComprasPage'))

// Páginas callback OAuth — sin protección, se renderizan durante el flujo de Google
const OAuthCallbackPage        = lazy(() => import('@/pages/admin/OAuthCallbackPage'))
const OAuthClienteCallbackPage = lazy(() => import('@/pages/public/OAuthClienteCallbackPage'))

// Páginas admin — lazy loading por ruta
const AdminLoginPage    = lazy(() => import('@/pages/admin/AdminLoginPage'))
const DashboardPage     = lazy(() => import('@/pages/admin/DashboardPage'))
const ProductosPage     = lazy(() => import('@/pages/admin/ProductosPage'))
const CategoriasPage    = lazy(() => import('@/pages/admin/CategoriasPage'))
const ProveedoresPage   = lazy(() => import('@/pages/admin/ProveedoresPage'))
const InventarioPage    = lazy(() => import('@/pages/admin/InventarioPage'))
const TPVPage           = lazy(() => import('@/pages/admin/TPVPage'))
const PedidosPage       = lazy(() => import('@/pages/admin/PedidosPage'))
const ComprasPage       = lazy(() => import('@/pages/admin/ComprasPage'))
const DevolucionesPage  = lazy(() => import('@/pages/admin/DevolucionesPage'))
const ClientesPage      = lazy(() => import('@/pages/admin/ClientesPage'))
const ReportesPage      = lazy(() => import('@/pages/admin/ReportesPage'))
const EmpleadosPage     = lazy(() => import('@/pages/admin/EmpleadosPage'))

// Skeleton global de carga entre rutas
function PageLoader() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-700 border-t-brand" />
        <p className="text-sm text-muted-foreground">Cargando…</p>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* ── Rutas públicas ────────────────────────────── */}
          <Route element={<PublicLayout />}>
            <Route index element={<LandingPage />} />
            <Route path="catalogo" element={<CatalogoPage />} />
            <Route path="catalogo/:id" element={<ProductoPage />} />
            <Route path="rastreo" element={<RastreoPage />} />
            <Route path="login" element={<LoginClientePage />} />
            <Route path="register" element={<RegisterPage />} />
            <Route path="pago" element={<PagoPage />} />
            <Route path="pago/exito" element={<PagoExitoPage />} />
            <Route path="pago/error" element={<PagoErrorPage />} />
            <Route path="mi-cuenta/compras" element={<MisComprasPage />} />
            {/* Callback OAuth Google para clientes — sin auth, accedido tras redirect de Google */}
            <Route path="oauth/cliente" element={<OAuthClienteCallbackPage />} />
          </Route>

          {/* ── Login admin (sin sidebar) ─────────────────── */}
          <Route path="admin/login" element={<AdminLoginPage />} />

          {/* ── Callback OAuth Google para empleados — sin protección ─────── */}
          <Route path="admin/oauth" element={<OAuthCallbackPage />} />

          {/* ── Rutas admin protegidas ────────────────────── */}
          <Route path="admin" element={<ProtectedRoute />}>
            <Route element={<AdminLayout />}>
              <Route index element={<DashboardPage />} />
              <Route path="productos"    element={<ProductosPage />} />
              <Route path="categorias"   element={<CategoriasPage />} />
              <Route path="proveedores"  element={<ProveedoresPage />} />
              <Route path="inventario"   element={<InventarioPage />} />
              <Route path="tpv"          element={<TPVPage />} />
              <Route path="pedidos"      element={<PedidosPage />} />
              <Route path="compras"      element={<ComprasPage />} />
              <Route path="devoluciones" element={<DevolucionesPage />} />
              <Route path="clientes"     element={<ClientesPage />} />
              {/* Rutas solo admin */}
              <Route element={<ProtectedRoute roles={['admin']} />}>
                <Route path="reportes"   element={<ReportesPage />} />
                <Route path="empleados"  element={<EmpleadosPage />} />
              </Route>
            </Route>
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}

import { Navigate, Outlet } from 'react-router-dom'
import { useAuthEmpleadoStore } from '@/stores/auth.store'
import type { RolEmpleado } from '@/types'

interface ProtectedRouteProps {
  /** Roles permitidos. Si no se especifica, solo requiere autenticación. */
  roles?: RolEmpleado[]
}

/**
 * Protege rutas de admin.
 * - Sin token → redirige a /admin/login
 * - Sin rol permitido → redirige a /admin (sin permisos)
 */
export default function ProtectedRoute({ roles }: ProtectedRouteProps) {
  const { isAuthenticated, hasRole } = useAuthEmpleadoStore()

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />
  }

  if (roles && !hasRole(roles)) {
    return <Navigate to="/admin" replace />
  }

  return <Outlet />
}

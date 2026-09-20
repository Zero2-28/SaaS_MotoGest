import { useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Bike } from 'lucide-react'
import { useAuthEmpleadoStore } from '@/stores/auth.store'
import type { Empleado, RolEmpleado } from '@/types'

// Mapa de rolId numérico → nombre de rol
const ROL_MAP: Record<number, RolEmpleado> = {
  1: 'admin',
  2: 'vendedor',
  3: 'repartidor',
}

// Estructura del payload base64url enviado por el backend
interface EmpleadoPayload {
  id: number
  nombre: string
  email: string
  rolId: number
  sucursalId: number | null
  activo: boolean
  createdAt: string
}

export default function OAuthCallbackPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { setEmpleado } = useAuthEmpleadoStore()
  const procesado = useRef(false)

  useEffect(() => {
    // Guard contra StrictMode double-invoke
    if (procesado.current) return
    procesado.current = true

    const token   = params.get('token')
    const refresh = params.get('refresh')
    const payload = params.get('payload')

    if (!token || !refresh || !payload) {
      navigate('/admin/login?error=oauth', { replace: true })
      return
    }

    try {
      // Decodificar payload base64url con datos del empleado
      const decoded = JSON.parse(atob(payload)) as EmpleadoPayload

      const empleado: Empleado = {
        id:         decoded.id,
        nombre:     decoded.nombre,
        email:      decoded.email,
        rol:        ROL_MAP[decoded.rolId] ?? 'vendedor',
        sucursalId: decoded.sucursalId,
        activo:     decoded.activo,
        createdAt:  decoded.createdAt,
      }

      setEmpleado(empleado, token, refresh)
      navigate('/admin', { replace: true })
    } catch {
      navigate('/admin/login?error=oauth', { replace: true })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="flex min-h-dvh items-center justify-center bg-brand-950">
      <div className="flex flex-col items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-md bg-brand">
          <Bike className="h-6 w-6 text-white" />
        </div>
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-700 border-t-brand" />
        <p className="text-sm text-muted-foreground">Iniciando sesión con Google…</p>
      </div>
    </div>
  )
}

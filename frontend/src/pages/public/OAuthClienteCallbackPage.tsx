import { useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Bike } from 'lucide-react'
import { useAuthClienteStore } from '@/stores/auth.store'
import type { Cliente } from '@/types'

// Estructura del payload base64url enviado por el backend
interface ClientePayload {
  id: number
  nombre: string
  email: string | null
  telefono: string | null
  direccion: string | null
  ciudad: string | null
  tipoDocumento: string | null
  numeroDocumento: string | null
  createdAt: string
}

export default function OAuthClienteCallbackPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { setCliente } = useAuthClienteStore()
  const procesado = useRef(false)

  useEffect(() => {
    // Guard contra StrictMode double-invoke
    if (procesado.current) return
    procesado.current = true

    const token   = params.get('token')
    const refresh = params.get('refresh')
    const payload = params.get('payload')

    if (!token || !refresh || !payload) {
      navigate('/login?error=oauth', { replace: true })
      return
    }

    try {
      // Decodificar payload base64url con datos del cliente
      const decoded = JSON.parse(atob(payload)) as ClientePayload

      const cliente: Cliente = {
        id:              decoded.id,
        nombre:          decoded.nombre,
        email:           decoded.email,
        telefono:        decoded.telefono,
        direccion:       decoded.direccion,
        ciudad:          decoded.ciudad,
        tipoDocumento:   decoded.tipoDocumento,
        numeroDocumento: decoded.numeroDocumento,
        createdAt:       decoded.createdAt,
      }

      setCliente(cliente, token, refresh)
      navigate('/catalogo', { replace: true })
    } catch {
      navigate('/login?error=oauth', { replace: true })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="flex min-h-[calc(100dvh-4rem)] items-center justify-center bg-brand-950">
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

import { useLocation, Link, useNavigate } from 'react-router-dom'
import { XCircle, ShoppingBag, AlertTriangle } from 'lucide-react'

interface ErrorState {
  mensaje?: string
}

const AYUDA_ITEMS = [
  'Verifica que los datos de tu tarjeta sean correctos',
  'Asegúrate de tener fondos suficientes',
  'Contacta a tu banco si el problema persiste',
]

export default function PagoErrorPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const state = (location.state ?? {}) as ErrorState

  const mensaje = state.mensaje ?? 'Hubo un problema con tu pago'

  return (
    <div className="min-h-screen bg-mist flex items-center justify-center px-4 py-12">
      <div className="bg-white rounded-2xl shadow-card-md p-10 sm:p-12 max-w-[500px] w-full text-center space-y-6">

        {/* Ícono error */}
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-danger-100">
          <XCircle className="h-12 w-12 text-danger" aria-hidden />
        </div>

        {/* Mensaje principal */}
        <div className="space-y-1">
          <h1 className="text-xl font-bold text-ink">El pago no se pudo procesar</h1>
          <p className="text-chrome-600 text-sm">{mensaje}</p>
        </div>

        {/* Card de ayuda */}
        <div className="rounded-xl bg-warning-100 p-4 text-left space-y-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-turbo shrink-0" aria-hidden />
            <p className="text-sm font-semibold text-ink">¿Qué puedes hacer?</p>
          </div>
          <ul className="space-y-1.5 pl-6 list-disc">
            {AYUDA_ITEMS.map((item) => (
              <li key={item} className="text-sm text-chrome-600">
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Acciones */}
        <div className="flex flex-col gap-3">
          <button
            onClick={() => navigate('/pago')}
            className="flex h-12 items-center justify-center gap-2 rounded-lg bg-brand text-white font-semibold hover:bg-brand-900 transition-colors"
          >
            Intentar de nuevo
          </button>
          <Link
            to="/catalogo"
            className="flex h-12 items-center justify-center gap-2 rounded-lg border border-chrome-200 text-ink font-medium hover:bg-mist transition-colors"
          >
            <ShoppingBag className="h-4 w-4 text-chrome-600" aria-hidden />
            Volver al catálogo
          </Link>
        </div>

        {/* Soporte */}
        <p className="text-sm text-chrome-600">
          ¿Necesitas ayuda?{' '}
          <span className="font-medium text-brand cursor-pointer hover:underline">
            Contáctanos
          </span>
        </p>
      </div>
    </div>
  )
}

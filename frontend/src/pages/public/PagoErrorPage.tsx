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
    <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center px-4 py-12">
      <div className="bg-white rounded-2xl shadow-md p-10 sm:p-12 max-w-[500px] w-full text-center space-y-6">

        {/* Ícono error */}
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#FEE2E2]">
          <XCircle className="h-12 w-12 text-[#CC0000]" aria-hidden />
        </div>

        {/* Mensaje principal */}
        <div className="space-y-1">
          <h1 className="text-xl font-bold text-[#111111]">El pago no se pudo procesar</h1>
          <p className="text-[#666666] text-sm">{mensaje}</p>
        </div>

        {/* Card de ayuda */}
        <div className="rounded-xl bg-[#FEF3C7] p-4 text-left space-y-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-[#FF6B00] shrink-0" aria-hidden />
            <p className="text-sm font-semibold text-[#111111]">¿Qué puedes hacer?</p>
          </div>
          <ul className="space-y-1.5 pl-6 list-disc">
            {AYUDA_ITEMS.map((item) => (
              <li key={item} className="text-sm text-[#666666]">
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Acciones */}
        <div className="flex flex-col gap-3">
          <button
            onClick={() => navigate('/pago')}
            className="flex h-12 items-center justify-center gap-2 rounded-lg bg-[#CC0000] text-white font-semibold hover:bg-[#AA0000] transition-colors"
          >
            Intentar de nuevo
          </button>
          <Link
            to="/catalogo"
            className="flex h-12 items-center justify-center gap-2 rounded-lg border border-[#D1D5DB] text-[#111111] font-medium hover:bg-[#F9FAFB] transition-colors"
          >
            <ShoppingBag className="h-4 w-4 text-[#666666]" aria-hidden />
            Volver al catálogo
          </Link>
        </div>

        {/* Soporte */}
        <p className="text-sm text-[#666666]">
          ¿Necesitas ayuda?{' '}
          <span className="font-medium text-[#CC0000] cursor-pointer hover:underline">
            Contáctanos
          </span>
        </p>
      </div>
    </div>
  )
}

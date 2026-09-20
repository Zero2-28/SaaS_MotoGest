import { useEffect, useState } from 'react'
import { useLocation, Link, useNavigate } from 'react-router-dom'
import { CheckCircle2, ShoppingBag, Copy, Check, Search, Package } from 'lucide-react'
import { formatPrecio } from '@/utils/format'
import { assets } from '@/config/assets'
import type { ProductoResumen } from '@/types'

const IMG_PLACEHOLDER = 'https://placehold.co/40x40/F9FAFB/9CA3AF?text=M'

interface ExitoState {
  numeroVenta?: string
  total?: number
  codigoPedido?: string
  productos?: ProductoResumen[]
}

export default function PagoExitoPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const state = (location.state ?? {}) as ExitoState

  // Redirigir si se llega sin estado (acceso directo a la URL)
  useEffect(() => {
    if (!state.numeroVenta && !state.total) {
      navigate('/catalogo', { replace: true })
    }
  }, [state, navigate])

  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 30)
    return () => clearTimeout(t)
  }, [])

  const [copiado, setCopiado] = useState(false)

  function copiarCodigo(texto: string) {
    void navigator.clipboard.writeText(texto).then(() => {
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    })
  }

  const { numeroVenta, total, codigoPedido, productos = [] } = state
  const codigoRastreo = codigoPedido ?? numeroVenta

  return (
    <div className="min-h-screen bg-mist py-12 px-4">
      <div className="max-w-[620px] mx-auto space-y-4">

        {/* ── Check animado + título ─────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-card p-8 text-center space-y-3">
          <div
            className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-success transition-transform duration-500 ${visible ? 'scale-100' : 'scale-0'}`}
          >
            <CheckCircle2 className="h-12 w-12 text-white" aria-hidden />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-ink">¡Pago exitoso!</h1>
            <p className="text-sm text-chrome-600 mt-1">Tu pedido ha sido confirmado y está en proceso</p>
          </div>
        </div>

        {/* ── Resumen del pedido ─────────────────────────────────── */}
        {(numeroVenta ?? total !== undefined) && (
          <div className="bg-white rounded-xl shadow-card p-6 space-y-3">
            <h2 className="text-sm font-semibold text-ink uppercase tracking-wide">
              Resumen del pedido
            </h2>

            {numeroVenta && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-chrome-600">Número de venta</span>
                <span className="font-mono font-semibold text-ink">{numeroVenta}</span>
              </div>
            )}

            {codigoPedido && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-chrome-600">Código de rastreo</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-base text-ink bg-chrome-50 rounded-lg px-3 py-1">
                    {codigoPedido}
                  </span>
                  <button
                    onClick={() => copiarCodigo(codigoPedido)}
                    aria-label="Copiar código"
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-chrome-200 text-chrome-600 hover:bg-mist transition-colors"
                  >
                    {copiado
                      ? <Check className="h-3.5 w-3.5 text-success" />
                      : <Copy className="h-3.5 w-3.5" />
                    }
                  </button>
                </div>
              </div>
            )}

            {total !== undefined && (
              <div className="flex items-center justify-between border-t border-chrome-50 pt-3">
                <span className="font-semibold text-ink">Total pagado</span>
                <span className="font-bold text-lg text-ink tabular-nums">
                  {formatPrecio(total)}
                </span>
              </div>
            )}
          </div>
        )}

        {/* ── Productos comprados ────────────────────────────────── */}
        {productos.length > 0 && (
          <div className="bg-white rounded-xl shadow-card p-6 space-y-4">
            <h2 className="text-sm font-semibold text-ink uppercase tracking-wide flex items-center gap-2">
              <Package className="h-4 w-4 text-chrome-600" aria-hidden />
              Productos comprados
            </h2>
            <ul className="space-y-0">
              {productos.map((p, idx) => (
                <li key={p.id}>
                  {idx > 0 && <div className="border-t border-chrome-50 my-3" />}
                  <div className="flex items-center gap-3">
                    <img
                      src={p.imagen_url ?? assets.categorias.repuestos}
                      alt={p.nombre}
                      onError={(e) => { e.currentTarget.src = IMG_PLACEHOLDER }}
                      className="h-10 w-10 rounded-lg object-cover shrink-0 bg-chrome-50"
                      width={40}
                      height={40}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-ink truncate">{p.nombre}</p>
                      <p className="text-xs text-chrome-600">
                        {p.cantidad} × {formatPrecio(p.precioUnitario)}
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-ink tabular-nums shrink-0">
                      {formatPrecio(p.cantidad * p.precioUnitario)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* ── Instrucciones de rastreo ───────────────────────────── */}
        {codigoRastreo && (
          <div className="bg-white rounded-xl shadow-card p-6 space-y-2">
            <h2 className="text-sm font-semibold text-ink uppercase tracking-wide">
              ¿Cómo sigo mi pedido?
            </h2>
            <p className="text-sm text-chrome-600">
              Usa el {codigoPedido ? 'código' : 'número'}{' '}
              <span className="font-mono font-semibold text-ink">{codigoRastreo}</span>{' '}
              en la sección <strong>Rastrear pedido</strong> para ver el estado en tiempo real.
            </p>
          </div>
        )}

        {/* ── Acciones ──────────────────────────────────────────── */}
        <div className="flex flex-col gap-3">
          {codigoRastreo && (
            <Link
              to={`/rastreo?codigo=${codigoRastreo}`}
              className="flex h-12 items-center justify-center gap-2 rounded-xl bg-brand text-white font-semibold hover:bg-brand-900 transition-colors"
            >
              <Search className="h-4 w-4" aria-hidden />
              Rastrear mi pedido
            </Link>
          )}
          <Link
            to="/mi-cuenta/compras"
            className="flex h-12 items-center justify-center gap-2 rounded-xl bg-ink text-white font-medium hover:bg-ink transition-colors"
          >
            Ver mis compras
          </Link>
          <button
            onClick={() => navigate('/catalogo')}
            className="flex h-12 items-center justify-center gap-2 rounded-xl border border-chrome-200 text-ink font-medium hover:bg-mist transition-colors"
          >
            <ShoppingBag className="h-4 w-4 text-chrome-600" aria-hidden />
            Seguir comprando
          </button>
        </div>
      </div>
    </div>
  )
}

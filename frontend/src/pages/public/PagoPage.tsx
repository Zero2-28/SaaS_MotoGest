import { useEffect, useRef, useState } from 'react'
import { Navigate, useNavigate, useLocation, Link } from 'react-router-dom'
import { isAxiosError } from 'axios'
import {
  Elements, CardElement, useStripe, useElements,
} from '@stripe/react-stripe-js'
import { Lock, ShoppingBag, AlertCircle, ChevronRight } from 'lucide-react'
import { stripePromise } from '@/lib/stripe'
import { useCarritoStore } from '@/stores/carrito.store'
import { useAuthClienteStore } from '@/stores/auth.store'
import { crearVentaCliente } from '@/services/ventas.service'
import { formatPrecio } from '@/utils/format'
import { assets } from '@/config/assets'
import type { Venta } from '@/types'

const CARD_OPTIONS = {
  style: {
    base: {
      color: '#111111',
      fontFamily: '"Inter", system-ui, sans-serif',
      fontSize: '16px',
      fontSmoothing: 'antialiased',
      '::placeholder': { color: '#9CA3AF' },
    },
    invalid: { color: '#CC0000', iconColor: '#CC0000' },
  },
}

interface StripeFormProps {
  clientSecret: string
  venta: Venta
  onSuccess: () => void
}

function StripeForm({ clientSecret, venta, onSuccess }: StripeFormProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [procesando, setProcesando] = useState(false)
  const [cardError, setCardError] = useState<string | null>(null)
  const [nombre, setNombre] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!stripe || !elements) return

    const card = elements.getElement(CardElement)
    if (!card) return

    setCardError(null)
    setProcesando(true)
    try {
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card,
          billing_details: { name: nombre || undefined },
        },
      })
      if (error) {
        // Error de tarjeta: mostrar inline, no cambiar paso
        setCardError(error.message ?? 'Error al procesar el pago')
      } else if (paymentIntent?.status === 'succeeded') {
        onSuccess()
      }
    } finally {
      setProcesando(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-xs text-[#666666]">
        Orden:{' '}
        <span className="font-mono font-medium text-[#111111]">{venta.numeroVenta}</span>
      </p>

      {/* Nombre en la tarjeta */}
      <div>
        <label htmlFor="nombre-tarjeta" className="block text-sm font-medium text-[#111111] mb-1.5">
          Nombre en la tarjeta
        </label>
        <input
          id="nombre-tarjeta"
          type="text"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Como aparece en la tarjeta"
          className="w-full h-11 rounded-lg border border-[#D1D5DB] px-3 text-sm text-[#111111] placeholder:text-[#9CA3AF] outline-none transition-colors focus:border-[#CC0000] focus:ring-2 focus:ring-[#CC0000]/20"
        />
      </div>

      {/* Stripe CardElement */}
      <div>
        <label className="block text-sm font-medium text-[#111111] mb-1.5">
          Número de tarjeta
        </label>
        <div className="rounded-lg border border-[#D1D5DB] px-4 py-3 transition-colors focus-within:border-[#CC0000] focus-within:ring-2 focus-within:ring-[#CC0000]/20">
          <CardElement options={CARD_OPTIONS} />
        </div>
      </div>

      {cardError && (
        <p className="flex items-center gap-1.5 text-xs text-[#CC0000]" role="alert">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden />
          {cardError}
        </p>
      )}

      {/* Botón de pago */}
      <button
        type="submit"
        disabled={!stripe || procesando}
        className="w-full h-[52px] rounded-lg bg-[#CC0000] text-white font-semibold flex items-center justify-center gap-2 transition-colors hover:bg-[#AA0000] disabled:bg-[#D1D5DB] disabled:cursor-not-allowed"
      >
        {procesando ? (
          <>
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" aria-hidden />
            Procesando tu pago...
          </>
        ) : (
          <>
            <Lock className="h-4 w-4" aria-hidden />
            Pagar {formatPrecio(venta.total)}
          </>
        )}
      </button>

      {procesando && (
        <p className="text-center text-xs text-[#666666]">
          Por favor no cierres esta ventana
        </p>
      )}

      {/* Texto legal */}
      <p className="text-center text-[10px] text-[#9CA3AF]">
        Al pagar aceptas nuestros términos de servicio
      </p>

      {/* Logos de tarjetas */}
      <div className="flex items-center justify-center gap-3 pt-1">
        <svg className="h-5" viewBox="0 0 60 20" aria-label="Visa">
          <text x="0" y="16" fontFamily="Arial" fontWeight="bold" fontSize="18" fill="#1434CB">VISA</text>
        </svg>
        <svg className="h-5 w-9" viewBox="0 0 38 24" aria-label="Mastercard">
          <circle cx="14" cy="12" r="10" fill="#EB001B" />
          <circle cx="24" cy="12" r="10" fill="#F79E1B" opacity="0.85" />
          <path d="M19 5.5a10 10 0 0 1 0 13A10 10 0 0 1 19 5.5z" fill="#FF5F00" />
        </svg>
        <span className="text-[10px] text-[#9CA3AF]">Procesado por Stripe</span>
      </div>
    </form>
  )
}

function Breadcrumb() {
  return (
    <nav aria-label="Progreso de compra" className="flex items-center gap-1 text-sm">
      {(['Carrito', 'Pago', 'Confirmación'] as const).map((label, i) => (
        <span key={label} className="flex items-center gap-1">
          {i > 0 && <ChevronRight className="h-3.5 w-3.5 text-[#D1D5DB]" aria-hidden />}
          <span
            className={
              i === 1
                ? 'font-semibold text-[#CC0000]'
                : i < 1
                ? 'text-[#111111]'
                : 'text-[#9CA3AF]'
            }
          >
            {label}
          </span>
        </span>
      ))}
    </nav>
  )
}

type Paso = 'iniciando' | 'formulario' | 'error'

export default function PagoPage() {
  const navigate = useNavigate()
  const location = useLocation()

  const { items, totalMonto, vaciarCarrito } = useCarritoStore()
  const { isAuthenticated, token } = useAuthClienteStore()

  const [paso, setPaso] = useState<Paso>('iniciando')
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [venta, setVenta] = useState<Venta | null>(null)
  const [codigoPedido, setCodigoPedido] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Evita el double-invoke de StrictMode → doble transacción → numeroVenta duplicado → 500
  const iniciado = useRef(false)

  useEffect(() => {
    if (!isAuthenticated || !token || items.length === 0) return
    if (iniciado.current) return
    iniciado.current = true
    void iniciarPago()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!isAuthenticated || !token) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }
  if (items.length === 0) {
    return <Navigate to="/catalogo" replace />
  }

  async function iniciarPago() {
    setPaso('iniciando')
    setErrorMsg(null)
    try {
      const { venta: nuevaVenta, clientSecret: secret, codigoPedido: cp } = await crearVentaCliente(
        {
          sucursalId: 1,
          metodoPago: 'tarjeta',
          detalles: items.map((i) => ({
            productoId:     i.producto.id,
            cantidad:       i.cantidad,
            precioUnitario: i.precioUnitario,
          })),
        },
        token!
      )
      setVenta(nuevaVenta)
      setClientSecret(secret)
      setCodigoPedido(cp)
      setPaso('formulario')
    } catch (err) {
      // El interceptor ya maneja el 401 con redirect duro — no actualizar estado para evitar flash
      if (isAxiosError(err) && err.response?.status === 401) return
      setPaso('error')
      setErrorMsg('No se pudo iniciar el proceso de pago. Verifica el stock e intenta de nuevo.')
    }
  }

  function handleSuccess() {
    const productosSnapshot = items.map((i) => ({
      id:             i.producto.id,
      nombre:         i.producto.nombre,
      imagen_url:     i.producto.imagen_url ?? null,
      cantidad:       i.cantidad,
      precioUnitario: i.precioUnitario,
    }))
    navigate('/pago/exito', {
      replace: true,
      state: {
        numeroVenta:  venta?.numeroVenta,
        total:        venta?.total,
        codigoPedido: codigoPedido ?? undefined,
        productos:    productosSnapshot,
      },
    })
    // setTimeout garantiza que React Router termine de comprometer la navegación
    // antes de que vaciarCarrito() active el guard items.length===0 de esta página
    setTimeout(() => vaciarCarrito(), 100)
  }

  // ── Estado iniciando ───────────────────────────────────────────────────────
  if (paso === 'iniciando') {
    return (
      <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#EEEEEE] border-t-[#CC0000]" />
          <p className="text-sm text-[#666666]">Preparando tu pago…</p>
        </div>
      </div>
    )
  }

  // ── Error al iniciar (stock agotado, red, etc.) ────────────────────────────
  if (paso === 'error') {
    return (
      <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-md p-10 max-w-sm w-full text-center space-y-5">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#FEE2E2] mx-auto">
            <AlertCircle className="h-8 w-8 text-[#CC0000]" aria-hidden />
          </div>
          <div>
            <p className="font-semibold text-[#111111]">Error al iniciar el pago</p>
            <p className="text-sm text-[#666666] mt-1">{errorMsg}</p>
          </div>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => void iniciarPago()}
              className="w-full h-11 rounded-lg bg-[#CC0000] text-white font-medium hover:bg-[#AA0000] transition-colors"
            >
              Reintentar
            </button>
            <button
              onClick={() => navigate('/catalogo')}
              className="w-full h-11 rounded-lg border border-[#D1D5DB] text-[#111111] font-medium hover:bg-[#F9FAFB] transition-colors"
            >
              Volver al catálogo
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Formulario ────────────────────────────────────────────────────────────
  const total    = totalMonto()
  const igv      = Math.round(total * 18 / 118 * 100) / 100
  const subtotal = Math.round((total - igv) * 100) / 100

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-[900px] mx-auto px-4 sm:px-8 h-16 flex items-center justify-between gap-4">
          <Link to="/">
            <img src={assets.logo} alt="MOTOGEST" className="h-8 object-contain" />
          </Link>
          <h1 className="text-base font-semibold text-[#111111] hidden sm:block">
            Finalizar compra
          </h1>
          <Breadcrumb />
        </div>
      </header>

      <main className="max-w-[900px] mx-auto px-4 sm:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-[55%_45%] gap-6 items-start">

          {/* Columna izquierda — Resumen del pedido */}
          <div className="bg-white rounded-xl shadow-sm p-6 space-y-5">
            <h2 className="font-semibold text-[#111111] flex items-center gap-2">
              <ShoppingBag className="h-4 w-4 text-[#666666]" aria-hidden />
              Resumen de tu pedido
            </h2>

            <ul className="space-y-0" aria-label="Productos en el carrito">
              {items.map(({ producto, cantidad, precioUnitario }, idx) => (
                <li key={producto.id}>
                  {idx > 0 && <div className="border-t border-[#F3F4F6] my-4" />}
                  <div className="flex gap-3">
                    <img
                      src={producto.imagen_url ?? assets.categorias.repuestos}
                      alt={producto.nombre}
                      className="h-[60px] w-[60px] rounded-lg object-cover shrink-0 bg-[#F3F4F6]"
                      onError={(e) => {
                        ;(e.currentTarget as HTMLImageElement).src = assets.categorias.repuestos
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#111111] truncate">{producto.nombre}</p>
                      <p className="text-xs text-[#666666] mt-0.5">
                        {cantidad} × {formatPrecio(precioUnitario)}
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-[#111111] tabular-nums shrink-0">
                      {formatPrecio(precioUnitario * cantidad)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>

            {/* Totales */}
            <div className="border-t border-[#F3F4F6] pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-[#666666]">Subtotal (sin IGV)</span>
                <span className="text-[#666666] tabular-nums">{formatPrecio(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#666666]">IGV (18%)</span>
                <span className="text-[#666666] tabular-nums">{formatPrecio(igv)}</span>
              </div>
              <div className="border-t border-[#F3F4F6] pt-3 flex justify-between items-baseline">
                <span className="font-bold text-[#111111]">Total</span>
                <span className="font-bold text-lg text-[#111111] tabular-nums">
                  {formatPrecio(total)}
                </span>
              </div>
            </div>
          </div>

          {/* Columna derecha — Formulario de pago */}
          {clientSecret && venta && (
            <div className="bg-white rounded-xl shadow-sm p-6 space-y-5 min-w-[340px]">
              <div>
                <h2 className="font-semibold text-[#111111]">Datos de pago</h2>
                <p className="text-xs text-[#666666] flex items-center gap-1 mt-1">
                  <Lock className="h-3 w-3 text-[#22C55E]" aria-hidden />
                  Pago seguro con Stripe
                </p>
              </div>

              <Elements stripe={stripePromise}>
                <StripeForm
                  clientSecret={clientSecret}
                  venta={venta}
                  onSuccess={handleSuccess}
                />
              </Elements>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

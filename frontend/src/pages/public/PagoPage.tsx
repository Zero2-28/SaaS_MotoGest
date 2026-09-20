import { useState } from 'react'
import { Navigate, useNavigate, useLocation, Link } from 'react-router-dom'
import { isAxiosError } from 'axios'
import {
  Elements, CardElement, useStripe, useElements,
} from '@stripe/react-stripe-js'
import { Lock, ShoppingBag, AlertCircle, ChevronRight, MapPin, Phone } from 'lucide-react'
import { stripePromise } from '@/lib/stripe'
import { useCarritoStore } from '@/stores/carrito.store'
import { useAuthClienteStore } from '@/stores/auth.store'
import { crearVentaCliente } from '@/services/ventas.service'
import { getProducto } from '@/services/productos.service'
import { formatPrecio } from '@/utils/format'
import { assets } from '@/config/assets'
import type { Venta } from '@/types'

const CARD_OPTIONS = {
  style: {
    base: {
      color: '#0E1B2A',
      fontFamily: '"Inter", system-ui, sans-serif',
      fontSize: '16px',
      fontSmoothing: 'antialiased',
      '::placeholder': { color: '#94A6B8' },
    },
    invalid: { color: '#DC2626', iconColor: '#DC2626' },
  },
}

// Distritos de la Provincia Constitucional del Callao
const DISTRITOS = [
  'Bellavista',
  'Callao',
  'Carmen de la Legua-Reynoso',
  'La Perla',
  'La Punta',
  'Mi Perú',
  'Ventanilla',
]

interface DireccionData {
  distrito: string
  direccion: string
  telefono: string
  referencia: string
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
      <p className="text-xs text-chrome-600">
        Orden:{' '}
        <span className="font-mono font-medium text-ink">{venta.numeroVenta}</span>
      </p>

      <div>
        <label htmlFor="nombre-tarjeta" className="block text-sm font-medium text-ink mb-1.5">
          Nombre en la tarjeta
        </label>
        <input
          id="nombre-tarjeta"
          type="text"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Como aparece en la tarjeta"
          className="w-full h-11 rounded-lg border border-chrome-200 px-3 text-sm text-ink placeholder:text-chrome-400 outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-brand/20"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-ink mb-1.5">
          Número de tarjeta
        </label>
        <div className="rounded-lg border border-chrome-200 px-4 py-3 transition-colors focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/20">
          <CardElement options={CARD_OPTIONS} />
        </div>
      </div>

      {cardError && (
        <p className="flex items-center gap-1.5 text-xs text-danger" role="alert">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden />
          {cardError}
        </p>
      )}

      <button
        type="submit"
        disabled={!stripe || procesando}
        className="w-full h-[52px] rounded-lg bg-brand text-white font-semibold flex items-center justify-center gap-2 transition-colors hover:bg-brand-900 disabled:bg-chrome-200 disabled:cursor-not-allowed"
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
        <p className="text-center text-xs text-chrome-600">
          Por favor no cierres esta ventana
        </p>
      )}

      <p className="text-center text-[10px] text-chrome-400">
        Al pagar aceptas nuestros términos de servicio
      </p>

      <div className="flex items-center justify-center gap-3 pt-1">
        <svg className="h-5" viewBox="0 0 60 20" aria-label="Visa">
          <text x="0" y="16" fontFamily="Arial" fontWeight="bold" fontSize="18" fill="#1434CB">VISA</text>
        </svg>
        <svg className="h-5 w-9" viewBox="0 0 38 24" aria-label="Mastercard">
          <circle cx="14" cy="12" r="10" fill="#EB001B" />
          <circle cx="24" cy="12" r="10" fill="#F79E1B" opacity="0.85" />
          <path d="M19 5.5a10 10 0 0 1 0 13A10 10 0 0 1 19 5.5z" fill="#FF5F00" />
        </svg>
        <span className="text-[10px] text-chrome-400">Procesado por Stripe</span>
      </div>
    </form>
  )
}

type Paso = 'direccion' | 'iniciando' | 'formulario' | 'error'

const PASOS_LABEL = [
  { key: 'direccion',    label: 'Dirección' },
  { key: 'formulario',   label: 'Pago' },
  { key: 'confirmacion', label: 'Confirmación' },
] as const

function Breadcrumb({ paso }: { paso: Paso }) {
  const activeIdx = paso === 'direccion' ? 0 : paso === 'formulario' ? 1 : 2

  return (
    <nav aria-label="Progreso de compra" className="flex items-center gap-1 text-sm">
      {PASOS_LABEL.map(({ label }, i) => (
        <span key={label} className="flex items-center gap-1">
          {i > 0 && <ChevronRight className="h-3.5 w-3.5 text-chrome-200" aria-hidden />}
          <span
            className={
              i === activeIdx
                ? 'font-semibold text-brand'
                : i < activeIdx
                ? 'text-ink'
                : 'text-chrome-400'
            }
          >
            {label}
          </span>
        </span>
      ))}
    </nav>
  )
}

function DireccionForm({ onSubmit }: { onSubmit: (data: DireccionData) => void }) {
  const [distrito, setDistrito] = useState('')
  const [direccion, setDireccion] = useState('')
  const [telefono, setTelefono] = useState('')
  const [referencia, setReferencia] = useState('')
  const [touched, setTouched] = useState(false)

  const distritoError  = touched && !distrito
  const direccionError = touched && !direccion.trim()
  const telefonoError  = touched && telefono.replace(/\D/g, '').length < 9

  const telefonoValido = telefono.replace(/\D/g, '').length >= 9
  const puedeEnviar = !!distrito && !!direccion.trim() && telefonoValido

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setTouched(true)
    if (!puedeEnviar) return
    onSubmit({ distrito, direccion: direccion.trim(), telefono: telefono.trim(), referencia: referencia.trim() })
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <div>
        <label htmlFor="distrito" className="block text-sm font-medium text-ink mb-1.5">
          Distrito <span className="text-brand">*</span>
        </label>
        <select
          id="distrito"
          value={distrito}
          onChange={(e) => setDistrito(e.target.value)}
          aria-invalid={distritoError}
          className="w-full h-11 rounded-lg border border-chrome-200 px-3 text-sm text-ink outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-brand/20 aria-[invalid=true]:border-danger bg-white"
        >
          <option value="">Selecciona tu distrito</option>
          {DISTRITOS.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
        {distritoError && (
          <p className="mt-1 text-xs text-danger" role="alert">Selecciona un distrito</p>
        )}
      </div>

      <div>
        <label htmlFor="direccion" className="block text-sm font-medium text-ink mb-1.5">
          Dirección exacta <span className="text-brand">*</span>
        </label>
        <textarea
          id="direccion"
          value={direccion}
          onChange={(e) => setDireccion(e.target.value)}
          aria-invalid={direccionError}
          placeholder="Av. Principal 123, Urbanización…"
          rows={2}
          className="w-full rounded-lg border border-chrome-200 px-3 py-2.5 text-sm text-ink placeholder:text-chrome-400 outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-brand/20 aria-[invalid=true]:border-danger resize-none"
        />
        {direccionError && (
          <p className="mt-1 text-xs text-danger" role="alert">Ingresa tu dirección</p>
        )}
      </div>

      <div>
        <label htmlFor="telefono" className="block text-sm font-medium text-ink mb-1.5">
          <span className="flex items-center gap-1.5">
            <Phone className="h-3.5 w-3.5 text-chrome-600" aria-hidden />
            Teléfono de contacto <span className="text-brand">*</span>
          </span>
        </label>
        <input
          id="telefono"
          type="tel"
          value={telefono}
          onChange={(e) => setTelefono(e.target.value)}
          aria-invalid={telefonoError}
          placeholder="987 654 321"
          className="w-full h-11 rounded-lg border border-chrome-200 px-3 text-sm text-ink placeholder:text-chrome-400 outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-brand/20 aria-[invalid=true]:border-danger"
        />
        {telefonoError && (
          <p className="mt-1 text-xs text-danger" role="alert">
            El teléfono es obligatorio para coordinar la entrega (mínimo 9 dígitos)
          </p>
        )}
      </div>

      <div>
        <label htmlFor="referencia" className="block text-sm font-medium text-ink mb-1.5">
          Referencia <span className="text-xs text-chrome-400 font-normal">(opcional)</span>
        </label>
        <input
          id="referencia"
          type="text"
          value={referencia}
          onChange={(e) => setReferencia(e.target.value)}
          placeholder="Cerca a la farmacia, frente al parque…"
          className="w-full h-11 rounded-lg border border-chrome-200 px-3 text-sm text-ink placeholder:text-chrome-400 outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-brand/20"
        />
      </div>

      <button
        type="submit"
        disabled={!puedeEnviar}
        className="w-full h-[52px] rounded-lg bg-brand text-white font-semibold flex items-center justify-center gap-2 transition-colors hover:bg-brand-900 disabled:bg-chrome-200 disabled:cursor-not-allowed"
      >
        <Lock className="h-4 w-4" aria-hidden />
        Continuar al pago
      </button>
    </form>
  )
}

export default function PagoPage() {
  const navigate = useNavigate()
  const location = useLocation()

  const { items, totalMonto, vaciarCarrito } = useCarritoStore()
  const { isAuthenticated, token } = useAuthClienteStore()

  const [paso, setPaso] = useState<Paso>('direccion')
  const [dirData, setDirData] = useState<DireccionData | null>(null)
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [venta, setVenta] = useState<Venta | null>(null)
  const [codigoPedido, setCodigoPedido] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  if (!isAuthenticated || !token) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }
  if (items.length === 0) {
    return <Navigate to="/catalogo" replace />
  }

  async function iniciarPago(dir: DireccionData) {
    setDirData(dir)
    setPaso('iniciando')
    setErrorMsg(null)

    // Verificar stock actualizado antes de proceder al pago
    try {
      const stockChecks = await Promise.all(items.map((i) => getProducto(i.producto.id)))
      const agotado = stockChecks.find((p) => p.stock !== undefined && p.stock === 0)
      if (agotado) {
        setPaso('error')
        setErrorMsg(`"${agotado.nombre}" ya no tiene stock disponible. Actualiza tu carrito antes de continuar.`)
        return
      }
    } catch {
      // Si falla la verificación, el backend validará el stock igualmente
    }

    const direccionEntrega = `${dir.distrito} - ${dir.direccion} - Tel: ${dir.telefono}${dir.referencia ? ` - Ref: ${dir.referencia}` : ''}`
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
          direccionEntrega,
        },
        token!
      )
      setVenta(nuevaVenta)
      setClientSecret(secret)
      setCodigoPedido(cp)
      setPaso('formulario')
    } catch (err) {
      if (isAxiosError(err) && err.response?.status === 401) return
      setPaso('error')
      setErrorMsg('No se pudo iniciar el proceso de pago. Verifica el stock e intenta de nuevo.')
    }
  }

  function handleRetry() {
    if (dirData) {
      void iniciarPago(dirData)
    } else {
      setPaso('direccion')
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
    setTimeout(() => vaciarCarrito(), 100)
  }

  const total    = totalMonto()
  const igv      = Math.round(total * 18 / 118 * 100) / 100
  const subtotal = Math.round((total - igv) * 100) / 100

  // ── Estado: iniciando ──────────────────────────────────────────────────────
  if (paso === 'iniciando') {
    return (
      <div className="min-h-screen bg-mist flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-chrome-100 border-t-brand" />
          <p className="text-sm text-chrome-600">Preparando tu pago…</p>
        </div>
      </div>
    )
  }

  // ── Estado: error ──────────────────────────────────────────────────────────
  if (paso === 'error') {
    return (
      <div className="min-h-screen bg-mist flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-card-md p-10 max-w-sm w-full text-center space-y-5">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-danger-100 mx-auto">
            <AlertCircle className="h-8 w-8 text-brand" aria-hidden />
          </div>
          <div>
            <p className="font-semibold text-ink">Error al iniciar el pago</p>
            <p className="text-sm text-chrome-600 mt-1">{errorMsg}</p>
          </div>
          <div className="flex flex-col gap-2">
            <button
              onClick={handleRetry}
              className="w-full h-11 rounded-lg bg-brand text-white font-medium hover:bg-brand-900 transition-colors"
            >
              Reintentar
            </button>
            <button
              onClick={() => setPaso('direccion')}
              className="w-full h-11 rounded-lg border border-chrome-200 text-ink font-medium hover:bg-mist transition-colors"
            >
              Cambiar dirección
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Cabecera compartida (dirección y formulario) ───────────────────────────
  const Header = (
    <header className="bg-white shadow-card">
      <div className="max-w-[900px] mx-auto px-4 sm:px-8 h-16 flex items-center justify-between gap-4">
        <Link to="/">
          <img src={assets.logo} alt="RE MOTOS" className="h-9 w-auto rounded-md object-contain" />
        </Link>
        <h1 className="text-base font-semibold text-ink hidden sm:block">
          Finalizar compra
        </h1>
        <Breadcrumb paso={paso} />
      </div>
    </header>
  )

  // ── Resumen del pedido (columna izquierda compartida) ─────────────────────
  const ResumenPedido = (
    <div className="bg-white rounded-xl shadow-card p-6 space-y-5">
      <h2 className="font-semibold text-ink flex items-center gap-2">
        <ShoppingBag className="h-4 w-4 text-chrome-600" aria-hidden />
        Resumen de tu pedido
      </h2>

      <ul className="space-y-0" aria-label="Productos en el carrito">
        {items.map(({ producto, cantidad, precioUnitario }, idx) => (
          <li key={producto.id}>
            {idx > 0 && <div className="border-t border-chrome-50 my-4" />}
            <div className="flex gap-3">
              <img
                src={producto.imagen_url ?? assets.categorias.repuestos}
                alt={producto.nombre}
                className="h-[60px] w-[60px] rounded-lg object-cover shrink-0 bg-chrome-50"
                onError={(e) => {
                  ;(e.currentTarget as HTMLImageElement).src = assets.categorias.repuestos
                }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-ink truncate">{producto.nombre}</p>
                <p className="text-xs text-chrome-600 mt-0.5">
                  {cantidad} × {formatPrecio(precioUnitario)}
                </p>
              </div>
              <span className="text-sm font-semibold text-ink tabular-nums shrink-0">
                {formatPrecio(precioUnitario * cantidad)}
              </span>
            </div>
          </li>
        ))}
      </ul>

      <div className="border-t border-chrome-50 pt-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-chrome-600">Subtotal (sin IGV)</span>
          <span className="text-chrome-600 tabular-nums">{formatPrecio(subtotal)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-chrome-600">IGV (18%)</span>
          <span className="text-chrome-600 tabular-nums">{formatPrecio(igv)}</span>
        </div>
        <div className="border-t border-chrome-50 pt-3 flex justify-between items-baseline">
          <span className="font-bold text-ink">Total</span>
          <span className="font-bold text-lg text-ink tabular-nums">
            {formatPrecio(total)}
          </span>
        </div>
      </div>
    </div>
  )

  // ── Estado: dirección ──────────────────────────────────────────────────────
  if (paso === 'direccion') {
    return (
      <div className="min-h-screen bg-mist">
        {Header}
        <main className="max-w-[900px] mx-auto px-4 sm:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-[55%_45%] gap-6 items-start">
            {ResumenPedido}
            <div className="bg-white rounded-xl shadow-card p-6 space-y-5 min-w-[340px]">
              <div>
                <h2 className="font-semibold text-ink flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-chrome-600" aria-hidden />
                  Dirección de entrega
                </h2>
                <p className="text-xs text-chrome-600 mt-1">
                  Solo entregamos en distritos de la Provincia Constitucional del Callao
                </p>
              </div>
              <DireccionForm onSubmit={(dir) => void iniciarPago(dir)} />
            </div>
          </div>
        </main>
      </div>
    )
  }

  // ── Estado: formulario (Stripe) ────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-mist">
      {Header}
      <main className="max-w-[900px] mx-auto px-4 sm:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-[55%_45%] gap-6 items-start">
          {ResumenPedido}
          {clientSecret && venta && (
            <div className="bg-white rounded-xl shadow-card p-6 space-y-5 min-w-[340px]">
              <div>
                <h2 className="font-semibold text-ink">Datos de pago</h2>
                <p className="text-xs text-chrome-600 flex items-center gap-1 mt-1">
                  <Lock className="h-3 w-3 text-success" aria-hidden />
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

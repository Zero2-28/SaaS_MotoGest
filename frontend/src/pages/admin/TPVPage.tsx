import { useState, useEffect, useCallback } from 'react'
import { Search, Plus, Minus, Trash2, ShoppingCart, CheckCircle, Lock, AlertCircle, FileText, Download } from 'lucide-react'
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog'
import { stripePromise } from '@/lib/stripe'
import { useCarritoStore } from '@/stores/carrito.store'
import { useAuthEmpleadoStore } from '@/stores/auth.store'
import { getProductos } from '@/services/productos.service'
import { getCategorias } from '@/services/categorias.service'
import { getStockSucursal } from '@/services/inventario.service'
import { crearVenta, verComprobante } from '@/services/ventas.service'
import { crearIntentoPago } from '@/services/pagos.service'
import type { Producto, MetodoPago, Venta, Categoria } from '@/types'
import { formatPrecio } from '@/utils/format'

// Backend solo acepta estos tres métodos en createVentaSchema
const METODOS: { value: MetodoPago; label: string }[] = [
  { value: 'efectivo',      label: 'Efectivo'      },
  { value: 'tarjeta',       label: 'Tarjeta'       },
  { value: 'transferencia', label: 'Transferencia' },
]

const CARD_OPTIONS = {
  style: {
    base: {
      color: '#0E1B2A',
      fontFamily: '"Inter", system-ui, sans-serif',
      fontSize: '14px',
      fontSmoothing: 'antialiased',
      '::placeholder': { color: '#94A6B8' },
    },
    invalid: { color: '#DC2626', iconColor: '#DC2626' },
  },
}

// ── Formulario Stripe en el modal del TPV ─────────────────────────────────────
interface TPVStripeFormProps {
  clientSecret: string
  venta: Venta
  onSuccess: () => void
  onClose: () => void
}

function TPVStripeForm({ clientSecret, venta, onSuccess, onClose }: TPVStripeFormProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [procesando, setProcesando] = useState(false)
  const [cardError, setCardError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!stripe || !elements) return

    const card = elements.getElement(CardElement)
    if (!card) return

    setCardError(null)
    setProcesando(true)
    try {
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: { card },
      })
      if (error) {
        setCardError(error.message ?? 'Error al procesar el pago')
      } else if (paymentIntent?.status === 'succeeded') {
        onSuccess()
      }
    } catch {
      setCardError('Error inesperado al procesar el pago')
    } finally {
      setProcesando(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-xs text-chrome-600">
        Orden: <span className="font-mono text-ink">{venta.numeroVenta}</span>
        {' · '}
        <span className="text-ink tabular-nums font-bold">{formatPrecio(venta.total)}</span>
      </p>

      <div className="rounded-md border border-chrome-200 bg-chrome-50 px-4 py-3">
        <CardElement options={CARD_OPTIONS} />
      </div>

      {cardError && (
        <p className="flex items-center gap-1.5 text-xs text-danger">
          <AlertCircle className="h-3 w-3 shrink-0" />
          {cardError}
        </p>
      )}

      <div className="flex gap-2">
        <Button
          type="button"
          variant="secondary"
          className="flex-1"
          onClick={onClose}
          disabled={procesando}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          className="flex-1"
          disabled={!stripe || procesando}
        >
          {procesando ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : (
            <>
              <Lock className="mr-2 h-3 w-3" />
              Confirmar
            </>
          )}
        </Button>
      </div>
    </form>
  )
}

// ── Panel de búsqueda de productos ────────────────────────────────────────────
function BuscadorProductos({ stockMap }: { stockMap: Record<number, number> }) {
  const [busqueda, setBusqueda]         = useState('')
  const [categFilter, setCategFilter]   = useState<number | undefined>(undefined)
  const [categorias, setCategorias]     = useState<Categoria[]>([])
  const [resultados, setResultados]     = useState<Producto[]>([])
  const [buscando, setBuscando]         = useState(false)
  const agregarItem = useCarritoStore((s) => s.agregarItem)

  // Cargar categorías al montar para el filtro
  useEffect(() => {
    getCategorias().then(setCategorias).catch(() => {})
  }, [])

  const buscar = useCallback(async (q: string, catId: number | undefined) => {
    if (!q.trim() && catId === undefined) { setResultados([]); return }
    setBuscando(true)
    try {
      const result = await getProductos(1, 20, q, catId)
      setResultados(result.items)
    } catch {
      setResultados([])
    } finally {
      setBuscando(false)
    }
  }, [])

  useEffect(() => {
    const t = setTimeout(() => buscar(busqueda, categFilter), 300)
    return () => clearTimeout(t)
  }, [busqueda, categFilter, buscar])

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden />
          <Input
            placeholder="Buscar por nombre o código…"
            className="pl-9 bg-mist border-chrome-200 text-ink placeholder:text-chrome-400 focus-visible:border-brand focus-visible:ring-brand/20"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            aria-label="Buscar producto para agregar al carrito"
          />
        </div>
        {categorias.length > 0 && (
          <Select
            value={categFilter !== undefined ? String(categFilter) : 'todas'}
            onValueChange={(v) => setCategFilter(v === 'todas' ? undefined : Number(v))}
          >
            <SelectTrigger className="w-40 shrink-0 bg-mist border-chrome-200 text-ink" aria-label="Filtrar por categoría">
              <SelectValue placeholder="Categoría" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas</SelectItem>
              {categorias.map((c) => (
                <SelectItem key={c.id} value={String(c.id)}>{c.nombre}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
      {(resultados.length > 0 || buscando) && (
        <div className="rounded-md border border-chrome-200 bg-white shadow-card-lg max-h-56 overflow-y-auto">
          {buscando ? (
            <div className="p-4 text-center text-sm text-muted-foreground">Buscando…</div>
          ) : (
            <ul>
              {resultados.map((p) => {
                const stock = stockMap[p.id] ?? 0
                const sinStock = !p.activo || stock === 0
                return (
                  <li key={p.id}>
                    <button
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-chrome-50 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={() => { agregarItem(p); setBusqueda(''); setResultados([]) }}
                      disabled={sinStock}
                      aria-label={`Agregar ${p.nombre} al carrito`}
                    >
                      <img
                        src={p.imagen_url ?? 'https://placehold.co/40x40/F9FAFB/9CA3AF?text=M'}
                        alt=""
                        aria-hidden
                        onError={(e) => { e.currentTarget.src = 'https://placehold.co/40x40/F9FAFB/9CA3AF?text=M' }}
                        className="h-10 w-10 rounded-lg object-cover shrink-0"
                        width={40}
                        height={40}
                        loading="lazy"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-ink truncate">{p.nombre}</p>
                        <p className="text-xs text-muted-foreground">{p.codigo}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className="tabular-nums text-ink">{formatPrecio(p.precioVenta)}</span>
                        <Badge variant={stock === 0 ? 'stock-critico' : stock <= 3 ? 'stock-bajo' : 'stock-ok'} className="text-[10px] py-0 h-4">
                          {stock === 0 ? 'Sin stock' : `${stock} disp.`}
                        </Badge>
                      </div>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

// ── Carrito ───────────────────────────────────────────────────────────────────
interface StripeModalData {
  clientSecret: string
  venta: Venta
}

function Carrito({ onVentaCompleta, stockMap }: { onVentaCompleta: () => void; stockMap: Record<number, number> }) {
  const {
    items, totalMonto, totalItems,
    cambiarCantidad, quitarItem,
    metodoPago, setMetodoPago,
    vaciarCarrito,
  } = useCarritoStore()
  const { empleado } = useAuthEmpleadoStore()
  const [procesando, setProcesando] = useState(false)
  const [ventaExito, setVentaExito] = useState<Venta | null>(null)
  const [stripeModal, setStripeModal] = useState<StripeModalData | null>(null)
  const [stockError, setStockError] = useState<string | null>(null)

  async function cobrar() {
    // empleado puede tener sucursalId null (admin global) → usamos fallback 1
    if (items.length === 0 || !empleado) return

    // Validar stock antes de proceder
    for (const item of items) {
      const disponible = stockMap[item.producto.id] ?? 0
      if (item.cantidad > disponible) {
        setStockError(
          `Stock insuficiente para "${item.producto.nombre}": hay ${disponible} unidad(es), pediste ${item.cantidad}.`
        )
        return
      }
    }
    setStockError(null)
    setProcesando(true)
    try {
      const ventaCreada = await crearVenta({
        sucursalId: empleado.sucursalId ?? 1,
        metodoPago,
        detalles: items.map((i) => ({
          productoId:     i.producto.id,
          cantidad:       i.cantidad,
          precioUnitario: i.precioUnitario,
        })),
      })

      if (metodoPago === 'tarjeta') {
        // Crear el PaymentIntent y abrir el modal de Stripe
        const intento = await crearIntentoPago({
          ventaId: ventaCreada.id,
          monto:   ventaCreada.total,
        })
        setStripeModal({ clientSecret: intento.clientSecret, venta: ventaCreada })
      } else {
        // Efectivo / transferencia: cobro inmediato
        vaciarCarrito()
        setVentaExito(ventaCreada)
      }
    } catch {
      // Error de API — procesando vuelve a false por finally, el carrito queda intacto
    } finally {
      setProcesando(false)
    }
  }

  function handleStripeSuccess() {
    const venta = stripeModal!.venta
    vaciarCarrito()
    setStripeModal(null)
    setVentaExito(venta)
  }

  function handleStripeClose() {
    // El pago fue cancelado — la venta ya está creada en el backend.
    // La dejamos en estado pendiente; el admin puede aprobarla o cancelarla desde Compras.
    setStripeModal(null)
  }

  if (ventaExito) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-12 animate-fade-in text-center">
        <CheckCircle className="h-16 w-16 text-success" />
        <div>
          <p className="text-xl font-bold text-ink">¡Venta registrada!</p>
          <p className="text-xs font-mono text-muted-foreground mt-1">{ventaExito.numeroVenta}</p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => void verComprobante(ventaExito.id, false)}
            className="flex items-center gap-1.5"
          >
            <FileText className="h-3.5 w-3.5" />
            Ver PDF
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void verComprobante(ventaExito.id, true)}
            className="flex items-center gap-1.5"
          >
            <Download className="h-3.5 w-3.5" />
            Descargar
          </Button>
        </div>

        <Button
          onClick={() => { setVentaExito(null); onVentaCompleta() }}
          className="mt-1"
        >
          Nuevo cobro
        </Button>
      </div>
    )
  }

  return (
    <>
      <div className="flex flex-col gap-4 h-full">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <ShoppingCart className="h-12 w-12 text-brand-600" />
            <p className="text-sm text-muted-foreground">Busca y agrega productos al carrito</p>
          </div>
        ) : (
          <>
            {/* Items */}
            <ul className="flex-1 space-y-2 overflow-y-auto max-h-72" aria-label="Productos en el carrito">
              {items.map(({ producto, cantidad, precioUnitario }) => (
                <li key={producto.id} className="flex items-center gap-3 rounded-md bg-chrome-50 border border-chrome-100 p-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-ink truncate">{producto.nombre}</p>
                    <p className="text-xs text-muted-foreground tabular-nums">
                      {formatPrecio(precioUnitario)} c/u
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      size="icon" variant="ghost"
                      className="h-7 w-7 bg-chrome-50 text-chrome-700 hover:text-brand hover:bg-chrome-50"
                      onClick={() => cambiarCantidad(producto.id, cantidad - 1)}
                      aria-label="Reducir"
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-6 text-center text-sm tabular-nums">{cantidad}</span>
                    <Button
                      size="icon" variant="ghost"
                      className="h-7 w-7 bg-chrome-50 text-chrome-700 hover:text-brand hover:bg-chrome-50"
                      onClick={() => cambiarCantidad(producto.id, cantidad + 1)}
                      aria-label="Aumentar"
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                  <span className="tabular-nums text-sm text-ink w-20 text-right">
                    {formatPrecio(precioUnitario * cantidad)}
                  </span>
                  <Button
                    size="icon" variant="ghost"
                    className="h-7 w-7 bg-chrome-50 text-chrome-700 hover:text-brand hover:bg-danger-100 shrink-0"
                    onClick={() => quitarItem(producto.id)}
                    aria-label={`Quitar ${producto.nombre}`}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </li>
              ))}
            </ul>

            <Separator />

            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">{totalItems()} productos</span>
              <span className="text-xl font-bold text-ink tabular-nums">{formatPrecio(totalMonto())}</span>
            </div>

            {/* Método de pago */}
            <div>
              <p className="text-xs text-muted-foreground mb-2">Método de pago</p>
              <div className="grid grid-cols-3 gap-2">
                {METODOS.map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => setMetodoPago(value)}
                    className={`rounded-md border px-2 py-2 text-xs font-medium transition-colors ${
                      metodoPago === value
                        ? 'border-brand bg-danger-50 text-brand'
                        : 'border-chrome-200 text-chrome-600 hover:border-chrome-400'
                    }`}
                    aria-pressed={metodoPago === value}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {stockError && (
              <p className="flex items-center gap-1.5 text-xs text-danger-600 rounded-md bg-danger-50 border border-danger-100 px-3 py-2">
                <AlertCircle className="h-3 w-3 shrink-0" />
                {stockError}
              </p>
            )}

            <Button
              size="lg"
              onClick={cobrar}
              disabled={procesando || items.length === 0}
              className="w-full text-base"
            >
              {procesando ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <>Cobrar {formatPrecio(totalMonto())}</>
              )}
            </Button>

            <Button
              variant="ghost" size="sm"
              className="text-muted-foreground hover:text-danger"
              onClick={vaciarCarrito}
            >
              Vaciar carrito
            </Button>
          </>
        )}
      </div>

      {/* Modal Stripe — solo aparece cuando metodoPago === 'tarjeta' */}
      {stripeModal && (
        <Dialog open onOpenChange={handleStripeClose}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                Pago con tarjeta
              </DialogTitle>
              <DialogDescription>
                Ingresa los datos de la tarjeta del cliente para completar el cobro.
              </DialogDescription>
            </DialogHeader>
            <Elements stripe={stripePromise}>
              <TPVStripeForm
                clientSecret={stripeModal.clientSecret}
                venta={stripeModal.venta}
                onSuccess={handleStripeSuccess}
                onClose={handleStripeClose}
              />
            </Elements>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}

// ── Página principal ──────────────────────────────────────────────────────────
export default function TPVPage() {
  const [refresh, setRefresh] = useState(0)
  const [stockMap, setStockMap] = useState<Record<number, number>>({})
  const totalItems = useCarritoStore((s) => s.totalItems)
  const { empleado } = useAuthEmpleadoStore()

  useEffect(() => {
    const sucursalId = empleado?.sucursalId ?? 1
    async function cargarStock() {
      try {
        const items = await getStockSucursal(sucursalId)
        const map: Record<number, number> = {}
        items.forEach((s) => { map[s.productoId] = s.cantidad })
        setStockMap(map)
      } catch {}
    }
    void cargarStock()
    const interval = setInterval(() => void cargarStock(), 30000)
    return () => clearInterval(interval)
  }, [empleado?.sucursalId])

  return (
    <div className="space-y-4 animate-fade-in h-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-display-sm text-ink">PUNTO DE VENTA</h1>
          <p className="text-sm text-muted-foreground mt-1">Registra ventas en tiempo real</p>
        </div>
        <Badge variant="secondary">{totalItems()} en carrito</Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 h-[calc(100vh-12rem)]">
        {/* Panel búsqueda */}
        <Card className="flex flex-col overflow-hidden bg-white border-chrome-200">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-chrome-700">Agregar productos</CardTitle>
          </CardHeader>
          <CardContent className="flex-1">
            <BuscadorProductos key={refresh} stockMap={stockMap} />
          </CardContent>
        </Card>

        {/* Panel carrito */}
        <Card className="flex flex-col overflow-hidden bg-white border-chrome-200">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-chrome-700">Carrito de venta</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col">
            <Carrito onVentaCompleta={() => setRefresh((r) => r + 1)} stockMap={stockMap} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

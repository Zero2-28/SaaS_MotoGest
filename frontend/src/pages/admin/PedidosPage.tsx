import { useEffect, useState, useCallback } from 'react'
import { ChevronDown, FileText } from 'lucide-react'
import { verComprobante } from '@/services/ventas.service'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { getPedidos, cambiarEstadoPedido } from '@/services/pedidos.service'
import { getRepartidores } from '@/services/usuarios.service'
import type { UsuarioBasico } from '@/services/usuarios.service'
import type { Pedido, EstadoPedido } from '@/types'
import { formatPrecio, formatFecha } from '@/utils/format'
import { useAuthEmpleadoStore } from '@/stores/auth.store'

// Intenta parsear observaciones como array de ítems JSON; si falla, devuelve el texto tal cual
function formatObservaciones(obs: string | null): string | null {
  if (!obs) return null
  try {
    const items = JSON.parse(obs) as { nombre: string; cantidad: number; precioUnitario: number }[]
    if (!Array.isArray(items) || items.length === 0) return obs
    return items
      .map((i) => `${i.cantidad}x ${i.nombre} — S/${Number(i.precioUnitario).toFixed(2)} c/u`)
      .join(' · ')
  } catch {
    return obs
  }
}

const ESTADOS_OPCIONES: { value: EstadoPedido; label: string }[] = [
  { value: 'pendiente',   label: 'Pendiente'    },
  { value: 'confirmado',  label: 'Confirmado'   },
  { value: 'preparando',  label: 'Preparando'   },
  { value: 'listo',       label: 'Listo'        },
  { value: 'en_transito', label: 'En tránsito'  },
  { value: 'entregado',   label: 'Entregado'    },
  { value: 'cancelado',   label: 'Cancelado'    },
]

const BADGE_VARIANT: Record<EstadoPedido, 'pendiente' | 'procesando' | 'listo' | 'enviado' | 'entregado' | 'cancelado'> = {
  pendiente:   'pendiente',
  confirmado:  'procesando',
  preparando:  'procesando',
  listo:       'listo',
  en_transito: 'enviado',
  entregado:   'entregado',
  cancelado:   'cancelado',
}

type RepartidorById = Record<number, UsuarioBasico>

function PedidoCard({
  pedido,
  repartidoresById,
  onEstadoCambiado,
}: {
  pedido: Pedido
  repartidoresById: RepartidorById
  onEstadoCambiado: () => void
}) {
  const { empleado } = useAuthEmpleadoStore()
  const esAdmin = empleado?.rol === 'admin'

  const [cambiando, setCambiando]     = useState(false)
  const [asignando, setAsignando]     = useState(false)
  const [asignarError, setAsignarError] = useState<string | null>(null)

  async function handleEstado(estado: string) {
    setCambiando(true)
    try {
      await cambiarEstadoPedido(pedido.id, estado as EstadoPedido)
      onEstadoCambiado()
    } catch {
      // Error silenciado
    } finally {
      setCambiando(false)
    }
  }

  async function handleAsignar(valor: string) {
    if (valor === 'sin-asignar') return
    setAsignando(true)
    setAsignarError(null)
    try {
      await cambiarEstadoPedido(pedido.id, pedido.estado, undefined, Number(valor))
      onEstadoCambiado()
    } catch {
      setAsignarError('No se pudo asignar el repartidor.')
    } finally {
      setAsignando(false)
    }
  }

  const repartidorActual = pedido.usuarioId ? repartidoresById[pedido.usuarioId] : null
  const repartidores     = Object.values(repartidoresById)

  return (
    <article className="rounded-lg border border-chrome-200 bg-white p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-sm font-bold text-ink">{pedido.codigoPedido}</span>
            <Badge variant={BADGE_VARIANT[pedido.estado]}>
              {ESTADOS_OPCIONES.find((e) => e.value === pedido.estado)?.label}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {pedido.fechaPedido
              ? formatFecha(pedido.fechaPedido)
              : pedido.createdAt
              ? formatFecha(pedido.createdAt)
              : '—'}
          </p>
        </div>
        <span className="tabular-nums font-bold text-ink text-sm shrink-0">
          {formatPrecio(pedido.total)}
        </span>
      </div>

      <div className="text-sm space-y-1">
        <p>
          <span className="text-muted-foreground">Cliente: </span>
          <span className="text-ink">{pedido.cliente.nombre}</span>
        </p>
        {pedido.direccionEntrega && (
          <p className="text-xs">
            <span className="text-muted-foreground">Dirección: </span>
            <span
              className={
                pedido.direccionEntrega === 'Por confirmar'
                  ? 'font-medium text-turbo'
                  : 'text-ink'
              }
            >
              {pedido.direccionEntrega}
            </span>
          </p>
        )}
        {(() => {
          const tel = pedido.direccionEntrega?.match(/Tel:\s*([^-]+)/)?.[1]?.trim()
          return tel ? (
            <p className="text-xs">
              <span className="text-muted-foreground">Teléfono: </span>
              <span className="text-ink font-medium">{tel}</span>
            </p>
          ) : null
        })()}
        {pedido.observaciones && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {formatObservaciones(pedido.observaciones)}
          </p>
        )}
      </div>

      {/* Repartidor asignado */}
      <div className="rounded-md bg-chrome-50 border border-chrome-100 px-3 py-2 text-xs space-y-1.5">
        <span className="text-muted-foreground">Repartidor</span>
        {esAdmin ? (
          <>
            <Select
              value={pedido.usuarioId ? String(pedido.usuarioId) : 'sin-asignar'}
              onValueChange={handleAsignar}
              disabled={asignando}
            >
              <SelectTrigger className="min-w-[180px] w-full bg-mist border border-chrome-200 text-ink h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sin-asignar" className="text-xs">Sin asignar</SelectItem>
                {repartidores.map((r) => (
                  <SelectItem key={r.id} value={String(r.id)} className="text-xs">
                    {r.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {asignarError && (
              <p className="text-xs text-danger">{asignarError}</p>
            )}
          </>
        ) : (
          <span className="font-medium text-ink">
            {repartidorActual?.nombre ?? <span className="text-chrome-400">Sin asignar</span>}
          </span>
        )}
      </div>

      {/* Cambio de estado */}
      {pedido.estado !== 'entregado' && pedido.estado !== 'cancelado' && (
        <div className="flex items-center gap-2">
          <Select onValueChange={handleEstado} disabled={cambiando}>
            <SelectTrigger className="h-8 text-xs flex-1">
              <SelectValue placeholder="Cambiar estado…" />
              <ChevronDown className="h-3 w-3 opacity-50" />
            </SelectTrigger>
            <SelectContent>
              {ESTADOS_OPCIONES.map((e) => (
                <SelectItem key={e.value} value={e.value} className="text-xs">
                  {e.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {cambiando && (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-chrome-400 border-t-transparent shrink-0" />
          )}
        </div>
      )}

      {/* Botón PDF — solo si se conoce el ID de la venta origen */}
      {pedido.ventaId && (
        <button
          onClick={() => void verComprobante(pedido.ventaId!, false)}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-ink transition-colors"
          aria-label="Ver comprobante PDF"
        >
          <FileText className="h-3.5 w-3.5" aria-hidden />
          Ver comprobante PDF
        </button>
      )}
    </article>
  )
}

export default function PedidosPage() {
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [filtro, setFiltro] = useState<EstadoPedido | 'todos'>('todos')
  const [desde, setDesde]   = useState('')
  const [hasta, setHasta]   = useState('')
  const [cargando, setCargando] = useState(true)
  const [repartidoresById, setRepartidoresById] = useState<RepartidorById>({})

  const cargar = useCallback(async (mostrarSkeleton = false) => {
    if (mostrarSkeleton) setCargando(true)
    try {
      const data = await getPedidos()
      setPedidos(data)
    } catch {
      // Error de red silenciado
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => {
    void cargar(true)
    const intervalo = setInterval(() => void cargar(), 30000)
    return () => clearInterval(intervalo)
  }, [cargar])

  // Carga repartidores una sola vez para el dropdown de asignación
  useEffect(() => {
    getRepartidores()
      .then((list) => {
        const byId: RepartidorById = {}
        list.forEach((r) => { byId[r.id] = r })
        setRepartidoresById(byId)
      })
      .catch(() => {})
  }, [])

  function enRango(fecha: string | null | undefined): boolean {
    if (!fecha) return true
    const fechaSolo = new Date(fecha).toLocaleDateString('en-CA')
    if (desde && fechaSolo < desde) return false
    if (hasta && fechaSolo > hasta) return false
    return true
  }

  const pedidosFiltrados = pedidos
    .filter((p) => filtro === 'todos' || p.estado === filtro)
    .filter((p) => enRango(p.fechaPedido ?? p.createdAt))

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display text-display-sm text-ink">PEDIDOS</h1>
        <p className="text-sm text-muted-foreground mt-1">{pedidos.length} pedidos en total</p>
      </div>

      {/* Filtro de fechas */}
      <div className="flex flex-wrap gap-2 items-center">
        <input
          type="date"
          value={desde}
          onChange={(e) => setDesde(e.target.value)}
          className="bg-mist border border-chrome-200 text-ink rounded-lg px-3 py-2 text-sm"
          aria-label="Desde"
        />
        <input
          type="date"
          value={hasta}
          onChange={(e) => setHasta(e.target.value)}
          className="bg-mist border border-chrome-200 text-ink rounded-lg px-3 py-2 text-sm"
          aria-label="Hasta"
        />
        {(desde || hasta) && (
          <button
            onClick={() => { setDesde(''); setHasta('') }}
            className="text-sm text-chrome-600 hover:text-ink px-3 py-2 rounded-lg border border-chrome-200 bg-mist"
          >
            Limpiar fechas
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar por estado">
        <Button
          variant={filtro === 'todos' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFiltro('todos')}
          aria-pressed={filtro === 'todos'}
        >
          Todos ({pedidos.length})
        </Button>
        {ESTADOS_OPCIONES.map(({ value, label }) => {
          const count = pedidos.filter((p) => p.estado === value).length
          return (
            <Button
              key={value}
              variant={filtro === value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFiltro(value)}
              aria-pressed={filtro === value}
            >
              {label} ({count})
            </Button>
          )
        })}
      </div>

      {cargando ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton h-52 rounded-lg" />
          ))}
        </div>
      ) : pedidosFiltrados.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground text-sm">
            No hay pedidos {filtro !== 'todos' ? `con estado "${filtro}"` : ''}.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {pedidosFiltrados.map((p) => (
            <PedidoCard
              key={p.id}
              pedido={p}
              repartidoresById={repartidoresById}
              onEstadoCambiado={cargar}
            />
          ))}
        </div>
      )}
    </div>
  )
}

import { useState, useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Search, Package, Truck, CheckCircle, CheckCircle2, Clock, XCircle,
} from 'lucide-react'
import { rastrearPedido } from '@/services/pedidos.service'
import type { PedidoPublico } from '@/types'
import { formatPrecio, formatFecha } from '@/utils/format'
import { assets } from '@/config/assets'
import { cn } from '@/utils/cn'

const schema = z.object({
  codigo: z
    .string()
    .min(1, 'Ingresa tu código de seguimiento CT-2026-XXXX')
    .regex(/^CT-\d{4}-\d+$/i, 'Ingresa tu código de seguimiento CT-2026-XXXX'),
})

type FormData = z.infer<typeof schema>

const ESTADO_META: Record<string, { label: string; bg: string; color: string }> = {
  pendiente:   { label: 'Pendiente',      bg: '#F1F5F9', color: '#33485C' },
  confirmado:  { label: 'Confirmado',     bg: '#EFF6FF', color: '#3B82F6' },
  preparando:  { label: 'En preparación', bg: '#FFF7ED', color: '#FF6B00' },
  listo:       { label: 'Listo',          bg: '#FEFCE8', color: '#EAB308' },
  en_transito: { label: 'En tránsito',    bg: '#EFF6FF', color: '#1D4ED8' },
  entregado:   { label: 'Entregado',      bg: '#F0FDF4', color: '#22C55E' },
  cancelado:   { label: 'Cancelado',      bg: '#FEF2F2', color: '#DC2626' },
}

// Timeline: listo y en_transito ambos mapean al paso 3
const PASOS = [
  { key: 'pendiente',  label: 'Pendiente',   Icon: Clock },
  { key: 'confirmado', label: 'Confirmado',  Icon: CheckCircle },
  { key: 'preparando', label: 'Preparando',  Icon: Package },
  { key: 'listo',      label: 'En tránsito', Icon: Truck },
  { key: 'entregado',  label: 'Entregado',   Icon: CheckCircle2 },
] as const

function timelineIdx(estado: string): number {
  if (estado === 'en_transito') return 3
  const i = PASOS.findIndex((p) => p.key === estado)
  return i >= 0 ? i : 0
}

function EstadoBadge({ estado }: { estado: string }) {
  const m = ESTADO_META[estado] ?? ESTADO_META.pendiente
  return (
    <span
      className="inline-flex rounded-full px-3 py-1 text-sm font-semibold"
      style={{ background: m.bg, color: m.color }}
    >
      {m.label}
    </span>
  )
}

function Timeline({ estado }: { estado: string }) {
  if (estado === 'cancelado') return null
  const active = timelineIdx(estado)

  return (
    <>
      {/* Desktop — horizontal */}
      <div className="hidden sm:flex items-start" role="list" aria-label="Progreso del pedido">
        {PASOS.map(({ key, label, Icon }, i) => {
          const done    = active > i
          const current = active === i
          return (
            <div key={key} className="flex items-center" role="listitem">
              <div className="flex flex-col items-center gap-2">
                <div
                  aria-current={current ? 'step' : undefined}
                  className={cn(
                    'flex h-12 w-12 items-center justify-center rounded-full transition-colors',
                    done    && 'bg-brand',
                    current && 'border-2 border-brand bg-white animate-pulse',
                    !done && !current && 'bg-chrome-100',
                  )}
                >
                  <Icon
                    className={cn(
                      'h-5 w-5',
                      done    && 'text-white',
                      current && 'text-brand',
                      !done && !current && 'text-chrome-400',
                    )}
                    aria-hidden
                  />
                </div>
                <span className={cn(
                  'text-xs font-medium text-center max-w-[64px]',
                  done || current ? 'text-ink' : 'text-chrome-400',
                )}>
                  {label}
                </span>
              </div>
              {i < PASOS.length - 1 && (
                <div
                  className={cn('h-0.5 w-8 lg:w-14 mx-2 mb-7 transition-colors', active > i ? 'bg-brand' : 'bg-chrome-100')}
                  aria-hidden
                />
              )}
            </div>
          )
        })}
      </div>

      {/* Mobile — vertical */}
      <div className="flex sm:hidden flex-col gap-0" role="list" aria-label="Progreso del pedido">
        {PASOS.map(({ key, label, Icon }, i) => {
          const done    = active > i
          const current = active === i
          const isLast  = i === PASOS.length - 1
          return (
            <div key={key} className="flex gap-3" role="listitem">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-full shrink-0',
                    done    && 'bg-brand',
                    current && 'border-2 border-brand bg-white animate-pulse',
                    !done && !current && 'bg-chrome-100',
                  )}
                >
                  <Icon
                    className={cn(
                      'h-4 w-4',
                      done    && 'text-white',
                      current && 'text-brand',
                      !done && !current && 'text-chrome-400',
                    )}
                    aria-hidden
                  />
                </div>
                {!isLast && (
                  <div className={cn('w-0.5 h-6 my-1', active > i ? 'bg-brand' : 'bg-chrome-100')} aria-hidden />
                )}
              </div>
              <div className="py-2">
                <span className={cn('text-sm font-medium', done || current ? 'text-ink' : 'text-chrome-400')}>
                  {label}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}

interface DetalleItem { nombre: string; cantidad: number; precioUnitario: number; subtotal: number }

function Productos({ obs }: { obs: string | null }) {
  if (!obs) return <p className="text-sm text-chrome-500">Sin detalle disponible</p>
  let items: DetalleItem[]
  try {
    const parsed = JSON.parse(obs) as DetalleItem[]
    if (!Array.isArray(parsed) || parsed.length === 0) throw new Error()
    items = parsed
  } catch {
    return <p className="text-sm text-chrome-600">{obs}</p>
  }
  return (
    <ul className="space-y-3">
      {items.map((item, i) => (
        <li key={i} className="flex items-start justify-between gap-2 text-sm">
          <div>
            <p className="font-medium text-ink">{item.nombre}</p>
            <p className="text-xs text-chrome-500">{item.cantidad} × {formatPrecio(item.precioUnitario)}</p>
          </div>
          <span className="font-semibold text-ink tabular-nums shrink-0">
            {formatPrecio(item.subtotal)}
          </span>
        </li>
      ))}
    </ul>
  )
}

const ESTADOS_TERMINAL = ['entregado', 'cancelado']

export default function RastreoPage() {
  const [pedido, setPedido] = useState<PedidoPublico | null>(null)
  const [buscado, setBuscado] = useState(false)
  const [hayError, setHayError] = useState(false)
  const codigoActivo = useRef<string | null>(null)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  // Polling cada 30s mientras el pedido no esté en estado terminal
  useEffect(() => {
    if (!pedido || ESTADOS_TERMINAL.includes(pedido.estado)) return
    const codigo = codigoActivo.current
    if (!codigo) return
    const intervalo = setInterval(async () => {
      try {
        const data = await rastrearPedido(codigo)
        setPedido(data)
      } catch {
        // Silenciado — no resetear el estado si falla el poll
      }
    }, 30000)
    return () => clearInterval(intervalo)
  }, [pedido?.estado])

  async function onSubmit({ codigo }: FormData) {
    setHayError(false)
    setPedido(null)
    setBuscado(false)
    try {
      const upper = codigo.toUpperCase()
      codigoActivo.current = upper
      const data = await rastrearPedido(upper)
      setPedido(data)
    } catch {
      codigoActivo.current = null
      setHayError(true)
    } finally {
      setBuscado(true)
    }
  }

  // Historial más reciente primero
  const historial = pedido ? [...pedido.historial].reverse() : []

  return (
    <div>
      {/* Hero */}
      <div className="relative flex h-[280px] items-center justify-center overflow-hidden">
        <img
          src={assets.carousel[3]}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          aria-hidden
          loading="eager"
        />
        <div className="absolute inset-0 bg-black/60" aria-hidden />
        <div className="relative z-10 flex flex-col items-center gap-3 px-4 text-center">
          <Truck className="h-14 w-14 text-white" aria-hidden />
          <h1 className="text-3xl font-bold text-white">Rastrea tu pedido</h1>
          <p className="text-base text-white/80">Ingresa tu código de seguimiento CT-2026-XXXX</p>
        </div>
      </div>

      <div className="mx-auto max-w-[600px] px-4 py-10">
        {/* Formulario */}
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex gap-3">
          <div className="flex-1">
            <label htmlFor="codigo" className="sr-only">Código de pedido</label>
            <input
              id="codigo"
              {...register('codigo')}
              placeholder="CT-2026-XXXX"
              aria-invalid={!!errors.codigo}
              aria-describedby="codigo-desc"
              className="h-12 w-full rounded-lg border border-chrome-200 bg-white px-4 text-sm uppercase tracking-wider text-ink placeholder:text-chrome-400 outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-brand/20 aria-[invalid=true]:border-danger"
            />
            {errors.codigo ? (
              <p id="codigo-desc" role="alert" className="mt-1 text-xs text-danger">
                Por favor ingresa un código de seguimiento CT-2026-XXXX.{' '}
                <span className="block">Puedes encontrarlo en tu sección &apos;Mis compras&apos;</span>
              </p>
            ) : (
              <p id="codigo-desc" className="mt-1 text-xs text-chrome-400">
                Ingresa tu código de seguimiento CT-2026-XXXX
              </p>
            )}
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            aria-label="Buscar pedido"
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-brand text-white transition-colors hover:bg-brand-900 disabled:opacity-60"
          >
            {isSubmitting
              ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              : <Search className="h-5 w-5" />
            }
          </button>
        </form>

        <div className="mt-10">
          {!buscado && (
            <div className="flex flex-col items-center gap-3 py-16 text-center" aria-live="polite">
              <Package className="h-12 w-12 text-chrome-300" aria-hidden />
              <p className="text-sm text-chrome-500">Ingresa tu código para ver el estado</p>
            </div>
          )}

          {buscado && hayError && (
            <div className="flex flex-col items-center gap-3 py-16 text-center" role="alert">
              <XCircle className="h-12 w-12 text-brand" aria-hidden />
              <p className="text-base font-semibold text-ink">
                No encontramos un pedido con ese código
              </p>
              <p className="text-sm text-chrome-500">Verifica el código e intenta de nuevo</p>
            </div>
          )}

          {pedido && (
            <div className="rounded-2xl bg-white p-8 shadow-card-md" role="region" aria-label="Detalle del pedido">
              {/* Header */}
              <div className="flex items-start justify-between gap-4 mb-8">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-chrome-400 mb-1">
                    Código de pedido
                  </p>
                  <p className="text-2xl font-bold text-ink">{pedido.codigoPedido}</p>
                </div>
                <EstadoBadge estado={pedido.estado} />
              </div>

              {/* Timeline */}
              {pedido.estado !== 'cancelado' && (
                <div className="mb-8 pb-8 border-b border-chrome-100">
                  <Timeline estado={pedido.estado} />
                </div>
              )}

              {/* Detalle — 2 columnas */}
              <div className="grid gap-8 md:grid-cols-2 mb-8">
                <div>
                  <h2 className="text-sm font-semibold text-ink mb-3">Información del pedido</h2>
                  <dl className="space-y-3 text-sm">
                    {pedido.fechaPedido && (
                      <div>
                        <dt className="text-chrome-500">Fecha de creación</dt>
                        <dd className="font-medium text-ink">{formatFecha(pedido.fechaPedido)}</dd>
                      </div>
                    )}
                    {pedido.direccionEntrega && (
                      <div>
                        <dt className="text-chrome-500">Dirección de entrega</dt>
                        <dd className="font-medium text-ink">{pedido.direccionEntrega}</dd>
                      </div>
                    )}
                    <div>
                      <dt className="text-chrome-500">Repartidor asignado</dt>
                      <dd className="font-medium text-ink">
                        {pedido.repartidorNombre ?? 'Por asignar'}
                      </dd>
                    </div>
                    <div className="pt-2 border-t border-chrome-100">
                      <dt className="text-chrome-500">Total</dt>
                      <dd className="text-lg font-bold text-ink tabular-nums">
                        {formatPrecio(pedido.total)}
                      </dd>
                    </div>
                  </dl>
                </div>

                <div>
                  <h2 className="text-sm font-semibold text-ink mb-3">Productos del pedido</h2>
                  <Productos obs={pedido.observaciones} />
                </div>
              </div>

              {/* Historial */}
              {historial.length > 0 && (
                <div className="border-t border-chrome-100 pt-6">
                  <h2 className="text-xs font-semibold uppercase tracking-widest text-chrome-400 mb-4">
                    Historial de seguimiento
                  </h2>
                  <ul className="space-y-3">
                    {historial.map((h, i) => {
                      const meta = ESTADO_META[h.estado]
                      return (
                        <li key={i} className="flex items-start gap-3 text-sm">
                          <span
                            className="mt-1.5 h-2 w-2 rounded-full shrink-0"
                            style={{ background: meta?.color ?? '#94A6B8' }}
                            aria-hidden
                          />
                          <div>
                            <span className="text-xs text-chrome-400">{formatFecha(h.fecha)}</span>
                            <span className="font-semibold text-ink ml-2">
                              {meta?.label ?? h.estado}
                            </span>
                            {h.comentario && (
                              <span className="text-chrome-500 ml-1">— {h.comentario}</span>
                            )}
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

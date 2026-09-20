import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  ShoppingBag, Package, AlertTriangle, ArrowUpRight, ArrowDownRight,
  ClipboardList, Users, BarChart3,
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts'
import { getReporteVentas, getVentas } from '@/services/ventas.service'
import { getAlertasStock } from '@/services/inventario.service'
import { getPedidos, cambiarEstadoPedido } from '@/services/pedidos.service'
import type { ReporteVentas, AlertaStock, Pedido, EstadoPedido, Venta } from '@/types'
import { formatPrecio, formatFecha, formatFechaCorta } from '@/utils/format'
import { useAuthEmpleadoStore } from '@/stores/auth.store'
import { assets } from '@/config/assets'

// ── Estado de pedidos ─────────────────────────────────────────────────────────

const ESTADO_META: Record<string, { label: string; bg: string; color: string }> = {
  pendiente:   { label: 'Pendiente',      bg: '#F1F5F9', color: '#33485C' },
  confirmado:  { label: 'Confirmado',     bg: '#EFF6FF', color: '#3B82F6' },
  preparando:  { label: 'En preparación', bg: '#FFF7ED', color: '#FF6B00' },
  listo:       { label: 'Listo',          bg: '#FEFCE8', color: '#EAB308' },
  en_transito: { label: 'En tránsito',    bg: '#EFF6FF', color: '#1D4ED8' },
  entregado:   { label: 'Entregado',      bg: '#F0FDF4', color: '#22C55E' },
  cancelado:   { label: 'Cancelado',      bg: '#FEF2F2', color: '#DC2626' },
}

function EstadoBadge({ estado }: { estado: string }) {
  const m = ESTADO_META[estado] ?? ESTADO_META.pendiente
  return (
    <span
      className="inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold"
      style={{ background: m.bg, color: m.color }}
    >
      {m.label}
    </span>
  )
}

// ── Tooltip del gráfico ───────────────────────────────────────────────────────

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-chrome-100 bg-white px-3 py-2 text-sm shadow-card-md">
      <p className="text-chrome-600 mb-1">{label}</p>
      <p className="font-bold text-ink">{formatPrecio(payload[0].value)}</p>
    </div>
  )
}

// ── Tarjeta de métrica ────────────────────────────────────────────────────────

interface MetricCardProps {
  title: string
  value: string | number
  icon: React.ElementType
  iconBg: string
  iconColor: string
  valueColor?: string
  change?: number
}

function MetricCard({ title, value, icon: Icon, iconBg, iconColor, valueColor = '#0E1B2A', change }: MetricCardProps) {
  const isPositive = (change ?? 0) >= 0
  return (
    <div className="bg-white rounded-xl shadow-card p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-chrome-600">{title}</span>
        <div className="h-9 w-9 rounded-lg flex items-center justify-center" style={{ background: iconBg }}>
          <Icon className="h-5 w-5" style={{ color: iconColor }} aria-hidden />
        </div>
      </div>
      <p className="text-2xl font-bold tabular-nums" style={{ color: valueColor }}>{value}</p>
      {change !== undefined && (
        <div className={`flex items-center gap-1 mt-1 text-xs ${isPositive ? 'text-success-600' : 'text-danger'}`}>
          {isPositive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
          <span>{Math.abs(change)}% vs mes anterior</span>
        </div>
      )}
    </div>
  )
}

function MetricSkeleton() {
  return (
    <div className="bg-white rounded-xl shadow-card p-5">
      <div className="skeleton h-4 w-24 rounded mb-3" />
      <div className="skeleton h-8 w-32 rounded" />
    </div>
  )
}

// ── Accesos rápidos ───────────────────────────────────────────────────────────

const ACCESOS_RAPIDOS = [
  { label: 'Nuevo producto', to: '/admin/productos', icon: Package    },
  { label: 'Nueva compra',   to: '/admin/compras',   icon: ShoppingBag },
  { label: 'Ver pedidos',    to: '/admin/pedidos',   icon: ClipboardList },
  { label: 'Ver reportes',   to: '/admin/reportes',  icon: BarChart3   },
] as const

// ── Admin: Dashboard completo ─────────────────────────────────────────────────

function AdminDashboard() {
  const [reporte,        setReporte]        = useState<ReporteVentas | null>(null)
  const [alertas,        setAlertas]        = useState<AlertaStock[]>([])
  const [ultimasVentas,  setUltimasVentas]  = useState<Venta[]>([])
  const [pedidosActivos, setPedidosActivos] = useState(0)
  const [cargando,       setCargando]       = useState(true)

  const cargar = useCallback(async () => {
    try {
      const [r, a, v, p] = await Promise.all([
        getReporteVentas(),
        getAlertasStock(),
        getVentas(),
        getPedidos(),
      ])
      setReporte(r)
      setAlertas(a)
      setUltimasVentas(v.slice(0, 5))
      setPedidosActivos(p.filter((ped) => !['entregado', 'cancelado'].includes(ped.estado)).length)
    } catch {
      // Error de red silenciado
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => {
    void cargar()
    const intervalo = setInterval(() => void cargar(), 30000)
    return () => clearInterval(intervalo)
  }, [cargar])

  return (
    <div className="space-y-6">
      {/* Isla 1 — Métricas del día */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cargando ? (
          Array.from({ length: 4 }).map((_, i) => <MetricSkeleton key={i} />)
        ) : (
          <>
            <MetricCard
              title="Ventas hoy"
              value={formatPrecio(reporte?.hoy.montoTotal ?? 0)}
              icon={ShoppingBag}
              iconBg="#EEF5F9"
              iconColor="#0F3341"
              change={12}
            />
            <MetricCard
              title="Pedidos activos"
              value={pedidosActivos}
              icon={Package}
              iconBg="#FFF7ED"
              iconColor="#FF6B00"
            />
            <MetricCard
              title="Productos bajo stock"
              value={alertas.length}
              icon={AlertTriangle}
              iconBg="#FEF2F2"
              iconColor="#DC2626"
              valueColor={alertas.length > 0 ? '#DC2626' : '#0E1B2A'}
            />
            <MetricCard
              title="Órdenes hoy"
              value={reporte?.hoy.totalVentas ?? 0}
              icon={Users}
              iconBg="#FFF7ED"
              iconColor="#FF6B00"
            />
          </>
        )}
      </div>

      {/* Isla 2 — Gráfico de ventas semanal */}
      <div className="bg-white rounded-xl shadow-card p-6">
        <div className="mb-4">
          <h2 className="font-semibold text-ink">Ventas de la semana</h2>
          <p className="text-sm text-chrome-600">Últimos 7 días</p>
        </div>
        {cargando ? (
          <div className="skeleton h-56 w-full rounded" />
        ) : (
          <ResponsiveContainer width="100%" height={224}>
            <BarChart data={reporte?.semana.porDia ?? []} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <defs>
                {/* Degradado metalizado para las barras */}
                <linearGradient id="gradBarBrand" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#26688C" />
                  <stop offset="100%" stopColor="#0F3341" />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E3EAF1" vertical={false} />
              <XAxis
                dataKey="fecha"
                tick={{ fill: '#4F6375', fontSize: 11 }}
                tickFormatter={(v: string) => formatFechaCorta(v)}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: '#4F6375', fontSize: 11 }}
                tickFormatter={(v: number) => `S/.${(v / 1000).toFixed(0)}k`}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: '#F1F5F9' }} />
              <Bar dataKey="monto" fill="url(#gradBarBrand)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Isla 3 — Últimas ventas + Stock crítico */}
      <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">

        {/* Columna izquierda — Últimas ventas */}
        <div className="bg-white rounded-xl shadow-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-ink">Últimas ventas</h2>
            {ultimasVentas.length > 0 && (
              <span className="rounded-full bg-danger-50 px-2.5 py-0.5 text-xs font-semibold text-brand">
                {ultimasVentas.length}
              </span>
            )}
          </div>
          {cargando ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="skeleton h-14 rounded-lg" />
              ))}
            </div>
          ) : ultimasVentas.length === 0 ? (
            <div className="py-10 text-center text-sm text-chrome-600">
              No hay ventas registradas
            </div>
          ) : (
            <ul className="space-y-3" aria-label="Últimas ventas">
              {ultimasVentas.map((v) => {
                const inicial = (v.cliente?.nombre ?? '?').charAt(0).toUpperCase()
                return (
                  <li key={v.id} className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand text-sm font-bold text-white">
                      {inicial}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-ink truncate">
                        {v.cliente?.nombre ?? 'Cliente'}
                      </p>
                      <p className="text-xs text-chrome-600">
                        {v.numeroVenta}
                        {v.fechaVenta ? ` · ${formatFecha(v.fechaVenta)}` : ''}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-ink tabular-nums">
                        {formatPrecio(v.total)}
                      </p>
                      <EstadoBadge estado={v.estado} />
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        {/* Columna derecha — Stock crítico */}
        <div className="bg-white rounded-xl shadow-card p-6 border-l-4 border-l-brand">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-brand flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" aria-hidden />
              Stock crítico
            </h2>
            {alertas.length > 0 && (
              <span className="rounded-full bg-danger-50 px-2 py-0.5 text-xs font-bold text-brand">
                {alertas.length}
              </span>
            )}
          </div>
          {cargando ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="skeleton h-12 rounded-lg" />
              ))}
            </div>
          ) : alertas.length === 0 ? (
            <div className="py-8 text-center">
              <Package className="h-10 w-10 mx-auto text-success mb-2" />
              <p className="text-sm text-chrome-600">Stock OK en todos los productos</p>
            </div>
          ) : (
            <ul className="space-y-2" aria-label="Productos con stock bajo">
              {alertas.slice(0, 6).map((a) => (
                <li
                  key={`${a.productoId}-${a.sucursalId}`}
                  className="flex items-center gap-2 rounded-lg bg-mist px-3 py-2"
                >
                  <img
                    src={a.producto.imagen_url ?? assets.categorias.repuestos}
                    alt=""
                    className="h-8 w-8 rounded object-cover shrink-0 bg-chrome-50"
                    onError={(e) => { ;(e.currentTarget as HTMLImageElement).src = assets.categorias.repuestos }}
                    aria-hidden
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-ink truncate">{a.producto.nombre}</p>
                    <p className="text-xs text-chrome-600">
                      Mín: {a.stockMinimo} un.
                    </p>
                  </div>
                  <span className="text-sm font-bold text-brand tabular-nums shrink-0">
                    {a.cantidad}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Isla 5 — Accesos rápidos (solo admin) */}
      <div>
        <h3 className="text-sm font-semibold text-ink mb-3">Accesos rápidos</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {ACCESOS_RAPIDOS.map(({ label, to, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className="group flex flex-col items-center gap-2 rounded-xl bg-white p-4 text-center shadow-card transition-all hover:-translate-y-0.5 hover:bg-metal-btn hover:shadow-metal"
            >
              <Icon className="h-5 w-5 text-brand group-hover:text-white transition-colors" aria-hidden />
              <span className="text-xs font-medium text-ink group-hover:text-white transition-colors">
                {label}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Vendedor/Repartidor: card de pedido con acciones ─────────────────────────

type TabFiltro = 'todos' | 'pendientes' | 'en_proceso' | 'entregados'

const ACCIONES_VENDEDOR: Partial<Record<EstadoPedido, { label: string; next: EstadoPedido; className: string }>> = {
  pendiente:  { label: 'Confirmar',  next: 'confirmado', className: 'bg-info hover:bg-info-600 text-white' },
  confirmado: { label: 'Preparando', next: 'preparando', className: 'bg-turbo hover:bg-turbo-600 text-white' },
  preparando: { label: 'Listo',      next: 'listo',      className: 'bg-warning hover:bg-warning-600 text-white' },
}

const ACCIONES_REPARTIDOR: Partial<Record<EstadoPedido, { label: string; next: EstadoPedido; className: string }>> = {
  listo:       { label: 'En tránsito', next: 'en_transito', className: 'bg-info-700 hover:bg-info-700 text-white' },
  en_transito: { label: 'Entregado',   next: 'entregado',   className: 'bg-success hover:bg-success-600 text-white' },
}

function PedidoCardEmpleado({
  pedido,
  rol,
  onActualizado,
}: {
  pedido: Pedido
  rol: 'vendedor' | 'repartidor'
  onActualizado: () => void
}) {
  const [ejecutando, setEjecutando] = useState(false)
  const acciones = rol === 'vendedor' ? ACCIONES_VENDEDOR : ACCIONES_REPARTIDOR
  const accion = acciones[pedido.estado]

  async function handleAccion() {
    if (!accion) return
    setEjecutando(true)
    try {
      await cambiarEstadoPedido(pedido.id, accion.next)
      onActualizado()
    } catch {
      // Error silenciado
    } finally {
      setEjecutando(false)
    }
  }

  return (
    <article className="rounded-xl border border-chrome-100 bg-white p-4 space-y-3 shadow-card">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            <span className="font-mono text-sm font-bold text-ink">{pedido.codigoPedido}</span>
            <EstadoBadge estado={pedido.estado} />
          </div>
          <p className="text-xs text-chrome-600">
            {pedido.fechaPedido ? formatFecha(pedido.fechaPedido) : '—'}
          </p>
        </div>
        <span className="text-sm font-bold text-ink tabular-nums shrink-0">
          {formatPrecio(pedido.total)}
        </span>
      </div>

      <div className="text-xs space-y-1">
        <p>
          <span className="text-chrome-600">Cliente: </span>
          <span className="text-ink">{pedido.cliente.nombre}</span>
        </p>
        {(pedido as Pedido & { repartidor?: { nombre: string } | null }).repartidor?.nombre && (
          <p>
            <span className="text-chrome-600">Repartidor: </span>
            <span className="text-ink">
              {(pedido as Pedido & { repartidor?: { nombre: string } | null }).repartidor!.nombre}
            </span>
          </p>
        )}
      </div>

      {accion && (
        <button
          onClick={handleAccion}
          disabled={ejecutando}
          className={`w-full rounded-md py-2 text-xs font-semibold transition-colors disabled:opacity-60 ${accion.className}`}
        >
          {ejecutando
            ? <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
            : accion.label
          }
        </button>
      )}
    </article>
  )
}

// ── Vendedor/Repartidor: sección "Mis pedidos asignados" ──────────────────────

function PedidosEmpleado({ rol }: { rol: 'vendedor' | 'repartidor' }) {
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [tab, setTab] = useState<TabFiltro>('todos')
  const [pagina, setPagina] = useState(1)
  const [cargando, setCargando] = useState(true)
  const POR_PAGINA = 10

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

  const filtrados = pedidos.filter((p) => {
    if (tab === 'pendientes') return p.estado === 'pendiente' || p.estado === 'confirmado'
    if (tab === 'en_proceso') return p.estado === 'preparando' || p.estado === 'listo' || p.estado === 'en_transito'
    if (tab === 'entregados') return p.estado === 'entregado' || p.estado === 'cancelado'
    return true
  })

  const totalPaginas = Math.ceil(filtrados.length / POR_PAGINA)
  const paginados    = filtrados.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA)
  const activos      = pedidos.filter((p) => !['entregado', 'cancelado'].includes(p.estado)).length

  const TABS: { key: TabFiltro; label: string }[] = [
    { key: 'todos',      label: 'Todos' },
    { key: 'pendientes', label: 'Pendientes' },
    { key: 'en_proceso', label: 'En proceso' },
    { key: 'entregados', label: 'Entregados' },
  ]

  function handleTab(t: TabFiltro) {
    setTab(t)
    setPagina(1)
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-3">
        <ClipboardList className="h-5 w-5 text-brand" aria-hidden />
        <h2 className="text-lg font-semibold text-ink">Mis pedidos asignados</h2>
        {activos > 0 && (
          <span className="rounded-full bg-brand px-2.5 py-0.5 text-xs font-bold text-white">
            {activos}
          </span>
        )}
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2" role="tablist">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            role="tab"
            aria-selected={tab === key}
            onClick={() => handleTab(key)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              tab === key
                ? 'bg-brand text-white'
                : 'bg-chrome-50 text-chrome-600 hover:text-ink'
            }`}
          >
            {label} ({
              key === 'todos'      ? pedidos.length :
              key === 'pendientes' ? pedidos.filter((p) => p.estado === 'pendiente' || p.estado === 'confirmado').length :
              key === 'en_proceso' ? pedidos.filter((p) => ['preparando', 'listo', 'en_transito'].includes(p.estado)).length :
              pedidos.filter((p) => ['entregado', 'cancelado'].includes(p.estado)).length
            })
          </button>
        ))}
      </div>

      {/* Lista */}
      {cargando ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton h-36 rounded-xl" />
          ))}
        </div>
      ) : paginados.length === 0 ? (
        <div className="bg-white rounded-xl shadow-card py-12 text-center text-sm text-chrome-600">
          No hay pedidos en esta categoría.
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {paginados.map((p) => (
              <PedidoCardEmpleado
                key={p.id}
                pedido={p}
                rol={rol}
                onActualizado={() => void cargar()}
              />
            ))}
          </div>

          {totalPaginas > 1 && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => setPagina((n) => Math.max(1, n - 1))}
                disabled={pagina === 1}
                className="rounded-lg bg-chrome-50 px-3 py-1.5 text-xs text-ink disabled:opacity-40 hover:bg-chrome-100 transition-colors"
              >
                ← Anterior
              </button>
              <span className="text-xs text-chrome-600">
                {pagina} / {totalPaginas}
              </span>
              <button
                onClick={() => setPagina((n) => Math.min(totalPaginas, n + 1))}
                disabled={pagina === totalPaginas}
                className="rounded-lg bg-chrome-50 px-3 py-1.5 text-xs text-ink disabled:opacity-40 hover:bg-chrome-100 transition-colors"
              >
                Siguiente →
              </button>
            </div>
          )}
        </>
      )}
    </section>
  )
}

// ── Página principal ──────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { empleado } = useAuthEmpleadoStore()
  const isVendedor   = empleado?.rol === 'vendedor'
  const isRepartidor = empleado?.rol === 'repartidor'
  const isAdmin      = !isVendedor && !isRepartidor

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-ink">
          Bienvenido{empleado ? `, ${empleado.nombre.split(' ')[0]}` : ''}
        </h1>
        <p className="text-sm text-chrome-600 mt-1">
          {new Date().toLocaleDateString('es-PE', {
            weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
          })}
        </p>
      </div>

      {/* Admin: métricas + gráfico + últimas ventas + accesos rápidos */}
      {(isAdmin || isVendedor) && <AdminDashboard />}

      {/* Vendedor: pedidos activos */}
      {isVendedor && <PedidosEmpleado rol="vendedor" />}

      {/* Repartidor: solo pedidos asignados */}
      {isRepartidor && <PedidosEmpleado rol="repartidor" />}
    </div>
  )
}

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
  pendiente:   { label: 'Pendiente',      bg: '#F3F4F6', color: '#374151' },
  confirmado:  { label: 'Confirmado',     bg: '#EFF6FF', color: '#3B82F6' },
  preparando:  { label: 'En preparación', bg: '#FFF7ED', color: '#FF6B00' },
  listo:       { label: 'Listo',          bg: '#FEFCE8', color: '#EAB308' },
  en_transito: { label: 'En tránsito',    bg: '#EFF6FF', color: '#1D4ED8' },
  entregado:   { label: 'Entregado',      bg: '#F0FDF4', color: '#22C55E' },
  cancelado:   { label: 'Cancelado',      bg: '#FEF2F2', color: '#CC0000' },
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
    <div className="rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-sm shadow-lg">
      <p className="text-[#666666] mb-1">{label}</p>
      <p className="font-bold text-[#111111]">{formatPrecio(payload[0].value)}</p>
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

function MetricCard({ title, value, icon: Icon, iconBg, iconColor, valueColor = '#111111', change }: MetricCardProps) {
  const isPositive = (change ?? 0) >= 0
  return (
    <div className="bg-white rounded-xl shadow-sm p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-[#666666]">{title}</span>
        <div className="h-9 w-9 rounded-lg flex items-center justify-center" style={{ background: iconBg }}>
          <Icon className="h-5 w-5" style={{ color: iconColor }} aria-hidden />
        </div>
      </div>
      <p className="text-2xl font-bold tabular-nums" style={{ color: valueColor }}>{value}</p>
      {change !== undefined && (
        <div className={`flex items-center gap-1 mt-1 text-xs ${isPositive ? 'text-[#22C55E]' : 'text-[#CC0000]'}`}>
          {isPositive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
          <span>{Math.abs(change)}% vs mes anterior</span>
        </div>
      )}
    </div>
  )
}

function MetricSkeleton() {
  return (
    <div className="bg-white rounded-xl shadow-sm p-5">
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
              iconBg="#FEF2F2"
              iconColor="#CC0000"
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
              iconColor="#CC0000"
              valueColor={alertas.length > 0 ? '#CC0000' : '#111111'}
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
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="mb-4">
          <h2 className="font-semibold text-[#111111]">Ventas de la semana</h2>
          <p className="text-sm text-[#666666]">Últimos 7 días</p>
        </div>
        {cargando ? (
          <div className="skeleton h-56 w-full rounded" />
        ) : (
          <ResponsiveContainer width="100%" height={224}>
            <BarChart data={reporte?.semana.porDia ?? []} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
              <XAxis
                dataKey="fecha"
                tick={{ fill: '#666666', fontSize: 11 }}
                tickFormatter={(v: string) => formatFechaCorta(v)}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: '#666666', fontSize: 11 }}
                tickFormatter={(v: number) => `S/.${(v / 1000).toFixed(0)}k`}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: '#F3F4F6' }} />
              <Bar dataKey="monto" fill="#CC0000" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Isla 3 — Últimas ventas + Stock crítico */}
      <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">

        {/* Columna izquierda — Últimas ventas */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-[#111111]">Últimas ventas</h2>
            {ultimasVentas.length > 0 && (
              <span className="rounded-full bg-[#FEF2F2] px-2.5 py-0.5 text-xs font-semibold text-[#CC0000]">
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
            <div className="py-10 text-center text-sm text-[#666666]">
              No hay ventas registradas
            </div>
          ) : (
            <ul className="space-y-3" aria-label="Últimas ventas">
              {ultimasVentas.map((v) => {
                const inicial = (v.cliente?.nombre ?? '?').charAt(0).toUpperCase()
                return (
                  <li key={v.id} className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#CC0000] text-sm font-bold text-white">
                      {inicial}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#111111] truncate">
                        {v.cliente?.nombre ?? 'Cliente'}
                      </p>
                      <p className="text-xs text-[#666666]">
                        {v.numeroVenta}
                        {v.fechaVenta ? ` · ${formatFecha(v.fechaVenta)}` : ''}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-[#111111] tabular-nums">
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
        <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-l-[#CC0000]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-[#CC0000] flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" aria-hidden />
              Stock crítico
            </h2>
            {alertas.length > 0 && (
              <span className="rounded-full bg-[#FEF2F2] px-2 py-0.5 text-xs font-bold text-[#CC0000]">
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
              <Package className="h-10 w-10 mx-auto text-[#22C55E] mb-2" />
              <p className="text-sm text-[#666666]">Stock OK en todos los productos</p>
            </div>
          ) : (
            <ul className="space-y-2" aria-label="Productos con stock bajo">
              {alertas.slice(0, 6).map((a) => (
                <li
                  key={`${a.productoId}-${a.sucursalId}`}
                  className="flex items-center gap-2 rounded-lg bg-[#F9FAFB] px-3 py-2"
                >
                  <img
                    src={a.producto.imagen_url ?? assets.categorias.repuestos}
                    alt=""
                    className="h-8 w-8 rounded object-cover shrink-0 bg-[#F3F4F6]"
                    onError={(e) => { ;(e.currentTarget as HTMLImageElement).src = assets.categorias.repuestos }}
                    aria-hidden
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-[#111111] truncate">{a.producto.nombre}</p>
                    <p className="text-xs text-[#666666]">
                      Mín: {a.stockMinimo} un.
                    </p>
                  </div>
                  <span className="text-sm font-bold text-[#CC0000] tabular-nums shrink-0">
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
        <h3 className="text-sm font-semibold text-[#111111] mb-3">Accesos rápidos</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {ACCESOS_RAPIDOS.map(({ label, to, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className="group bg-white rounded-xl shadow-sm p-4 flex flex-col items-center gap-2 text-center hover:bg-[#CC0000] transition-colors"
            >
              <Icon className="h-5 w-5 text-[#CC0000] group-hover:text-white transition-colors" aria-hidden />
              <span className="text-xs font-medium text-[#111111] group-hover:text-white transition-colors">
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
  pendiente:  { label: 'Confirmar',  next: 'confirmado', className: 'bg-[#3B82F6] hover:bg-[#2563EB] text-white' },
  confirmado: { label: 'Preparando', next: 'preparando', className: 'bg-[#FF6B00] hover:bg-[#E55F00] text-white' },
  preparando: { label: 'Listo',      next: 'listo',      className: 'bg-[#EAB308] hover:bg-[#CA8A04] text-white' },
}

const ACCIONES_REPARTIDOR: Partial<Record<EstadoPedido, { label: string; next: EstadoPedido; className: string }>> = {
  listo:       { label: 'En tránsito', next: 'en_transito', className: 'bg-[#1D4ED8] hover:bg-[#1E40AF] text-white' },
  en_transito: { label: 'Entregado',   next: 'entregado',   className: 'bg-[#22C55E] hover:bg-[#16A34A] text-white' },
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
    <article className="rounded-xl border border-[#E5E7EB] bg-white p-4 space-y-3 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            <span className="font-mono text-sm font-bold text-[#111111]">{pedido.codigoPedido}</span>
            <EstadoBadge estado={pedido.estado} />
          </div>
          <p className="text-xs text-[#666666]">
            {pedido.fechaPedido ? formatFecha(pedido.fechaPedido) : '—'}
          </p>
        </div>
        <span className="text-sm font-bold text-[#111111] tabular-nums shrink-0">
          {formatPrecio(pedido.total)}
        </span>
      </div>

      <div className="text-xs space-y-1">
        <p>
          <span className="text-[#666666]">Cliente: </span>
          <span className="text-[#111111]">{pedido.cliente.nombre}</span>
        </p>
        {(pedido as Pedido & { repartidor?: { nombre: string } | null }).repartidor?.nombre && (
          <p>
            <span className="text-[#666666]">Repartidor: </span>
            <span className="text-[#111111]">
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
        <ClipboardList className="h-5 w-5 text-[#CC0000]" aria-hidden />
        <h2 className="text-lg font-semibold text-[#111111]">Mis pedidos asignados</h2>
        {activos > 0 && (
          <span className="rounded-full bg-[#CC0000] px-2.5 py-0.5 text-xs font-bold text-white">
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
                ? 'bg-[#CC0000] text-white'
                : 'bg-[#F3F4F6] text-[#666666] hover:text-[#111111]'
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
        <div className="bg-white rounded-xl shadow-sm py-12 text-center text-sm text-[#666666]">
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
                className="rounded-lg bg-[#F3F4F6] px-3 py-1.5 text-xs text-[#111111] disabled:opacity-40 hover:bg-[#E5E7EB] transition-colors"
              >
                ← Anterior
              </button>
              <span className="text-xs text-[#666666]">
                {pagina} / {totalPaginas}
              </span>
              <button
                onClick={() => setPagina((n) => Math.min(totalPaginas, n + 1))}
                disabled={pagina === totalPaginas}
                className="rounded-lg bg-[#F3F4F6] px-3 py-1.5 text-xs text-[#111111] disabled:opacity-40 hover:bg-[#E5E7EB] transition-colors"
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
        <h1 className="text-2xl font-bold text-[#111111]">
          Bienvenido{empleado ? `, ${empleado.nombre.split(' ')[0]}` : ''}
        </h1>
        <p className="text-sm text-[#666666] mt-1">
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

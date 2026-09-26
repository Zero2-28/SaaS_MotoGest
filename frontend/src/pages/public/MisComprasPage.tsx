import { useEffect, useState } from 'react'
import { Navigate, Link, useLocation } from 'react-router-dom'
import { ShoppingBag, Package, AlertCircle, ChevronLeft, ChevronRight, Filter } from 'lucide-react'
import { useAuthClienteStore } from '@/stores/auth.store'
import { getMisCompras } from '@/services/ventas.service'
import { formatPrecio, formatFecha } from '@/utils/format'
import { assets } from '@/config/assets'
import type { VentaCliente } from '@/types'

const IMG_PLACEHOLDER = 'https://placehold.co/40x40/F9FAFB/9CA3AF?text=M'
const PAGE_SIZE = 10

// Estados de la venta (completada, cancelada, devolucion_parcial)
const ESTADO_VENTA_META: Record<string, { label: string; bg: string; color: string }> = {
  completada:          { label: 'Completada',    bg: '#F0FDF4', color: '#15803D' },
  cancelada:           { label: 'Cancelada',     bg: '#FEF2F2', color: '#CC0000' },
  devolucion_parcial:  { label: 'Dev. parcial',  bg: '#FFF7ED', color: '#C2410C' },
}

// Estados del pedido CT asociado
const ESTADO_PEDIDO_META: Record<string, { label: string; bg: string; color: string }> = {
  pendiente:   { label: 'Pendiente',      bg: '#F3F4F6', color: '#374151' },
  confirmado:  { label: 'Confirmado',     bg: '#EFF6FF', color: '#3B82F6' },
  preparando:  { label: 'En preparación', bg: '#FFF7ED', color: '#FF6B00' },
  listo:       { label: 'Listo',          bg: '#FEFCE8', color: '#CA8A04' },
  en_transito: { label: 'En tránsito',    bg: '#EFF6FF', color: '#1D4ED8' },
  entregado:   { label: 'Entregado',      bg: '#F0FDF4', color: '#16A34A' },
  cancelado:   { label: 'Cancelado',      bg: '#FEF2F2', color: '#CC0000' },
}

function EstadoBadge({ estado }: { estado: string }) {
  const m = ESTADO_VENTA_META[estado] ?? ESTADO_VENTA_META.completada
  return (
    <span
      className="inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold"
      style={{ background: m.bg, color: m.color }}
    >
      {m.label}
    </span>
  )
}

function EstadoPedidoBadge({ estado }: { estado: string }) {
  const m = ESTADO_PEDIDO_META[estado] ?? ESTADO_PEDIDO_META.pendiente
  return (
    <span
      className="inline-flex rounded-full px-2 py-0.5 text-xs font-medium"
      style={{ background: m.bg, color: m.color }}
    >
      {m.label}
    </span>
  )
}

// Extrae solo la dirección legible: elimina "Tel:", "Ref:" y todo lo que sigue
function limpiarDireccion(dir: string): string {
  return dir.replace(/\s*(tel[eé]fono?[.:)]?|tel[.:]|ref[.:]|referencia[.:])[^]*/i, '').trim()
}

function CompraCard({ venta }: { venta: VentaCliente }) {
  const [expanded, setExpanded] = useState(false)
  const { pedido } = venta

  return (
    <article className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="flex items-start justify-between gap-3 p-5">
        <div className="min-w-0 flex-1">
          {/* Número de venta + estado */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-sm font-bold text-[#111111]">
              {venta.numeroVenta}
            </span>
            <EstadoBadge estado={venta.estado} />
          </div>
          {venta.fechaVenta && (
            <p className="text-xs text-[#666666] mt-0.5">{formatFecha(venta.fechaVenta)}</p>
          )}
          <p className="text-xs text-[#666666] mt-0.5">
            {venta.detalles.length} producto{venta.detalles.length !== 1 ? 's' : ''}
          </p>

          {/* Sección del pedido CT */}
          {pedido ? (
            <div className="mt-2.5 space-y-1.5">
              <EstadoPedidoBadge estado={pedido.estado} />
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs text-[#666666]">📦 Seguimiento:</span>
                <Link
                  to={`/rastreo?codigo=${pedido.codigoPedido}`}
                  className="font-mono text-xs font-bold text-[#CC0000] hover:underline"
                >
                  {pedido.codigoPedido}
                </Link>
                <Link
                  to={`/rastreo?codigo=${pedido.codigoPedido}`}
                  className="text-[10px] font-semibold text-[#CC0000] border border-[#CC0000] rounded px-1.5 py-0.5 hover:bg-[#CC0000] hover:text-white transition-colors"
                >
                  Rastrear pedido →
                </Link>
              </div>
              {pedido.direccionEntrega && (
                <p className="text-xs text-[#666666]">
                  📍 {limpiarDireccion(pedido.direccionEntrega)}
                </p>
              )}
            </div>
          ) : null}
        </div>
        <div className="text-right shrink-0">
          <p className="font-bold text-base text-[#111111] tabular-nums">
            {formatPrecio(venta.total)}
          </p>
          {venta.metodoPago && (
            <p className="text-xs text-[#666666] capitalize mt-0.5">{venta.metodoPago}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 px-5 pb-3 flex-wrap">
        {venta.detalles.slice(0, 5).map((d) => (
          <img
            key={d.productoId}
            src={d.producto.imagen_url ?? assets.categorias.repuestos}
            alt={d.producto.nombre}
            onError={(e) => { e.currentTarget.src = IMG_PLACEHOLDER }}
            title={d.producto.nombre}
            className="h-10 w-10 rounded-lg object-cover bg-[#F3F4F6] border border-[#E5E7EB]"
            width={40}
            height={40}
          />
        ))}
        {venta.detalles.length > 5 && (
          <span className="text-xs text-[#666666]">+{venta.detalles.length - 5} más</span>
        )}
      </div>

      {expanded && (
        <div className="border-t border-[#F3F4F6] px-5 py-4 space-y-0">
          {venta.detalles.map((d, idx) => (
            <div key={d.productoId}>
              {idx > 0 && <div className="border-t border-[#F9FAFB] my-3" />}
              <div className="flex items-center gap-3">
                <img
                  src={d.producto.imagen_url ?? assets.categorias.repuestos}
                  alt={d.producto.nombre}
                  onError={(e) => { e.currentTarget.src = IMG_PLACEHOLDER }}
                  className="h-10 w-10 rounded-lg object-cover shrink-0 bg-[#F3F4F6]"
                  width={40}
                  height={40}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#111111] truncate">{d.producto.nombre}</p>
                  <p className="text-xs text-[#666666]">
                    {d.cantidad} × {formatPrecio(d.precioUnitario)}
                  </p>
                </div>
                <span className="text-sm font-semibold text-[#111111] tabular-nums shrink-0">
                  {formatPrecio(d.subtotal)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="border-t border-[#F3F4F6] flex items-center justify-between px-5 py-3 gap-2">
        <button
          onClick={() => setExpanded((v) => !v)}
          className="text-xs font-medium text-[#CC0000] hover:underline"
        >
          {expanded ? 'Ocultar detalle' : 'Ver detalle'}
        </button>
      </div>
    </article>
  )
}

function Paginacion({
  pagina,
  total,
  pageSize,
  onChange,
}: {
  pagina: number
  total: number
  pageSize: number
  onChange: (p: number) => void
}) {
  const totalPaginas = Math.ceil(total / pageSize)
  if (totalPaginas <= 1) return null

  return (
    <div className="flex items-center justify-between gap-2 pt-2">
      <span className="text-xs text-[#666666]">
        Página {pagina} de {totalPaginas}
      </span>
      <div className="flex gap-1">
        <button
          onClick={() => onChange(pagina - 1)}
          disabled={pagina === 1}
          aria-label="Página anterior"
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#D1D5DB] text-[#111111] hover:bg-[#F9FAFB] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden />
        </button>
        {Array.from({ length: totalPaginas }, (_, i) => i + 1)
          .filter((p) => Math.abs(p - pagina) <= 2)
          .map((p) => (
            <button
              key={p}
              onClick={() => onChange(p)}
              aria-current={p === pagina ? 'page' : undefined}
              className={`h-8 w-8 rounded-lg text-xs font-medium transition-colors ${
                p === pagina
                  ? 'bg-[#CC0000] text-white'
                  : 'border border-[#D1D5DB] text-[#111111] hover:bg-[#F9FAFB]'
              }`}
            >
              {p}
            </button>
          ))}
        <button
          onClick={() => onChange(pagina + 1)}
          disabled={pagina === totalPaginas}
          aria-label="Página siguiente"
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#D1D5DB] text-[#111111] hover:bg-[#F9FAFB] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight className="h-4 w-4" aria-hidden />
        </button>
      </div>
    </div>
  )
}

export default function MisComprasPage() {
  const location = useLocation()
  const { isAuthenticated, token } = useAuthClienteStore()

  const [compras,  setCompras]  = useState<VentaCliente[]>([])
  const [cargando, setCargando] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Filtros
  const [desde,   setDesde]   = useState('')
  const [hasta,   setHasta]   = useState('')
  const [orden,   setOrden]   = useState<'desc' | 'asc'>('desc')
  const [pagina,  setPagina]  = useState(1)

  const cargar = (t: string) =>
    getMisCompras(t)
      .then(setCompras)
      .catch(() => setErrorMsg('No se pudieron cargar tus compras. Intenta de nuevo.'))
      .finally(() => setCargando(false))

  useEffect(() => {
    if (!token) return
    void cargar(token)

    // Polling cada 30s para actualizar estados
    const intervalo = setInterval(() => {
      if (token) void getMisCompras(token).then(setCompras).catch(() => {})
    }, 30000)
    return () => clearInterval(intervalo)
  }, [token])

  // Resetear página al cambiar filtros
  useEffect(() => { setPagina(1) }, [desde, hasta, orden])

  if (!isAuthenticated || !token) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  // Filtrado y ordenamiento en cliente
  const filtradas = compras
    .filter((v) => {
      if (!v.fechaVenta) return true
      const fecha = new Date(v.fechaVenta).toLocaleDateString('en-CA')
      if (desde && fecha < desde) return false
      if (hasta && fecha > hasta) return false
      return true
    })
    .sort((a, b) => {
      const fa = a.fechaVenta ? new Date(a.fechaVenta).getTime() : 0
      const fb = b.fechaVenta ? new Date(b.fechaVenta).getTime() : 0
      return orden === 'desc' ? fb - fa : fa - fb
    })

  const paginadas = filtradas.slice((pagina - 1) * PAGE_SIZE, pagina * PAGE_SIZE)
  const hayFiltros = !!desde || !!hasta

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      <div className="max-w-[720px] mx-auto px-4 sm:px-6 py-8 space-y-6">

        <div>
          <h1 className="text-2xl font-bold text-[#111111]">Mis compras</h1>
          <p className="text-sm text-[#666666] mt-1">Historial de todas tus órdenes</p>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="h-4 w-4 text-[#666666]" aria-hidden />
            <span className="text-sm font-medium text-[#111111]">Filtros</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label htmlFor="desde" className="block text-xs text-[#666666] mb-1">Desde</label>
              <input
                id="desde"
                type="date"
                value={desde}
                onChange={(e) => setDesde(e.target.value)}
                max={hasta || undefined}
                className="w-full h-9 rounded-lg border border-[#D1D5DB] px-3 text-sm text-[#111111] outline-none focus:border-[#CC0000] focus:ring-2 focus:ring-[#CC0000]/20"
              />
            </div>
            <div>
              <label htmlFor="hasta" className="block text-xs text-[#666666] mb-1">Hasta</label>
              <input
                id="hasta"
                type="date"
                value={hasta}
                onChange={(e) => setHasta(e.target.value)}
                min={desde || undefined}
                className="w-full h-9 rounded-lg border border-[#D1D5DB] px-3 text-sm text-[#111111] outline-none focus:border-[#CC0000] focus:ring-2 focus:ring-[#CC0000]/20"
              />
            </div>
            <div>
              <label htmlFor="orden" className="block text-xs text-[#666666] mb-1">Ordenar por</label>
              <select
                id="orden"
                value={orden}
                onChange={(e) => setOrden(e.target.value as 'desc' | 'asc')}
                className="w-full h-9 rounded-lg border border-[#D1D5DB] px-3 text-sm text-[#111111] outline-none focus:border-[#CC0000] bg-white"
              >
                <option value="desc">Más reciente primero</option>
                <option value="asc">Más antiguo primero</option>
              </select>
            </div>
          </div>
          {hayFiltros && (
            <button
              onClick={() => { setDesde(''); setHasta('') }}
              className="mt-3 text-xs text-[#CC0000] hover:underline"
            >
              Limpiar filtros
            </button>
          )}
        </div>

        {/* Error */}
        {errorMsg && (
          <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {errorMsg}
          </div>
        )}

        {/* Skeleton */}
        {cargando && (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm p-5 space-y-3">
                <div className="skeleton h-4 w-40 rounded" />
                <div className="skeleton h-3 w-24 rounded" />
                <div className="flex gap-2">
                  {Array.from({ length: 3 }).map((__, j) => (
                    <div key={j} className="skeleton h-10 w-10 rounded-lg" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Contador de resultados */}
        {!cargando && !errorMsg && filtradas.length > 0 && (
          <p className="text-xs text-[#666666]">
            {filtradas.length} orden{filtradas.length !== 1 ? 'es' : ''}
            {hayFiltros ? ' en el período seleccionado' : ''}
          </p>
        )}

        {/* Lista paginada */}
        {!cargando && !errorMsg && paginadas.length > 0 && (
          <div className="space-y-4">
            {paginadas.map((v) => (
              <CompraCard key={v.id} venta={v} />
            ))}
          </div>
        )}

        <Paginacion
          pagina={pagina}
          total={filtradas.length}
          pageSize={PAGE_SIZE}
          onChange={setPagina}
        />

        {/* Estado vacío — sin compras en absoluto */}
        {!cargando && !errorMsg && compras.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm py-16 text-center space-y-4">
            <ShoppingBag className="h-14 w-14 mx-auto text-gray-200" aria-hidden />
            <div>
              <p className="font-semibold text-[#111111]">Aún no tienes compras</p>
              <p className="text-sm text-[#666666] mt-1">Explora el catálogo y realiza tu primera compra</p>
            </div>
            <Link
              to="/catalogo"
              className="inline-flex items-center gap-2 rounded-lg bg-[#CC0000] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#AA0000] transition-colors"
            >
              <Package className="h-4 w-4" aria-hidden />
              Ver catálogo
            </Link>
          </div>
        )}

        {/* Estado vacío — hay compras pero no coinciden los filtros */}
        {!cargando && !errorMsg && compras.length > 0 && filtradas.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm py-12 text-center space-y-3">
            <Filter className="h-10 w-10 mx-auto text-gray-200" aria-hidden />
            <p className="font-semibold text-[#111111]">Sin resultados para este período</p>
            <button
              onClick={() => { setDesde(''); setHasta('') }}
              className="text-sm text-[#CC0000] hover:underline"
            >
              Limpiar filtros
            </button>
          </div>
        )}

      </div>
    </div>
  )
}

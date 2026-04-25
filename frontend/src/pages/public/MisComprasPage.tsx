import { useEffect, useState } from 'react'
import { Navigate, Link, useLocation } from 'react-router-dom'
import { ShoppingBag, Package, AlertCircle } from 'lucide-react'
import { useAuthClienteStore } from '@/stores/auth.store'
import { getMisCompras } from '@/services/ventas.service'
import { formatPrecio, formatFecha } from '@/utils/format'
import { assets } from '@/config/assets'
import type { VentaCliente } from '@/types'

const IMG_PLACEHOLDER = 'https://placehold.co/40x40/F9FAFB/9CA3AF?text=M'

const ESTADO_META: Record<string, { label: string; bg: string; color: string }> = {
  completada:          { label: 'Completada',  bg: '#F0FDF4', color: '#15803D' },
  cancelada:           { label: 'Cancelada',   bg: '#FEF2F2', color: '#CC0000' },
  devolucion_parcial:  { label: 'Dev. parcial', bg: '#FFF7ED', color: '#C2410C' },
}

function EstadoBadge({ estado }: { estado: string }) {
  const m = ESTADO_META[estado] ?? ESTADO_META.completada
  return (
    <span
      className="inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold"
      style={{ background: m.bg, color: m.color }}
    >
      {m.label}
    </span>
  )
}

function CompraCard({ venta }: { venta: VentaCliente }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <article className="bg-white rounded-xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 p-5">
        <div className="min-w-0">
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

      {/* Miniaturas (siempre visibles) */}
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

      {/* Detalle expandido */}
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

      {/* Footer con acciones */}
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

export default function MisComprasPage() {
  const location = useLocation()
  const { isAuthenticated, token } = useAuthClienteStore()

  const [compras,   setCompras]   = useState<VentaCliente[]>([])
  const [cargando,  setCargando]  = useState(true)
  const [errorMsg,  setErrorMsg]  = useState<string | null>(null)

  useEffect(() => {
    if (!token) return
    void getMisCompras(token)
      .then(setCompras)
      .catch(() => setErrorMsg('No se pudieron cargar tus compras. Intenta de nuevo.'))
      .finally(() => setCargando(false))
  }, [token])

  if (!isAuthenticated || !token) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      <div className="max-w-[720px] mx-auto px-4 sm:px-6 py-8 space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-[#111111]">Mis compras</h1>
          <p className="text-sm text-[#666666] mt-1">Historial de todas tus órdenes</p>
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

        {/* Lista */}
        {!cargando && !errorMsg && compras.length > 0 && (
          <div className="space-y-4">
            {compras.map((v) => (
              <CompraCard key={v.id} venta={v} />
            ))}
          </div>
        )}

        {/* Estado vacío */}
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
      </div>
    </div>
  )
}

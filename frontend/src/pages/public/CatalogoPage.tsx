import { useState, useEffect, useCallback } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  Search, ShoppingCart, ChevronLeft, ChevronRight,
  LayoutGrid, List, SlidersHorizontal, X,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { getProductos } from '@/services/productos.service'
import { getCategorias } from '@/services/categorias.service'
import type { Producto, ProductoListResponse, Categoria } from '@/types'
import { formatPrecio } from '@/utils/format'
import { useCarritoStore } from '@/stores/carrito.store'
import { assets } from '@/config/assets'
import { cn } from '@/utils/cn'
import { getProductImage, PRODUCTO_PLACEHOLDER } from '@/utils/productImage'

const LIMITS = [12, 24, 36] as const
type Limit    = (typeof LIMITS)[number]
type SortBy   = 'recientes' | 'precio-asc' | 'precio-desc' | 'nombre-az'
type ViewMode = 'grid' | 'list'

// Ordena items client-side (solo afecta la página actual)
function sortItems(items: Producto[], sort: SortBy): Producto[] {
  const arr = [...items]
  switch (sort) {
    case 'precio-asc':  return arr.sort((a, b) => a.precioVenta - b.precioVenta)
    case 'precio-desc': return arr.sort((a, b) => b.precioVenta - a.precioVenta)
    case 'nombre-az':   return arr.sort((a, b) => a.nombre.localeCompare(b.nombre))
    default:            return arr
  }
}

// ── Hero banner con breadcrumb ────────────────────────────────────────────────
function HeroBanner() {
  return (
    <div className="relative h-[200px] overflow-hidden" aria-label="Banner del catálogo">
      <img
        src={assets.carousel[1]}
        alt=""
        aria-hidden
        className="h-full w-full object-cover"
        loading="eager"
        width={1920}
        height={200}
      />
      <div className="absolute inset-0 bg-black/55" aria-hidden />
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <h1 className="font-display text-display-md text-white mb-2 drop-shadow-md">
          Catálogo
        </h1>
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-white/70">
          <Link to="/" className="hover:text-white transition-colors">Inicio</Link>
          <span>/</span>
          <span className="text-white/90 font-medium">Catálogo</span>
        </nav>
      </div>
    </div>
  )
}

// ── Skeleton card ─────────────────────────────────────────────────────────────
function ProductoSkeleton() {
  return (
    <div className="rounded-xl border border-chrome-100 bg-white shadow-card overflow-hidden">
      <div className="skeleton h-48 w-full" />
      <div className="p-4 flex flex-col gap-2">
        <div className="skeleton h-3 w-1/3 rounded" />
        <div className="skeleton h-4 w-3/4 rounded" />
        <div className="skeleton h-4 w-1/2 rounded" />
        <div className="skeleton h-9 w-full rounded mt-2" />
      </div>
    </div>
  )
}

// ── Card de producto (grid y lista) ───────────────────────────────────────────
function ProductoCard({ producto, view }: { producto: Producto; view: ViewMode }) {
  const agregarItem = useCarritoStore((s) => s.agregarItem)
  const [imgSrc, setImgSrc] = useState(() => getProductImage(producto))

  const sinStock = !producto.activo || producto.stock === 0
  const pocasUnidades = producto.stock !== undefined && producto.stock > 0 && producto.stock <= 5

  if (view === 'list') {
    return (
      <article className="flex gap-4 rounded-xl border border-chrome-100 bg-white shadow-card hover:shadow-card-md p-4 transition-all">
        <Link to={`/catalogo/${producto.id}`} className="flex-shrink-0 relative">
          <img
            src={imgSrc}
            alt={producto.nombre}
            onError={() => setImgSrc(PRODUCTO_PLACEHOLDER)}
            className="h-24 w-24 rounded-lg object-cover bg-chrome-50"
            loading="lazy"
            width={96}
            height={96}
          />
          {sinStock && (
            <div className="absolute inset-0 bg-black/60 rounded-lg flex items-center justify-center">
              <Badge variant="cancelado">Agotado</Badge>
            </div>
          )}
          {!sinStock && pocasUnidades && (
            <div className="absolute bottom-1 left-1 right-1">
              <span className="block text-center rounded bg-turbo/90 px-1 py-0.5 text-[9px] font-semibold text-white leading-tight">
                Pocas unidades
              </span>
            </div>
          )}
        </Link>
        <div className="flex flex-col flex-1 min-w-0 gap-1">
          <span className="inline-block w-fit rounded-full bg-brand px-2 py-0.5 text-[11px] font-semibold text-white">
            {producto.categoria.nombre}
          </span>
          <Link to={`/catalogo/${producto.id}`}>
            <h3 className="text-sm font-semibold text-brand-900 line-clamp-1 hover:text-brand transition-colors">
              {producto.nombre}
            </h3>
          </Link>
          <p className="text-xs text-chrome-400">Cód: {producto.codigo}</p>
          <div className="flex items-center gap-3 mt-auto pt-2">
            <span className="text-lg font-bold text-brand tabular-nums">
              {formatPrecio(producto.precioVenta)}
            </span>
            <button
              onClick={() => agregarItem(producto)}
              disabled={sinStock}
              aria-label={`Agregar ${producto.nombre} al carrito`}
              className="flex items-center gap-1.5 rounded-md bg-brand px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-700 disabled:opacity-40 transition-colors"
            >
              <ShoppingCart className="h-3.5 w-3.5" aria-hidden />
              {sinStock ? 'Agotado' : 'Agregar'}
            </button>
          </div>
        </div>
      </article>
    )
  }

  return (
    <article className="group rounded-xl border border-chrome-100 bg-white shadow-card hover:shadow-card-md overflow-hidden transition-all duration-200 hover:-translate-y-1 flex flex-col">
      <Link to={`/catalogo/${producto.id}`} className="block relative overflow-hidden">
        <img
          src={imgSrc}
          alt={producto.nombre}
          onError={() => setImgSrc(PRODUCTO_PLACEHOLDER)}
          className="h-48 w-full object-cover bg-chrome-50 transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
          width={400}
          height={192}
        />
        {sinStock && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <Badge variant="cancelado">Agotado</Badge>
          </div>
        )}
        {!sinStock && pocasUnidades && (
          <div className="absolute bottom-2 left-2">
            <span className="rounded-full bg-turbo px-2 py-0.5 text-[10px] font-semibold text-white">
              Pocas unidades
            </span>
          </div>
        )}
      </Link>

      <div className="p-4 flex flex-col gap-2 flex-1">
        <span className="inline-block w-fit rounded-full bg-brand px-2.5 py-0.5 text-[11px] font-semibold text-white">
          {producto.categoria.nombre}
        </span>
        <Link to={`/catalogo/${producto.id}`}>
          <h3 className="text-sm font-semibold text-brand-900 line-clamp-2 hover:text-brand transition-colors">
            {producto.nombre}
          </h3>
        </Link>

        <div className="mt-auto flex flex-col gap-2 pt-3 border-t border-chrome-100">
          <span className="text-xl font-bold text-brand tabular-nums">
            {formatPrecio(producto.precioVenta)}
          </span>
          <button
            onClick={() => agregarItem(producto)}
            disabled={sinStock}
            aria-label={`Agregar ${producto.nombre} al carrito`}
            className="flex w-full items-center justify-center gap-2 rounded-md bg-brand py-2.5 text-xs font-semibold text-white hover:bg-brand-700 disabled:opacity-40 transition-colors"
          >
            <ShoppingCart className="h-3.5 w-3.5" aria-hidden />
            {sinStock ? 'Agotado' : 'Agregar al carrito'}
          </button>
        </div>
      </div>
    </article>
  )
}

// ── Sidebar: categorías, precio, orden ───────────────────────────────────────
interface SidebarProps {
  categorias:    Categoria[]
  categoriaId:   number | undefined
  onCategoria:   (id: number | undefined) => void
  precioMin:     string
  precioMax:     string
  onPrecioMin:   (v: string) => void
  onPrecioMax:   (v: string) => void
  onAplicarPrecio: () => void
  sortBy:        SortBy
  onSort:        (s: SortBy) => void
}

function Sidebar({
  categorias, categoriaId, onCategoria,
  precioMin, precioMax, onPrecioMin, onPrecioMax, onAplicarPrecio,
  sortBy, onSort,
}: SidebarProps) {
  return (
    <aside className="flex flex-col gap-6">

      {/* Categorías */}
      <div>
        <h2 className="text-[11px] font-bold uppercase tracking-widest text-brand-900 mb-2">
          Categorías
        </h2>
        <div className="h-0.5 bg-brand mb-3" aria-hidden />
        <ul className="flex flex-col">
          <li>
            <button
              onClick={() => onCategoria(undefined)}
              className={cn(
                'w-full text-left py-2 text-sm transition-colors',
                categoriaId === undefined ? 'font-bold text-brand' : 'text-chrome-600 hover:text-brand'
              )}
            >
              Todos los productos
            </button>
          </li>
          {categorias.map((cat) => (
            <li key={cat.id}>
              <button
                onClick={() => onCategoria(cat.id)}
                className={cn(
                  'w-full text-left py-2 text-sm border-t border-chrome-50 transition-colors',
                  categoriaId === cat.id ? 'font-bold text-brand' : 'text-chrome-600 hover:text-brand'
                )}
              >
                {cat.nombre}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Precio */}
      <div>
        <h2 className="text-[11px] font-bold uppercase tracking-widest text-brand-900 mb-2">
          Precio
        </h2>
        <div className="h-0.5 bg-brand mb-3" aria-hidden />
        <div className="flex items-center gap-2 mb-3">
          <div className="flex-1">
            <label className="text-[11px] text-chrome-400 mb-1 block">Mínimo</label>
            <input
              type="number"
              min={0}
              placeholder="S/ 0"
              value={precioMin}
              onChange={(e) => onPrecioMin(e.target.value)}
              className="field h-9 bg-white px-2 text-sm"
            />
          </div>
          <span className="text-chrome-400 pt-5 text-sm">—</span>
          <div className="flex-1">
            <label className="text-[11px] text-chrome-400 mb-1 block">Máximo</label>
            <input
              type="number"
              min={0}
              placeholder="S/ 2000"
              value={precioMax}
              onChange={(e) => onPrecioMax(e.target.value)}
              className="field h-9 bg-white px-2 text-sm"
            />
          </div>
        </div>
        <button
          onClick={onAplicarPrecio}
          className="w-full rounded-md bg-metal-btn py-2 text-xs font-semibold text-white shadow-metal transition-all hover:bg-metal-btn-hv"
        >
          Aplicar
        </button>
      </div>

      {/* Ordenar por */}
      <div>
        <h2 className="text-[11px] font-bold uppercase tracking-widest text-brand-900 mb-2">
          Ordenar por
        </h2>
        <div className="h-0.5 bg-brand mb-3" aria-hidden />
        <select
          value={sortBy}
          onChange={(e) => onSort(e.target.value as SortBy)}
          className="w-full rounded-md border border-chrome-200 bg-white px-3 py-2 text-sm text-brand-900 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
        >
          <option value="recientes">Más recientes</option>
          <option value="precio-asc">Precio: menor a mayor</option>
          <option value="precio-desc">Precio: mayor a menor</option>
          <option value="nombre-az">Nombre A–Z</option>
        </select>
      </div>
    </aside>
  )
}

// ── Paginación estilo ecommerce ───────────────────────────────────────────────
function Paginacion({
  pagina, totalPaginas, onChange,
}: {
  pagina: number
  totalPaginas: number
  onChange: (n: number) => void
}) {
  if (totalPaginas <= 1) return null

  const rango: number[] = []
  const inicio = Math.max(1, pagina - 2)
  const fin = Math.min(totalPaginas, inicio + 4)
  for (let i = inicio; i <= fin; i++) rango.push(i)

  const btnBase = 'flex h-9 w-9 items-center justify-center rounded-md border text-sm transition-colors'
  const btnIdle = 'border-chrome-200 text-chrome-600 hover:border-brand hover:text-brand'
  const btnActive = 'border-brand bg-brand text-white pointer-events-none'

  return (
    <nav className="mt-10 flex justify-center items-center gap-1" role="navigation" aria-label="Paginación">
      <button
        disabled={pagina === 1}
        onClick={() => onChange(pagina - 1)}
        aria-label="Página anterior"
        className={cn(btnBase, 'border-chrome-200 text-chrome-500 hover:border-brand hover:text-brand disabled:opacity-30')}
      >
        <ChevronLeft className="h-4 w-4" aria-hidden />
      </button>

      {inicio > 1 && (
        <>
          <button onClick={() => onChange(1)} className={cn(btnBase, btnIdle)}>1</button>
          {inicio > 2 && <span className="px-1 text-chrome-400">…</span>}
        </>
      )}

      {rango.map((n) => (
        <button
          key={n}
          onClick={() => onChange(n)}
          aria-current={n === pagina ? 'page' : undefined}
          className={cn(btnBase, n === pagina ? btnActive : btnIdle)}
        >
          {n}
        </button>
      ))}

      {fin < totalPaginas && (
        <>
          {fin < totalPaginas - 1 && <span className="px-1 text-chrome-400">…</span>}
          <button onClick={() => onChange(totalPaginas)} className={cn(btnBase, btnIdle)}>
            {totalPaginas}
          </button>
        </>
      )}

      <button
        disabled={pagina === totalPaginas}
        onClick={() => onChange(pagina + 1)}
        aria-label="Página siguiente"
        className={cn(btnBase, 'border-chrome-200 text-chrome-500 hover:border-brand hover:text-brand disabled:opacity-30')}
      >
        <ChevronRight className="h-4 w-4" aria-hidden />
      </button>
    </nav>
  )
}

// ── Página catálogo ───────────────────────────────────────────────────────────
export default function CatalogoPage() {
  // URL como fuente de verdad para búsqueda y categoría
  const [searchParams, setSearchParams] = useSearchParams()
  const busquedaUrl  = searchParams.get('q') ?? ''
  const catIdUrl     = searchParams.get('categoriaId')
  const categoriaId  = catIdUrl ? Number(catIdUrl) : undefined

  const [resultado,       setResultado]       = useState<ProductoListResponse | null>(null)
  const [categorias,      setCategorias]       = useState<Categoria[]>([])
  const [pagina,          setPagina]           = useState(1)
  const [cargando,        setCargando]         = useState(true)
  const [error,           setError]            = useState<string | null>(null)
  const [limit,           setLimit]            = useState<Limit>(12)
  const [sortBy,          setSortBy]           = useState<SortBy>('recientes')
  const [viewMode,        setViewMode]         = useState<ViewMode>('grid')
  const [sidebarOpen,     setSidebarOpen]      = useState(false)
  const [precioMin,       setPrecioMin]        = useState('')
  const [precioMax,       setPrecioMax]        = useState('')
  const [precioMinActivo, setPrecioMinActivo]  = useState<number | undefined>(undefined)
  const [precioMaxActivo, setPrecioMaxActivo]  = useState<number | undefined>(undefined)

  // Cargar categorías al montar
  useEffect(() => {
    getCategorias()
      .then(setCategorias)
      .catch(() => {/* categorías opcionales */})
  }, [])

  // Resetear página al cambiar filtros de URL
  useEffect(() => {
    setPagina(1)
  }, [busquedaUrl, catIdUrl])

  const cargar = useCallback(async () => {
    setCargando(true)
    setError(null)
    try {
      const data = await getProductos(pagina, limit, busquedaUrl, categoriaId)
      setResultado(data)
    } catch {
      setError('No se pudo cargar el catálogo. Intenta de nuevo.')
    } finally {
      setCargando(false)
    }
  }, [pagina, limit, busquedaUrl, categoriaId])

  useEffect(() => {
    const timer = setTimeout(cargar, 300)
    return () => clearTimeout(timer)
  }, [cargar])

  // Actualiza categoría en URL; cierra drawer mobile
  function handleCategoria(id: number | undefined) {
    const next = new URLSearchParams(searchParams)
    if (id === undefined) next.delete('categoriaId')
    else next.set('categoriaId', String(id))
    next.delete('p')
    setSearchParams(next)
    setSidebarOpen(false)
  }

  function handleLimit(val: Limit) {
    setLimit(val)
    setPagina(1)
  }

  function handleAplicarPrecio() {
    setPrecioMinActivo(precioMin ? Number(precioMin) : undefined)
    setPrecioMaxActivo(precioMax ? Number(precioMax) : undefined)
    setSidebarOpen(false)
  }

  function limpiarFiltros() {
    setSearchParams(new URLSearchParams())
    setPrecioMin('')
    setPrecioMax('')
    setPrecioMinActivo(undefined)
    setPrecioMaxActivo(undefined)
    setSortBy('recientes')
    setPagina(1)
  }

  // Filtrar por precio y ordenar client-side sobre la página actual
  const itemsFiltrados = (() => {
    let items = resultado?.items ?? []
    if (precioMinActivo !== undefined) items = items.filter((p) => p.precioVenta >= precioMinActivo)
    if (precioMaxActivo !== undefined) items = items.filter((p) => p.precioVenta <= precioMaxActivo)
    return sortItems(items, sortBy)
  })()

  const totalPaginas   = resultado?.pagination.pages ?? 1
  const totalProductos = resultado?.pagination.total ?? 0

  const sidebarProps: SidebarProps = {
    categorias, categoriaId, onCategoria: handleCategoria,
    precioMin, precioMax, onPrecioMin: setPrecioMin, onPrecioMax: setPrecioMax,
    onAplicarPrecio: handleAplicarPrecio,
    sortBy, onSort: setSortBy,
  }

  return (
    <div className="bg-mist min-h-[calc(100dvh-4rem)]">
      <HeroBanner />

      <div className="container mx-auto px-4 py-8">
        <div className="flex gap-8">

          {/* ── Sidebar desktop fijo ───────────────────────────────────── */}
          <div className="hidden lg:block w-[280px] flex-shrink-0">
            <div className="sticky top-[88px] bg-white rounded-xl shadow-card border border-chrome-100 p-6">
              <Sidebar {...sidebarProps} />
            </div>
          </div>

          {/* ── Drawer sidebar mobile / tablet ────────────────────────── */}
          {sidebarOpen && (
            <div
              className="lg:hidden fixed inset-0 z-50 flex"
              role="dialog"
              aria-modal="true"
              aria-label="Filtros"
            >
              <div
                className="absolute inset-0 bg-black/40"
                onClick={() => setSidebarOpen(false)}
              />
              <div className="relative z-10 w-[300px] max-w-[85vw] bg-white h-full overflow-y-auto p-6 shadow-card-lg">
                <div className="flex items-center justify-between mb-6">
                  <span className="font-semibold text-brand-900">Filtros</span>
                  <button
                    onClick={() => setSidebarOpen(false)}
                    aria-label="Cerrar filtros"
                    className="p-1 rounded text-chrome-400 hover:text-brand-900 transition-colors"
                  >
                    <X className="h-5 w-5" aria-hidden />
                  </button>
                </div>
                <Sidebar {...sidebarProps} />
              </div>
            </div>
          )}

          {/* ── Área principal ─────────────────────────────────────────── */}
          <div className="flex-1 min-w-0">

            {/* Header del grid */}
            <div className="flex flex-wrap items-center gap-3 mb-6">
              {/* Botón filtros — mobile/tablet */}
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden flex items-center gap-2 rounded-md border border-chrome-200 bg-white px-3 py-2 text-sm font-medium text-brand-900 hover:border-brand hover:text-brand shadow-card transition-colors"
              >
                <SlidersHorizontal className="h-4 w-4" aria-hidden />
                Filtros
              </button>

              <p className="text-sm text-chrome-500 flex-1">
                {cargando
                  ? <span className="skeleton h-4 w-40 rounded inline-block align-middle" />
                  : <>{totalProductos} producto{totalProductos !== 1 ? 's' : ''} encontrado{totalProductos !== 1 ? 's' : ''}</>
                }
              </p>

              {/* Selector de items por página */}
              <div className="flex items-center gap-1" aria-label="Items por página">
                {LIMITS.map((l) => (
                  <button
                    key={l}
                    onClick={() => handleLimit(l)}
                    aria-pressed={limit === l}
                    className={cn(
                      'flex h-8 w-8 items-center justify-center rounded text-xs font-medium transition-colors',
                      limit === l
                        ? 'bg-brand text-white'
                        : 'bg-white border border-chrome-200 text-chrome-600 hover:border-brand hover:text-brand'
                    )}
                  >
                    {l}
                  </button>
                ))}
              </div>

              {/* Vista grid / lista */}
              <div className="flex items-center gap-1" aria-label="Modo de vista">
                <button
                  onClick={() => setViewMode('grid')}
                  aria-label="Vista cuadrícula"
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded transition-colors',
                    viewMode === 'grid'
                      ? 'bg-brand text-white'
                      : 'bg-white border border-chrome-200 text-chrome-500 hover:border-brand hover:text-brand'
                  )}
                >
                  <LayoutGrid className="h-4 w-4" aria-hidden />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  aria-label="Vista lista"
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded transition-colors',
                    viewMode === 'list'
                      ? 'bg-brand text-white'
                      : 'bg-white border border-chrome-200 text-chrome-500 hover:border-brand hover:text-brand'
                  )}
                >
                  <List className="h-4 w-4" aria-hidden />
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div
                role="alert"
                className="rounded-lg border border-danger-100 bg-danger-50 p-4 text-sm text-danger-600 mb-6 flex items-center justify-between"
              >
                <span>{error}</span>
                <button
                  onClick={cargar}
                  className="ml-4 text-danger underline hover:text-danger-600 transition-colors"
                >
                  Reintentar
                </button>
              </div>
            )}

            {/* Grid de productos */}
            {viewMode === 'grid' ? (
              <div className="grid gap-4 grid-cols-2 lg:grid-cols-3">
                {cargando
                  ? Array.from({ length: limit }).map((_, i) => <ProductoSkeleton key={i} />)
                  : itemsFiltrados.map((p) => <ProductoCard key={p.id} producto={p} view="grid" />)
                }
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {cargando
                  ? Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="flex gap-4 rounded-xl border border-chrome-100 bg-white shadow-card p-4">
                        <div className="skeleton h-24 w-24 rounded-lg flex-shrink-0" />
                        <div className="flex flex-col gap-2 flex-1 py-1">
                          <div className="skeleton h-3 w-1/4 rounded" />
                          <div className="skeleton h-4 w-2/3 rounded" />
                          <div className="skeleton h-4 w-1/3 rounded" />
                        </div>
                      </div>
                    ))
                  : itemsFiltrados.map((p) => <ProductoCard key={p.id} producto={p} view="list" />)
                }
              </div>
            )}

            {/* Estado vacío */}
            {!cargando && !error && itemsFiltrados.length === 0 && (
              <div className="py-24 text-center">
                <Search className="h-14 w-14 mx-auto text-chrome-300 mb-4" aria-hidden />
                <p className="font-semibold text-brand-900 mb-1">
                  No encontramos productos con esos filtros
                </p>
                <p className="text-sm text-chrome-500 mb-6">
                  Prueba con otros términos o limpia los filtros aplicados
                </p>
                <button
                  onClick={limpiarFiltros}
                  className="inline-flex items-center gap-2 rounded-md bg-brand px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 transition-colors"
                >
                  Ver todos los productos
                </button>
              </div>
            )}

            {/* Paginación */}
            {!cargando && !error && itemsFiltrados.length > 0 && (
              <Paginacion pagina={pagina} totalPaginas={totalPaginas} onChange={setPagina} />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

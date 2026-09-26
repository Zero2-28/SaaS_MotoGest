import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ShoppingCart, ArrowLeft, Package, CheckCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { getProducto, getProductos } from '@/services/productos.service'
import type { Producto } from '@/types'
import { formatPrecio } from '@/utils/format'
import { useCarritoStore } from '@/stores/carrito.store'
import { getProductImage, PRODUCTO_PLACEHOLDER } from '@/utils/productImage'
import { cn } from '@/utils/cn'

function ProductoSkeleton() {
  return (
    <div className="bg-white min-h-screen">
      <div className="h-[200px] skeleton" />
      <div className="container mx-auto px-4 py-10">
        <div className="grid gap-10 md:grid-cols-2">
          <div className="skeleton h-96 w-full rounded-xl" />
          <div className="flex flex-col gap-4">
            <div className="skeleton h-5 w-1/3 rounded" />
            <div className="skeleton h-10 w-3/4 rounded" />
            <div className="skeleton h-4 w-1/4 rounded" />
            <div className="skeleton h-20 w-full rounded" />
            <div className="skeleton h-10 w-1/3 rounded" />
            <div className="skeleton h-12 w-full rounded" />
          </div>
        </div>
      </div>
    </div>
  )
}

function StockIndicador({ activo, stock }: { activo: boolean; stock?: number }) {
  if (stock !== undefined) {
    if (stock === 0) {
      return (
        <span className="flex items-center gap-1.5 text-sm font-medium text-[#CC0000]">
          <span className="h-2.5 w-2.5 rounded-full bg-[#CC0000]" aria-hidden />
          Agotado
        </span>
      )
    }
    if (stock <= 5) {
      return (
        <span className="flex items-center gap-1.5 text-sm font-medium text-[#FF6B00]">
          <span className="h-2.5 w-2.5 rounded-full bg-[#FF6B00] animate-pulse" aria-hidden />
          Solo quedan {stock} unidad{stock === 1 ? '' : 'es'}
        </span>
      )
    }
    if (stock <= 10) {
      return (
        <span className="flex items-center gap-1.5 text-sm">
          <span className="h-2.5 w-2.5 rounded-full bg-green-500" aria-hidden />
          <span className="font-medium text-green-600">En stock</span>
          <span className="font-medium text-[#FF6B00]">· pocas unidades</span>
        </span>
      )
    }
    return (
      <span className="flex items-center gap-1.5 text-sm font-medium text-green-600">
        <span className="h-2.5 w-2.5 rounded-full bg-green-500" aria-hidden />
        En stock
      </span>
    )
  }
  return activo
    ? (
      <span className="flex items-center gap-1.5 text-sm font-medium text-green-600">
        <span className="h-2.5 w-2.5 rounded-full bg-green-500" aria-hidden />
        En stock
      </span>
    )
    : (
      <span className="flex items-center gap-1.5 text-sm font-medium text-[#CC0000]">
        <span className="h-2.5 w-2.5 rounded-full bg-[#CC0000]" aria-hidden />
        Agotado
      </span>
    )
}

function RelacionadoCardSkeleton() {
  return (
    <div className="rounded-xl border border-gray-100 bg-white overflow-hidden flex flex-col">
      <div className="skeleton h-36 w-full" />
      <div className="p-3 flex flex-col gap-2 flex-1">
        <div className="skeleton h-3 w-1/3 rounded" />
        <div className="skeleton h-4 w-full rounded" />
        <div className="skeleton h-4 w-2/3 rounded" />
        <div className="mt-auto pt-2 flex flex-col gap-1.5">
          <div className="skeleton h-5 w-1/2 rounded" />
          <div className="skeleton h-8 w-full rounded" />
        </div>
      </div>
    </div>
  )
}

function RelacionadoCard({ producto }: { producto: Producto }) {
  const [imgSrc, setImgSrc] = useState(() => getProductImage(producto))

  return (
    <article className="group rounded-xl border border-gray-100 bg-white shadow-sm hover:shadow-md overflow-hidden transition-all duration-200 hover:-translate-y-1 flex flex-col">
      <Link to={`/catalogo/${producto.id}`} className="block relative overflow-hidden">
        <img
          src={imgSrc}
          alt={producto.nombre}
          onError={() => setImgSrc(PRODUCTO_PLACEHOLDER)}
          className="h-36 w-full object-cover bg-gray-50 transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
          width={300}
          height={144}
        />
        {!producto.activo && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <Badge variant="cancelado">Sin stock</Badge>
          </div>
        )}
      </Link>
      <div className="p-3 flex flex-col gap-2 flex-1">
        <span className="w-fit rounded-full bg-racing px-2 py-0.5 text-[10px] font-semibold text-white">
          {producto.categoria.nombre}
        </span>
        <Link to={`/catalogo/${producto.id}`}>
          <h3 className="text-xs font-semibold text-carbon-900 line-clamp-2 hover:text-racing transition-colors leading-snug">
            {producto.nombre}
          </h3>
        </Link>
        <div className="mt-auto flex flex-col gap-1.5 pt-2 border-t border-gray-100">
          <span className="text-base font-bold text-[#111111] tabular-nums">
            {formatPrecio(producto.precioVenta)}
          </span>
          <Link
            to={`/catalogo/${producto.id}`}
            className="flex w-full items-center justify-center gap-1.5 rounded-md bg-racing py-2 text-xs font-semibold text-white hover:bg-racing-700 transition-colors"
          >
            Ver producto
          </Link>
        </div>
      </div>
    </article>
  )
}

function ProductosRelacionados({
  categoriaId,
  productoActualId,
}: {
  categoriaId: number
  productoActualId: number
}) {
  const [relacionados, setRelacionados] = useState<Producto[]>([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    const ctrl = new AbortController()
    setCargando(true)
    getProductos(1, 8, '', categoriaId)
      .then((res) => {
        if (ctrl.signal.aborted) return
        const filtrados = res.items.filter((p) => p.id !== productoActualId).slice(0, 4)
        setRelacionados(filtrados)
      })
      .catch(() => {})
      .finally(() => { if (!ctrl.signal.aborted) setCargando(false) })
    return () => ctrl.abort()
  }, [categoriaId, productoActualId])

  // Mostrar skeletons mientras carga
  if (cargando) {
    return (
      <section className="mt-16 border-t border-gray-100 pt-10">
        <h2 className="font-display text-xl text-carbon-900 mb-1">También te puede interesar</h2>
        <p className="text-sm text-gray-500 mb-6">Más productos de la misma categoría</p>
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <RelacionadoCardSkeleton key={i} />
          ))}
        </div>
      </section>
    )
  }

  if (relacionados.length === 0) return null

  return (
    <section className="mt-16 border-t border-gray-100 pt-10">
      <h2 className="font-display text-xl text-carbon-900 mb-1">
        También te puede interesar
      </h2>
      <p className="text-sm text-gray-500 mb-6">Más productos de la misma categoría</p>
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-4">
        {relacionados.map((p) => (
          <RelacionadoCard key={p.id} producto={p} />
        ))}
      </div>
    </section>
  )
}

function ExplorarProductos({
  categoriaId,
  productoActualId,
}: {
  categoriaId: number
  productoActualId: number
}) {
  const [explorar, setExplorar] = useState<Producto[]>([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    const ctrl = new AbortController()
    setCargando(true)
    getProductos(1, 20)
      .then((res) => {
        if (ctrl.signal.aborted) return
        const otros = res.items.filter(
          (p) => p.id !== productoActualId && p.categoriaId !== categoriaId
        )
        const aleatorios = [...otros].sort(() => Math.random() - 0.5).slice(0, 4)
        setExplorar(aleatorios)
      })
      .catch(() => {})
      .finally(() => { if (!ctrl.signal.aborted) setCargando(false) })
    return () => ctrl.abort()
  }, [categoriaId, productoActualId])

  if (cargando) {
    return (
      <section className="mt-12 pt-10 border-t border-gray-100">
        <h2 className="font-display text-xl text-carbon-900 mb-1">Explorar más productos</h2>
        <p className="text-sm text-gray-500 mb-6">Descubre otros accesorios para tu moto</p>
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <RelacionadoCardSkeleton key={i} />
          ))}
        </div>
      </section>
    )
  }

  // Mostrar solo si hay al menos 2 productos de otras categorías
  if (explorar.length < 2) return null

  return (
    <section className="mt-12 pt-10 border-t border-gray-100">
      <h2 className="font-display text-xl text-carbon-900 mb-1">Explorar más productos</h2>
      <p className="text-sm text-gray-500 mb-6">Descubre otros accesorios para tu moto</p>
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-4">
        {explorar.map((p) => (
          <RelacionadoCard key={p.id} producto={p} />
        ))}
      </div>
    </section>
  )
}

export default function ProductoPage() {
  const { id } = useParams<{ id: string }>()
  const [producto, setProducto] = useState<Producto | null>(null)
  const [cargando, setCargando]   = useState(true)
  const [cantidad, setCantidad]   = useState(1)
  const [agregado, setAgregado]   = useState(false)
  const [imgSrc, setImgSrc]       = useState(PRODUCTO_PLACEHOLDER)
  const agregarItem = useCarritoStore((s) => s.agregarItem)
  const agregadoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!id) return
    const ctrl = new AbortController()
    setCargando(true)
    setCantidad(1)
    getProducto(Number(id))
      .then((p) => {
        if (ctrl.signal.aborted) return
        setProducto(p)
        setImgSrc(getProductImage(p))
      })
      .finally(() => { if (!ctrl.signal.aborted) setCargando(false) })
    return () => ctrl.abort()
  }, [id])

  function handleAgregar() {
    if (!producto) return
    agregarItem(producto, cantidad)
    setAgregado(true)
    if (agregadoTimerRef.current) clearTimeout(agregadoTimerRef.current)
    agregadoTimerRef.current = setTimeout(() => setAgregado(false), 2000)
  }

  if (cargando) return <ProductoSkeleton />

  if (!producto) {
    return (
      <div className="bg-white min-h-screen">
        <div className="container mx-auto px-4 py-24 text-center">
          <Package className="h-16 w-16 mx-auto text-gray-300 mb-4" aria-hidden />
          <h1 className="text-xl font-semibold text-carbon-900 mb-2">Producto no encontrado</h1>
          <Link
            to="/catalogo"
            className="mt-4 inline-flex items-center gap-2 rounded-md border border-gray-200 px-4 py-2 text-sm font-medium text-carbon-900 hover:border-racing hover:text-racing transition-colors"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Volver al catálogo
          </Link>
        </div>
      </div>
    )
  }

  const hayStock = producto.activo && (producto.stock === undefined || producto.stock > 0)

  return (
    <div className="bg-white min-h-screen">
      <div className="container mx-auto px-4 py-8">

        {/* Breadcrumb: Inicio / [Categoría] / [Nombre] */}
        <nav aria-label="Ruta de navegación" className="mb-6 flex items-center gap-2 text-sm text-gray-500">
          <Link to="/" className="hover:text-racing transition-colors">Inicio</Link>
          <span className="text-gray-300">/</span>
          <Link
            to={`/catalogo?categoriaId=${producto.categoriaId}`}
            className="hover:text-racing transition-colors"
          >
            {producto.categoria.nombre}
          </Link>
          <span className="text-gray-300">/</span>
          <span className="text-carbon-900 font-medium line-clamp-1 max-w-[200px]">
            {producto.nombre}
          </span>
        </nav>

        <div className="grid gap-10 md:grid-cols-2">

            <div className="rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
            <img
              src={imgSrc}
              alt={producto.nombre}
              onError={() => setImgSrc(PRODUCTO_PLACEHOLDER)}
              className="w-full h-80 md:h-[28rem] object-cover"
              loading="eager"
              width={600}
              height={448}
            />
          </div>

          <div className="flex flex-col gap-5">

            <div>
              <span className="inline-block rounded-full bg-racing px-3 py-0.5 text-xs font-semibold text-white mb-3">
                {producto.categoria.nombre}
              </span>
              <h1 className="text-2xl md:text-3xl font-bold text-carbon-900 leading-tight">
                {producto.nombre}
              </h1>
              <p className="mt-1 text-xs text-gray-400">Cód: {producto.codigo}</p>
            </div>

            {producto.descripcion && (
              <p className="text-sm text-gray-500 leading-relaxed">
                {producto.descripcion}
              </p>
            )}

            <StockIndicador activo={producto.activo} stock={producto.stock} />

            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-carbon-900 tabular-nums">
                {formatPrecio(producto.precioVenta)}
              </span>
              <span className="text-sm text-gray-500">Soles</span>
            </div>

            {hayStock && (
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-500">Cantidad:</span>
                <div className="flex items-center border border-gray-200 rounded-md overflow-hidden">
                  <button
                    onClick={() => setCantidad((c) => Math.max(1, c - 1))}
                    aria-label="Reducir cantidad"
                    className="px-3 py-2 text-carbon-900 hover:bg-gray-100 transition-colors"
                  >
                    −
                  </button>
                  <span className="px-4 py-2 text-carbon-900 tabular-nums min-w-[3rem] text-center text-sm font-medium">
                    {cantidad}
                  </span>
                  <button
                    onClick={() => setCantidad((c) => c + 1)}
                    aria-label="Aumentar cantidad"
                    className="px-3 py-2 text-carbon-900 hover:bg-gray-100 transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>
            )}

            <button
              onClick={handleAgregar}
              disabled={!hayStock || agregado}
              aria-label={`Agregar ${cantidad} unidad(es) al carrito`}
              className={cn(
                'mt-2 flex w-full items-center justify-center gap-2 rounded-md py-3 text-sm font-semibold text-white transition-colors',
                hayStock && !agregado
                  ? 'bg-turbo hover:bg-[#E55F00]'
                  : !hayStock
                    ? 'bg-gray-300 cursor-not-allowed'
                    : 'bg-green-500 cursor-not-allowed'
              )}
            >
              {!hayStock ? (
                'Agotado'
              ) : agregado ? (
                <>
                  <CheckCircle className="h-5 w-5" aria-hidden />
                  ¡Agregado!
                </>
              ) : (
                <>
                  <ShoppingCart className="h-5 w-5" aria-hidden />
                  Agregar al carrito
                </>
              )}
            </button>

            <Link
              to="/catalogo"
              className="flex w-fit items-center gap-2 text-sm text-gray-400 hover:text-racing transition-colors"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden />
              Volver al catálogo
            </Link>
          </div>
        </div>

        <ProductosRelacionados
          categoriaId={producto.categoriaId}
          productoActualId={producto.id}
        />

        <ExplorarProductos
          categoriaId={producto.categoriaId}
          productoActualId={producto.id}
        />
      </div>
    </div>
  )
}

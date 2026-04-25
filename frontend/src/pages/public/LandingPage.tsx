import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, ChevronLeft, ChevronRight, Zap, Shield, Truck, ShoppingCart } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { getProductos } from '@/services/productos.service'
import type { Producto } from '@/types'
import { formatPrecio } from '@/utils/format'
import { useCarritoStore } from '@/stores/carrito.store'
import { assets } from '@/config/assets'
import { cn } from '@/utils/cn'
import { getProductImage, getCategoriaImage, PRODUCTO_PLACEHOLDER } from '@/utils/productImage'
import { getCategorias } from '@/services/categorias.service'
import type { Categoria } from '@/types'

// 5 slides seleccionados del array carousel
const HERO_SLIDES = [
  assets.carousel[0], // pexels-jarod
  assets.carousel[1], // pexels-rodolfoclix
  assets.carousel[4], // V2FaR
  assets.carousel[5], // pexels-jannisr
  assets.carousel[6], // pexels-luisbecerrafotografo
]

// ── Carrusel Hero ─────────────────────────────────────────────────────────────
function HeroCarrusel() {
  const [current, setCurrent] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const total = HERO_SLIDES.length

  function prev() {
    setCurrent((c) => (c - 1 + total) % total)
  }

  function next() {
    setCurrent((c) => (c + 1) % total)
  }

  function startAutoplay() {
    intervalRef.current = setInterval(() => {
      setCurrent((c) => (c + 1) % total)
    }, 4000)
  }

  function stopAutoplay() {
    if (intervalRef.current) clearInterval(intervalRef.current)
  }

  useEffect(() => {
    startAutoplay()
    return stopAutoplay
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <section
      className="relative overflow-hidden h-[300px] md:h-[500px]"
      onMouseEnter={stopAutoplay}
      onMouseLeave={startAutoplay}
      aria-label="Carrusel de imágenes destacadas"
    >
      {/* Slides con fade */}
      {HERO_SLIDES.map((src, i) => (
        <div
          key={src}
          className="absolute inset-0 transition-opacity duration-700 ease-in-out"
          style={{ opacity: i === current ? 1 : 0 }}
          aria-hidden={i !== current}
        >
          <img
            src={src}
            alt=""
            aria-hidden
            className="h-full w-full object-cover"
            loading={i === 0 ? 'eager' : 'lazy'}
            width={1920}
            height={500}
          />
          {/* Overlay oscuro para legibilidad del texto */}
          <div className="absolute inset-0 bg-black/55" aria-hidden />
        </div>
      ))}

      {/* Contenido centrado */}
      <div className="relative z-10 flex h-full flex-col items-center justify-center text-center px-4">
        <h1 className="font-display text-display-md md:text-display-xl text-white mb-3 drop-shadow-lg">
          ACCESORIOS PARA TU MOTO
        </h1>
        <p className="text-base md:text-xl text-white/90 mb-8 max-w-xl drop-shadow">
          Encuentra todo lo que necesitas para rodar
        </p>
        <Link
          to="/catalogo"
          className="inline-flex items-center gap-2 rounded-md bg-racing px-8 py-3 text-base font-semibold text-white shadow-racing hover:bg-racing-700 transition-colors active:scale-[0.98]"
        >
          Ver catálogo
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>

      {/* Flecha anterior */}
      <button
        onClick={prev}
        aria-label="Slide anterior"
        className="absolute left-3 top-1/2 -translate-y-1/2 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-sm hover:bg-black/50 transition-colors"
      >
        <ChevronLeft className="h-6 w-6" aria-hidden />
      </button>

      {/* Flecha siguiente */}
      <button
        onClick={next}
        aria-label="Slide siguiente"
        className="absolute right-3 top-1/2 -translate-y-1/2 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-sm hover:bg-black/50 transition-colors"
      >
        <ChevronRight className="h-6 w-6" aria-hidden />
      </button>

      {/* Dots indicadores */}
      <div
        className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 flex gap-2"
        role="tablist"
        aria-label="Indicadores de slide"
      >
        {HERO_SLIDES.map((_, i) => (
          <button
            key={i}
            role="tab"
            aria-selected={i === current}
            aria-label={`Slide ${i + 1}`}
            onClick={() => setCurrent(i)}
            className={cn(
              'h-2 rounded-full transition-all duration-300',
              i === current ? 'w-6 bg-white' : 'w-2 bg-white/50 hover:bg-white/80'
            )}
          />
        ))}
      </div>
    </section>
  )
}

// ── Carrusel de marcas (scroll infinito CSS) ──────────────────────────────────
function MarcasCarrusel() {
  // Duplicamos el array para crear el efecto de loop infinito
  const doble = [...assets.marcas, ...assets.marcas]

  return (
    <section className="bg-gray-50 py-10 overflow-hidden" aria-label="Marcas que trabajamos">
      <h2 className="text-center text-xs font-semibold uppercase tracking-widest text-gray-400 mb-8">
        Marcas que trabajamos
      </h2>

      {/* Contenedor con overflow oculto */}
      <div className="flex">
        {/* motion-safe: solo anima si el usuario no prefiere movimiento reducido */}
        <div className="motion-safe:animate-marquee flex items-center gap-12 flex-shrink-0">
          {doble.map(({ nombre, url }, i) => (
            <div
              key={`${nombre}-${i}`}
              className="flex-shrink-0 flex items-center justify-center"
              title={nombre}
            >
              <img
                src={url}
                alt={nombre}
                className="h-[60px] w-[120px] object-contain grayscale transition-all duration-300 hover:grayscale-0 hover:scale-110"
                loading="lazy"
                width={120}
                height={60}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── Sección de categorías ─────────────────────────────────────────────────────
function CategoriasSection() {
  const [categorias, setCategorias] = useState<Categoria[]>([])

  useEffect(() => {
    getCategorias().then(setCategorias).catch(() => {})
  }, [])

  return (
    <section className="py-20 bg-white" aria-label="Categorías de productos">
      <div className="container mx-auto px-4">
        <div className="mb-10 text-center">
          <h2 className="font-display text-display-md text-carbon-900">
            EXPLORA POR CATEGORÍA
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            Encuentra exactamente lo que buscas
          </p>
        </div>

        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {categorias.map((cat) => (
            <Link
              key={cat.id}
              to={`/catalogo?categoriaId=${cat.id}`}
              aria-label={`Ver categoría ${cat.nombre}`}
              className="group relative block h-[200px] cursor-pointer overflow-hidden rounded-xl"
              style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }}
            >
              <img
                src={getCategoriaImage(cat)}
                alt=""
                aria-hidden
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                loading="lazy"
                width={600}
                height={200}
              />
              <div className="absolute inset-0 bg-black/50 transition-colors duration-300 group-hover:bg-black/35" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="font-display text-display-sm text-white drop-shadow-lg tracking-wide">
                  {cat.nombre.toUpperCase()}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── Por qué elegirnos ─────────────────────────────────────────────────────────
const FEATURES = [
  {
    icon: Zap,
    title: 'Calidad Premium',
    desc: 'Solo marcas certificadas. Productos probados en pista y calle.',
  },
  {
    icon: Truck,
    title: 'Envío Rápido',
    desc: 'Despacho en 24h dentro de Ayacucho. Envíos a todo el país.',
  },
  {
    icon: Shield,
    title: 'Garantía Real',
    desc: 'Todos nuestros productos cuentan con garantía del fabricante.',
  },
]

function Features() {
  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <h2 className="font-display text-display-md text-carbon-900 text-center mb-12">
          POR QUÉ ELEGIRNOS
        </h2>
        <div className="grid gap-6 md:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-racing/10">
                <Icon className="h-6 w-6 text-racing" aria-hidden />
              </div>
              <h3 className="mb-2 text-base font-semibold text-carbon-900">{title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── Card de producto destacado ────────────────────────────────────────────────
function ProductoDestacadoCard({ producto }: { producto: Producto }) {
  const agregarItem = useCarritoStore((s) => s.agregarItem)
  const [imgSrc, setImgSrc] = useState(() => getProductImage(producto))

  return (
    <article className="group rounded-xl border border-gray-100 bg-white shadow-md hover:shadow-lg overflow-hidden transition-shadow flex flex-col">
      <Link to={`/catalogo/${producto.id}`} className="block relative overflow-hidden">
        <img
          src={imgSrc}
          alt={producto.nombre}
          onError={() => setImgSrc(PRODUCTO_PLACEHOLDER)}
          className="h-44 w-full object-cover bg-gray-100 transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
          width={400}
          height={176}
        />
        {!producto.activo && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <Badge variant="cancelado">Sin stock</Badge>
          </div>
        )}
      </Link>

      <div className="p-4 flex flex-col gap-2 flex-1">
        {/* Badge de categoría rojo */}
        <span className="inline-block w-fit rounded-full bg-racing px-2.5 py-0.5 text-[11px] font-semibold text-white">
          {producto.categoria.nombre}
        </span>
        <Link to={`/catalogo/${producto.id}`}>
          <h3 className="text-sm font-semibold text-carbon-900 line-clamp-2 hover:text-racing transition-colors">
            {producto.nombre}
          </h3>
        </Link>

        <div className="mt-auto flex items-center justify-between pt-3 border-t border-gray-100">
          <span className="text-lg font-bold text-racing tabular-nums">
            {formatPrecio(producto.precioVenta)}
          </span>
          <button
            onClick={() => agregarItem(producto)}
            disabled={!producto.activo}
            aria-label={`Agregar ${producto.nombre} al carrito`}
            className="flex h-9 w-9 items-center justify-center rounded-md bg-racing text-white hover:bg-racing-700 disabled:opacity-40 transition-colors"
          >
            <ShoppingCart className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </div>
    </article>
  )
}

function ProductoSkeleton() {
  return (
    <div className="rounded-xl border border-gray-100 bg-white shadow-md overflow-hidden">
      <div className="skeleton h-44 w-full" />
      <div className="p-4 flex flex-col gap-2">
        <div className="skeleton h-3 w-1/3 rounded" />
        <div className="skeleton h-4 w-3/4 rounded" />
        <div className="skeleton h-6 w-1/3 rounded mt-2" />
      </div>
    </div>
  )
}

// ── Sección productos destacados ──────────────────────────────────────────────
function ProductosDestacados() {
  const [productos, setProductos] = useState<Producto[]>([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    getProductos(1, 4)
      .then((res) => setProductos(res.items))
      .finally(() => setCargando(false))
  }, [])

  if (!cargando && productos.length === 0) return null

  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="flex items-end justify-between mb-10">
          <div>
            <h2 className="font-display text-display-md text-carbon-900">PRODUCTOS</h2>
            <p className="text-gray-500 text-sm mt-1">Lo más reciente en nuestro stock</p>
          </div>
          <Link
            to="/catalogo"
            className="flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-racing transition-colors"
          >
            Ver todos <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </div>

        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          {cargando
            ? Array.from({ length: 4 }).map((_, i) => <ProductoSkeleton key={i} />)
            : productos.map((p) => <ProductoDestacadoCard key={p.id} producto={p} />)
          }
        </div>
      </div>
    </section>
  )
}

// ── CTA final ─────────────────────────────────────────────────────────────────
function CTA() {
  return (
    <section className="py-20 bg-racing">
      <div className="container mx-auto px-4 text-center">
        <h2 className="font-display text-display-md text-white mb-4">
          ¿LISTO PARA EQUIPAR TU MOTO?
        </h2>
        <p className="text-white/80 mb-8">
          Explora nuestro catálogo completo de accesorios y repuestos.
        </p>
        <Link
          to="/catalogo"
          className="inline-flex items-center gap-2 rounded-md bg-white px-8 py-3 text-base font-semibold text-racing hover:bg-gray-50 active:scale-[0.98] transition-colors"
        >
          Explorar ahora <ArrowRight className="h-5 w-5" aria-hidden />
        </Link>
      </div>
    </section>
  )
}

export default function LandingPage() {
  return (
    <>
      <HeroCarrusel />
      <MarcasCarrusel />
      <CategoriasSection />
      <Features />
      <ProductosDestacados />
      <CTA />
    </>
  )
}

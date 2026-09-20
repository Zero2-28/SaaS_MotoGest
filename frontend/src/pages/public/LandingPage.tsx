import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, ChevronLeft, ChevronRight, ShoppingCart, Truck, ShieldCheck } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { getProductos } from '@/services/productos.service'
import type { Producto } from '@/types'
import { formatPrecio } from '@/utils/format'
import { useCarritoStore } from '@/stores/carrito.store'
import { assets } from '@/config/assets'
import { tienda } from '@/config/tienda'
import { cn } from '@/utils/cn'
import { getProductImage, getCategoriaImage, PRODUCTO_PLACEHOLDER } from '@/utils/productImage'
import { getCategorias } from '@/services/categorias.service'
import type { Categoria } from '@/types'

// El hero muestra el carrusel completo (RE1–RE5)
const HERO_SLIDES = assets.carousel

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
        <h1 className="font-display text-display-md md:text-display-xl text-white mb-3 drop-shadow-md">
          ACCESORIOS PARA TU MOTO
        </h1>
        <p className="text-base md:text-xl text-white/90 mb-8 max-w-xl drop-shadow">
          Encuentra todo lo que necesitas para rodar
        </p>
        <Link
          to="/catalogo"
          className="sheen inline-flex items-center gap-2 rounded-md bg-metal-btn px-8 py-3 text-base font-semibold text-white shadow-metal transition-all hover:bg-metal-btn-hv hover:shadow-brand active:scale-[0.98]"
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
    <section className="bg-chrome-50 py-10 overflow-hidden" aria-label="Marcas que trabajamos">
      <h2 className="text-center text-xs font-semibold uppercase tracking-widest text-chrome-400 mb-8">
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
    <section className="pt-20 pb-4 bg-white" aria-label="Categorías de productos">
      <div className="container mx-auto px-4">
        <div className="mb-10 text-center">
          <h2 className="font-display text-display-md text-gradient-brand">
            EXPLORA POR CATEGORÍA
          </h2>
          <p className="mt-2 text-sm text-chrome-500">
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
                <span className="font-display text-display-sm text-white drop-shadow-md tracking-wide">
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

// ── Banner promocional ────────────────────────────────────────────────────────
function BannerPromocional() {
  return (
    <section
      className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8 py-5 md:h-20 px-6"
      style={{ background: 'linear-gradient(100deg, #15425A 0%, #0F3341 50%, #0B2041 100%)' }}
      aria-label="Beneficios"
    >
      <span className="flex items-center gap-2 text-[15px] font-bold text-white">
        <Truck size={18} aria-hidden />
        Envíos en 24h dentro del Callao
      </span>
      <span className="hidden md:block text-white/50 select-none text-lg font-light">|</span>
      <span className="flex items-center gap-2 text-[15px] font-bold text-white">
        <ShieldCheck size={18} aria-hidden />
        Garantía en todos los productos
      </span>
      <Link
        to="/catalogo"
        className="inline-flex items-center gap-1.5 rounded-md border border-white/70 px-5 py-1.5 text-sm font-semibold text-white hover:bg-white/10 active:scale-[0.98] transition-colors"
      >
        Ver catálogo <ArrowRight size={16} aria-hidden />
      </Link>
    </section>
  )
}

// ── Por qué elegirnos ─────────────────────────────────────────────────────────
const PUNTOS_CLAVE = [
  'Productos certificados de calidad premium',
  'Despacho en 24h dentro del Callao',
  'Garantía real del fabricante',
]

function Features() {
  return (
    <section className="flex flex-col md:flex-row" aria-label="Por qué elegirnos">
      {/* Columna izquierda — imagen completa sobre fondo oscuro uniforme */}
      <div
        className="relative md:w-1/2 min-h-[500px] flex items-center justify-center overflow-hidden"
        style={{ background: '#0F3341' }}
      >
        <img
          src={assets.banner.porQueElegirnos}
          alt=""
          aria-hidden
          className="w-full h-full object-contain object-center"
          style={{ filter: 'brightness(0.9)' }}
          loading="lazy"
          width={700}
          height={500}
        />
      </div>

      {/* Columna derecha — fondo oscuro, contenido centrado verticalmente */}
      <div className="flex items-center bg-metal px-10 py-12 md:w-1/2 md:px-12 md:py-16">
        <div className="max-w-md">
          <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-brand-300">
            RE MOTOS
          </p>
          <h2 className="font-display text-3xl md:text-4xl text-white leading-tight mb-6">
            Por qué elegir<br />
            Nuestro{' '}
            <span className="text-brand-300">Servicio</span>
            {' '}de Confianza.
          </h2>
          <p className="mb-8 text-sm leading-relaxed text-brand-200">
            En RE MOTOS, nuestra prioridad es satisfacer las necesidades de nuestros
            clientes y brindarles la mayor comodidad y confianza en cada producto.
          </p>
          <ul className="flex flex-col gap-3 mb-8">
            {PUNTOS_CLAVE.map((punto) => (
              <li key={punto} className="flex items-center gap-3 text-sm text-white">
                <span className="shrink-0 font-bold text-brand-300">✓</span>
                {punto}
              </li>
            ))}
          </ul>
          {/* Dirección y WhatsApp — datos de contacto a la vista */}
          <ul className="mb-8 flex flex-col gap-2 text-sm text-brand-200">
            <li>
              <span aria-hidden>📍</span> ¡Ubícanos en{' '}
              <span className="font-semibold text-white">{tienda.direccion}</span>!
            </li>
            <li>
              <span aria-hidden>📲</span> Escríbenos al WhatsApp{' '}
              <a
                href={tienda.whatsapp.url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-white underline-offset-4 hover:underline"
              >
                {tienda.whatsapp.display}
              </a>
            </li>
          </ul>
          <a
            href={tienda.mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="sheen inline-block rounded-md bg-metal-btn px-8 py-3 text-sm font-semibold text-white shadow-metal transition-all hover:bg-metal-btn-hv hover:shadow-brand active:scale-[0.98]"
          >
            Ubícanos en Google Maps
          </a>
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
    <article className="group flex flex-col overflow-hidden rounded-xl border border-chrome-200 bg-white shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-card-md">
      <Link to={`/catalogo/${producto.id}`} className="block relative overflow-hidden">
        <img
          src={imgSrc}
          alt={producto.nombre}
          onError={() => setImgSrc(PRODUCTO_PLACEHOLDER)}
          className="h-44 w-full object-cover bg-chrome-100 transition-transform duration-300 group-hover:scale-105"
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
        <span className="inline-block w-fit rounded-full bg-brand px-2.5 py-0.5 text-[11px] font-semibold text-white">
          {producto.categoria.nombre}
        </span>
        <Link to={`/catalogo/${producto.id}`}>
          <h3 className="text-sm font-semibold text-brand-900 line-clamp-2 hover:text-brand transition-colors">
            {producto.nombre}
          </h3>
        </Link>

        <div className="mt-auto flex items-center justify-between pt-3 border-t border-chrome-100">
          <span className="text-lg font-bold text-brand tabular-nums">
            {formatPrecio(producto.precioVenta)}
          </span>
          <button
            onClick={() => agregarItem(producto)}
            disabled={!producto.activo}
            aria-label={`Agregar ${producto.nombre} al carrito`}
            className="flex h-9 w-9 items-center justify-center rounded-md bg-metal-btn text-white shadow-metal transition-all hover:bg-metal-btn-hv disabled:opacity-40"
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
    <div className="overflow-hidden rounded-xl border border-chrome-200 bg-white shadow-card">
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
            <h2 className="font-display text-display-md text-gradient-brand">PRODUCTOS</h2>
            <p className="text-chrome-500 text-sm mt-1">Lo más reciente en nuestro stock</p>
          </div>
          <Link
            to="/catalogo"
            className="flex items-center gap-1 text-sm font-medium text-chrome-500 hover:text-brand transition-colors"
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
    <section className="edge-chrome bg-metal py-20">
      <div className="container mx-auto px-4 text-center">
        <h2 className="mb-4 font-display text-display-md text-gradient-chrome">
          ¿LISTO PARA EQUIPAR TU MOTO?
        </h2>
        <p className="text-white/80 mb-8">
          Explora nuestro catálogo completo de accesorios y repuestos.
        </p>
        <Link
          to="/catalogo"
          className="inline-flex items-center gap-2 rounded-md bg-white px-8 py-3 text-base font-semibold text-brand hover:bg-chrome-50 active:scale-[0.98] transition-colors"
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
      <BannerPromocional />
      <Features />
      <ProductosDestacados />
      <CTA />
    </>
  )
}

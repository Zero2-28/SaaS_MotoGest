import { Outlet, Link, NavLink, useNavigate } from 'react-router-dom'
import { ShoppingCart, Menu, X, Truck, User, LogOut, ChevronDown, Search, ShoppingBag, UserCircle, MapPin, Star, Bell, Lock } from 'lucide-react'
import { useState, useRef, useEffect, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/utils/cn'
import { useCarritoStore } from '@/stores/carrito.store'
import { useAuthClienteStore } from '@/stores/auth.store'
import { assets, LOGO_RATIO } from '@/config/assets'
import { tienda } from '@/config/tienda'
import { CartDrawer } from '@/components/CartDrawer'
import { Avatar } from '@/components/ui/Avatar'

// ── Categorías para el dropdown ───────────────────────────────────────────────
const CATEGORIAS = [
  { label: 'Motor',          slug: 'motor' },
  { label: 'Cascos',         slug: 'cascos' },
  { label: 'Guantes',       slug: 'guantes' },
  { label: 'Repuestos | Motor',      slug: 'repuestos-motor' },
  { label: 'Espejos',     slug: 'espejos' },
  { label: 'Frenos', slug: 'frenos' },
]

// ── Barra de búsqueda ─────────────────────────────────────────────────────────
function SearchBar({ className }: { className?: string }) {
  const navigate = useNavigate()
  const [q, setQ] = useState('')

  function handleSearch(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const term = q.trim()
    if (term) navigate(`/catalogo?q=${encodeURIComponent(term)}`)
  }

  return (
    <form onSubmit={handleSearch} className={cn('relative flex items-center', className)}>
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Buscar productos..."
        aria-label="Buscar productos"
        className="w-full rounded-full border border-chrome-200 bg-chrome-50 py-2 pl-4 pr-10 text-sm text-brand-900 placeholder:text-chrome-400 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
      />
      <button
        type="submit"
        aria-label="Buscar"
        className="absolute right-3 text-chrome-400 hover:text-brand transition-colors"
      >
        <Search className="h-5 w-5" aria-hidden />
      </button>
    </form>
  )
}

// ── Dropdown de categorías ────────────────────────────────────────────────────
function CategoriasDropdown() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Cerrar al hacer click fuera
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [open])

  return (
    <div ref={ref} className="relative flex-shrink-0">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1 text-sm font-medium text-brand-900 hover:text-brand transition-colors"
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        Categorías
        <ChevronDown
          className={cn('h-5 w-5 transition-transform duration-200', open && 'rotate-180')}
          aria-hidden
        />
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute left-0 top-full z-50 mt-2 w-48 rounded-lg border border-chrome-100 bg-white py-2 shadow-card-md animate-fade-in"
        >
          {CATEGORIAS.map(({ label, slug }) => (
            <Link
              key={slug}
              to={`/catalogo?categoria=${slug}`}
              role="option"
              onClick={() => setOpen(false)}
              className="block px-4 py-2 text-sm text-brand-900 hover:bg-chrome-50 hover:text-brand transition-colors"
            >
              {label}
            </Link>
          ))}
          <div className="my-1 border-t border-chrome-100" />
          <Link
            to="/catalogo"
            role="option"
            onClick={() => setOpen(false)}
            className="block px-4 py-2 text-sm font-semibold text-brand hover:bg-chrome-50 transition-colors"
          >
            Ver todo el catálogo →
          </Link>
        </div>
      )}
    </div>
  )
}

// ── Dropdown "Mi cuenta" para cliente autenticado ────────────────────────────
function MiCuentaDropdown({
  cliente,
  onLogout,
}: {
  cliente: { nombre: string; avatarUrl?: string | null }
  onLogout: () => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [open])

  return (
    <div ref={ref} className="hidden md:block relative pl-2 border-l border-chrome-100">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <Avatar
          src={cliente.avatarUrl ?? assets.avatares.perfil}
          nombre={cliente.nombre}
          size="sm"
          rol="cliente"
          className="border border-chrome-200"
        />
        <span className="text-sm font-medium text-brand-900 max-w-[96px] truncate">
          {cliente.nombre.split(' ')[0]}
        </span>
        <ChevronDown
          className={cn('h-3.5 w-3.5 text-chrome-400 transition-transform duration-200', open && 'rotate-180')}
          aria-hidden
        />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-2 z-50 w-52 rounded-lg border border-chrome-100 bg-white py-1 shadow-card-md animate-fade-in"
        >
          {/* Ítem activo */}
          <Link
            to="/mi-cuenta/compras"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-4 py-2 text-sm text-brand-900 hover:bg-chrome-50 hover:text-brand transition-colors"
          >
            <ShoppingBag className="h-4 w-4" aria-hidden />
            Mis compras
          </Link>

          {/* Ítems próximamente */}
          {([
            { Icon: UserCircle, label: 'Mi perfil' },
            { Icon: MapPin,     label: 'Mis direcciones' },
            { Icon: Star,       label: 'Mis puntos' },
            { Icon: Bell,       label: 'Notificaciones' },
            { Icon: Lock,       label: 'Cambiar contraseña' },
          ] as const).map(({ Icon, label }) => (
            <button
              key={label}
              role="menuitem"
              disabled
              aria-disabled="true"
              className="flex w-full items-center justify-between gap-2 px-4 py-2 text-sm text-chrome-300 cursor-not-allowed"
            >
              <span className="flex items-center gap-2">
                <Icon className="h-4 w-4" aria-hidden />
                {label}
              </span>
              <span className="text-[10px] font-semibold text-turbo bg-turbo-50 px-1.5 py-0.5 rounded-full leading-tight">
                Próximamente
              </span>
            </button>
          ))}

          <div className="my-1 border-t border-chrome-100" />
          <button
            role="menuitem"
            onClick={() => { setOpen(false); onLogout() }}
            className="flex w-full items-center gap-2 px-4 py-2 text-sm text-chrome-500 hover:bg-chrome-50 hover:text-brand transition-colors"
          >
            <LogOut className="h-4 w-4" aria-hidden />
            Cerrar sesión
          </button>
        </div>
      )}
    </div>
  )
}

// ── Navbar pública ────────────────────────────────────────────────────────────
function PublicNavbar({ onCartClick }: { onCartClick: () => void }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const navigate = useNavigate()

  const totalCarrito = useCarritoStore((s) => s.totalItems())
  const { cliente, isAuthenticated, clearCliente } = useAuthClienteStore()

  function handleLogout() {
    clearCliente()
    navigate('/')
    setMenuOpen(false)
  }

  return (
    <header className="sticky top-0 z-40 border-b border-chrome-200 bg-white shadow-card">
      {/* Filo metálico de marca */}
      <div className="h-[3px] w-full bg-metal" aria-hidden />
      <div className="container mx-auto flex h-16 items-center justify-between gap-4 px-4">

        {/* Logo */}
        <Link
          to="/"
          className="flex-shrink-0 rounded-md transition-opacity hover:opacity-90"
          aria-label="RE MOTOS — Inicio"
        >
          <img
            src={assets.logo}
            alt="RE MOTOS — Accesorios y equipamiento"
            className="h-11 w-auto rounded-md"
            width={Math.round(44 * LOGO_RATIO)}
            height={44}
          />
        </Link>

        {/* Categorías + Buscador — desktop */}
        <div className="hidden md:flex items-center gap-6 flex-1 max-w-2xl">
          <CategoriasDropdown />
          <SearchBar className="flex-1" />
        </div>

        {/* Acciones lado derecho */}
        <div className="flex items-center gap-1 sm:gap-2">

          {/* Sigue tu pedido — solo desktop grande */}
          <NavLink
            to="/rastreo"
            className={({ isActive }) =>
              cn(
                'hidden lg:flex items-center gap-1.5 text-sm font-medium transition-colors px-2',
                isActive ? 'text-brand' : 'text-brand-900 hover:text-brand'
              )
            }
          >
            <Truck className="h-5 w-5" aria-hidden />
            Sigue tu pedido
          </NavLink>

          {/* Mi cuenta / Avatar — desktop */}
          {isAuthenticated && cliente ? (
            <MiCuentaDropdown cliente={cliente} onLogout={handleLogout} />
          ) : (
            <Button asChild variant="outline" size="sm" className="hidden md:inline-flex">
              <Link to="/login">
                <User className="h-4 w-4" aria-hidden />
                Ingresar
              </Link>
            </Button>
          )}

          {/* Carrito con badge naranja — abre el drawer */}
          <button
            onClick={onCartClick}
            className="relative flex h-9 w-9 items-center justify-center rounded-md text-brand-900 hover:bg-chrome-50 hover:text-brand transition-colors"
            aria-label={`Carrito${totalCarrito > 0 ? ` — ${totalCarrito} producto(s)` : ''}`}
          >
            <ShoppingCart className="h-5 w-5" aria-hidden />
            {totalCarrito > 0 && (
              <span
                className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-turbo text-[10px] font-bold text-white tabular-nums"
                aria-hidden
              >
                {totalCarrito > 99 ? '99+' : totalCarrito}
              </span>
            )}
          </button>

          {/* Hamburguesa — mobile */}
          <button
            className="flex md:hidden h-9 w-9 items-center justify-center rounded-md text-brand-900 hover:bg-chrome-50 transition-colors"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X className="h-5 w-5" aria-hidden /> : <Menu className="h-5 w-5" aria-hidden />}
          </button>
        </div>
      </div>

      {/* Menú mobile */}
      {menuOpen && (
        <div className="md:hidden border-t border-chrome-100 bg-white px-4 py-4 animate-fade-in">
          <SearchBar className="mb-4" />

          <nav className="flex flex-col gap-1" aria-label="Menú móvil">
            <NavLink
              to="/catalogo"
              onClick={() => setMenuOpen(false)}
              className={({ isActive }) =>
                cn(
                  'rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  isActive ? 'bg-chrome-50 text-brand' : 'text-brand-900 hover:bg-chrome-50'
                )
              }
            >
              Catálogo
            </NavLink>

            {/* Categorías en grid de 2 columnas */}
            <div className="px-3 py-2">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-chrome-400">
                Categorías
              </p>
              <div className="grid grid-cols-2 gap-1">
                {CATEGORIAS.map(({ label, slug }) => (
                  <Link
                    key={slug}
                    to={`/catalogo?categoria=${slug}`}
                    onClick={() => setMenuOpen(false)}
                    className="rounded px-2 py-1.5 text-sm text-brand-900 hover:bg-chrome-50 hover:text-brand transition-colors"
                  >
                    {label}
                  </Link>
                ))}
              </div>
            </div>

            <NavLink
              to="/rastreo"
              onClick={() => setMenuOpen(false)}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  isActive ? 'bg-chrome-50 text-brand' : 'text-brand-900 hover:bg-chrome-50'
                )
              }
            >
              <Truck className="h-5 w-5" aria-hidden />
              Sigue tu pedido
            </NavLink>

            <div className="my-2 border-t border-chrome-100" />

            {isAuthenticated && cliente ? (
              <>
                <div className="flex items-center gap-2 px-3 py-2">
                  <Avatar
                    src={cliente.avatarUrl ?? assets.avatares.perfil}
                    nombre={cliente.nombre}
                    size="sm"
                    rol="cliente"
                    className="border border-chrome-200"
                  />
                  <span className="text-sm font-medium text-brand-900">{cliente.nombre}</span>
                </div>
                <Link
                  to="/mi-cuenta/compras"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-brand-900 hover:bg-chrome-50 hover:text-brand transition-colors"
                >
                  <ShoppingBag className="h-5 w-5" aria-hidden />
                  Mis compras
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-chrome-500 hover:bg-chrome-50 hover:text-brand transition-colors text-left"
                >
                  <LogOut className="h-5 w-5" aria-hidden />
                  Cerrar sesión
                </button>
              </>
            ) : (
              <Link
                to="/login"
                onClick={() => setMenuOpen(false)}
                className="mx-3 mt-1 flex items-center justify-center gap-2 rounded-md border border-brand py-2 text-sm font-semibold text-brand hover:bg-brand hover:text-white transition-colors"
              >
                <User className="h-5 w-5" aria-hidden />
                Ingresar
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  )
}

// 6 marcas seleccionadas para el footer
const MARCAS_FOOTER = [
  assets.marcas[9],  // Motul
  assets.marcas[10], // Michelin
  assets.marcas[12], // Suzuki
  assets.marcas[6],  // Scoyco
  assets.marcas[7],  // Repsol
  assets.marcas[0],  // CST
]

const LINKS_FOOTER = [
  { label: 'Catálogo',        to: '/catalogo' },
  { label: 'Rastrear pedido', to: '/rastreo' },
  { label: 'Mi cuenta',       to: '/login' },
]

// ── Footer público ────────────────────────────────────────────────────────────
function PublicFooter() {
  return (
    <footer className="mt-auto">
      {/* Sección principal 4 columnas */}
      <div className="edge-chrome bg-metal py-12">
        <div className="container mx-auto px-4">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">

            {/* Col 1: Logo + descripción */}
            <div>
              <img
                src={assets.logo}
                alt="RE MOTOS"
                className="mb-4 h-10 w-auto rounded-md"
                width={Math.round(40 * LOGO_RATIO)}
                height={40}
              />
              <p className="text-sm text-brand-200 leading-relaxed">
                Tu tienda de accesorios para motos en {tienda.ciudad}. Calidad garantizada en cada producto.
              </p>
            </div>

            {/* Col 2: Links rápidos */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-widest text-brand-300 mb-4">
                Links rápidos
              </h3>
              <ul className="flex flex-col gap-2">
                {LINKS_FOOTER.map(({ label, to }) => (
                  <li key={to}>
                    <Link
                      to={to}
                      className="text-sm text-brand-200 hover:text-white transition-colors"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Col 3: Contacto */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-widest text-brand-300 mb-4">
                Contacto
              </h3>
              <ul className="flex flex-col gap-2 text-sm text-brand-200">
                <li>
                  <a
                    href={tienda.mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="transition-colors hover:text-white"
                  >
                    📍 {tienda.direccion}
                  </a>
                </li>
                <li>
                  <a
                    href={tienda.whatsapp.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="transition-colors hover:text-white"
                  >
                    📲 WhatsApp {tienda.whatsapp.display}
                  </a>
                </li>
                <li>
                  <a href={`mailto:${tienda.email}`} className="transition-colors hover:text-white">
                    📧 {tienda.email}
                  </a>
                </li>
              </ul>
            </div>

            {/* Col 4: Logos de marcas 3×2 */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-widest text-brand-300 mb-4">
                Marcas
              </h3>
              <div className="grid grid-cols-3 gap-2">
                {MARCAS_FOOTER.map(({ nombre, url }) => (
                  <div
                    key={nombre}
                    className="flex items-center justify-center rounded-md bg-white/5 p-2"
                    title={nombre}
                  >
                    <img
                      src={url}
                      alt={nombre}
                      className="h-8 w-full object-contain opacity-80 hover:opacity-100 transition-opacity"
                      loading="lazy"
                      width={60}
                      height={32}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Franja inferior */}
      <div className="border-t border-white/5 bg-brand-950 py-4">
        <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 px-4 text-xs text-brand-300">
          <span>© {new Date().getFullYear()} {tienda.nombre} — {tienda.ciudad}, Perú</span>
          <p>
            Rastrear pedido:{' '}
            <Link to="/rastreo" className="font-medium text-brand-200 hover:text-white hover:underline">
              CT-2026-XXXX
            </Link>
          </p>
        </div>
      </div>
    </footer>
  )
}

// ── Botón flotante de WhatsApp ────────────────────────────────────────────────
function WhatsAppButton() {
  return (
    <a
      href={tienda.whatsapp.url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Escríbenos por WhatsApp al ${tienda.whatsapp.display}`}
      className="group fixed bottom-6 left-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] shadow-card-md transition-all duration-200 hover:scale-110 hover:shadow-card-lg"
    >
      <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        className="h-7 w-7 text-white"
        aria-hidden="true"
      >
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
        <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.555 4.116 1.527 5.845L.057 23.885l6.19-1.444A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.006-1.376l-.36-.214-3.722.868.936-3.42-.235-.372A9.818 9.818 0 1112 21.818z" />
      </svg>
      {/* Tooltip a la derecha del botón */}
      <span className="pointer-events-none absolute left-full ml-3 whitespace-nowrap rounded-md bg-ink px-2.5 py-1 text-xs text-white opacity-0 shadow-card-md transition-opacity duration-200 group-hover:opacity-100">
        WhatsApp {tienda.whatsapp.display}
      </span>
    </a>
  )
}

// ── Layout público principal ──────────────────────────────────────────────────
export default function PublicLayout() {
  const [isCartOpen, setIsCartOpen] = useState(false)

  return (
    <div className="flex min-h-dvh flex-col bg-white">
      <PublicNavbar onCartClick={() => setIsCartOpen(true)} />
      <main className="flex-1">
        <Outlet />
      </main>
      <PublicFooter />
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
      <WhatsAppButton />
    </div>
  )
}

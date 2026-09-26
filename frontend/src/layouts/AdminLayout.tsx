import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Package, Warehouse, ShoppingCart,
  ClipboardList, Users, BarChart3, LogOut, Bell,
  ChevronLeft, ChevronRight, AlertTriangle, ShoppingBag,
  CreditCard, Info, Tag, Truck, RotateCcw, User, KeyRound, Eye, EyeOff, Camera,
} from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { cn } from '@/utils/cn'
import { useAuthEmpleadoStore } from '@/stores/auth.store'
import { logoutEmpleado, changePassword, updateAvatarUrl } from '@/services/auth.service'
import { uploadAvatarImage } from '@/services/upload.service'
import {
  getNotificaciones, marcarLeida, marcarTodasLeidas,
} from '@/services/notificaciones.service'
import type { Notificacion, TipoNotificacion, RolEmpleado } from '@/types'
import { assets } from '@/config/assets'
import { Avatar } from '@/components/ui/Avatar'

const NAV_ITEMS = [
  { to: '/admin',              icon: LayoutDashboard, label: 'Dashboard',           exact: true, roles: ['admin','vendedor','repartidor'] },
  { to: '/admin/empleados',    icon: Users,           label: 'Empleados',                        roles: ['admin']                        },
  { to: '/admin/productos',    icon: Package,         label: 'Productos',                        roles: ['admin','vendedor']             },
  { to: '/admin/categorias',   icon: Tag,             label: 'Categorías',                       roles: ['admin']                        },
  { to: '/admin/proveedores',  icon: Truck,           label: 'Proveedores',                      roles: ['admin']                        },
  { to: '/admin/inventario',   icon: Warehouse,       label: 'Inventario',                       roles: ['admin','vendedor']             },
  { to: '/admin/tpv',          icon: ShoppingCart,    label: 'Punto de Venta',                   roles: ['admin','vendedor']             },
  { to: '/admin/pedidos',      icon: ClipboardList,   label: 'Pedidos | Clientes',               roles: ['admin','vendedor','repartidor'] },
  { to: '/admin/compras',      icon: Package,         label: 'Pedidos | Distribuidora',          roles: ['admin']                        },
  { to: '/admin/devoluciones', icon: RotateCcw,       label: 'Devoluciones',                     roles: ['admin','vendedor']             },
  { to: '/admin/clientes',     icon: Users,           label: 'Clientes',                         roles: ['admin','vendedor']             },
  { to: '/admin/reportes',     icon: BarChart3,       label: 'Reportes',                         roles: ['admin']                        },
]

const TIPO_CONFIG: Record<
  TipoNotificacion,
  { icon: React.ElementType; colorClass: string; label: string }
> = {
  general:         { icon: Info,          colorClass: 'text-blue-500',   label: 'General'         },
  stock_bajo:      { icon: AlertTriangle, colorClass: 'text-yellow-500', label: 'Stock bajo'      },
  pedido_nuevo:    { icon: ShoppingBag,   colorClass: 'text-[#CC0000]',  label: 'Pedido nuevo'    },
  pago_confirmado: { icon: CreditCard,    colorClass: 'text-green-500',  label: 'Pago confirmado' },
}

function NotificacionItem({
  notif,
  onMarcar,
}: {
  notif: Notificacion
  onMarcar: (id: string) => void
}) {
  const { icon: Icon, colorClass, label } = TIPO_CONFIG[notif.tipo]

  return (
    <li
      className={cn(
        'flex gap-3 rounded-md px-3 py-2.5 transition-colors',
        notif.leida ? 'opacity-50' : 'bg-gray-50'
      )}
    >
      <div className={cn('mt-0.5 shrink-0', colorClass)} aria-label={label}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-[#111111] leading-snug">{notif.titulo}</p>
        <p className="text-xs text-[#666666] leading-snug mt-0.5 line-clamp-2">
          {notif.mensaje}
        </p>
      </div>
      {!notif.leida && (
        <button
          className="mt-0.5 shrink-0 h-2 w-2 rounded-full bg-[#CC0000] hover:bg-[#AA0000] transition-colors"
          onClick={() => onMarcar(notif.id)}
          aria-label={`Marcar "${notif.titulo}" como leída`}
          title="Marcar como leída"
        />
      )}
    </li>
  )
}

function NotificacionesPanel({
  notifs, onMarcar, onMarcarTodas, onCerrar,
}: {
  notifs: Notificacion[]
  onMarcar: (id: string) => void
  onMarcarTodas: () => void
  onCerrar: () => void
}) {
  const noLeidas = notifs.filter((n) => !n.leida).length
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) onCerrar()
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [onCerrar])

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onCerrar()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onCerrar])

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-label="Notificaciones"
      className="absolute right-0 top-full mt-2 z-50 w-80 rounded-lg border border-gray-200 bg-white shadow-xl animate-fade-in"
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-[#666666]" aria-hidden />
          <span className="text-sm font-semibold text-[#111111]">Notificaciones</span>
          {noLeidas > 0 && (
            <Badge className="h-4 px-1.5 text-[10px]">{noLeidas}</Badge>
          )}
        </div>
        {noLeidas > 0 && (
          <button
            className="text-xs text-[#666666] hover:text-[#CC0000] transition-colors"
            onClick={onMarcarTodas}
          >
            Marcar todas
          </button>
        )}
      </div>

      <ScrollArea className="max-h-80">
        {notifs.length === 0 ? (
          <div className="py-10 text-center">
            <Bell className="h-8 w-8 mx-auto text-gray-300 mb-2" />
            <p className="text-xs text-[#666666]">Sin notificaciones pendientes</p>
          </div>
        ) : (
          <ul className="p-2 space-y-1" aria-live="polite">
            {notifs.map((n) => (
              <NotificacionItem key={n.id} notif={n} onMarcar={onMarcar} />
            ))}
          </ul>
        )}
      </ScrollArea>

      {notifs.length > 0 && (
        <>
          <Separator />
          <div className="px-4 py-2 text-center">
            <p className="text-xs text-[#666666]">
              {noLeidas === 0 ? 'Todo al día' : `${noLeidas} sin leer`}
            </p>
          </div>
        </>
      )}
    </div>
  )
}

const ROL_BADGE: Record<RolEmpleado, string> = {
  admin:      'bg-[#CC0000] text-white',
  vendedor:   'bg-[#FF6B00] text-white',
  repartidor: 'bg-blue-500 text-white',
}

const pwdSchema = z.object({
  passwordActual:    z.string().min(1, 'Ingresa tu contraseña actual'),
  passwordNuevo:     z.string().min(6, 'Mínimo 6 caracteres'),
  confirmarPassword: z.string().min(1, 'Confirma tu nueva contraseña'),
}).refine((d) => d.passwordNuevo === d.confirmarPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmarPassword'],
})

type PwdForm = z.infer<typeof pwdSchema>

function PerfilModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { empleado, patchEmpleado } = useAuthEmpleadoStore()
  const [guardando, setGuardando]         = useState(false)
  const [exito, setExito]                 = useState(false)
  const [errorMsg, setErrorMsg]           = useState<string | null>(null)
  const [mostrarActual, setMostrarActual] = useState(false)
  const [mostrarNuevo, setMostrarNuevo]   = useState(false)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [avatarFile, setAvatarFile]       = useState<File | null>(null)
  const [subiendoAvatar, setSubiendoAvatar] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<PwdForm>({
    resolver: zodResolver(pwdSchema),
  })

  function handleClose() {
    if (avatarPreview?.startsWith('blob:')) URL.revokeObjectURL(avatarPreview)
    setAvatarPreview(null)
    setAvatarFile(null)
    reset()
    setExito(false)
    setErrorMsg(null)
    onClose()
  }

  async function handleGuardarAvatar() {
    if (!avatarFile) return
    setSubiendoAvatar(true)
    try {
      const url = await uploadAvatarImage(avatarFile)
      await updateAvatarUrl(url)
      patchEmpleado({ avatarUrl: url })
      setAvatarFile(null)
      if (avatarPreview?.startsWith('blob:')) URL.revokeObjectURL(avatarPreview)
      setAvatarPreview(url)
    } catch {
      // error silencioso — no interrumpe el resto del modal
    } finally {
      setSubiendoAvatar(false)
    }
  }

  async function onSubmit(data: PwdForm) {
    setGuardando(true)
    setErrorMsg(null)
    try {
      await changePassword({
        passwordActual: data.passwordActual,
        passwordNuevo:  data.passwordNuevo,
      })
      setExito(true)
      reset()
    } catch {
      setErrorMsg('Contraseña actual incorrecta o error del servidor.')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-white text-[#111111]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[#111111]">
            <User className="h-4 w-4" />MI PERFIL
          </DialogTitle>
          <DialogDescription className="text-[#666666]">Información de tu cuenta y cambio de contraseña.</DialogDescription>
        </DialogHeader>

        {empleado && (
          <div className="flex flex-col items-center gap-3 py-2">
            <div className="relative">
              <Avatar
                src={avatarPreview ?? empleado.avatarUrl}
                nombre={empleado.nombre}
                size="lg"
                rol={empleado.rol}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 flex h-6 w-6 items-center justify-center rounded-full bg-white border border-gray-300 shadow-sm hover:bg-gray-50 transition-colors"
                aria-label="Cambiar foto de perfil"
              >
                <Camera className="h-3.5 w-3.5 text-[#374151]" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".jpg,.jpeg,.png,.webp"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  if (avatarPreview?.startsWith('blob:')) URL.revokeObjectURL(avatarPreview)
                  setAvatarFile(file)
                  setAvatarPreview(URL.createObjectURL(file))
                }}
              />
            </div>
            {avatarFile && (
              <button
                type="button"
                disabled={subiendoAvatar}
                onClick={handleGuardarAvatar}
                className="text-xs text-[#CC0000] font-medium hover:underline disabled:opacity-50"
              >
                {subiendoAvatar ? 'Guardando...' : 'Guardar foto'}
              </button>
            )}
            <div className="text-center space-y-0.5">
              <p className="font-semibold text-[#111111]">{empleado.nombre}</p>
              <p className="text-xs text-[#666666]">{empleado.email}</p>
            </div>
            <span className={cn('rounded-full px-3 py-0.5 text-xs font-semibold capitalize', ROL_BADGE[empleado.rol])}>
              {empleado.rol}
            </span>
            {empleado.sucursalId && (
              <p className="text-xs text-[#666666]">Sucursal #{empleado.sucursalId}</p>
            )}
          </div>
        )}

        <Separator />

        <p className="text-xs font-medium text-[#374151] uppercase tracking-wider flex items-center gap-1">
          <KeyRound className="h-3 w-3" />Cambiar contraseña
        </p>

        {exito && (
          <div role="status" className="rounded-md border border-green-200 bg-green-50 p-2.5 text-xs text-green-700">
            Contraseña actualizada correctamente.
          </div>
        )}
        {errorMsg && (
          <div role="alert" className="rounded-md border border-red-200 bg-red-50 p-2.5 text-xs text-red-600">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="pwd-actual">Contraseña actual <span className="text-racing" aria-hidden>*</span></Label>
            <div className="relative">
              <Input
                id="pwd-actual"
                type={mostrarActual ? 'text' : 'password'}
                className="pr-9 bg-[#F9FAFB] border-[#D1D5DB] text-[#111111] placeholder:text-[#9CA3AF]"
                {...register('passwordActual')}
                aria-invalid={!!errors.passwordActual}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#374151]"
                onClick={() => setMostrarActual((p) => !p)}
                aria-label={mostrarActual ? 'Ocultar' : 'Mostrar'}
              >
                {mostrarActual ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.passwordActual && (
              <p role="alert" className="text-xs text-red-500">{errors.passwordActual.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="pwd-nuevo">Nueva contraseña <span className="text-racing" aria-hidden>*</span></Label>
            <div className="relative">
              <Input
                id="pwd-nuevo"
                type={mostrarNuevo ? 'text' : 'password'}
                className="pr-9 bg-[#F9FAFB] border-[#D1D5DB] text-[#111111] placeholder:text-[#9CA3AF]"
                {...register('passwordNuevo')}
                aria-invalid={!!errors.passwordNuevo}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#374151]"
                onClick={() => setMostrarNuevo((p) => !p)}
                aria-label={mostrarNuevo ? 'Ocultar' : 'Mostrar'}
              >
                {mostrarNuevo ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.passwordNuevo && (
              <p role="alert" className="text-xs text-red-500">{errors.passwordNuevo.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="pwd-confirm">Confirmar contraseña <span className="text-racing" aria-hidden>*</span></Label>
            <Input
              id="pwd-confirm"
              type="password"
              className="bg-[#F9FAFB] border-[#D1D5DB] text-[#111111] placeholder:text-[#9CA3AF]"
              {...register('confirmarPassword')}
              aria-invalid={!!errors.confirmarPassword}
            />
            {errors.confirmarPassword && (
              <p role="alert" className="text-xs text-red-500">{errors.confirmarPassword.message}</p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="secondary" onClick={handleClose} className="bg-white border border-[#D1D5DB] text-[#374151] hover:bg-gray-50">Cerrar</Button>
            <Button type="submit" disabled={guardando}>
              {guardando
                ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                : 'Cambiar contraseña'
              }
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function AdminSidebar({
  collapsed,
  onToggle,
  onPerfil,
}: {
  collapsed: boolean
  onToggle: () => void
  onPerfil: () => void
}) {
  const { empleado, clearEmpleado } = useAuthEmpleadoStore()
  const navigate = useNavigate()

  async function handleLogout() {
    try { await logoutEmpleado() } finally {
      clearEmpleado()
      navigate('/admin/login')
    }
  }

  return (
    <aside
      className={cn(
        'flex flex-col border-r border-gray-200 bg-white transition-all duration-200',
        collapsed ? 'w-16' : 'w-64'
      )}
      aria-label="Navegación de administración"
    >
      {/* Logo + colapso */}
      <div className="flex h-16 items-center justify-between px-3 border-b border-gray-200 shrink-0 ">
        {!collapsed && (
          <div className="flex items-center gap-6 overflow-hidden">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center ml-3.5">
              <img src={assets.logo} alt="MotoGest" aria-hidden className="h-11 w-11 object-contain"/>
            </div>
            <span className="  font-display text-base tracking-wider text-[#111111] truncate">
              MOTOGEST PRO
            </span>
          </div>
        )}
        {collapsed && (
          <div className="flex h-11 w-11 mx-auto items-center justify-center">
            <img src={assets.logo} alt="MotoGest" className="h-11 w-11 object-contain" />
          </div>
        )}
        {!collapsed && (
          <button
            onClick={onToggle}
            aria-label="Colapsar sidebar"
            className="shrink-0 p-1.5 rounded-md text-[#666666] hover:text-[#111111] hover:bg-gray-100 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        )}
      </div>

      {collapsed && (
        <button
          onClick={onToggle}
          aria-label="Expandir sidebar"
          className="mx-auto mt-2 p-1.5 rounded-md text-[#666666] hover:text-[#111111] hover:bg-gray-100 transition-colors"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      )}

      {/* Navegación */}
      <ScrollArea className="flex-1 py-4">
        <nav className="flex flex-col gap-0.5 px-2">
          <p className="px-3 pb-2 text-[9px] font-semibold uppercase tracking-widest text-[#9CA3AF]">
            MAIN MENU
          </p>
          {NAV_ITEMS.filter(({ roles }) => !empleado?.rol || roles.includes(empleado.rol)).map(({ to, icon: Icon, label, exact }) => (
            <div key={to} className="relative group">
              <NavLink
                to={to}
                end={exact}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-[#CC0000] text-white'
                      : 'text-[#666666] hover:bg-[#FEF2F2] hover:text-[#CC0000]'
                  )
                }
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden />
                {!collapsed && <span className="truncate">{label}</span>}
              </NavLink>
              {collapsed && (
                <span className="pointer-events-none absolute left-full top-1/2 ml-2 -translate-y-1/2 rounded bg-[#111111] px-2 py-1 text-xs text-white whitespace-nowrap opacity-0 transition-opacity group-hover:opacity-100 z-50">
                  {label}
                </span>
              )}
            </div>
          ))}
        </nav>
      </ScrollArea>

      {/* Usuario */}
      <div className="border-t border-gray-200 p-3 shrink-0">
        {!collapsed && empleado && (
          <button
            className="w-full mb-3 rounded-md bg-gray-50 p-2 text-left hover:bg-gray-100 transition-colors"
            onClick={onPerfil}
            aria-label="Abrir perfil"
          >
            <div className="flex items-center gap-2">
              <Avatar
                src={empleado.avatarUrl}
                nombre={empleado.nombre}
                size="sm"
                rol={empleado.rol}
                className="shrink-0"
              />
              <div className="min-w-0">
                <p className="text-xs font-medium text-[#111111] truncate">{empleado.nombre}</p>
                <p className="text-xs text-[#666666] capitalize">{empleado.rol}</p>
              </div>
            </div>
          </button>
        )}
        {collapsed && (
          <button
            className="w-full mb-2 flex items-center justify-center rounded-md p-1 hover:bg-gray-100 transition-colors"
            onClick={onPerfil}
            aria-label="Abrir perfil"
          >
            <Avatar
              src={empleado?.avatarUrl}
              nombre={empleado?.nombre ?? ''}
              size="sm"
              rol={empleado?.rol}
            />
          </button>
        )}
        <button
          className={cn(
            'w-full flex items-center rounded-md px-3 py-2 text-sm font-medium text-[#666666] hover:text-[#CC0000] hover:bg-[#FEF2F2] transition-colors',
            collapsed ? 'justify-center' : 'justify-start'
          )}
          onClick={handleLogout}
          aria-label="Cerrar sesión"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && <span className="ml-2">Cerrar sesión</span>}
        </button>
      </div>
    </aside>
  )
}

function AdminTopbar() {
  const { token } = useAuthEmpleadoStore()
  const [notifs, setNotifs]       = useState<Notificacion[]>([])
  const [panelOpen, setPanelOpen] = useState(false)

  useEffect(() => {
    if (!token) return

    async function cargar() {
      try {
        const data = await getNotificaciones()
        setNotifs(data)
      } catch {
        // Silencioso — no romper el layout si falla
      }
    }
    cargar()
    const interval = setInterval(cargar, 60_000)
    return () => clearInterval(interval)
  }, [token])

  async function handleMarcar(id: string) {
    await marcarLeida(id)
    setNotifs((prev) => prev.map((n) => (n.id === id ? { ...n, leida: true } : n)))
  }

  async function handleMarcarTodas() {
    await marcarTodasLeidas()
    setNotifs((prev) => prev.map((n) => ({ ...n, leida: true })))
  }

  const noLeidas = notifs.filter((n) => !n.leida).length

  return (
    <header className="flex h-16 items-center justify-between border-b border-[#E5E7EB] bg-white px-6 shrink-0">
      <div />
      <div className="relative flex items-center gap-2">
        <button
          className="relative p-2 rounded-md text-[#374151] hover:bg-[#F3F4F6] transition-colors"
          onClick={() => setPanelOpen((o) => !o)}
          aria-label={
            noLeidas > 0
              ? `${noLeidas} notificaciones sin leer`
              : 'Sin notificaciones nuevas'
          }
          aria-expanded={panelOpen}
          aria-haspopup="dialog"
        >
          <Bell className="h-5 w-5" />
          {noLeidas > 0 && (
            <span
              className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#CC0000] text-[10px] font-bold text-white"
              aria-hidden
            >
              {noLeidas > 9 ? '9+' : noLeidas}
            </span>
          )}
        </button>

        {panelOpen && (
          <NotificacionesPanel
            notifs={notifs}
            onMarcar={handleMarcar}
            onMarcarTodas={handleMarcarTodas}
            onCerrar={() => setPanelOpen(false)}
          />
        )}
      </div>
    </header>
  )
}

export default function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const [perfilOpen, setPerfilOpen] = useState(false)

  return (
    <div className="flex h-dvh overflow-hidden bg-[#F5F5F5]">
      <AdminSidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((c) => !c)}
        onPerfil={() => setPerfilOpen(true)}
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        <AdminTopbar />
        <main className="flex-1 overflow-y-auto p-6 bg-[#F5F5F5]">
          <Outlet />
        </main>
      </div>
      <PerfilModal open={perfilOpen} onClose={() => setPerfilOpen(false)} />
    </div>
  )
}

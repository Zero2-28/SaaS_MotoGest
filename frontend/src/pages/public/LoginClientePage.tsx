import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Eye, EyeOff, CheckCircle, ShieldCheck, Store, UserCog, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import axios from 'axios'
import { loginCliente } from '@/services/auth.service'
import { useAuthClienteStore } from '@/stores/auth.store'
import { assets } from '@/config/assets'
import { GoogleIcon } from '@/components/GoogleIcon'
import {
  Dialog, DialogContent, DialogTitle, DialogDescription,
} from '@/components/ui/dialog'

const schema = z.object({
  email:    z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
})

type FormData = z.infer<typeof schema>

export default function LoginClientePage() {
  const [showPass, setShowPass] = useState(false)
  const [equipoOpen, setEquipoOpen] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)
  const { setCliente } = useAuthClienteStore()
  const navigate = useNavigate()
  const location = useLocation()

  // Mensaje de éxito enviado desde RegisterPage vía router state
  const mensajeExito = (location.state as { mensaje?: string } | null)?.mensaje ?? null

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  async function onSubmit({ email, password }: FormData) {
    setApiError(null)
    try {
      const { cliente, token, refreshToken } = await loginCliente(email, password)
      setCliente(cliente, token, refreshToken)
      const from = (location.state as { from?: string } | null)?.from ?? '/catalogo'
      navigate(from, { replace: true })
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && !err.response) {
        setApiError('Error de conexión, intenta de nuevo')
      } else {
        setApiError('Email o contraseña incorrectos')
      }
    }
  }

  return (
    <div className="flex min-h-[calc(100dvh-4rem)]">

      <div className="relative hidden lg:block lg:w-1/2" aria-hidden>
        <img
          src={assets.carousel[0]}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          loading="eager"
        />
        <div className="absolute inset-0 bg-brand/80" />
        <div className="relative flex h-full flex-col items-center justify-center gap-5 px-12 text-center">
          <img
            src={assets.logo}
            alt=""
            className="h-16 w-auto"
            style={{ borderRadius: 10 }}
          />
          <h2 className="text-3xl font-bold text-white leading-tight">
            Bienvenido de vuelta
          </h2>
          <p className="text-base text-white/80">
            Tu tienda de accesorios para motos
          </p>
        </div>
      </div>

      <div className="flex w-full lg:w-1/2 items-center justify-center bg-white px-8 py-12">
        <div className="w-full max-w-sm">

          <div className="mb-8 flex justify-center lg:hidden">
            <img src={assets.logo} alt="RE MOTOS" className="h-11 w-auto rounded-md" />
          </div>

          <h1 className="text-2xl font-bold text-ink mb-1">Iniciar sesión</h1>
          <p className="text-sm text-chrome-600 mb-8">Accede a tu cuenta</p>

          {mensajeExito && (
            <div
              role="status"
              className="mb-5 flex items-center gap-2 rounded-lg border border-success-100 bg-success-50 px-4 py-3 text-sm text-success-700"
            >
              <CheckCircle className="h-4 w-4 shrink-0" aria-hidden />
              {mensajeExito}
            </div>
          )}

          {apiError && (
            <div role="alert" className="mb-5 rounded-lg border border-danger-100 bg-danger-50 px-4 py-3 text-sm text-danger-600">
              {apiError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
              <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-sm font-medium text-ink">
                Correo electrónico <span aria-hidden className="text-brand">*</span>
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="tu@correo.com"
                {...register('email')}
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? 'email-error' : undefined}
                className="h-12 w-full rounded-lg border border-chrome-200 bg-white px-4 text-sm text-ink placeholder:text-chrome-400 outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-brand/20 aria-[invalid=true]:border-danger"
              />
              {errors.email && (
                <p id="email-error" role="alert" className="text-xs text-danger">{errors.email.message}</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-sm font-medium text-ink">
                Contraseña <span aria-hidden className="text-brand">*</span>
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPass ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  {...register('password')}
                  aria-invalid={!!errors.password}
                  aria-describedby={errors.password ? 'password-error' : undefined}
                  className="h-12 w-full rounded-lg border border-chrome-200 bg-white px-4 pr-11 text-sm text-ink placeholder:text-chrome-400 outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-brand/20 aria-[invalid=true]:border-danger"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-chrome-400 hover:text-chrome-700 transition-colors"
                  onClick={() => setShowPass((s) => !s)}
                  aria-label={showPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <p id="password-error" role="alert" className="text-xs text-danger">{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex h-12 w-full items-center justify-center rounded-lg bg-brand text-sm font-semibold text-white transition-colors hover:bg-brand-900 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                'Iniciar sesión'
              )}
            </button>
          </form>

          <div className="my-6 flex items-center gap-4">
            <div className="flex-1 border-t border-chrome-200" />
            <span className="text-xs text-chrome-400">o continúa con</span>
            <div className="flex-1 border-t border-chrome-200" />
          </div>

          <button
            type="button"
            onClick={() => { window.location.href = `${import.meta.env.VITE_API_URL}/auth/google/cliente` }}
            className="flex h-12 w-full items-center justify-center gap-3 rounded-lg border border-chrome-200 bg-white text-sm font-medium text-ink transition-colors hover:bg-chrome-50"
          >
            <GoogleIcon />
            Continuar con Google
          </button>

          {/* Acceso al panel interno — pregunta el rol antes de redirigir */}
          <button
            type="button"
            onClick={() => setEquipoOpen(true)}
            className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-lg border border-brand-200 bg-brand-50 text-sm font-semibold text-brand-800 transition-colors hover:border-brand-400 hover:bg-brand-100"
          >
            <ShieldCheck className="h-4 w-4" aria-hidden />
            Soy del equipo — ir al panel
          </button>

          <p className="mt-6 text-center text-sm text-chrome-600">
            ¿No tienes cuenta?{' '}
            <Link to="/register" className="font-semibold text-brand hover:underline">
              Registrarte
            </Link>
          </p>
        </div>
      </div>

      {/* ── Diálogo: ¿con qué rol entras al panel? ───────────────────────── */}
      <Dialog open={equipoOpen} onOpenChange={setEquipoOpen}>
        <DialogContent className="max-w-lg overflow-hidden p-0 [&>button]:top-5 [&>button]:text-brand-300 [&>button]:hover:bg-white/10 [&>button]:hover:text-white">

          {/* Cabecera metalizada con el logo */}
          <div className="edge-chrome bg-brand-950 px-8 py-8 text-center">
            <img
              src={assets.logo}
              alt="RE MOTOS"
              className="mx-auto h-12 w-auto rounded-md"
            />
            <DialogTitle className="mt-5 text-2xl text-white">
              ¿Cómo vas a ingresar?
            </DialogTitle>
            <DialogDescription className="mx-auto mt-2 max-w-sm text-sm text-brand-200">
              El panel interno es solo para el personal de la tienda.
              Elige tu rol para continuar.
            </DialogDescription>
          </div>

          {/* Opciones de rol */}
          <div className="flex flex-col gap-3 px-8 py-7">
            <button
              type="button"
              onClick={() => navigate('/admin/login?rol=admin')}
              className="group flex items-center gap-4 rounded-xl border border-chrome-200 bg-white p-4 text-left shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-400 hover:shadow-card-md"
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-metal-btn text-white shadow-metal">
                <UserCog className="h-6 w-6" aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-base font-semibold text-ink">Administrador</span>
                <span className="block text-sm text-chrome-500">
                  Acceso completo: reportes, empleados y configuración
                </span>
              </span>
              <ChevronRight
                className="h-5 w-5 shrink-0 text-chrome-300 transition-all group-hover:translate-x-0.5 group-hover:text-brand-600"
                aria-hidden
              />
            </button>

            <button
              type="button"
              onClick={() => navigate('/admin/login?rol=vendedor')}
              className="group flex items-center gap-4 rounded-xl border border-chrome-200 bg-white p-4 text-left shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:border-turbo-300 hover:shadow-card-md"
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-turbo text-white shadow-turbo">
                <Store className="h-6 w-6" aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-base font-semibold text-ink">Vendedor</span>
                <span className="block text-sm text-chrome-500">
                  Punto de venta, inventario y pedidos
                </span>
              </span>
              <ChevronRight
                className="h-5 w-5 shrink-0 text-chrome-300 transition-all group-hover:translate-x-0.5 group-hover:text-turbo-600"
                aria-hidden
              />
            </button>
          </div>

          {/* Pie */}
          <div className="border-t border-chrome-100 bg-mist px-8 py-4">
            <p className="text-center text-xs text-chrome-500">
              ¿Eres cliente?{' '}
              <button
                type="button"
                onClick={() => setEquipoOpen(false)}
                className="font-semibold text-brand-600 underline-offset-4 hover:underline"
              >
                Volver al inicio de sesión
              </button>
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

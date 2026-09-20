import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate, Navigate, useSearchParams } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'
import { loginEmpleado } from '@/services/auth.service'
import { useAuthEmpleadoStore } from '@/stores/auth.store'
import { assets } from '@/config/assets'
import { GoogleIcon } from '@/components/GoogleIcon'

const schema = z.object({
  email:    z.string().email('Email inválido'),
  password: z.string().min(1, 'Ingresa tu contraseña'),
})

type FormData = z.infer<typeof schema>

export default function AdminLoginPage() {
  const [showPass, setShowPass] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)
  const { setEmpleado, isAuthenticated } = useAuthEmpleadoStore()
  const navigate = useNavigate()
  // Rol elegido en el diálogo del login de clientes — solo informativo:
  // el backend decide los permisos reales a partir del usuario.
  const [searchParams] = useSearchParams()
  const rolSugerido = searchParams.get('rol')
  const etiquetaRol =
    rolSugerido === 'admin' ? 'Administrador' :
    rolSugerido === 'vendedor' ? 'Vendedor' : null

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  if (isAuthenticated) return <Navigate to="/admin" replace />

  async function onSubmit({ email, password }: FormData) {
    setApiError(null)
    try {
      const { empleado, token, refreshToken } = await loginEmpleado(email, password)
      setEmpleado(empleado, token, refreshToken)
      navigate('/admin')
    } catch {
      setApiError('Credenciales incorrectas. Contacta al administrador si persiste el problema.')
    }
  }

  return (
    <div className="flex min-h-dvh">

      {/* Columna izquierda — imagen + overlay (solo desktop) */}
      <div className="relative hidden lg:block lg:w-1/2" aria-hidden>
        <img
          src={assets.carousel[4]}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          loading="eager"
        />
        <div className="absolute inset-0 bg-brand/80" />
        <div className="relative flex h-full flex-col items-center justify-center gap-5 px-12 text-center">
          <img
            src={assets.logo}
            alt=""
            className="h-16 w-auto rounded-lg shadow-metal-lg"
          />
          <h2 className="text-3xl font-bold text-white leading-tight">
            Panel Administrativo
          </h2>
          <p className="text-base text-white/80">
            RE MOTOS — Gestión interna
          </p>
        </div>
      </div>

      {/* Columna derecha — formulario */}
      <div className="flex w-full lg:w-1/2 items-center justify-center bg-white px-8 py-12">
        <div className="w-full max-w-sm">

          {/* Logo mobile */}
          <div className="mb-8 flex justify-center lg:hidden">
            <img src={assets.logo} alt="RE MOTOS" className="h-11 w-auto rounded-md" />
          </div>

          {etiquetaRol && (
            <span className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-brand-100 bg-brand-50 px-2.5 py-0.5 text-xs font-semibold text-brand-800">
              Ingreso como {etiquetaRol}
            </span>
          )}

          <h1 className="text-2xl font-bold text-ink mb-1">Iniciar sesión</h1>
          <p className="text-sm text-chrome-600 mb-8">Accede al panel de administración</p>

          {apiError && (
            <div role="alert" className="mb-5 rounded-lg border border-danger-100 bg-danger-50 px-4 py-3 text-sm text-danger-600">
              {apiError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-sm font-medium text-ink">
                Email <span aria-hidden className="text-brand">*</span>
              </label>
              <input
                id="email"
                type="email"
                autoComplete="username"
                placeholder="empleado@calletuning.pe"
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
                  aria-describedby={errors.password ? 'pass-error' : undefined}
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
                <p id="pass-error" role="alert" className="text-xs text-danger">{errors.password.message}</p>
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
                'Ingresar'
              )}
            </button>
          </form>

          <div className="my-6 flex items-center gap-4">
            <div className="flex-1 border-t border-chrome-200" />
            <span className="text-xs text-chrome-400">o continúa con</span>
            <div className="flex-1 border-t border-chrome-200" />
          </div>

          {/* OAuth Google — solo vincula empleados ya existentes en BD */}
          <button
            type="button"
            onClick={() => { window.location.href = `${import.meta.env.VITE_API_URL}/auth/google` }}
            className="flex h-12 w-full items-center justify-center gap-3 rounded-lg border border-chrome-200 bg-white text-sm font-medium text-ink transition-colors hover:bg-chrome-50"
          >
            <GoogleIcon />
            Continuar con Google
          </button>

          <p className="mt-8 text-center text-xs text-chrome-400">
            Acceso exclusivo para personal autorizado
          </p>
        </div>
      </div>
    </div>
  )
}

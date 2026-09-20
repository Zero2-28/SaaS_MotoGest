import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Eye, EyeOff, CheckCircle } from 'lucide-react'
import { useState } from 'react'
import axios from 'axios'
import { loginCliente } from '@/services/auth.service'
import { useAuthClienteStore } from '@/stores/auth.store'
import { assets } from '@/config/assets'
import { GoogleIcon } from '@/components/GoogleIcon'

const schema = z.object({
  email:    z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
})

type FormData = z.infer<typeof schema>

export default function LoginClientePage() {
  const [showPass, setShowPass] = useState(false)
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

          <p className="mt-6 text-center text-sm text-chrome-600">
            ¿No tienes cuenta?{' '}
            <Link to="/register" className="font-semibold text-brand hover:underline">
              Registrarte
            </Link>
          </p>

          <div className="mt-6 border-t border-chrome-100 pt-5">
            <p className="text-center text-xs text-chrome-400">
              ¿Eres del equipo?{' '}
              <Link
                to="/admin/login"
                className="text-chrome-400 underline transition-colors hover:text-chrome-600"
              >
                Acceso administrativo
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

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
        <div className="absolute inset-0 bg-[#CC0000]/80" />
        <div className="relative flex h-full flex-col items-center justify-center gap-5 px-12 text-center">
          <img
            src={assets.logo}
            alt=""
            className="h-16 w-auto"
            style={{ filter: 'brightness(0) invert(1)' }}
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
            <img src={assets.logo} alt="CALLE TUNING" className="h-10 w-auto" />
          </div>

          <h1 className="text-2xl font-bold text-[#111111] mb-1">Iniciar sesión</h1>
          <p className="text-sm text-[#666666] mb-8">Accede a tu cuenta</p>

          {mensajeExito && (
            <div
              role="status"
              className="mb-5 flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700"
            >
              <CheckCircle className="h-4 w-4 shrink-0" aria-hidden />
              {mensajeExito}
            </div>
          )}

          {apiError && (
            <div role="alert" className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {apiError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
              <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-sm font-medium text-[#111111]">
                Correo electrónico <span aria-hidden className="text-[#CC0000]">*</span>
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="tu@correo.com"
                {...register('email')}
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? 'email-error' : undefined}
                className="h-12 w-full rounded-lg border border-[#D1D5DB] bg-white px-4 text-sm text-[#111111] placeholder:text-gray-400 outline-none transition-colors focus:border-[#CC0000] focus:ring-2 focus:ring-[#CC0000]/20 aria-[invalid=true]:border-red-400"
              />
              {errors.email && (
                <p id="email-error" role="alert" className="text-xs text-red-500">{errors.email.message}</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-sm font-medium text-[#111111]">
                Contraseña <span aria-hidden className="text-[#CC0000]">*</span>
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
                  className="h-12 w-full rounded-lg border border-[#D1D5DB] bg-white px-4 pr-11 text-sm text-[#111111] placeholder:text-gray-400 outline-none transition-colors focus:border-[#CC0000] focus:ring-2 focus:ring-[#CC0000]/20 aria-[invalid=true]:border-red-400"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors"
                  onClick={() => setShowPass((s) => !s)}
                  aria-label={showPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <p id="password-error" role="alert" className="text-xs text-red-500">{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex h-12 w-full items-center justify-center rounded-lg bg-[#CC0000] text-sm font-semibold text-white transition-colors hover:bg-[#AA0000] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                'Iniciar sesión'
              )}
            </button>
          </form>

          <div className="my-6 flex items-center gap-4">
            <div className="flex-1 border-t border-[#D1D5DB]" />
            <span className="text-xs text-[#999999]">o continúa con</span>
            <div className="flex-1 border-t border-[#D1D5DB]" />
          </div>

          <button
            type="button"
            onClick={() => { window.location.href = `${import.meta.env.VITE_API_URL}/auth/google/cliente` }}
            className="flex h-12 w-full items-center justify-center gap-3 rounded-lg border border-[#D1D5DB] bg-white text-sm font-medium text-[#111111] transition-colors hover:bg-gray-50"
          >
            <GoogleIcon />
            Continuar con Google
          </button>

          <p className="mt-6 text-center text-sm text-[#666666]">
            ¿No tienes cuenta?{' '}
            <Link to="/register" className="font-semibold text-[#CC0000] hover:underline">
              Registrarte
            </Link>
          </p>

          <div className="mt-6 border-t border-gray-100 pt-5">
            <p className="text-center text-xs text-gray-400">
              ¿Eres del equipo?{' '}
              <Link
                to="/admin/login"
                className="text-gray-400 underline transition-colors hover:text-gray-600"
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

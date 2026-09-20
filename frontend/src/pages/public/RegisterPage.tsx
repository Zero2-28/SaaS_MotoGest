import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'
import axios from 'axios'
import { registerCliente } from '@/services/auth.service'
import { assets } from '@/config/assets'
import { GoogleIcon } from '@/components/GoogleIcon'

const schema = z.object({
  nombre:   z.string().min(2, 'Mínimo 2 caracteres'),
  email:    z.string().email('Email inválido'),
  telefono: z.string().optional(),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
})

type FormData = z.infer<typeof schema>

function evaluarFortaleza(pwd: string): { nivel: 0 | 1 | 2 | 3; label: string } {
  if (!pwd) return { nivel: 0, label: '' }
  let score = 0
  if (pwd.length >= 8) score++
  if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score++
  if (/\d/.test(pwd)) score++
  if (/[^A-Za-z0-9]/.test(pwd)) score++
  if (score <= 1) return { nivel: 1, label: 'Débil' }
  if (score <= 2) return { nivel: 2, label: 'Media' }
  return { nivel: 3, label: 'Fuerte' }
}

function barColor(nivel: 0 | 1 | 2 | 3, bar: 1 | 2 | 3): string {
  if (nivel < bar) return 'bg-chrome-200'
  if (nivel === 1) return 'bg-danger'
  if (nivel === 2) return 'bg-turbo-400'
  return 'bg-success'
}

function labelColor(nivel: 0 | 1 | 2 | 3): string {
  if (nivel === 1) return 'text-danger'
  if (nivel === 2) return 'text-turbo-400'
  if (nivel === 3) return 'text-success-600'
  return ''
}

export default function RegisterPage() {
  const [showPass, setShowPass] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)
  const [pwdValue, setPwdValue] = useState('')
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  async function onSubmit({ nombre, email, password, telefono }: FormData) {
    setApiError(null)
    try {
      await registerCliente({ nombre, email, password, telefono })
      navigate('/login', { state: { mensaje: '¡Cuenta creada! Inicia sesión para continuar.' } })
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        if (!err.response) {
          setApiError('Error de conexión, intenta de nuevo')
        } else if (err.response.status === 409) {
          setApiError('Este email ya está en uso')
        } else {
          setApiError('No se pudo crear la cuenta. Intenta de nuevo.')
        }
      } else {
        setApiError('Error de conexión, intenta de nuevo')
      }
    }
  }

  const { nivel, label } = evaluarFortaleza(pwdValue)
  const passwordField = register('password')

  return (
    <div className="flex min-h-[calc(100dvh-4rem)]">

      <div className="relative hidden lg:block lg:w-1/2" aria-hidden>
        <img
          src={assets.carousel[2]}
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
            Únete a RE MOTOS
          </h2>
          <p className="text-base text-white/80">
            Accede a los mejores accesorios para tu moto
          </p>
        </div>
      </div>

      <div className="flex w-full lg:w-1/2 items-center justify-center bg-white px-8 py-12">
        <div className="w-full max-w-sm">

          <div className="mb-8 flex justify-center lg:hidden">
            <img src={assets.logo} alt="RE MOTOS" className="h-11 w-auto rounded-md" />
          </div>

          <h1 className="text-2xl font-bold text-ink mb-1">Crear cuenta</h1>
          <p className="text-sm text-chrome-600 mb-8">Completa tus datos</p>

          {apiError && (
            <div role="alert" className="mb-5 rounded-lg border border-danger-100 bg-danger-50 px-4 py-3 text-sm text-danger-600">
              {apiError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
            {/* Nombre */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="nombre" className="text-sm font-medium text-ink">
                Nombre completo <span aria-hidden className="text-brand">*</span>
              </label>
              <input
                id="nombre"
                autoComplete="name"
                placeholder="Tu nombre completo"
                {...register('nombre')}
                aria-invalid={!!errors.nombre}
                aria-describedby={errors.nombre ? 'nombre-error' : undefined}
                className="h-12 w-full rounded-lg border border-chrome-200 bg-white px-4 text-sm text-ink placeholder:text-chrome-400 outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-brand/20 aria-[invalid=true]:border-danger"
              />
              {errors.nombre && (
                <p id="nombre-error" role="alert" className="text-xs text-danger">{errors.nombre.message}</p>
              )}
            </div>

            {/* Email */}
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
              <label htmlFor="telefono" className="text-sm font-medium text-ink">
                Teléfono{' '}
                <span className="font-normal text-chrome-600">(opcional)</span>
              </label>
              <input
                id="telefono"
                type="tel"
                autoComplete="tel"
                inputMode="numeric"
                placeholder="+51 999 999 999"
                {...register('telefono')}
                className="h-12 w-full rounded-lg border border-chrome-200 bg-white px-4 text-sm text-ink placeholder:text-chrome-400 outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-brand/20"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-sm font-medium text-ink">
                Contraseña <span aria-hidden className="text-brand">*</span>
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPass ? 'text' : 'password'}
                  autoComplete="new-password"
                  {...passwordField}
                  onChange={(e) => {
                    setPwdValue(e.target.value)
                    void passwordField.onChange(e)
                  }}
                  aria-invalid={!!errors.password}
                  aria-describedby={errors.password ? 'pass-error' : 'pass-strength'}
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

              {pwdValue.length > 0 && (
                <div id="pass-strength" className="flex items-center gap-2">
                  <div className="flex flex-1 gap-1">
                    {([1, 2, 3] as const).map((bar) => (
                      <div
                        key={bar}
                        className={`h-1.5 flex-1 rounded-full transition-colors ${barColor(nivel, bar)}`}
                      />
                    ))}
                  </div>
                  <span className={`text-xs font-medium ${labelColor(nivel)}`}>{label}</span>
                </div>
              )}

              {errors.password && (
                <p id="pass-error" role="alert" className="text-xs text-danger">{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-1 flex h-12 w-full items-center justify-center rounded-lg bg-brand text-sm font-semibold text-white transition-colors hover:bg-brand-900 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                'Crear cuenta'
              )}
            </button>
          </form>

          <div className="my-6 flex items-center gap-4">
            <div className="flex-1 border-t border-chrome-200" />
            <span className="text-xs text-chrome-400">o regístrate con</span>
            <div className="flex-1 border-t border-chrome-200" />
          </div>

          <button
            type="button"
            onClick={() => { window.location.href = `${import.meta.env.VITE_API_URL}/auth/google/cliente` }}
            className="flex h-12 w-full items-center justify-center gap-3 rounded-lg border border-chrome-200 bg-white text-sm font-medium text-ink transition-colors hover:bg-chrome-50"
          >
            <GoogleIcon />
            Registrarse con Google
          </button>

          <p className="mt-6 text-center text-sm text-chrome-600">
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" className="font-semibold text-brand hover:underline">
              Iniciar sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

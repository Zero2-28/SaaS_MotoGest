import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import type { ApiError } from '@/types'
import { useAuthEmpleadoStore, useAuthClienteStore } from '@/stores/auth.store'

// Claves de localStorage — deben coincidir con auth.store.ts
const EMPLEADO_TOKEN_KEY         = 'token'
const EMPLEADO_REFRESH_TOKEN_KEY = 'refreshToken'
const CLIENTE_TOKEN_KEY          = 'cliente-token'
const CLIENTE_REFRESH_TOKEN_KEY  = 'cliente-refreshToken'

// ── Instancia base ────────────────────────────────────────────────────────────
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

// ── Request interceptor: adjunta el token al header ───────────────────────────
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem(EMPLEADO_TOKEN_KEY)
    // No sobreescribir si el llamante ya inyectó un token (ej. cliente en checkout)
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// ── Flag para evitar múltiples refreshes en paralelo ─────────────────────────
let isRefreshing = false
let failedQueue: Array<{
  resolve: (token: string) => void
  reject: (err: unknown) => void
}> = []

function processQueue(error: unknown, token: string | null) {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error)
    else if (token) resolve(token)
  })
  failedQueue = []
}

// ── Response interceptor: desempaqueta { success, data } y maneja 401 ─────────
api.interceptors.response.use(
  (response) => {
    // El backend siempre responde { success: true, data: T } — extraer el payload
    if (
      response.data !== null &&
      typeof response.data === 'object' &&
      response.data.success === true &&
      Object.prototype.hasOwnProperty.call(response.data, 'data')
    ) {
      response.data = response.data.data
    }
    return response
  },
  async (error: AxiosError<ApiError>) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

    // Un 401 en los endpoints de autenticación significa credenciales inválidas,
    // no sesión expirada. Si entrara al flujo de refresh acabaría en
    // window.location.href, que recarga la página y borra el formulario antes
    // de que este pueda mostrar el error al usuario.
    const ENDPOINTS_AUTH = ['/auth/login', '/clientes/login', '/auth/refresh', '/clientes/refresh']
    const esEndpointAuth = ENDPOINTS_AUTH.some((ruta) => original?.url?.includes(ruta))

    // Solo intentar refresh en 401, y solo una vez por request
    if (error.response?.status === 401 && !original._retry && !esEndpointAuth) {
      if (isRefreshing) {
        // Encolar mientras se está renovando.
        // FIX: marcar _retry en el config encolado para que el reintento no
        // vuelva a entrar al interceptor si también recibe un 401.
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then((token) => {
          original._retry = true
          original.headers.Authorization = `Bearer ${token}`
          return api(original)
        })
      }

      original._retry = true
      isRefreshing = true

      // Determinar si la petición fallida usaba token de empleado o de cliente
      const authHeader = original.headers.Authorization as string | undefined
      const clienteToken = localStorage.getItem(CLIENTE_TOKEN_KEY)
      const esLlamadaCliente =
        authHeader != null &&
        clienteToken != null &&
        authHeader === `Bearer ${clienteToken}`

      if (esLlamadaCliente) {
        // ── Renovar token de CLIENTE ─────────────────────────────────────────
        const clienteRefreshToken = localStorage.getItem(CLIENTE_REFRESH_TOKEN_KEY)
        if (!clienteRefreshToken) {
          isRefreshing = false
          useAuthClienteStore.getState().clearCliente()
          processQueue(error, null)
          window.location.href = '/login'
          return Promise.reject(error)
        }
        try {
          const { data } = await axios.post<{ success: boolean; data: { accessToken: string } }>(
            `${import.meta.env.VITE_API_URL}/clientes/refresh`,
            { refreshToken: clienteRefreshToken }
          )
          const newToken = data.data.accessToken
          localStorage.setItem(CLIENTE_TOKEN_KEY, newToken)
          useAuthClienteStore.getState().patchClienteToken(newToken)
          processQueue(null, newToken)
          original.headers.Authorization = `Bearer ${newToken}`
          return api(original)
        } catch (refreshError) {
          processQueue(refreshError, null)
          useAuthClienteStore.getState().clearCliente()
          window.location.href = '/login'
          return Promise.reject(refreshError)
        } finally {
          isRefreshing = false
        }
      } else {
        // ── Renovar token de EMPLEADO ────────────────────────────────────────
        // FIX: solo remover tokens de empleado, nunca localStorage.clear()
        // para no borrar el estado de auth del cliente.
        const refreshToken = localStorage.getItem(EMPLEADO_REFRESH_TOKEN_KEY)
        if (!refreshToken) {
          isRefreshing = false
          useAuthEmpleadoStore.getState().clearEmpleado()
          processQueue(error, null)
          const esRutaAdmin = window.location.pathname.startsWith('/admin')
          window.location.href = esRutaAdmin ? '/admin/login' : '/login'
          return Promise.reject(error)
        }
        try {
          const { data } = await axios.post<{ success: boolean; data: { accessToken: string } }>(
            `${import.meta.env.VITE_API_URL}/auth/refresh`,
            { refreshToken }
          )
          const newToken = data.data.accessToken
          localStorage.setItem(EMPLEADO_TOKEN_KEY, newToken)
          processQueue(null, newToken)
          original.headers.Authorization = `Bearer ${newToken}`
          return api(original)
        } catch (refreshError) {
          processQueue(refreshError, null)
          useAuthEmpleadoStore.getState().clearEmpleado()
          const esRutaAdmin = window.location.pathname.startsWith('/admin')
          window.location.href = esRutaAdmin ? '/admin/login' : '/login'
          return Promise.reject(refreshError)
        } finally {
          isRefreshing = false
        }
      }
    }

    return Promise.reject(error)
  }
)

export default api

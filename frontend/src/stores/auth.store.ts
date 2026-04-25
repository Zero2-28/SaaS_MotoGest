import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Empleado, Cliente, RolEmpleado } from '@/types'

// ── Estado de autenticación de empleados ──────────────────────────────────────

interface AuthEmpleadoState {
  empleado: Empleado | null
  token: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  // Acciones
  setEmpleado: (empleado: Empleado, token: string, refreshToken: string) => void
  patchEmpleado: (patch: Partial<Empleado>) => void
  clearEmpleado: () => void
  hasRole: (roles: RolEmpleado[]) => boolean
}

export const useAuthEmpleadoStore = create<AuthEmpleadoState>()(
  persist(
    (set, get) => ({
      empleado: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,

      setEmpleado: (empleado, token, refreshToken) => {
        // Sincronizar con localStorage para el interceptor Axios
        localStorage.setItem('token', token)
        localStorage.setItem('refreshToken', refreshToken)
        set({ empleado, token, refreshToken, isAuthenticated: true })
      },

      patchEmpleado: (patch) => {
        set((state) => ({
          empleado: state.empleado ? { ...state.empleado, ...patch } : null,
        }))
      },

      clearEmpleado: () => {
        localStorage.removeItem('token')
        localStorage.removeItem('refreshToken')
        set({ empleado: null, token: null, refreshToken: null, isAuthenticated: false })
      },

      hasRole: (roles) => {
        const { empleado } = get()
        if (!empleado) return false
        return roles.includes(empleado.rol)
      },
    }),
    {
      name: 'motogest-auth-empleado',
      // Solo persistir el token y datos del empleado, no funciones
      partialize: (state) => ({
        empleado: state.empleado,
        token: state.token,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)

// ── Estado de autenticación de clientes ───────────────────────────────────────
// Claves de localStorage separadas de las del empleado para evitar colisiones
const CLIENTE_TOKEN_KEY         = 'cliente-token'
const CLIENTE_REFRESH_TOKEN_KEY = 'cliente-refreshToken'

interface AuthClienteState {
  cliente: Cliente | null
  token: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  setCliente: (cliente: Cliente, token: string, refreshToken: string) => void
  patchClienteToken: (token: string) => void
  clearCliente: () => void
}

export const useAuthClienteStore = create<AuthClienteState>()(
  persist(
    (set) => ({
      cliente: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,

      setCliente: (cliente, token, refreshToken) => {
        // Sincronizar con localStorage para que el interceptor Axios pueda renovar el token
        localStorage.setItem(CLIENTE_TOKEN_KEY, token)
        localStorage.setItem(CLIENTE_REFRESH_TOKEN_KEY, refreshToken)
        set({ cliente, token, refreshToken, isAuthenticated: true })
      },

      patchClienteToken: (token) => {
        set({ token })
      },

      clearCliente: () => {
        localStorage.removeItem(CLIENTE_TOKEN_KEY)
        localStorage.removeItem(CLIENTE_REFRESH_TOKEN_KEY)
        set({ cliente: null, token: null, refreshToken: null, isAuthenticated: false })
      },
    }),
    {
      name: 'motogest-auth-cliente',
      partialize: (state) => ({
        cliente:       state.cliente,
        token:         state.token,
        refreshToken:  state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)

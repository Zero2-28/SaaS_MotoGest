import api from './api'
import type { AuthEmpleadoResponse, AuthClienteResponse, RolEmpleado } from '@/types'

// Mapa de rolId numérico → nombre de rol (igual que en el backend seed)
const ROL_MAP: Record<number, RolEmpleado> = {
  1: 'admin',
  2: 'vendedor',
  3: 'repartidor',
}

// Forma del payload una vez desempaquetado por el interceptor de api.ts
interface BackendLoginData {
  accessToken: string
  refreshToken: string
  usuario: {
    id: number
    nombre: string
    email: string
    rolId: number
    sucursalId: number | null
  }
}

// ── Auth empleados ────────────────────────────────────────────────────────────

export async function loginEmpleado(email: string, password: string): Promise<AuthEmpleadoResponse> {
  // El interceptor global ya desempaquetó { success, data } → obtenemos BackendLoginData directamente
  const { data } = await api.post<BackendLoginData>('/auth/login', { email, password })

  return {
    token: data.accessToken,
    refreshToken: data.refreshToken,
    empleado: {
      id: data.usuario.id,
      nombre: data.usuario.nombre,
      email: data.usuario.email,
      rol: ROL_MAP[data.usuario.rolId] ?? 'vendedor',
      sucursalId: data.usuario.sucursalId,
      activo: true,
      createdAt: new Date().toISOString(),
    },
  }
}

// Datos del empleado autenticado (rol + sucursal completos)
export interface MeResponse {
  id: number
  nombre: string
  email: string
  activo: boolean
  sucursalId: number | null
  rol: { id: number; nombre: string }
  sucursal: { id: number; nombre: string; ubicacion: string } | null
}

export async function getMe(): Promise<MeResponse> {
  const { data } = await api.get<MeResponse>('/auth/me')
  return data
}

export async function changePassword(payload: {
  passwordActual: string
  passwordNuevo: string
}): Promise<void> {
  await api.put('/auth/change-password', payload)
}

export async function updateAvatarUrl(avatarUrl: string): Promise<void> {
  await api.put('/auth/me', { avatarUrl })
}

export async function logoutEmpleado(): Promise<void> {
  // El backend requiere el refreshToken en el body para invalidarlo en BD
  const refreshToken = localStorage.getItem('refreshToken')
  if (refreshToken) {
    await api.post('/auth/logout', { refreshToken })
  }
}

// ── Auth clientes ─────────────────────────────────────────────────────────────

interface BackendClienteLoginData {
  accessToken: string
  refreshToken: string
  cliente: {
    id: number
    nombre: string
    email: string | null
    telefono: string | null
    direccion: string | null
    ciudad: string | null
    tipoDocumento: string | null
    numeroDocumento: string | null
    createdAt: string
  }
}

export async function loginCliente(email: string, password: string): Promise<AuthClienteResponse> {
  const { data } = await api.post<BackendClienteLoginData>('/clientes/login', { email, password })
  return {
    token: data.accessToken,
    refreshToken: data.refreshToken,
    cliente: { ...data.cliente },
  }
}

export async function registerCliente(payload: {
  nombre: string
  email: string
  password: string
  telefono?: string
}): Promise<AuthClienteResponse> {
  const { data } = await api.post<BackendClienteLoginData>('/clientes/register', payload)
  return {
    token: data.accessToken,
    refreshToken: data.refreshToken,
    cliente: { ...data.cliente },
  }
}

import api from './api'
import type { EmpleadoDetalle } from '@/types'

export async function getEmpleados(): Promise<EmpleadoDetalle[]> {
  const { data } = await api.get<EmpleadoDetalle[]>('/usuarios')
  return data
}

export async function crearEmpleado(payload: {
  nombre: string
  email: string
  password: string
  rolId: number
  sucursalId?: number
}): Promise<EmpleadoDetalle> {
  const { data } = await api.post<EmpleadoDetalle>('/usuarios', payload)
  return data
}

export async function editarEmpleado(
  id: number,
  payload: {
    nombre?: string
    email?: string
    password?: string
    rolId?: number
    sucursalId?: number | null
    activo?: boolean
  }
): Promise<EmpleadoDetalle> {
  const { data } = await api.put<EmpleadoDetalle>(`/usuarios/${id}`, payload)
  return data
}

export async function desactivarEmpleado(id: number): Promise<void> {
  await api.put(`/usuarios/${id}`, { activo: false })
}

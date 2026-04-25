import api from './api'
import type { Devolucion, EstadoDevolucion } from '@/types'

export interface DetalleDevolucionPayload {
  productoId: number
  cantidad: number
}

export interface CrearDevolucionPayload {
  ventaId: number
  motivo: string
  detalles: DetalleDevolucionPayload[]
  observaciones?: string
}

export async function getDevoluciones(): Promise<Devolucion[]> {
  const { data } = await api.get<Devolucion[]>('/devoluciones')
  return data
}

export async function crearDevolucion(payload: CrearDevolucionPayload): Promise<Devolucion> {
  const { data } = await api.post<Devolucion>('/devoluciones', payload)
  return data
}

export async function updateEstadoDevolucion(
  id: number,
  estado: EstadoDevolucion,
): Promise<Devolucion> {
  const { data } = await api.put<Devolucion>(`/devoluciones/${id}/estado`, { estado })
  return data
}

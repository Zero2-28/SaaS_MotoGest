import api from './api'
import type { Notificacion } from '@/types'

export async function getNotificaciones(): Promise<Notificacion[]> {
  const { data } = await api.get<Notificacion[]>('/notificaciones')
  return data
}

export async function marcarLeida(id: string): Promise<void> {
  await api.put(`/notificaciones/${id}/leer`)
}

export async function marcarTodasLeidas(): Promise<void> {
  await api.put('/notificaciones/leer-todas')
}

import api from './api'
import type { Compra, EstadoCompra } from '@/types'

export interface DetalleCompraPayload {
  productoId: number
  cantidad: number
  precioUnitario: number
}

export interface CrearCompraPayload {
  proveedorId: number
  detalles: DetalleCompraPayload[]
  observaciones?: string
}

export async function getCompras(): Promise<Compra[]> {
  const { data } = await api.get<Compra[]>('/compras')
  return data
}

export async function crearCompra(payload: CrearCompraPayload): Promise<Compra> {
  const { data } = await api.post<Compra>('/compras', payload)
  return data
}

export async function updateEstadoCompra(
  id: number,
  estado: EstadoCompra,
  sucursalId?: number,
): Promise<Compra> {
  const { data } = await api.put<Compra>(`/compras/${id}/estado`, {
    estado,
    ...(sucursalId ? { sucursalId } : {}),
  })
  return data
}

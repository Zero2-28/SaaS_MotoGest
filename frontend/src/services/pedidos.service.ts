import api from './api'
import type { Pedido, EstadoPedido, PedidoPublico } from '@/types'

// GET /pedidos — retorna array directo (sin paginación)
export async function getPedidos(): Promise<Pedido[]> {
  const { data } = await api.get<Pedido[]>('/pedidos')
  return data
}

// GET /pedidos/:codigo — público, sin auth
export async function rastrearPedido(codigo: string): Promise<PedidoPublico> {
  const { data } = await api.get<PedidoPublico>(`/pedidos/${codigo}`)
  return data
}

export async function cambiarEstadoPedido(
  id: number,
  estado: EstadoPedido,
  comentario?: string,
  repartidorId?: number
): Promise<Pedido> {
  const { data } = await api.put<Pedido>(`/pedidos/${id}/estado`, {
    estado,
    comentario,
    ...(repartidorId !== undefined && { repartidorId }),
  })
  return data
}

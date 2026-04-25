import api from './api'
import type { StockItem, AlertaStock } from '@/types'

export async function getStockSucursal(sucursalId: number): Promise<StockItem[]> {
  const { data } = await api.get<StockItem[]>(`/inventario/sucursal/${sucursalId}`)
  return data
}

export async function getAlertasStock(): Promise<AlertaStock[]> {
  const { data } = await api.get<AlertaStock[]>('/inventario/alertas')
  return data
}

export async function ajustarStock(payload: {
  productoId: number
  sucursalId: number
  cantidad: number
  motivo?: string
}): Promise<StockItem> {
  const { data } = await api.post<StockItem>('/inventario/ajuste', payload)
  return data
}

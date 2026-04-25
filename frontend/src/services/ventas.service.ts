import api from './api'
import type { Venta, VentaCliente, ReporteVentas, MetodoPago } from '@/types'

export interface CrearVentaPayload {
  clienteId?: number
  sucursalId: number
  metodoPago?: MetodoPago
  // Backend usa "detalles", no "items"
  detalles: { productoId: number; cantidad: number; precioUnitario: number }[]
  descuento?: number
}

// Checkout unificado: el backend crea la venta y el PaymentIntent de Stripe
// en un solo request para evitar que el cliente toque /pagos/crear-intento
export interface CheckoutResponse {
  venta: Venta
  clientSecret: string
  codigoPedido: string | null
}

export async function crearVenta(payload: CrearVentaPayload): Promise<Venta> {
  const { data } = await api.post<Venta>('/ventas', payload)
  return data
}

// Para el checkout público del cliente: inyecta el token del cliente
// El interceptor de api.ts no sobreescribirá si ya hay Authorization en el header
export async function crearVentaCliente(payload: CrearVentaPayload, token: string): Promise<CheckoutResponse> {
  const { data } = await api.post<CheckoutResponse>('/ventas/checkout', payload, {
    headers: { Authorization: `Bearer ${token}` },
  })
  return data
}

export async function getVentas(): Promise<Venta[]> {
  const { data } = await api.get<Venta[]>('/ventas')
  return data
}

export async function getVenta(id: number): Promise<Venta> {
  const { data } = await api.get<Venta>(`/ventas/${id}`)
  return data
}

export async function getReporteVentas(): Promise<ReporteVentas> {
  const { data } = await api.get<ReporteVentas>('/ventas/reportes')
  return data
}

export async function getMisCompras(token: string): Promise<VentaCliente[]> {
  const { data } = await api.get<VentaCliente[]>('/clientes/mis-compras', {
    headers: { Authorization: `Bearer ${token}` },
  })
  return data
}

import api from './api'
import type { Venta, VentaCliente, ReporteVentas, MetodoPago } from '@/types'

export interface CrearVentaPayload {
  clienteId?: number
  sucursalId: number
  metodoPago?: MetodoPago
  detalles: { productoId: number; cantidad: number; precioUnitario: number }[]
  descuento?: number
  direccionEntrega?: string
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

// Descarga o abre en el visor el PDF del comprobante de una venta (requiere auth de empleado)
export async function verComprobante(ventaId: number, descargar = false): Promise<void> {
  const resp = await api.get<Blob>(`/ventas/${ventaId}/comprobante${descargar ? '' : '?download=false'}`, {
    responseType: 'blob',
  })
  const url = URL.createObjectURL(resp.data)
  if (descargar) {
    const a = document.createElement('a')
    a.href = url
    a.download = `comprobante-${ventaId}.pdf`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    setTimeout(() => URL.revokeObjectURL(url), 5000)
  } else {
    window.open(url, '_blank')
    // La URL se revoca después de 60s para dar tiempo al visor PDF del navegador
    setTimeout(() => URL.revokeObjectURL(url), 60000)
  }
}

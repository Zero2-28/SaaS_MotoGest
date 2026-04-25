import api from './api'
import type { IntentoPago } from '@/types'

export interface CrearIntentoPayload {
  ventaId: number
  monto: number
  moneda?: string
}

export async function crearIntentoPago(payload: CrearIntentoPayload): Promise<IntentoPago> {
  const { data } = await api.post<IntentoPago>('/pagos/crear-intento', payload)
  return data
}

import api from './api'
import type { Proveedor } from '@/types'

export interface ProveedorPayload {
  nombre: string
  email?: string
  telefono?: string
  direccion?: string
  tipoDocumento?: string
  numeroDocumento?: string
  contacto?: string
}

export async function getProveedores(): Promise<Proveedor[]> {
  const { data } = await api.get<Proveedor[]>('/proveedores')
  return data
}

export async function crearProveedor(payload: ProveedorPayload): Promise<Proveedor> {
  const { data } = await api.post<Proveedor>('/proveedores', payload)
  return data
}

export async function editarProveedor(id: number, payload: ProveedorPayload): Promise<Proveedor> {
  const { data } = await api.put<Proveedor>(`/proveedores/${id}`, payload)
  return data
}

export async function eliminarProveedor(id: number): Promise<void> {
  await api.delete(`/proveedores/${id}`)
}

import api from './api'
import type { Producto, ProductoListResponse } from '@/types'

// Backend usa page/limit/search/categoriaId/activo
export async function getProductos(
  page = 1,
  limit = 12,
  search = '',
  categoriaId?: number,
  activo?: boolean
): Promise<ProductoListResponse> {
  const { data } = await api.get<ProductoListResponse>('/productos', {
    params: {
      page,
      limit,
      search: search || undefined,
      categoriaId: categoriaId ?? undefined,
      // undefined → backend usa default (true); true/false → filtra explícito
      activo: activo !== undefined ? String(activo) : undefined,
    },
  })
  return data
}

export async function getProducto(id: number): Promise<Producto> {
  const { data } = await api.get<Producto>(`/productos/${id}`)
  return data
}

export async function crearProducto(payload: {
  codigo: string
  nombre: string
  descripcion?: string | null
  imagen_url?: string | null
  categoriaId: number
  precioCompra: number
  precioVenta: number
}): Promise<Producto> {
  const { data } = await api.post<Producto>('/productos', payload)
  return data
}

export async function editarProducto(id: number, payload: {
  codigo?: string
  nombre?: string
  descripcion?: string | null
  imagen_url?: string | null
  categoriaId?: number
  precioCompra?: number
  precioVenta?: number
  activo?: boolean
}): Promise<Producto> {
  const { data } = await api.put<Producto>(`/productos/${id}`, payload)
  return data
}

export async function desactivarProducto(id: number): Promise<void> {
  await api.delete(`/productos/${id}`)
}

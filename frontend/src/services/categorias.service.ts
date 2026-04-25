import api from './api'
import type { Categoria } from '@/types'

// GET /categorias es público — no requiere token de empleado
export async function getCategorias(): Promise<Categoria[]> {
  const { data } = await api.get<Categoria[]>('/categorias')
  return data
}

// POST /categorias — requiere auth admin/vendedor
export async function crearCategoria(payload: {
  nombre: string
  descripcion?: string
  imagen_url?: string | null
}): Promise<Categoria> {
  const { data } = await api.post<Categoria>('/categorias', payload)
  return data
}

// PUT /categorias/:id — requiere auth admin/vendedor
export async function editarCategoria(
  id: number,
  payload: { nombre: string; descripcion?: string; imagen_url?: string | null },
): Promise<Categoria> {
  const { data } = await api.put<Categoria>(`/categorias/${id}`, payload)
  return data
}

// DELETE /categorias/:id — requiere auth admin
export async function eliminarCategoria(id: number): Promise<void> {
  await api.delete(`/categorias/${id}`)
}

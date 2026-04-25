import api from './api'

export interface UsuarioBasico {
  id: number
  nombre: string
  email: string
  rolId: number
  rol: { id: number; name: string }
  sucursalId: number | null
  activo: boolean
}

export async function getUsuarios(): Promise<UsuarioBasico[]> {
  const { data } = await api.get<UsuarioBasico[]>('/usuarios')
  return data
}

export async function getRepartidores(): Promise<UsuarioBasico[]> {
  const all = await getUsuarios()
  return all.filter((u) => u.rol.name === 'repartidor' && u.activo)
}

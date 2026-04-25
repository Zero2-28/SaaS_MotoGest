import api from './api'

export async function uploadProductoImage(file: File): Promise<string> {
  const formData = new FormData()
  formData.append('imagen', file)
  const { data } = await api.post<{ url: string }>('/upload/producto', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data.url
}

export async function uploadCategoriaImage(file: File): Promise<string> {
  const formData = new FormData()
  formData.append('imagen', file)
  const { data } = await api.post<{ url: string }>('/upload/categoria', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data.url
}

export async function uploadAvatarImage(file: File): Promise<string> {
  const formData = new FormData()
  formData.append('imagen', file)
  const { data } = await api.post<{ url: string }>('/upload/avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data.url
}

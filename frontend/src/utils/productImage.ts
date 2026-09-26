import { assets } from '@/config/assets'
import type { Producto, Categoria } from '@/types'

export const PRODUCTO_PLACEHOLDER = 'https://placehold.co/400x300/0A0A0A/FF6B00?text=MOTOGEST'

/** Nivel 1: imagen_url de BD. Nivel 2: placeholder MOTOGEST. */
export function getProductImage(p: Producto): string {
  if (p.imagen_url) return p.imagen_url
  return PRODUCTO_PLACEHOLDER
}

/** Imagen de categoría: imagen_url de BD o fallback decorativo de assets por nombre. */
export function getCategoriaImage(cat: Categoria): string {
  if (cat.imagen_url) return cat.imagen_url
  const nom = cat.nombre.toLowerCase()
  if (nom.includes('casco'))                              return assets.categorias.cascoTnt
  if (nom.includes('guante'))                             return assets.categorias.guantes
  if (nom.includes('tablero'))                            return assets.categorias.tablerosBanner
  if (nom.includes('repuesto'))                           return assets.categorias.repuestos1
  if (nom.includes('lubri') || nom.includes('aceite'))    return assets.categorias.lubri
  if (nom.includes('escape') || nom.includes('cilindro')) return assets.categorias.cilindroCilindro
  if (nom.includes('kit'))                                return assets.categorias.kitArrastre
  if (nom.includes('amort'))                              return assets.categorias.amortC
  if (nom.includes('carb'))                               return assets.categorias.carb2
  return assets.categorias.acce
}

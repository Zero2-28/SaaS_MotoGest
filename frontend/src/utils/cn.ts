import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/** Combina clsx + tailwind-merge para clases condicionales limpias */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

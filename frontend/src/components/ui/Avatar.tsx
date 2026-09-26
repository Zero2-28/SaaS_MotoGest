import { useState } from 'react'
import { cn } from '@/utils/cn'
import type { RolEmpleado } from '@/types'

export type AvatarSize = 'sm' | 'md' | 'lg'
export type AvatarRol  = RolEmpleado | 'cliente' | 'default'

const SIZES: Record<AvatarSize, { cls: string; px: number }> = {
  sm: { cls: 'h-8 w-8 text-xs',    px: 32 },
  md: { cls: 'h-10 w-10 text-sm',  px: 40 },
  lg: { cls: 'h-20 w-20 text-2xl', px: 80 },
}

// Color de fondo+texto para la inicial cuando no hay imagen
const INITIALS_CLS: Record<AvatarRol, string> = {
  admin:      'bg-racing/20 text-racing',
  vendedor:   'bg-turbo/20 text-turbo',
  repartidor: 'bg-blue-500/20 text-blue-600',
  cliente:    'bg-gray-100 text-gray-600',
  default:    'bg-gray-100 text-gray-600',
}

interface AvatarProps {
  src?: string | null
  nombre: string
  size?: AvatarSize
  rol?: AvatarRol
  className?: string
}

export function Avatar({ src, nombre, size = 'md', rol = 'default', className }: AvatarProps) {
  const [error, setError] = useState(false)
  const { cls, px } = SIZES[size]
  const inicial = (nombre.trim().charAt(0) || '?').toUpperCase()

  if (src && !error) {
    return (
      <img
        src={src}
        alt={nombre}
        onError={() => setError(true)}
        className={cn('rounded-full object-cover flex-shrink-0', cls, className)}
        width={px}
        height={px}
        loading="lazy"
      />
    )
  }

  return (
    <div
      role="img"
      aria-label={nombre}
      className={cn(
        'flex items-center justify-center rounded-full font-semibold flex-shrink-0 select-none',
        cls,
        INITIALS_CLS[rol],
        className
      )}
    >
      {inicial}
    </div>
  )
}

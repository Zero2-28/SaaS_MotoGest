import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/utils/cn'

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-brand-400 focus:ring-offset-2',
  {
    variants: {
      variant: {
        default:     'border-transparent bg-brand text-white',
        // Píldora metálica con filo claro — para destacar sobre fondo oscuro
        metal:       'border-white/10 bg-metal-btn text-white shadow-metal',
        secondary:   'border-chrome-200 bg-chrome-50 text-chrome-600',
        accent:      'border-transparent bg-turbo text-white',
        outline:     'border-brand-200 bg-white text-brand-800',
        // Estados de pedido / compra / devolución
        pendiente:   'border-chrome-200 bg-chrome-50  text-chrome-600',
        procesando:  'border-info-100   bg-info-50    text-info-700',
        listo:       'border-warning-100 bg-warning-50 text-warning-700',
        enviado:     'border-brand-100  bg-brand-50   text-brand-700',
        entregado:   'border-success-100 bg-success-50 text-success-700',
        cancelado:   'border-danger-100 bg-danger-50  text-danger-700',
        // Stock
        'stock-ok':      'border-success-100 bg-success-50 text-success-700',
        'stock-bajo':    'border-turbo-100  bg-turbo-50   text-turbo-700',
        'stock-critico': 'border-danger-100 bg-danger-50  text-danger-700',
      },
    },
    defaultVariants: { variant: 'default' },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }

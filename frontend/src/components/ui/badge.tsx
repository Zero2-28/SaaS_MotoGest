import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/utils/cn'

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default:     'border-transparent bg-racing text-white',
        secondary:   'border-transparent bg-carbon-600 text-white',
        accent:      'border-transparent bg-turbo text-white',
        outline:     'border-border text-foreground',
        // Estados de pedido / compra / devolución
        pendiente:   'bg-gray-100 text-gray-700 border-gray-200',
        procesando:  'bg-blue-100 text-blue-800 border-blue-200',
        listo:       'bg-yellow-100 text-yellow-800 border-yellow-200',
        enviado:     'bg-indigo-100 text-indigo-800 border-indigo-200',
        entregado:   'bg-green-100 text-green-800 border-green-200',
        cancelado:   'bg-red-100 text-red-800 border-red-200',
        // Stock
        'stock-ok':      'bg-green-100 text-green-800 border-green-200',
        'stock-bajo':    'bg-orange-100 text-orange-800 border-orange-200',
        'stock-critico': 'bg-red-100 text-red-800 border-red-200',
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

import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/utils/cn'

const buttonVariants = cva(
  // Base — todos los botones
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        /**
         * Azul metalizado — acción principal.
         * El degradado vertical + el filo interior claro (shadow-metal) son
         * lo que da la lectura de chapa pulida en vez de color plano.
         */
        default:
          'bg-metal-btn text-white shadow-metal hover:bg-metal-btn-hv hover:shadow-brand active:scale-[0.98] active:shadow-none',
        // Borde de marca — acción secundaria sobre fondo claro
        outline:
          'border border-brand-200 bg-white text-brand-800 hover:border-brand-400 hover:bg-brand-50 active:scale-[0.98]',
        // Neutra — "Cancelar", acciones de bajo peso sobre fondo claro
        secondary:
          'bg-chrome-100 text-chrome-700 hover:bg-chrome-200 active:scale-[0.98]',
        // Superficie acero — acción neutra sobre fondo oscuro
        steel:
          'bg-brand-700 text-white shadow-metal hover:bg-brand-600 active:scale-[0.98]',
        // Sin fondo — acción terciaria
        ghost:
          'text-brand-800 hover:bg-brand-50 active:scale-[0.98]',
        // Ghost para superficies oscuras
        'ghost-dark':
          'text-brand-100 hover:bg-white/10 active:scale-[0.98]',
        // Naranja — acento cálido (ofertas, confirmaciones destacadas)
        accent:
          'bg-turbo text-white shadow-turbo hover:bg-turbo-600 active:scale-[0.98]',
        // Rojo — acción destructiva
        destructive:
          'bg-danger text-white hover:bg-danger-700 active:scale-[0.98]',
        // Texto puro
        link:
          'text-brand-600 underline-offset-4 hover:text-brand-800 hover:underline p-0 h-auto',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm:      'h-8 rounded-md px-3 text-xs',
        lg:      'h-12 rounded-md px-8 text-base',
        xl:      'h-14 rounded-md px-10 text-lg',
        icon:    'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size:    'default',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }

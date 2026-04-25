import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/utils/cn'

const buttonVariants = cva(
  // Base — todos los botones
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        // Rojo Ducati — acción principal
        default:     'bg-racing text-white hover:bg-racing-700 active:scale-[0.98]',
        // Borde rojo — acción secundaria
        outline:     'border border-racing text-racing bg-transparent hover:bg-racing/10 active:scale-[0.98]',
        // Superficie carbono — acción neutra
        secondary:   'bg-carbon-700 text-white hover:bg-carbon-600 active:scale-[0.98]',
        // Sin fondo — acción terciaria
        ghost:       'text-white hover:bg-carbon-700 active:scale-[0.98]',
        // Naranja Honda — acento/alerta positiva
        accent:      'bg-turbo text-white hover:bg-turbo-600 active:scale-[0.98]',
        // Rojo destructivo para eliminar
        destructive: 'bg-destructive text-white hover:bg-destructive/90 active:scale-[0.98]',
        // Texto puro
        link:        'text-racing underline-offset-4 hover:underline p-0 h-auto',
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

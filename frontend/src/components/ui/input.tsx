import * as React from 'react'
import { cn } from '@/utils/cn'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-10 w-full rounded-md border border-chrome-200 bg-mist px-3 py-2',
          'text-sm text-ink placeholder:text-chrome-400',
          'focus-visible:outline-none focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/20',
          'hover:border-chrome-300',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'transition-colors duration-150',
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = 'Input'

export { Input }

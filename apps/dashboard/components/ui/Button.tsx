import { forwardRef } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/cn'

const buttonStyles = cva(
  'inline-flex items-center justify-center gap-2 font-medium tracking-tight transition-all duration-200 ease-out active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50 select-none',
  {
    variants: {
      variant: {
        primary: 'bg-ink text-bg hover:bg-ink/90',
        secondary:
          'bg-white/5 text-ink border border-border hover:bg-white/10 hover:border-border-strong',
        accent:
          'bg-accent text-bg hover:bg-accent-bright shadow-[0_8px_24px_-8px_rgba(48,209,88,0.4)]',
        ghost: 'text-ink-muted hover:text-ink hover:bg-white/5',
        danger:
          'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/15 hover:border-red-500/30',
      },
      size: {
        sm: 'h-8 px-3 text-[13px] rounded-lg',
        md: 'h-10 px-4 text-[14px] rounded-lg',
        lg: 'h-11 px-5 text-[15px] rounded-lg',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonStyles> {}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button ref={ref} className={cn(buttonStyles({ variant, size }), className)} {...props} />
  )
)
Button.displayName = 'Button'

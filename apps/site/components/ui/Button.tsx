import { forwardRef } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/cn'

const buttonStyles = cva(
  'inline-flex items-center justify-center gap-2 font-medium tracking-tight transition-all duration-200 ease-out active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50 select-none',
  {
    variants: {
      variant: {
        primary:
          'bg-ink text-bg hover:bg-ink/90 shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_8px_24px_-8px_rgba(255,255,255,0.2)]',
        secondary:
          'bg-white/5 text-ink border border-border hover:bg-white/10 hover:border-border-strong backdrop-blur',
        ghost: 'text-ink-muted hover:text-ink hover:bg-white/5',
        gradient:
          'text-ink bg-gradient-to-r from-accent via-accent-bright to-accent-deep shadow-[0_0_0_1px_rgba(255,255,255,0.1),0_12px_32px_-8px_rgba(48,209,88,0.5)] hover:shadow-[0_0_0_1px_rgba(255,255,255,0.15),0_16px_40px_-8px_rgba(48,209,88,0.6)]',
      },
      size: {
        sm: 'h-9 px-4 text-sm rounded-full',
        md: 'h-11 px-5 text-[15px] rounded-full',
        lg: 'h-13 px-7 text-base rounded-full',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonStyles> {
  asChild?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button ref={ref} className={cn(buttonStyles({ variant, size }), className)} {...props} />
    )
  }
)

Button.displayName = 'Button'

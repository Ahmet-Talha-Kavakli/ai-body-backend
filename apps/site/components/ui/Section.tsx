import { cn } from '@/lib/cn'

interface SectionProps extends React.HTMLAttributes<HTMLElement> {
  spacing?: 'sm' | 'md' | 'lg'
}

export function Section({ className, spacing = 'lg', children, ...props }: SectionProps) {
  const spacings = {
    sm: 'py-16 sm:py-20',
    md: 'py-20 sm:py-28',
    lg: 'py-28 sm:py-40',
  }
  return (
    <section className={cn('relative', spacings[spacing], className)} {...props}>
      {children}
    </section>
  )
}

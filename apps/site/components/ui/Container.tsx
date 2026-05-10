import { cn } from '@/lib/cn'

interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

export function Container({ className, size = 'lg', children, ...props }: ContainerProps) {
  const sizes = {
    sm: 'max-w-3xl',
    md: 'max-w-5xl',
    lg: 'max-w-6xl',
    xl: 'max-w-7xl',
  }
  return (
    <div className={cn('mx-auto w-full px-6 sm:px-8', sizes[size], className)} {...props}>
      {children}
    </div>
  )
}

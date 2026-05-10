import { cn } from '@/lib/cn'

export function Badge({ className, children, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium',
        'border border-border bg-white/5 text-ink-muted backdrop-blur',
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
}

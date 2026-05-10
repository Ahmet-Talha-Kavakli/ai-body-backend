import { cn } from '@/lib/cn'
import type { LucideIcon } from 'lucide-react'

interface StatProps {
  label: string
  value: string
  delta?: { value: string; positive?: boolean }
  icon?: LucideIcon
  className?: string
}

export function Stat({ label, value, delta, icon: Icon, className }: StatProps) {
  return (
    <div className={cn('rounded-2xl border border-border bg-bg-elevated p-6', className)}>
      <div className="mb-3 flex items-start justify-between">
        <p className="text-[13px] text-ink-muted">{label}</p>
        {Icon && (
          <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-white/5">
            <Icon className="h-4 w-4 text-ink-muted" />
          </div>
        )}
      </div>
      <p className="text-[32px] font-bold leading-none tracking-tightest">{value}</p>
      {delta && (
        <p
          className={cn(
            'mt-3 text-[12px] font-medium',
            delta.positive ? 'text-accent' : 'text-red-400'
          )}
        >
          {delta.positive ? '↑' : '↓'} {delta.value}
        </p>
      )}
    </div>
  )
}

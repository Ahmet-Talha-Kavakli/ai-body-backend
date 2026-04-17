import { ChevronRight } from 'lucide-react'

interface SettingsRowProps {
  label: string
  value?: string
  action?: string
  onAction?: () => void
  last?: boolean
  children?: React.ReactNode
}

export function SettingsRow({ label, value, action, onAction, last, children }: SettingsRowProps) {
  return (
    <div
      className={`flex items-center justify-between py-3 ${!last ? 'border-border/20 border-b' : ''}`}
    >
      <div className="flex-1">
        <p className="text-sm font-semibold">{label}</p>
        {value && <p className="text-muted-foreground text-xs">{value}</p>}
      </div>
      {children}
      {action && (
        <button
          onClick={onAction}
          className="flex items-center gap-1 text-xs font-medium text-blue-400 hover:text-blue-300"
        >
          {action} <ChevronRight size={12} />
        </button>
      )}
    </div>
  )
}

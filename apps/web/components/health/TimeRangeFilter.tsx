'use client'

import { motion } from 'framer-motion'

export type TimeRange = '7d' | '30d' | '90d'

const OPTIONS: { label: string; value: TimeRange }[] = [
  { label: '7 Gün', value: '7d' },
  { label: '30 Gün', value: '30d' },
  { label: '90 Gün', value: '90d' },
]

interface TimeRangeFilterProps {
  value: TimeRange
  onChange: (v: TimeRange) => void
}

export function TimeRangeFilter({ value, onChange }: TimeRangeFilterProps) {
  return (
    <div className="bg-muted/30 border-border/30 flex gap-1 rounded-xl border p-1">
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`relative cursor-pointer rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
            value === opt.value ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          {value === opt.value && (
            <motion.div
              layoutId="time-range-pill"
              className="bg-card border-border/50 absolute inset-0 rounded-lg border shadow-sm"
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            />
          )}
          <span className="relative z-10">{opt.label}</span>
        </button>
      ))}
    </div>
  )
}

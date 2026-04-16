'use client'

import { motion } from 'framer-motion'

interface MacroBarProps {
  label: string
  current: number
  goal: number
  color: string
  unit?: string
}

export function MacroBar({ label, current, goal, color, unit = 'g' }: MacroBarProps) {
  const pct = Math.min(current / Math.max(goal, 1), 1)
  const over = current > goal

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-white/50">{label}</span>
        <span className={`font-medium ${over ? 'text-red-400' : 'text-white'}`}>
          {Math.round(current)}
          <span className="text-white/30">
            /{goal}
            {unit}
          </span>
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/5">
        <motion.div
          className={`h-full rounded-full ${color}`}
          initial={{ width: 0 }}
          animate={{ width: `${pct * 100}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>
    </div>
  )
}

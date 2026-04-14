'use client'

import { motion } from 'framer-motion'

interface GoalRingProps {
  value: number
  max: number
  label: string
  unit: string
  color: string
  size?: number
}

export function GoalRing({ value, max, label, unit, color, size = 120 }: GoalRingProps) {
  const pct = Math.min(value / max, 1)
  const radius = (size - 20) / 2
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference * (1 - pct)

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={10}
            className="text-muted/30"
          />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={10}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg font-black leading-none">{Math.round(pct * 100)}%</span>
          <span className="text-muted-foreground text-xs">hedef</span>
        </div>
      </div>
      <div className="text-center">
        <p className="text-muted-foreground text-xs font-semibold">{label}</p>
        <p className="text-sm font-bold">
          {typeof value === 'number' ? value.toLocaleString('tr-TR') : value}{' '}
          <span className="text-muted-foreground text-xs font-normal">{unit}</span>
        </p>
      </div>
    </div>
  )
}

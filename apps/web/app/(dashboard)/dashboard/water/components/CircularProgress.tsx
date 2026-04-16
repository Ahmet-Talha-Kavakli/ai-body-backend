'use client'

import { motion } from 'framer-motion'

interface CircularProgressProps {
  current: number
  goal: number
  size?: number
}

export function CircularProgress({ current, goal, size = 200 }: CircularProgressProps) {
  const pct = Math.min(current / Math.max(goal, 1), 1)
  const r = (size - 20) / 2
  const circ = 2 * Math.PI * r
  const offset = circ * (1 - pct)
  const liters = (current / 1000).toFixed(1)
  const goalL = (goal / 1000).toFixed(1)

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id="tealGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#14b8a6" />
            <stop offset="100%" stopColor="#6366f1" />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgba(20,184,166,0.1)"
          strokeWidth={12}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="url(#tealGrad)"
          strokeWidth={12}
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <motion.span
          className="text-4xl font-black text-white"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          {liters}L
        </motion.span>
        <span className="text-sm text-white/40">/ {goalL}L hedef</span>
        <span className="mt-1 text-xs font-medium text-teal-400">{Math.round(pct * 100)}%</span>
      </div>
    </div>
  )
}

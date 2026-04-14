'use client'

import { useEffect } from 'react'
import { motion, useMotionValue, useTransform, animate } from 'framer-motion'

interface CalorieRingProps {
  consumed: number
  goal: number
  score: number
  streak: number
}

export function CalorieRing({ consumed, goal, score, streak }: CalorieRingProps) {
  const SIZE = 220
  const STROKE = 16
  const RADIUS = (SIZE - STROKE) / 2
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS
  const progress = useMotionValue(0)
  const dashOffset = useTransform(progress, (v) => CIRCUMFERENCE - (v / 100) * CIRCUMFERENCE)
  const pct = Math.min((consumed / goal) * 100, 100)
  const isOver = consumed > goal

  useEffect(() => {
    const controls = animate(progress, pct, {
      duration: 1.2,
      ease: [0.4, 0, 0.2, 1],
    })
    return controls.stop
  }, [pct, progress])

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative" style={{ width: SIZE, height: SIZE }}>
        <svg width={SIZE} height={SIZE} className="-rotate-90">
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke="rgba(99,102,241,0.15)"
            strokeWidth={STROKE}
          />
          <motion.circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke={isOver ? '#F97316' : '#6366F1'}
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            style={{ strokeDashoffset: dashOffset }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-['Barlow_Condensed'] text-4xl font-bold text-white">
            {consumed.toLocaleString()}
          </span>
          <span className="mt-0.5 text-xs text-[#64748B]">/ {goal.toLocaleString()} kcal</span>
          <span
            className={`mt-1 text-sm font-semibold ${isOver ? 'text-[#F97316]' : 'text-[#22C55E]'}`}
          >
            {isOver
              ? `${(consumed - goal).toLocaleString()} kcal fazla`
              : `${(goal - consumed).toLocaleString()} kcal kalan`}
          </span>
        </div>
      </div>
      <div className="flex gap-4 text-center">
        <div>
          <p className="font-['Barlow_Condensed'] text-2xl font-bold text-[#6366F1]">{score}</p>
          <p className="text-xs text-[#64748B]">puan</p>
        </div>
        <div className="w-px bg-white/10" />
        <div>
          <p className="font-['Barlow_Condensed'] text-2xl font-bold text-[#22C55E]">{streak}</p>
          <p className="text-xs text-[#64748B]">günlük seri</p>
        </div>
      </div>
    </div>
  )
}

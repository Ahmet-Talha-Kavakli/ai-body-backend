'use client'

import { motion, useAnimationFrame } from 'framer-motion'
import { useState } from 'react'

interface WaterWaveProps {
  percentage: number
  amountMl: number
  goalMl: number
}

function generateWavePath(
  offset: number,
  amplitude: number,
  width: number,
  height: number,
  fillY: number
): string {
  const points: string[] = []
  const segments = 20
  for (let i = 0; i <= segments; i++) {
    const x = (i / segments) * width
    const y = fillY + Math.sin((i / segments) * Math.PI * 2 + offset) * amplitude
    points.push(`${i === 0 ? 'M' : 'L'} ${x} ${y}`)
  }
  points.push(`L ${width} ${height} L 0 ${height} Z`)
  return points.join(' ')
}

export function WaterWave({ percentage, amountMl, goalMl }: WaterWaveProps) {
  const [wave1, setWave1] = useState(0)
  const [wave2, setWave2] = useState(Math.PI)
  const clampedPct = Math.min(100, Math.max(0, percentage))
  const width = 300
  const height = 300
  const fillY = height - (clampedPct / 100) * height
  const amplitude = clampedPct > 0 && clampedPct < 100 ? 8 : 2
  const goalMet = clampedPct >= 100

  useAnimationFrame((t) => {
    setWave1(t * 0.001)
    setWave2(t * 0.0015 + Math.PI)
  })

  const path1 = generateWavePath(wave1, amplitude, width, height, fillY)
  const path2 = generateWavePath(wave2, amplitude * 0.7, width, height, fillY + 4)

  return (
    <div className="relative flex flex-col items-center">
      <div className="relative h-64 w-64 overflow-hidden rounded-full border-4 border-white/10 shadow-2xl">
        <div className="absolute inset-0 bg-[#0A0A1A]" />
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="absolute inset-0 h-full w-full"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="waveGrad1" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={goalMet ? '#10B981' : '#3B82F6'} stopOpacity="0.9" />
              <stop offset="100%" stopColor={goalMet ? '#059669' : '#1D4ED8'} stopOpacity="1" />
            </linearGradient>
            <linearGradient id="waveGrad2" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={goalMet ? '#34D399' : '#60A5FA'} stopOpacity="0.5" />
              <stop offset="100%" stopColor={goalMet ? '#10B981' : '#3B82F6'} stopOpacity="0.7" />
            </linearGradient>
          </defs>
          <path d={path1} fill="url(#waveGrad1)" />
          <path d={path2} fill="url(#waveGrad2)" />
        </svg>
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center">
          <motion.p
            key={amountMl}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-3xl font-black text-white drop-shadow-lg"
          >
            {amountMl} ml
          </motion.p>
          <p className="mt-1 text-sm text-white/70">/ {goalMl} ml</p>
          <motion.p
            key={clampedPct}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`mt-1 text-lg font-bold ${goalMet ? 'text-emerald-400' : 'text-blue-300'}`}
          >
            {Math.round(clampedPct)}%
          </motion.p>
          {goalMet && (
            <motion.p
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="mt-1 text-xs font-semibold text-emerald-400"
            >
              🎉 Hedefe ulaştın!
            </motion.p>
          )}
        </div>
      </div>
      <p className="mt-3 text-xs text-[#64748B]">Kalan: {Math.max(0, goalMl - amountMl)} ml</p>
    </div>
  )
}

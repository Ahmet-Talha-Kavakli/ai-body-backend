'use client'

import { motion } from 'framer-motion'
import { Droplets } from 'lucide-react'

interface WaterTrackerProps {
  glasses: number
  goal?: number
  onUpdate: (glasses: number) => void
}

export function WaterTracker({ glasses, goal = 8, onUpdate }: WaterTrackerProps) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Droplets size={14} className="text-[#3B82F6]" />
          <span className="text-xs text-[#64748B]">Su</span>
        </div>
        <span className="text-xs font-semibold text-white">
          {glasses * 250}ml / {goal * 250}ml
        </span>
      </div>
      <div className="flex gap-1.5">
        {Array.from({ length: goal }).map((_, i) => (
          <motion.button
            key={i}
            onClick={() => onUpdate(i < glasses ? i : i + 1)}
            whileTap={{ scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className="h-6 flex-1 cursor-pointer rounded-sm"
            style={{
              background:
                i < glasses
                  ? 'linear-gradient(to top, #3B82F6, #06B6D4)'
                  : 'rgba(255,255,255,0.06)',
            }}
            aria-label={`${i + 1} bardak su`}
          />
        ))}
      </div>
    </div>
  )
}

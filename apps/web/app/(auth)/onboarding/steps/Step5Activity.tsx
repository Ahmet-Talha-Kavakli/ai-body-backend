'use client'

import { motion } from 'framer-motion'
import type { StepProps } from '../page'

const ACTIVITY_LEVELS = [
  { value: 'sedentary', label: 'Sedanter', sub: 'Haftada 0-1 gün', emoji: '🛋️', days: 0 },
  { value: 'lightly_active', label: 'Hafif Aktif', sub: 'Haftada 2-3 gün', emoji: '🚶', days: 2 },
  { value: 'moderately_active', label: 'Orta Aktif', sub: 'Haftada 3-4 gün', emoji: '🏋️', days: 3 },
  { value: 'very_active', label: 'Çok Aktif', sub: 'Haftada 5+ gün', emoji: '🔥', days: 5 },
]

export function Step5Activity({ data, onChange, onNext }: StepProps) {
  const handleSelect = (value: string, days: number) => {
    onChange({ fitnessLevel: value, trainingDaysPerWeek: days })
    setTimeout(onNext, 300)
  }

  return (
    <div className="mx-auto w-full max-w-lg px-4">
      <motion.h2
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-2 text-center text-3xl font-bold text-white"
      >
        Aktivite Seviyesi
      </motion.h2>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="mb-8 text-center text-white/60"
      >
        Şu anki aktivite seviyeni seç.
      </motion.p>

      <div className="space-y-3">
        {ACTIVITY_LEVELS.map((level, i) => (
          <motion.button
            key={level.value}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleSelect(level.value, level.days)}
            className={`flex w-full items-center gap-4 rounded-2xl border-2 p-4 text-left transition-all ${
              data.fitnessLevel === level.value
                ? 'border-indigo-500 bg-indigo-500/20 shadow-lg shadow-indigo-500/20'
                : 'border-white/10 bg-white/5 hover:border-white/25 hover:bg-white/10'
            }`}
          >
            <span className="text-4xl">{level.emoji}</span>
            <div className="flex-1">
              <div className="font-semibold text-white">{level.label}</div>
              <div className="text-sm text-white/50">{level.sub}</div>
            </div>
            {data.fitnessLevel === level.value && (
              <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-indigo-500 text-xs text-white">
                ✓
              </div>
            )}
          </motion.button>
        ))}
      </div>
    </div>
  )
}

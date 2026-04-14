'use client'

import { motion } from 'framer-motion'

interface MacroBarsProps {
  protein: { current: number; goal: number }
  carbs: { current: number; goal: number }
  fat: { current: number; goal: number }
  fiber: { current: number; goal: number }
}

const MACROS = [
  { key: 'protein' as const, label: 'Protein', unit: 'g', color: 'from-[#3B82F6] to-[#06B6D4]' },
  { key: 'carbs' as const, label: 'Karbonhidrat', unit: 'g', color: 'from-[#F59E0B] to-[#F97316]' },
  { key: 'fat' as const, label: 'Yağ', unit: 'g', color: 'from-[#EC4899] to-[#F43F5E]' },
  { key: 'fiber' as const, label: 'Lif', unit: 'g', color: 'from-[#22C55E] to-[#10B981]' },
]

export function MacroBars({ protein, carbs, fat, fiber }: MacroBarsProps) {
  const data = { protein, carbs, fat, fiber }

  return (
    <div className="flex w-full flex-col gap-3">
      {MACROS.map((m, i) => {
        const { current, goal } = data[m.key]
        const pct = Math.min((current / goal) * 100, 100)
        return (
          <div key={m.key}>
            <div className="mb-1 flex justify-between">
              <span className="text-xs text-[#64748B]">{m.label}</span>
              <span className="text-xs font-semibold text-white">
                {Math.round(current)}
                <span className="font-normal text-[#64748B]">
                  /{goal}
                  {m.unit}
                </span>
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
              <motion.div
                className={`h-full bg-gradient-to-r ${m.color} rounded-full`}
                initial={{ scaleX: 0 }}
                animate={{ scaleX: pct / 100 }}
                transition={{ duration: 0.7, delay: i * 0.08, ease: 'easeOut' }}
                style={{ originX: 0 }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

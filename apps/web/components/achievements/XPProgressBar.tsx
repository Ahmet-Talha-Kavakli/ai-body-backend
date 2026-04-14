'use client'

import { motion } from 'framer-motion'
import { getXpForLevel } from '@/lib/achievements/definitions'

interface Props {
  total: number
  level: number
}

export function XPProgressBar({ total, level }: Props) {
  const currentLevelXp = getXpForLevel(level)
  const nextLevelXp = getXpForLevel(level + 1)
  const progress =
    nextLevelXp > currentLevelXp
      ? ((total - currentLevelXp) / (nextLevelXp - currentLevelXp)) * 100
      : 100

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4">
      <div className="mb-2 flex items-center justify-between">
        <div>
          <p className="text-xs text-[#64748B]">Seviye</p>
          <p className="text-2xl font-bold text-white">{level}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-[#64748B]">Toplam XP</p>
          <p className="text-lg font-semibold text-[#6366F1]">{total.toLocaleString()}</p>
        </div>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-[#6366F1] to-[#818CF8]"
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(progress, 100)}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </div>
      <p className="mt-1 text-right text-xs text-[#64748B]">
        {total - currentLevelXp} / {nextLevelXp - currentLevelXp} XP → Seviye {level + 1}
      </p>
    </div>
  )
}

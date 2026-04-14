'use client'

import { motion, AnimatePresence } from 'framer-motion'
import type { AchievementDef } from '@/lib/achievements/definitions'

interface Props {
  achievement: AchievementDef | null
  onDismiss: () => void
}

const TIER_COLORS: Record<string, string> = {
  bronze: 'from-amber-600/20 to-amber-800/10 border-amber-600/30',
  silver: 'from-slate-400/20 to-slate-600/10 border-slate-400/30',
  gold: 'from-yellow-400/20 to-yellow-600/10 border-yellow-400/30',
  platinum: 'from-violet-400/20 to-violet-600/10 border-violet-400/30',
}

export function AchievementToast({ achievement, onDismiss }: Props) {
  return (
    <AnimatePresence>
      {achievement && (
        <motion.div
          initial={{ x: 400, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 400, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 120, damping: 20 }}
          onAnimationComplete={() => {
            setTimeout(onDismiss, 3000)
          }}
          className={`fixed right-4 top-4 z-[100] flex items-center gap-3 rounded-2xl border bg-gradient-to-br p-4 shadow-2xl ${TIER_COLORS[achievement.tier]}`}
        >
          <span className="text-3xl">{achievement.icon}</span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#94A3B8]">
              Yeni Başarım!
            </p>
            <p className="text-sm font-bold text-white">{achievement.title}</p>
            <p className="text-xs text-[#64748B]">+{achievement.xp} XP</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

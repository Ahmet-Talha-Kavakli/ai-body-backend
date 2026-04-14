'use client'

import { motion } from 'framer-motion'
import type { AchievementDef } from '@/lib/achievements/definitions'

interface Props {
  def: AchievementDef
  earned: boolean
  earnedAt?: string
}

const TIER_STYLES: Record<string, string> = {
  bronze: 'border-amber-600/30 bg-amber-600/5',
  silver: 'border-slate-400/30 bg-slate-400/5',
  gold: 'border-yellow-400/30 bg-yellow-400/5',
  platinum: 'border-violet-400/30 bg-violet-400/5',
}

const TIER_TEXT: Record<string, string> = {
  bronze: 'text-amber-500',
  silver: 'text-slate-400',
  gold: 'text-yellow-400',
  platinum: 'text-violet-400',
}

export function AchievementCard({ def, earned, earnedAt }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative flex items-center gap-3 rounded-xl border p-3 transition-colors ${
        earned ? TIER_STYLES[def.tier] : 'border-white/[0.04] bg-white/[0.02] opacity-40'
      }`}
    >
      <span className={`text-2xl ${!earned ? 'grayscale' : ''}`}>{def.icon}</span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-white">{def.title}</p>
        <p className="truncate text-xs text-[#64748B]">{def.description}</p>
        {earned && earnedAt && (
          <p className="text-xs text-[#475569]">{new Date(earnedAt).toLocaleDateString('tr-TR')}</p>
        )}
      </div>
      <div className="text-right">
        <p className={`text-xs font-semibold ${earned ? TIER_TEXT[def.tier] : 'text-[#475569]'}`}>
          +{def.xp} XP
        </p>
        <p className={`text-xs capitalize ${earned ? TIER_TEXT[def.tier] : 'text-[#475569]'}`}>
          {def.tier}
        </p>
      </div>
      {!earned && (
        <div className="absolute inset-0 flex items-center justify-center rounded-xl">
          <span className="text-lg">🔒</span>
        </div>
      )}
    </motion.div>
  )
}

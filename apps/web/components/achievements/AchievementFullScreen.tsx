'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'
import type { AchievementDef } from '@/lib/achievements/definitions'

interface Props {
  achievement: AchievementDef | null
  newLevel?: number
  leveledUp?: boolean
  onDismiss: () => void
}

const TIER_GLOW: Record<string, string> = {
  bronze: '#B45309',
  silver: '#94A3B8',
  gold: '#EAB308',
  platinum: '#7C3AED',
}

export function AchievementFullScreen({ achievement, newLevel, leveledUp, onDismiss }: Props) {
  const [particles, setParticles] = useState<{ x: number; y: number; r: number }[]>([])

  useEffect(() => {
    if (!achievement) return
    setParticles(
      Array.from({ length: 30 }, () => ({
        x: Math.random() * 100,
        y: Math.random() * 100,
        r: Math.random() * 6 + 2,
      }))
    )
    const t = setTimeout(onDismiss, 4500)
    return () => clearTimeout(t)
  }, [achievement, onDismiss])

  return (
    <AnimatePresence>
      {achievement && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-black/90 backdrop-blur-md"
          onClick={onDismiss}
        >
          {particles.map((p, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full"
              style={{
                left: `${p.x}%`,
                top: `${p.y}%`,
                width: p.r,
                height: p.r,
                backgroundColor: TIER_GLOW[achievement.tier],
              }}
              initial={{ opacity: 0, scale: 0, y: 0 }}
              animate={{ opacity: [0, 1, 0], scale: [0, 1, 0.5], y: [-20, -80] }}
              transition={{ delay: i * 0.05, duration: 1.5 }}
            />
          ))}

          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 150, damping: 15, delay: 0.1 }}
            className="flex flex-col items-center gap-4 text-center"
          >
            <motion.div
              animate={{
                boxShadow: [
                  `0 0 0px ${TIER_GLOW[achievement.tier]}`,
                  `0 0 60px ${TIER_GLOW[achievement.tier]}`,
                  `0 0 0px ${TIER_GLOW[achievement.tier]}`,
                ],
              }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="flex h-32 w-32 items-center justify-center rounded-full border-2 bg-black/50"
              style={{ borderColor: TIER_GLOW[achievement.tier] }}
            >
              <span className="text-6xl">{achievement.icon}</span>
            </motion.div>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#94A3B8]">
                Başarım Kazanıldı
              </p>
              <h2 className="mt-1 text-3xl font-bold text-white">{achievement.title}</h2>
              <p className="mt-1 text-sm text-[#94A3B8]">{achievement.description}</p>
              <p className="mt-3 text-lg font-bold" style={{ color: TIER_GLOW[achievement.tier] }}>
                +{achievement.xp} XP
              </p>
            </motion.div>

            {leveledUp && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.8, type: 'spring' }}
                className="mt-2 rounded-full border border-yellow-400/30 bg-yellow-400/10 px-6 py-2"
              >
                <p className="text-sm font-bold text-yellow-400">⬆️ Seviye {newLevel}!</p>
              </motion.div>
            )}

            <p className="mt-6 text-xs text-[#475569]">Devam etmek için dokun</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

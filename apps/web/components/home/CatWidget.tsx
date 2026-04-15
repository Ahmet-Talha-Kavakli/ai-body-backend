'use client'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Sparkles } from 'lucide-react'

interface CatWidgetProps {
  mood?: 'happy' | 'sad' | 'energetic' | 'tired' | 'angry'
  name?: string
  level?: number
}

const MOOD_BAR_WIDTH: Record<CatWidgetProps['mood'] & string, string> = {
  happy: '80%',
  energetic: '80%',
  sad: '50%',
  tired: '30%',
  angry: '20%',
}

export function CatWidget({ mood = 'happy', name = 'Pamuk', level = 1 }: CatWidgetProps) {
  const moodConfig = {
    happy: { emoji: '😺', color: 'from-amber-400 to-orange-400', text: 'Mutlu', bounce: true },
    sad: { emoji: '😿', color: 'from-blue-400 to-indigo-400', text: 'Üzgün', bounce: false },
    energetic: {
      emoji: '😸',
      color: 'from-green-400 to-emerald-400',
      text: 'Enerjik',
      bounce: true,
    },
    tired: { emoji: '😴', color: 'from-purple-400 to-violet-400', text: 'Yorgun', bounce: false },
    angry: { emoji: '😾', color: 'from-red-400 to-rose-400', text: 'Sinirli', bounce: false },
  }

  const config = moodConfig[mood]

  return (
    <Link href="/dashboard/pet">
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="from-card/80 to-card/40 relative cursor-pointer overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br p-5"
      >
        {/* Background glow */}
        <div
          className={`absolute inset-0 bg-gradient-to-br ${config.color} rounded-2xl opacity-5`}
        />

        <div className="relative flex items-center gap-4">
          {/* Cat animation */}
          <motion.div
            animate={config.bounce ? { y: [0, -8, 0] } : { rotate: [0, -5, 5, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            className="select-none text-5xl"
          >
            {config.emoji}
          </motion.div>

          {/* Info */}
          <div className="flex-1">
            <div className="mb-1 flex items-center gap-2">
              <span className="text-base font-bold">{name}</span>
              <span
                className={`rounded-full bg-gradient-to-r px-2 py-0.5 text-xs ${config.color} font-semibold text-white`}
              >
                Seviye {level}
              </span>
            </div>
            <p className="text-muted-foreground text-sm">Bugün {config.text} hissediyor</p>
          </div>

          {/* Arrow */}
          <div className="text-muted-foreground flex items-center gap-1 text-xs">
            <Sparkles size={14} className="text-amber-400" />
          </div>
        </div>

        {/* Mood bar */}
        <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/10">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: MOOD_BAR_WIDTH[mood] }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className={`h-full rounded-full bg-gradient-to-r ${config.color}`}
          />
        </div>
      </motion.div>
    </Link>
  )
}

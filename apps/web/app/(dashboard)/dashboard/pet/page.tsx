'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Heart, Coffee, Gamepad2, ShoppingBag, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { getMoodConfig, getReturnMessage } from '@/lib/pet/catMood'
import { xpToLevel, xpProgress } from '@/lib/pet/catState'
import type { CatMood } from '@/lib/pet/catMood'

interface PetData {
  id: string
  name: string
  level: number
  xp: number
  mood: CatMood
  coins: number
  hasInjury: boolean
  injuredPart: string | null
  daysAbsent: number
  outfit: string | null
  accessories: string[]
}

export default function PetPage() {
  const [pet, setPet] = useState<PetData | null>(null)
  const [loading, setLoading] = useState(true)
  const [interacting, setInteracting] = useState(false)
  const [returnMsg, setReturnMsg] = useState<string | null>(null)
  const [xpPopup, setXpPopup] = useState<number | null>(null)

  useEffect(() => {
    fetch('/api/pet')
      .then((r) => r.json())
      .then((data: PetData) => {
        setPet(data)
        setLoading(false)
        if (data.daysAbsent > 0) {
          const msg = getReturnMessage(data.daysAbsent, data.name)
          if (msg) setReturnMsg(msg)
        }
      })
      .catch(() => setLoading(false))
  }, [])

  const interact = useCallback(
    async (type: 'pet' | 'feed' | 'play') => {
      if (!pet || interacting) return
      setInteracting(true)
      try {
        const res = await fetch('/api/pet/interact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type }),
        })
        const { xpGain } = (await res.json()) as { xpGain: number }
        setXpPopup(xpGain)
        setPet((p) => (p ? { ...p, xp: p.xp + xpGain } : p))
        setTimeout(() => setXpPopup(null), 1500)
      } finally {
        setInteracting(false)
      }
    },
    [pet, interacting]
  )

  if (loading)
    return (
      <div className="flex min-h-64 items-center justify-center">
        <div className="animate-bounce text-4xl">🐱</div>
      </div>
    )

  if (!pet) return null

  const config = getMoodConfig(pet.mood)
  const level = xpToLevel(pet.xp)
  const progress = xpProgress(pet.xp)

  return (
    <div className="mx-auto max-w-sm space-y-6">
      {/* Kedi Dönüş Mesajı */}
      <AnimatePresence>
        {returnMsg && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-center text-sm text-amber-300"
          >
            {returnMsg}
            <button
              onClick={() => setReturnMsg(null)}
              className="mx-auto mt-2 block text-xs text-amber-500"
            >
              Tamam 😺
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Büyük Kedi Avatar */}
      <div className="relative flex flex-col items-center gap-4 py-6">
        {/* XP Popup */}
        <AnimatePresence>
          {xpPopup !== null && (
            <motion.div
              initial={{ opacity: 0, y: 0 }}
              animate={{ opacity: 1, y: -30 }}
              exit={{ opacity: 0 }}
              className="absolute top-0 z-10 text-lg font-black text-green-400"
            >
              +{xpPopup} XP!
            </motion.div>
          )}
        </AnimatePresence>

        {/* Kedi Emoji (animasyonlu) */}
        <motion.div
          animate={
            config.animation === 'bounce'
              ? { y: [0, -12, 0] }
              : config.animation === 'shake'
                ? { rotate: [-5, 5, -5, 5, 0] }
                : { rotate: [-3, 3, -3] }
          }
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          className="cursor-pointer select-none text-8xl"
          onClick={() => interact('pet')}
          whileTap={{ scale: 0.85 }}
        >
          {config.emoji}
        </motion.div>

        {/* İsim + Seviye + Mood */}
        <div className="text-center">
          <h1 className="text-2xl font-black text-white">{pet.name}</h1>
          <div className="mt-1 flex items-center justify-center gap-2">
            <span
              className={`rounded-full bg-gradient-to-r px-2 py-0.5 text-sm font-semibold ${config.bg} text-white`}
            >
              Seviye {level}
            </span>
            <span className={`text-sm ${config.color}`}>{config.label}</span>
          </div>
        </div>

        {/* XP Bar */}
        <div className="w-full">
          <div className="mb-1 flex justify-between text-xs text-white/40">
            <span>XP: {pet.xp}</span>
            <span>
              Seviye {level + 1} için %{progress}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/10">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.8 }}
              className={`h-full rounded-full bg-gradient-to-r ${config.bg}`}
            />
          </div>
        </div>

        {/* Coin */}
        <div className="flex items-center gap-1 font-bold text-amber-400">
          <span className="text-lg">🪙</span>
          <span>{pet.coins} coin</span>
        </div>
      </div>

      {/* Etkileşim Butonları */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { type: 'pet' as const, icon: Heart, label: 'Okşa', color: 'from-pink-500 to-rose-500' },
          {
            type: 'feed' as const,
            icon: Coffee,
            label: 'Besle',
            color: 'from-amber-500 to-orange-500',
          },
          {
            type: 'play' as const,
            icon: Gamepad2,
            label: 'Oyna',
            color: 'from-green-500 to-emerald-500',
          },
        ].map((btn) => (
          <motion.button
            key={btn.type}
            whileTap={{ scale: 0.92 }}
            onClick={() => interact(btn.type)}
            disabled={interacting}
            className={`flex flex-col items-center gap-2 rounded-2xl bg-gradient-to-br p-4 ${btn.color} shadow-lg disabled:opacity-50`}
          >
            <btn.icon size={22} className="text-white" />
            <span className="text-xs font-bold text-white">{btn.label}</span>
          </motion.button>
        ))}
      </div>

      {/* Sakatlık Uyarısı */}
      {pet.hasInjury && (
        <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/10 p-4">
          <p className="text-center text-sm text-yellow-300">
            🩹 {pet.name} {pet.injuredPart ? `${pet.injuredPart} sakatlığı` : 'bir sakatlık'}{' '}
            yaşıyor — senin gibi!
          </p>
        </div>
      )}

      {/* Mini Oyun + Mağaza Linkleri */}
      <div className="space-y-2">
        <Link href="/dashboard/pet/shop">
          <motion.div
            whileHover={{ x: 4 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-4 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4"
          >
            <ShoppingBag size={20} className="text-amber-400" />
            <div className="flex-1">
              <p className="text-sm font-bold text-white">Kozmetik Mağaza</p>
              <p className="text-xs text-white/50">Coin ile kıyafet ve aksesuar al</p>
            </div>
            <ChevronRight size={16} className="text-white/30" />
          </motion.div>
        </Link>
        <Link href="/dashboard/pet/minigame">
          <motion.div
            whileHover={{ x: 4 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-4 rounded-2xl border border-purple-500/20 bg-purple-500/10 p-4"
          >
            <Gamepad2 size={20} className="text-purple-400" />
            <div className="flex-1">
              <p className="text-sm font-bold text-white">Mini Oyun</p>
              <p className="text-xs text-white/50">Oyna, XP ve coin kazan</p>
            </div>
            <ChevronRight size={16} className="text-white/30" />
          </motion.div>
        </Link>
      </div>
    </div>
  )
}

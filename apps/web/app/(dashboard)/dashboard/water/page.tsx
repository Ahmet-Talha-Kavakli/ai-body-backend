'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Droplets, Flame, Plus, X } from 'lucide-react'
import { CircularProgress } from './components/CircularProgress'
import { WeeklyChart } from './components/WeeklyChart'

const QUICK_AMOUNTS = [
  { ml: 200, label: 'Bardak', emoji: '🥛' },
  { ml: 350, label: 'Büyük', emoji: '🫗' },
  { ml: 500, label: 'Şişe', emoji: '🍶' },
  { ml: 750, label: 'Sport', emoji: '🧴' },
]

interface WaterData {
  todayMl: number
  goalMl: number
  streak: number
  weeklyData: { day: string; ml: number; goal: number }[]
}

export default function WaterPage() {
  const [data, setData] = useState<WaterData | null>(null)
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [showCustom, setShowCustom] = useState(false)
  const [customMl, setCustomMl] = useState('')
  const [coachMessage, setCoachMessage] = useState<string | null>(null)
  const coachTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/water/dashboard')
      if (!res.ok) {
        console.error('[water] dashboard fetch failed:', res.status)
        return
      }
      setData(await res.json())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const addWater = useCallback(
    async (ml: number) => {
      if (adding || ml <= 0) return
      setAdding(true)
      // Optimistic update
      setData((prev) =>
        prev
          ? {
              ...prev,
              todayMl: prev.todayMl + ml,
              weeklyData: prev.weeklyData.map((d, i) => {
                const todayIdx = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1
                return i === todayIdx ? { ...d, ml: d.ml + ml } : d
              }),
            }
          : prev
      )
      try {
        const res = await fetch('/api/nutrition/water', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ml }),
        })
        if (!res.ok) {
          // revert optimistic update
          setData((prev) =>
            prev
              ? {
                  ...prev,
                  todayMl: Math.max(0, prev.todayMl - ml),
                  weeklyData: prev.weeklyData.map((d, i) => {
                    const todayIdx = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1
                    return i === todayIdx ? { ...d, ml: Math.max(0, d.ml - ml) } : d
                  }),
                }
              : prev
          )
          return
        }
        const json = await res.json()
        if (json.coachMessage) {
          setCoachMessage(json.coachMessage)
          if (coachTimerRef.current) clearTimeout(coachTimerRef.current)
          coachTimerRef.current = setTimeout(() => setCoachMessage(null), 5000)
        }
      } catch {
        // Revert optimistic on error
        setData((prev) =>
          prev
            ? {
                ...prev,
                todayMl: prev.todayMl - ml,
                weeklyData: prev.weeklyData.map((d, i) => {
                  const todayIdx = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1
                  return i === todayIdx ? { ...d, ml: Math.max(0, d.ml - ml) } : d
                }),
              }
            : prev
        )
      } finally {
        await fetchData()
        setAdding(false)
      }
    },
    [adding, fetchData]
  )

  const todayMl = data?.todayMl ?? 0
  const goalMl = data?.goalMl ?? 2500
  const remaining = goalMl - todayMl

  return (
    <div className="mx-auto max-w-2xl space-y-4 pb-24">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-teal-500/20">
          <Droplets size={20} className="text-teal-400" />
        </div>
        <div>
          <h1 className="text-xl font-black text-white">Su Takibi</h1>
          <p className="text-xs text-white/40">Günlük hidrasyon hedefin</p>
        </div>
      </motion.div>

      {/* Hero: Circular progress */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="glass-card-teal flex flex-col items-center gap-4 rounded-3xl p-6"
      >
        <CircularProgress current={loading ? 0 : todayMl} goal={goalMl} size={200} />

        {/* Stats row */}
        <div className="flex w-full gap-3">
          <div className="flex-1 rounded-2xl border border-teal-500/20 bg-teal-500/10 p-3 text-center">
            <p className="text-lg font-black text-white">
              {remaining > 0 ? `${(remaining / 1000).toFixed(1)}L` : '✓'}
            </p>
            <p className="text-xs text-white/40">{remaining > 0 ? 'kalan' : 'tamamlandı'}</p>
          </div>
          <div className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-orange-500/20 bg-orange-500/10 p-3">
            <Flame size={16} className="text-orange-400" />
            <div className="text-center">
              <p className="text-lg font-black text-orange-300">{data?.streak ?? 0}</p>
              <p className="text-xs text-white/40">günlük seri</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* AI Coach Toast */}
      <AnimatePresence>
        {coachMessage && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex items-start gap-3 rounded-2xl border border-teal-500/20 bg-teal-500/10 px-4 py-3"
          >
            <span className="text-lg">🤖</span>
            <p className="text-sm text-teal-200">{coachMessage}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick add */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card rounded-3xl p-4"
      >
        <p className="mb-3 text-sm font-semibold text-white/50">Hızlı Ekle</p>
        <div className="grid grid-cols-4 gap-2">
          {QUICK_AMOUNTS.map(({ ml, label, emoji }) => (
            <motion.button
              key={ml}
              whileTap={{ scale: 0.92 }}
              whileHover={{ scale: 1.04 }}
              disabled={adding}
              onClick={() => addWater(ml)}
              className="flex flex-col items-center gap-1 rounded-2xl border border-teal-500/20 bg-teal-500/10 px-2 py-3 text-teal-300 transition-colors hover:bg-teal-500/20 disabled:opacity-50"
            >
              <span className="text-xl">{emoji}</span>
              <span className="text-sm font-black">+{ml}</span>
              <span className="text-[10px] text-teal-400/60">{label}</span>
            </motion.button>
          ))}
        </div>

        {/* Custom amount */}
        <div className="mt-3">
          <AnimatePresence>
            {showCustom ? (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex gap-2 overflow-hidden"
              >
                <input
                  type="number"
                  value={customMl}
                  onChange={(e) => setCustomMl(e.target.value)}
                  placeholder="Miktar (ml)"
                  className="flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-teal-500/50"
                  autoFocus
                />
                <button
                  onClick={() => {
                    const ml = parseInt(customMl)
                    if (ml > 0 && ml <= 5000) addWater(ml)
                    setCustomMl('')
                    setShowCustom(false)
                  }}
                  className="rounded-xl bg-teal-500 px-4 py-2 text-sm font-bold text-white"
                >
                  Ekle
                </button>
                <button
                  onClick={() => setShowCustom(false)}
                  className="rounded-xl border border-white/10 px-3 py-2 text-white/40"
                >
                  <X size={16} />
                </button>
              </motion.div>
            ) : (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={() => setShowCustom(true)}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-white/10 py-2 text-sm text-white/40 hover:text-white/60"
              >
                <Plus size={14} /> Özel miktar
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Weekly chart */}
      {!loading && data?.weeklyData && data.weeklyData.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="glass-card rounded-3xl p-4"
        >
          <p className="mb-4 text-sm font-semibold text-white/50">Bu Hafta</p>
          <WeeklyChart data={data.weeklyData} />
        </motion.div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-4">
          <div className="h-72 animate-pulse rounded-3xl bg-white/5" />
          <div className="h-36 animate-pulse rounded-3xl bg-white/5" />
        </div>
      )}
    </div>
  )
}

'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Moon, Star, Clock, TrendingUp, Plus, X, Sun } from 'lucide-react'

interface SleepData {
  latest: { duration: number; quality: number; recordedAt: string } | null
  avgQuality: number
  avgDurationMin: number
  readinessScore: number | null
  weeklyRecords: { day: string; duration: number; quality: number; recordedAt: string }[]
}

function QualityRing({ score, size = 140 }: { score: number; size?: number }) {
  const r = (size - 16) / 2
  const circ = 2 * Math.PI * r
  const offset = circ * (1 - Math.min(score, 100) / 100)
  const color =
    score >= 80 ? '#818cf8' : score >= 60 ? '#a78bfa' : score > 0 ? '#f87171' : '#818cf8'

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgba(129,140,248,0.1)"
          strokeWidth={10}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={10}
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <motion.span
          className="text-3xl font-black text-white"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          {score}
        </motion.span>
        <span className="text-xs text-white/40">kalite</span>
      </div>
    </div>
  )
}

function hoursLabel(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}s ${m}dk` : `${h}s`
}

export default function SleepPage() {
  const [data, setData] = useState<SleepData | null>(null)
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ bedTime: '23:00', wakeTime: '07:00', quality: 75 })
  const [submitting, setSubmitting] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/sleep/dashboard')
      if (res.ok) setData(await res.json())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const logSleep = useCallback(async () => {
    setSubmitting(true)
    try {
      // Build ISO datetime strings for today
      const today = new Date()
      const todayStr = today.toISOString().split('T')[0]
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)
      const yesterdayStr = yesterday.toISOString().split('T')[0]

      const [bh] = form.bedTime.split(':').map(Number)
      const [wh] = form.wakeTime.split(':').map(Number)

      // If bedtime hour > waketime hour, bed was yesterday
      const bedDate = bh > wh ? yesterdayStr : todayStr
      const bedtime = `${bedDate}T${form.bedTime}:00`
      const wakeTime = `${todayStr}T${form.wakeTime}:00`

      // quality 0-100 → 1-10 scale for POST route
      const qualityScaled = Math.round((form.quality / 100) * 10)

      await fetch('/api/tracking/sleep', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bedtime, wakeTime, quality: qualityScaled }),
      })
      setShowAdd(false)
      await fetchData()
    } finally {
      setSubmitting(false)
    }
  }, [form, fetchData])

  const qualityScore = data?.latest?.quality ?? data?.avgQuality ?? 0
  const latestHours = data?.latest ? hoursLabel(data.latest.duration) : '—'
  const avgHours = data?.avgDurationMin ? hoursLabel(data.avgDurationMin) : '—'
  const qualityLabel =
    qualityScore >= 80 ? 'Mükemmel' : qualityScore >= 60 ? 'İyi' : qualityScore > 0 ? 'Düşük' : '—'

  return (
    <div className="mx-auto max-w-2xl space-y-4 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-purple-500/20">
            <Moon size={20} className="text-purple-400" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white">Uyku</h1>
            <p className="text-xs text-white/40">Uyku kalitesi ve analizi</p>
          </div>
        </div>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 rounded-xl border border-purple-500/20 bg-purple-500/10 px-3 py-2 text-sm font-medium text-purple-300"
        >
          <Plus size={16} /> Kaydet
        </motion.button>
      </div>

      {/* Hero: ring + stats */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card rounded-3xl p-5"
      >
        <div className="flex items-center gap-6">
          <QualityRing score={loading ? 0 : qualityScore} />
          <div className="flex-1 space-y-3">
            <div>
              <p className="text-xs text-white/40">Son Uyku</p>
              <p className="text-2xl font-black text-white">{loading ? '—' : latestHours}</p>
              <p className="text-xs text-purple-400">{loading ? '' : qualityLabel}</p>
            </div>
            <div>
              <p className="text-xs text-white/40">Haftalık Ortalama</p>
              <p className="text-lg font-bold text-purple-300">{loading ? '—' : avgHours}</p>
            </div>
            {data?.readinessScore != null && (
              <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/10 px-3 py-2">
                <p className="text-xs text-white/40">Hazırlık</p>
                <p className="text-base font-black text-indigo-300">{data.readinessScore}/100</p>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Weekly chart */}
      {!loading && (data?.weeklyRecords?.length ?? 0) > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card rounded-3xl p-4"
        >
          <p className="mb-4 text-sm font-semibold text-white/50">Bu Hafta</p>
          <div className="flex items-end justify-between gap-2">
            {data!.weeklyRecords.map((r, i) => {
              const pct = Math.min(r.duration / (9 * 60), 1)
              const qColor =
                r.quality >= 80
                  ? 'from-indigo-500 to-purple-500'
                  : r.quality >= 60
                    ? 'from-purple-500 to-violet-600'
                    : 'from-red-500 to-rose-500'
              return (
                <div key={i} className="flex flex-1 flex-col items-center gap-1">
                  <div className="relative flex h-24 w-full items-end overflow-hidden rounded-lg bg-white/5">
                    <motion.div
                      className={`w-full rounded-lg bg-gradient-to-t ${qColor}`}
                      style={{ minHeight: pct > 0 ? 4 : 0 }}
                      initial={{ height: 0 }}
                      animate={{ height: `${Math.max(pct * 100, pct > 0 ? 5 : 0)}%` }}
                      transition={{ delay: i * 0.07, duration: 0.6, ease: 'easeOut' }}
                    />
                  </div>
                  <span className="text-[10px] text-white/30">{r.day}</span>
                  {r.duration > 0 && (
                    <span className="text-[10px] font-medium text-purple-400">
                      {Math.floor(r.duration / 60)}s
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </motion.div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          {
            label: 'Ort. Kalite',
            value: loading ? '—' : `${data?.avgQuality ?? 0}%`,
            icon: Star,
            color: 'text-yellow-400',
          },
          {
            label: 'Ort. Süre',
            value: loading ? '—' : avgHours,
            icon: Clock,
            color: 'text-blue-400',
          },
          {
            label: 'Kayıt',
            value: loading ? '—' : `${data?.weeklyRecords?.length ?? 0}`,
            icon: TrendingUp,
            color: 'text-green-400',
          },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + i * 0.07 }}
            className="glass-card rounded-2xl p-3 text-center"
          >
            <stat.icon size={16} className={`${stat.color} mx-auto mb-1`} />
            <p className="text-base font-black text-white">{stat.value}</p>
            <p className="text-[10px] text-white/40">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Sleep tips */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="glass-card rounded-3xl p-4"
      >
        <p className="mb-3 text-sm font-semibold text-white/50">Uyku İpuçları</p>
        <div className="space-y-2">
          {[
            { icon: '🌙', tip: 'Her gece aynı saatte uyu ve uyan' },
            { icon: '📱', tip: 'Yatmadan 1 saat önce ekrana bakmayı bırak' },
            { icon: '🌡️', tip: "Oda sıcaklığını 18-20°C'de tut" },
            { icon: '☕', tip: 'Öğleden sonra kafein tüketimini azalt' },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3 rounded-xl bg-white/[0.03] px-3 py-2">
              <span>{item.icon}</span>
              <p className="text-sm text-white/60">{item.tip}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-4">
          <div className="h-44 animate-pulse rounded-3xl bg-white/5" />
          <div className="h-32 animate-pulse rounded-3xl bg-white/5" />
        </div>
      )}

      {/* Add sleep modal */}
      <AnimatePresence>
        {showAdd && (
          <motion.div
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowAdd(false)}
          >
            <motion.div
              className="w-full max-w-lg rounded-t-3xl border-t border-white/10 bg-[#0a0f1e] p-6 pb-10"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-5 flex items-center justify-between">
                <h3 className="text-lg font-bold text-white">Uyku Kaydet</h3>
                <button onClick={() => setShowAdd(false)}>
                  <X size={20} className="text-white/40" />
                </button>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 flex items-center gap-1 text-xs text-white/50">
                      <Moon size={12} /> Yatış
                    </label>
                    <input
                      type="time"
                      value={form.bedTime}
                      onChange={(e) => setForm((p) => ({ ...p, bedTime: e.target.value }))}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-purple-500/50"
                    />
                  </div>
                  <div>
                    <label className="mb-1 flex items-center gap-1 text-xs text-white/50">
                      <Sun size={12} /> Uyanış
                    </label>
                    <input
                      type="time"
                      value={form.wakeTime}
                      onChange={(e) => setForm((p) => ({ ...p, wakeTime: e.target.value }))}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-purple-500/50"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-2 block text-xs text-white/50">
                    Kalite — {form.quality}/100
                  </label>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={form.quality}
                    onChange={(e) => setForm((p) => ({ ...p, quality: parseInt(e.target.value) }))}
                    className="w-full accent-purple-500"
                  />
                  <div className="mt-1 flex justify-between text-[10px] text-white/30">
                    <span>Kötü</span>
                    <span>Orta</span>
                    <span>Mükemmel</span>
                  </div>
                </div>
                <button
                  onClick={logSleep}
                  disabled={submitting}
                  className="w-full rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 py-3 font-bold text-white disabled:opacity-50"
                >
                  {submitting ? 'Kaydediliyor...' : 'Kaydet'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

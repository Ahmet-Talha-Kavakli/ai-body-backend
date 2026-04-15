'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Loader2, Trophy } from 'lucide-react'
import { levelProgress } from '@/lib/gamification/xpSystem'
import type { Badge } from '@/lib/gamification/badges'

interface GamificationData {
  xp: number
  level: number
  progress: number
  badges: (Badge & { earned: boolean; earnedAt?: string })[]
  totalBadges: number
  earnedBadges: number
  activityDates: string[]
}

export default function AchievementsPage() {
  const [data, setData] = useState<GamificationData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'badges' | 'streak'>('badges')

  useEffect(() => {
    fetch('/api/gamification')
      .then((r) => r.json())
      .then((d: GamificationData) => {
        setData(d)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading)
    return (
      <div className="flex min-h-64 items-center justify-center">
        <Loader2 className="animate-spin text-indigo-400" size={32} />
      </div>
    )

  if (!data) return null

  // Son 35 günlük aktivite grid
  const today = new Date()
  const activitySet = new Set(data.activityDates.map((d) => new Date(d).toDateString()))
  const last35Days = Array.from({ length: 35 }, (_, i) => {
    const d = new Date(today)
    d.setDate(today.getDate() - (34 - i))
    return { date: d, active: activitySet.has(d.toDateString()) }
  })

  const earnedBadges = data.badges.filter((b) => b.earned)
  const unearnedBadges = data.badges.filter((b) => !b.earned)

  // levelProgress is imported but data already has level/progress from the API
  // We use it here for consistency if needed
  void levelProgress

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="mb-1 text-2xl font-black text-white">Başarımlar</h1>
        <p className="text-sm text-white/50">
          {data.earnedBadges}/{data.totalBadges} rozet kazanıldı
        </p>
      </div>

      {/* XP & Seviye Kartı */}
      <div className="rounded-2xl border border-indigo-500/20 bg-gradient-to-br from-indigo-500/20 to-purple-500/10 p-5">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider text-white/40">Seviye</p>
            <p className="text-4xl font-black text-white">{data.level}</p>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-wider text-white/40">Toplam XP</p>
            <p className="text-2xl font-black text-indigo-400">{data.xp.toLocaleString('tr-TR')}</p>
          </div>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-white/10">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${data.progress}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500"
          />
        </div>
        <p className="mt-1 text-right text-xs text-white/30">
          Seviye {data.level + 1} için %{data.progress}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 rounded-xl bg-white/5 p-1">
        {(['badges', 'streak'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-all ${activeTab === tab ? 'bg-indigo-500 text-white' : 'text-white/40'}`}
          >
            {tab === 'badges' ? '🏅 Rozetler' : '🔥 Aktivite'}
          </button>
        ))}
      </div>

      {activeTab === 'badges' && (
        <div className="space-y-4">
          {/* Kazanılanlar */}
          {earnedBadges.length > 0 && (
            <div>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-white/40">
                Kazanılanlar
              </h3>
              <div className="grid grid-cols-3 gap-3">
                {earnedBadges.map((badge, i) => (
                  <motion.div
                    key={badge.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex flex-col items-center gap-2 rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-indigo-500/20 to-purple-500/10 p-4 text-center"
                  >
                    <div className="text-3xl">{badge.emoji}</div>
                    <p className="text-xs font-bold leading-tight text-white">{badge.name}</p>
                    <p className="text-[10px] text-indigo-400">+{badge.xpReward} XP</p>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Kazanılmayanlar */}
          <div>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-white/40">
              Kilitli
            </h3>
            <div className="grid grid-cols-3 gap-3">
              {unearnedBadges.map((badge, i) => (
                <motion.div
                  key={badge.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                  className="flex flex-col items-center gap-2 rounded-2xl border border-white/5 bg-white/[0.03] p-4 text-center opacity-50"
                >
                  <div className="text-3xl grayscale">{badge.emoji}</div>
                  <p className="text-xs font-bold leading-tight text-white/40">{badge.name}</p>
                  <p className="text-[10px] text-white/20">{badge.condition}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'streak' && (
        <div className="space-y-4">
          {/* Aktivite Grid */}
          <div>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-white/40">
              Son 35 Gün
            </h3>
            <div className="grid grid-cols-7 gap-1">
              {last35Days.map((day, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.01 }}
                  className={`aspect-square rounded-lg ${day.active ? 'bg-indigo-500' : 'bg-white/5'}`}
                  title={day.date.toLocaleDateString('tr-TR')}
                />
              ))}
            </div>
            <div className="mt-2 flex justify-between text-xs text-white/30">
              <span>35 gün önce</span>
              <span>Bugün</span>
            </div>
          </div>

          {/* Streak istatistikleri */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-orange-500/20 bg-orange-500/10 p-4 text-center">
              <p className="text-3xl font-black text-orange-400">
                {last35Days.filter((d) => d.active).length}
              </p>
              <p className="mt-1 text-xs text-white/40">Son 35 Günde Aktif</p>
            </div>
            <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/10 p-4 text-center">
              <Trophy size={28} className="mx-auto mb-1 text-indigo-400" />
              <p className="text-xs text-white/40">Toplam Rozet</p>
              <p className="text-xl font-black text-indigo-400">{data.earnedBadges}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

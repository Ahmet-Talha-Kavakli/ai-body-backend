'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, Award, Dumbbell, Activity } from 'lucide-react'
import Image from 'next/image'
import { THIINGS } from '@/lib/thiings'
import { NeonIcon } from '@/components/ui/neon-icon'

interface ProgressData {
  monthlyActivity: { month: string; sessions: number; calories: number; minutes: number }[]
  strengthProgress: { name: string; records: { date: string; value: number }[] }[]
  summary: { totalSessions: number; totalCalories: number; totalMinutes: number; avgFormScore: number }
  profile: { weightKg: number; heightCm: number; age: number } | null
}

const ACHIEVEMENTS = [
  { title: '7 Günlük Seri', desc: 'Üst üste 7 gün antrenman', img: THIINGS.flame, minSessions: 7 },
  { title: '10 Seans', desc: 'Toplam 10 seans tamamlandı', img: THIINGS.trophy, minSessions: 10 },
  { title: '25 Seans', desc: 'Toplam 25 seans tamamlandı', img: THIINGS.goldMedal, minSessions: 25 },
  { title: '50 Seans', desc: 'Toplam 50 seans tamamlandı', img: THIINGS.star, minSessions: 50 },
]

export default function ProgressPage() {
  const [data, setData] = useState<ProgressData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/progress')
      .then(r => r.json())
      .then(d => setData(d))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="space-y-8 max-w-5xl">
        <div className="h-12 bg-muted/30 rounded-xl animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 bg-muted/30 rounded-2xl animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-64 bg-muted/30 rounded-2xl animate-pulse" />
          <div className="h-64 bg-muted/30 rounded-2xl animate-pulse" />
        </div>
      </div>
    )
  }

  const summary = data?.summary ?? { totalSessions: 0, totalCalories: 0, totalMinutes: 0, avgFormScore: 0 }
  const monthly = data?.monthlyActivity ?? []
  const strength = data?.strengthProgress ?? []
  const maxSessions = monthly.length ? Math.max(...monthly.map(m => m.sessions), 1) : 1

  const summaryCards = [
    { label: 'Toplam Seans', value: summary.totalSessions.toString(), unit: 'seans', neonType: 'activity' as const, color: 'blue', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
    { label: 'Yakılan Kalori', value: summary.totalCalories.toLocaleString('tr-TR'), unit: 'kcal', neonType: 'flame' as const, color: 'orange', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
    { label: 'Toplam Süre', value: Math.floor(summary.totalMinutes / 60).toString(), unit: 'saat', neonType: 'clock' as const, color: 'green', bg: 'bg-green-500/10', border: 'border-green-500/20' },
    { label: 'Form Skoru', value: summary.avgFormScore > 0 ? `${summary.avgFormScore}` : '–', unit: '/100', neonType: 'target' as const, color: 'purple', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
  ]

  return (
    <div className="space-y-8 max-w-5xl">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-black mb-1">İlerleyiş</h1>
        <p className="text-muted-foreground">Performans ve gelişim analizi</p>
      </motion.div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className={`${card.bg} border ${card.border} rounded-2xl p-5`}
          >
            <NeonIcon type={card.neonType} color={card.color as any} size={28} />
            <p className="text-xs text-muted-foreground mb-1">{card.label}</p>
            <p className="text-2xl font-black">
              {card.value}
              <span className="text-sm font-normal text-muted-foreground ml-1">{card.unit}</span>
            </p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly sessions chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card/50 border border-border/30 rounded-2xl p-5"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold">Aylık Seans Sayısı</h3>
            <Activity size={16} className="text-blue-400" />
          </div>

          {monthly.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
              Henüz seans verisi yok
            </div>
          ) : (
            <div className="flex items-end gap-2 h-32">
              {monthly.map((month, i) => (
                <div key={month.month} className="flex-1 flex flex-col items-center gap-2">
                  <span className="text-xs text-muted-foreground">{month.sessions}</span>
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${(month.sessions / maxSessions) * 100}%` }}
                    transition={{ delay: 0.3 + i * 0.08, duration: 0.6 }}
                    className={`w-full rounded-t-lg ${i === monthly.length - 1 ? 'bg-blue-500/50' : 'bg-blue-500'}`}
                  />
                  <span className="text-xs text-muted-foreground">{month.month}</span>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Strength progress */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-card/50 border border-border/30 rounded-2xl p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold">Güç Gelişimi</h3>
            <Dumbbell size={16} className="text-blue-400" />
          </div>

          {strength.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
              Henüz egzersiz verisi yok
            </div>
          ) : (
            <div className="space-y-4">
              {strength.map((item, i) => {
                const records = item.records ?? []
                const current = records[records.length - 1]?.value ?? 0
                const start = records[0]?.value ?? 0
                const max = Math.max(...records.map(r => r.value), 1) * 1.2
                const changePct = start > 0 ? Math.round(((current - start) / start) * 100) : 0
                return (
                  <div key={item.name}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium">{item.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">{current}</span>
                        {changePct > 0 && <span className="text-green-400 text-xs">+{changePct}%</span>}
                      </div>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: `${(start / max) * 100}%` }}
                        animate={{ width: `${(current / max) * 100}%` }}
                        transition={{ delay: 0.4 + i * 0.1, duration: 0.8 }}
                        className="h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full"
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </motion.div>
      </div>

      {/* Achievements */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="bg-card/50 border border-border/30 rounded-2xl p-5"
      >
        <div className="flex items-center gap-3 mb-5">
          <Image src={THIINGS.trophy} alt="trophy" width={32} height={32} unoptimized />
          <h3 className="font-bold text-lg">Başarılar</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {ACHIEVEMENTS.map((achievement, i) => {
            const earned = summary.totalSessions >= achievement.minSessions
            const progress = Math.min(100, Math.round((summary.totalSessions / achievement.minSessions) * 100))
            return (
              <motion.div
                key={achievement.title}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 + i * 0.08 }}
                className={`flex items-start gap-4 p-4 rounded-xl border ${
                  earned
                    ? 'bg-yellow-500/5 border-yellow-500/20'
                    : 'bg-muted/20 border-border/20'
                }`}
              >
                <div className={`shrink-0 ${!earned ? 'grayscale opacity-40' : ''}`}>
                  <Image src={achievement.img} alt={achievement.title} width={44} height={44} unoptimized />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm">{achievement.title}</p>
                  <p className="text-xs text-muted-foreground mb-2">{achievement.desc}</p>
                  {earned ? (
                    <p className="text-xs text-yellow-400 flex items-center gap-1">
                      <TrendingUp size={10} /> Tamamlandı
                    </p>
                  ) : (
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-muted-foreground">İlerleme</span>
                        <span>{progress}%</span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${progress}%` }}
                          transition={{ delay: 0.6, duration: 0.8 }}
                          className="h-full bg-blue-500 rounded-full"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>
      </motion.div>
    </div>
  )
}

'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import {
  Play, Flame, Activity, Heart, Zap, TrendingUp,
  Clock, CheckCircle, ChevronRight, Dumbbell, Apple,
  Droplets, Sparkles, Loader2
} from 'lucide-react'
import { useUser } from '@clerk/nextjs'
import Image from 'next/image'
import { THIINGS } from '@/lib/thiings'
import { NeonIcon } from '@/components/ui/neon-icon'

interface DashboardStats {
  stats: {
    weeklyCalories: number
    weeklyMinutes: number
    weeklySessions: number
    totalSessions: number
  }
  todayNutrition: {
    calories: number
    protein: number
    carbs: number
    fat: number
    goal: { dailyCalories: number; proteinG: number; carbsG: number; fatG: number }
  }
  last7Days: { day: string; date: string; done: boolean; calories: number; isToday: boolean }[]
  monthlyActivity: Record<string, number>
}

function StatCard({
  label, value, unit, neonType, color, bg, border, sub, delay
}: {
  label: string; value: string; unit: string; neonType: 'flame' | 'heart' | 'lightning' | 'zap' | 'trophy' | 'star' | 'droplet' | 'activity' | 'clock' | 'target' | 'fire-ring'
  color: string; bg: string; border: string; sub: string; delay: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className={`bg-card/50 border ${border} rounded-2xl p-5 flex items-center justify-between`}
    >
      <div>
        <p className="text-xs text-muted-foreground mb-1">{label}</p>
        <div className="flex items-end gap-1">
          <p className="text-2xl font-black">{value}</p>
          <p className="text-sm text-muted-foreground mb-0.5">{unit}</p>
        </div>
        <p className="text-xs text-green-400 mt-1">{sub}</p>
      </div>
      <div className={`${bg} ${border} border rounded-xl p-3`}>
        <NeonIcon type={neonType} color={color.replace('text-', '') as any} size={24} />
      </div>
    </motion.div>
  )
}

export default function DashboardPage() {
  const { user } = useUser()
  const [data, setData] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [generatingProgram, setGeneratingProgram] = useState(false)
  const [programGenerated, setProgramGenerated] = useState(false)

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Günaydın' : hour < 17 ? 'İyi öğleden sonralar' : 'İyi akşamlar'
  const firstName = user?.firstName ?? ''

  useEffect(() => {
    fetch('/api/dashboard/stats')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const generateProgram = useCallback(async () => {
    setGeneratingProgram(true)
    try {
      const res = await fetch('/api/ai/generate-program', { method: 'POST' })
      if (res.ok) setProgramGenerated(true)
    } finally {
      setGeneratingProgram(false)
    }
  }, [])

  const stats = data?.stats
  const nutrition = data?.todayNutrition
  const days = data?.last7Days ?? []
  const doneDays = useMemo(() => days.filter(d => d.done).length, [days])

  // Fallback değerler (veri yokken)
  const STATS = useMemo(() => [
    {
      label: 'Kalori Yakıldı', value: stats ? stats.weeklyCalories.toLocaleString('tr-TR') : '—',
      unit: 'kcal', neonType: 'flame' as const, color: 'orange',
      bg: 'bg-orange-500/10', border: 'border-orange-500/20',
      sub: 'bu hafta'
    },
    {
      label: 'Aktif Süre', value: stats ? Math.round(stats.weeklyMinutes / 60 * 10) / 10 + '' : '—',
      unit: 'saat', neonType: 'clock' as const, color: 'blue',
      bg: 'bg-blue-500/10', border: 'border-blue-500/20',
      sub: 'bu hafta'
    },
    {
      label: 'Toplam Seans', value: stats ? stats.totalSessions + '' : '—',
      unit: 'seans', neonType: 'activity' as const, color: 'green',
      bg: 'bg-green-500/10', border: 'border-green-500/20',
      sub: 'tüm zamanlar'
    },
    {
      label: 'Bu Hafta', value: stats ? stats.weeklySessions + '' : '—',
      unit: 'seans', neonType: 'zap' as const, color: 'purple',
      bg: 'bg-purple-500/10', border: 'border-purple-500/20',
      sub: `${doneDays}/7 gün aktif`
    },
  ], [stats, doneDays])

  const goalCal = nutrition?.goal.dailyCalories ?? 2200
  const goalProtein = nutrition?.goal.proteinG ?? 150
  const goalCarbs = nutrition?.goal.carbsG ?? 250
  const goalFat = nutrition?.goal.fatG ?? 70

  return (
    <div className="space-y-8 max-w-7xl">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start justify-between gap-4 flex-wrap"
      >
        <div>
          <h1 className="text-3xl font-black mb-1">
            {greeting}{firstName ? `, ${firstName}` : ''}!
          </h1>
          <p className="text-muted-foreground">
            {new Date().toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <button
          onClick={generateProgram}
          disabled={generatingProgram || programGenerated}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-60 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-blue-500/20 shrink-0"
        >
          {generatingProgram ? (
            <><Loader2 size={14} className="animate-spin" /> Oluşturuluyor...</>
          ) : programGenerated ? (
            <><CheckCircle size={14} /> Program Hazır!</>
          ) : (
            <><Sparkles size={14} /> AI Program Oluştur</>
          )}
        </button>
      </motion.div>

      {/* İstatistikler */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-card/30 border border-border/20 rounded-2xl p-5 h-24 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {STATS.map((s, i) => (
            <StatCard key={s.label} {...s} delay={i * 0.08} />
          ))}
        </div>
      )}

      {/* Ana içerik */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bugünkü antrenman */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2 bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-6 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 right-12 w-32 h-32 bg-white/5 rounded-full translate-y-1/2" />

          <div className="relative z-10">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-blue-200 text-sm font-medium mb-1">Bugünkü Antrenman</p>
                <h2 className="text-white text-2xl font-black">Full Body Strength</h2>
              </div>
              <div className="flex items-center gap-3">
                <Image src={THIINGS.dumbbell} alt="dumbbell" width={56} height={56} className="drop-shadow-2xl" unoptimized />
                <span className="bg-white/20 text-white text-xs font-semibold px-3 py-1.5 rounded-full">Orta</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-6">
              {[
                { label: 'Süre', value: '~45 dk', icon: Clock },
                { label: 'Egzersiz', value: '5', icon: Dumbbell },
                { label: 'Kalori', value: '~300', icon: Flame },
              ].map(item => (
                <div key={item.label} className="bg-white/10 rounded-xl p-3">
                  <item.icon size={14} className="text-blue-200 mb-1" />
                  <p className="text-white text-lg font-bold">{item.value}</p>
                  <p className="text-blue-200 text-xs">{item.label}</p>
                </div>
              ))}
            </div>

            <Link
              href="/dashboard/session"
              className="flex items-center justify-center gap-2 w-full bg-white text-blue-700 hover:bg-blue-50 rounded-xl py-3.5 font-bold text-sm transition-colors"
            >
              <Play size={16} />
              Seansı Başlat
            </Link>
          </div>
        </motion.div>

        {/* Haftalık aktivite */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-card/50 border border-border/30 rounded-2xl p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold">Haftalık Aktivite</h3>
            <TrendingUp size={16} className="text-green-400" />
          </div>

          <div className="space-y-2 mb-4">
            {loading ? (
              [...Array(7)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-2">
                  <div className="w-8 h-3 bg-muted/40 rounded animate-pulse" />
                  <div className="flex-1 h-2 bg-muted/30 rounded-full animate-pulse" />
                </div>
              ))
            ) : days.map((day) => (
              <div
                key={day.day}
                className={`flex items-center gap-3 p-2 rounded-lg ${day.isToday ? 'bg-blue-500/10 border border-blue-500/20' : ''}`}
              >
                <span className={`text-xs w-8 font-medium ${day.isToday ? 'text-blue-400' : 'text-muted-foreground'}`}>
                  {day.day}
                </span>
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: day.done ? '100%' : '0%' }}
                    transition={{ delay: 0.5, duration: 0.7 }}
                    className={`h-full rounded-full ${day.done ? 'bg-green-500' : ''}`}
                  />
                </div>
                {day.done
                  ? <CheckCircle size={13} className="text-green-400 shrink-0" />
                  : <span className="w-3.5 h-3.5 rounded-full border border-muted shrink-0" />
                }
              </div>
            ))}
          </div>

          <div className="bg-muted/30 rounded-xl p-3 text-center">
            <p className="text-2xl font-black text-green-400">{doneDays}/7</p>
            <p className="text-xs text-muted-foreground">gün tamamlandı</p>
          </div>
        </motion.div>
      </div>

      {/* Alt sıra */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Beslenme özeti */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-card/50 border border-border/30 rounded-2xl p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Image src={THIINGS.apple} alt="apple" width={28} height={28} unoptimized />
              <h3 className="font-bold">Bugünkü Beslenme</h3>
            </div>
            <Link href="/dashboard/nutrition" className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
              Detay <ChevronRight size={12} />
            </Link>
          </div>

          <div className="flex items-center gap-6 mb-4">
            <div className="relative w-20 h-20 shrink-0">
              <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90">
                <circle cx="40" cy="40" r="32" fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
                <circle
                  cx="40" cy="40" r="32" fill="none"
                  stroke="#F97316" strokeWidth="8"
                  strokeDasharray={`${Math.min(((nutrition?.calories ?? 0) / goalCal) * 201, 201)} 201`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <Apple size={13} className="text-orange-400" />
                <p className="text-xs font-bold">
                  {nutrition ? Math.round((nutrition.calories / goalCal) * 100) : 0}%
                </p>
              </div>
            </div>
            <div>
              {loading ? (
                <div className="space-y-2">
                  <div className="w-16 h-6 bg-muted/40 rounded animate-pulse" />
                  <div className="w-24 h-3 bg-muted/30 rounded animate-pulse" />
                </div>
              ) : (
                <>
                  <p className="text-2xl font-black">{nutrition?.calories ?? 0}</p>
                  <p className="text-xs text-muted-foreground">/ {goalCal} kcal</p>
                  <p className="text-xs text-orange-400 mt-1">
                    {Math.max(goalCal - (nutrition?.calories ?? 0), 0)} kcal kaldı
                  </p>
                </>
              )}
            </div>
          </div>

          <div className="space-y-2.5">
            {[
              { label: 'Protein', current: nutrition?.protein ?? 0, goal: goalProtein, color: 'bg-blue-500', unit: 'g' },
              { label: 'Karbo', current: nutrition?.carbs ?? 0, goal: goalCarbs, color: 'bg-yellow-500', unit: 'g' },
              { label: 'Yağ', current: nutrition?.fat ?? 0, goal: goalFat, color: 'bg-pink-500', unit: 'g' },
            ].map(macro => (
              <div key={macro.label}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">{macro.label}</span>
                  <span className="font-medium">{macro.current}/{macro.goal}{macro.unit}</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min((macro.current / macro.goal) * 100, 100)}%` }}
                    transition={{ delay: 0.6, duration: 0.8 }}
                    className={`h-full ${macro.color} rounded-full`}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Yaklaşan seanslar + su */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="bg-card/50 border border-border/30 rounded-2xl p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold">Hızlı Erişim</h3>
          </div>

          <div className="space-y-3">
            {[
              { href: '/dashboard/workouts', img: THIINGS.dumbbell, label: 'Egzersiz Planım', sub: 'Haftalık programını gör', bg: 'bg-blue-500/10' },
              { href: '/dashboard/progress', img: THIINGS.trendingUp, label: 'İlerleyiş', sub: 'Güç ve vücut gelişimini takip et', bg: 'bg-green-500/10' },
              { href: '/dashboard/health', img: THIINGS.heart, label: 'Sağlık Metrikleri', sub: 'Nabız, uyku ve su takibi', bg: 'bg-red-500/10' },
            ].map(item => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-4 p-3 bg-muted/20 hover:bg-muted/30 border border-border/20 rounded-xl transition-colors group"
              >
                <div className={`w-10 h-10 ${item.bg} rounded-xl flex items-center justify-center shrink-0`}>
                  <Image src={item.img} alt={item.label} width={24} height={24} unoptimized className="drop-shadow-sm" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">{item.label}</p>
                  <p className="text-xs text-muted-foreground truncate">{item.sub}</p>
                </div>
                <ChevronRight size={15} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
              </Link>
            ))}
          </div>

          {/* Su takibi */}
          <div className="mt-4 p-3 bg-blue-500/5 border border-blue-500/20 rounded-xl flex items-center gap-4">
            <Droplets size={20} className="text-blue-400 shrink-0" />
            <div className="flex-1">
              <div className="flex justify-between text-xs mb-1">
                <span className="font-medium">Su Tüketimi</span>
                <span className="text-blue-400">— / 2.5 L</span>
              </div>
              <div className="h-1.5 bg-muted rounded-full" />
            </div>
            <Link href="/dashboard/health" className="text-xs text-blue-400 hover:text-blue-300 shrink-0">
              Ekle
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

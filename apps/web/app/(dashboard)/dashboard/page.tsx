'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Zap, Droplets, Moon, Flame, ChevronRight, Map } from 'lucide-react'
import { CatWidget } from '@/components/home/CatWidget'

interface GreetingData {
  greeting: string
  firstName: string
  message: string
  stats: { waterMl: number; sleepHours: number; workoutCount: number }
}

interface DashboardStats {
  todayNutrition: { calories: number; goal: { dailyCalories: number } }
  stats: { weeklyCalories: number; weeklySessions: number }
}

function useTypewriter(text: string, speed = 30) {
  const [displayed, setDisplayed] = useState('')
  useEffect(() => {
    setDisplayed('')
    if (!text) return
    let i = 0
    const timer = setInterval(() => {
      i++
      setDisplayed(text.slice(0, i))
      if (i >= text.length) clearInterval(timer)
    }, speed)
    return () => clearInterval(timer)
  }, [text, speed])
  return displayed
}

export default function DashboardPage() {
  const [greeting, setGreeting] = useState<GreetingData | null>(null)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  const displayedMessage = useTypewriter(greeting?.message ?? '', 25)

  useEffect(() => {
    Promise.all([
      fetch('/api/home/greeting').then((r) => r.json()),
      fetch('/api/dashboard/stats').then((r) => r.json()),
    ])
      .then(([g, s]) => {
        setGreeting(g)
        setStats(s)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const summaryCards = [
    {
      label: 'Su',
      value: greeting?.stats.waterMl ? `${Math.round(greeting.stats.waterMl / 100) / 10}L` : '—',
      goal: '2.5L',
      icon: Droplets,
      color: 'text-blue-400',
      bg: 'from-blue-500/20 to-blue-600/10',
      border: 'border-blue-500/20',
      href: '/dashboard/tracking',
    },
    {
      label: 'Kalori',
      value: stats?.todayNutrition.calories ? `${stats.todayNutrition.calories}` : '—',
      goal: `${stats?.todayNutrition.goal.dailyCalories ?? 2200}`,
      icon: Flame,
      color: 'text-orange-400',
      bg: 'from-orange-500/20 to-orange-600/10',
      border: 'border-orange-500/20',
      href: '/dashboard/tracking',
    },
    {
      label: 'Uyku',
      value: greeting?.stats.sleepHours ? `${greeting.stats.sleepHours}s` : '—',
      goal: '8s',
      icon: Moon,
      color: 'text-purple-400',
      bg: 'from-purple-500/20 to-purple-600/10',
      border: 'border-purple-500/20',
      href: '/dashboard/sleep',
    },
    {
      label: 'Antrenman',
      value: greeting?.stats.workoutCount ? `${greeting.stats.workoutCount}` : '—',
      goal: 'bu hafta',
      icon: Zap,
      color: 'text-green-400',
      bg: 'from-green-500/20 to-green-600/10',
      border: 'border-green-500/20',
      href: '/dashboard/sessions',
    },
  ]

  return (
    <div className="mx-auto max-w-2xl space-y-4 px-0 pb-2">
      {/* 1. AI Selamlama */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative overflow-hidden rounded-2xl border border-indigo-500/20 bg-gradient-to-br from-indigo-500/20 via-purple-500/10 to-transparent p-5"
      >
        <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-indigo-500/20 blur-3xl" />

        <div className="relative">
          {loading ? (
            <div className="space-y-2">
              <div className="h-5 w-32 animate-pulse rounded-lg bg-white/10" />
              <div className="h-4 w-full animate-pulse rounded-lg bg-white/5" />
              <div className="h-4 w-3/4 animate-pulse rounded-lg bg-white/5" />
            </div>
          ) : (
            <>
              <p className="mb-1 text-sm font-semibold text-indigo-300">
                {greeting?.greeting}, {greeting?.firstName}! 👋
              </p>
              <p className="min-h-[48px] text-base leading-relaxed text-white/80">
                {displayedMessage}
                <motion.span
                  animate={{ opacity: [1, 0] }}
                  transition={{ duration: 0.6, repeat: Infinity }}
                  className="ml-0.5 inline-block h-4 w-0.5 bg-indigo-400 align-middle"
                />
              </p>
            </>
          )}
        </div>
      </motion.div>

      {/* 2. Kedi Widget */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
      >
        <CatWidget mood="happy" name="Pamuk" level={1} />
      </motion.div>

      {/* 3. Günlük Özet Kartları */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
      >
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-white/40">Bugün</h2>
        <div className="grid grid-cols-2 gap-3">
          {summaryCards.map((card, i) => (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 + i * 0.05 }}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.97 }}
            >
              <Link href={card.href}>
                <div
                  className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${card.bg} border ${card.border} p-4`}
                >
                  <div className="mb-2 flex items-center justify-between">
                    <card.icon size={16} className={card.color} />
                    <span className="text-xs text-white/40">{card.goal}</span>
                  </div>
                  <p className="text-2xl font-black text-white">{loading ? '—' : card.value}</p>
                  <p className="mt-0.5 text-xs text-white/50">{card.label}</p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* 4. Hızlı Erişim */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.4 }}
        className="space-y-3"
      >
        <h2 className="text-sm font-semibold uppercase tracking-wider text-white/40">
          Hızlı Erişim
        </h2>

        {/* Seans Başlat — ana aksiyon */}
        <Link href="/dashboard/sessions">
          <motion.div
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-4 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 p-4 shadow-lg shadow-indigo-500/25"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
              <Zap size={20} className="text-white" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-white">Seans Başlat</p>
              <p className="text-xs text-white/70">AI koçunla antrenman yap</p>
            </div>
            <ChevronRight size={18} className="text-white/70" />
          </motion.div>
        </Link>

        {/* Yol Haritası */}
        <Link href="/dashboard/roadmap">
          <motion.div
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-4"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
              <Map size={20} className="text-indigo-400" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-white">Yol Haritam</p>
              <p className="text-xs text-white/50">Bu haftanın görevlerine bak</p>
            </div>
            <ChevronRight size={18} className="text-white/40" />
          </motion.div>
        </Link>
      </motion.div>
    </div>
  )
}

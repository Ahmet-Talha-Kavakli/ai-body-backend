'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Droplets } from 'lucide-react'
import { WaterWave } from '@/components/water/WaterWave'
import { WaterActions } from '@/components/water/WaterActions'
import { WaterSettingsPanel } from '@/components/water/WaterSettingsPanel'
import { WaterHistory } from '@/components/water/WaterHistory'
import { WaterStreakCard } from '@/components/water/WaterStreakCard'
import { WaterAchievements } from '@/components/water/WaterAchievements'
import { DrinkTracker } from '@/components/water/DrinkTracker'
import { NotificationSettings } from '@/components/settings/NotificationSettings'
import { CoachToast } from '@/components/water/CoachToast'
import type { ReminderSettings } from '@/lib/water/types'

interface WaterState {
  amountMl: number
  glasses: number
  dailyGoalMl: number
  cupSizeMl: number
  reminderMode: 'interval' | 'manual'
  reminderIntervalHours: number
  reminderTimes: string[]
  city?: string
  isManualGoal?: boolean
}

interface StreakState {
  currentStreak: number
  longestStreak: number
  totalDaysGoal: number
  totalMlEver: number
}

interface HistoryItem {
  date: string
  amountMl: number
  goalMet: boolean
}

export default function WaterPage() {
  const [water, setWater] = useState<WaterState>({
    amountMl: 0,
    glasses: 0,
    dailyGoalMl: 2500,
    cupSizeMl: 200,
    reminderMode: 'interval',
    reminderIntervalHours: 2,
    reminderTimes: [],
    city: '',
    isManualGoal: false,
  })
  const [streak, setStreak] = useState<StreakState>({
    currentStreak: 0,
    longestStreak: 0,
    totalDaysGoal: 0,
    totalMlEver: 0,
  })
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [period, setPeriod] = useState<'week' | 'month'>('week')
  const [loading, setLoading] = useState(true)
  const [coachMessage, setCoachMessage] = useState<string | null>(null)

  const fetchAll = useCallback(
    async (p: 'week' | 'month' = period) => {
      const [waterRes, streakRes, historyRes, settingsRes, autoGoalRes] = await Promise.all([
        fetch('/api/nutrition/water').then((r) => r.json()),
        fetch('/api/nutrition/water/streak').then((r) => r.json()),
        fetch(`/api/nutrition/water/history?period=${p}`).then((r) => r.json()),
        fetch('/api/nutrition/water/settings').then((r) => r.json()),
        fetch('/api/nutrition/water/auto-goal', { method: 'POST' }).then((r) => r.json()),
      ])
      setWater({
        amountMl: waterRes.amountMl ?? 0,
        glasses: waterRes.glasses ?? 0,
        dailyGoalMl: autoGoalRes.dailyGoalMl ?? settingsRes.settings?.dailyGoalMl ?? 2500,
        cupSizeMl: waterRes.cupSizeMl ?? 200,
        reminderMode: settingsRes.settings?.reminderMode ?? 'interval',
        reminderIntervalHours: settingsRes.settings?.reminderIntervalHours ?? 2,
        reminderTimes: settingsRes.settings?.reminderTimes ?? [],
        city: settingsRes.settings?.city ?? '',
        isManualGoal: settingsRes.settings?.isManualGoal ?? false,
      })
      const totalMlEver = (historyRes.history ?? []).reduce(
        (s: number, d: HistoryItem) => s + d.amountMl,
        0
      )
      setStreak({
        currentStreak: streakRes.streak?.currentStreak ?? 0,
        longestStreak: streakRes.streak?.longestStreak ?? 0,
        totalDaysGoal: streakRes.streak?.totalDaysGoal ?? 0,
        totalMlEver,
      })
      setHistory(historyRes.history ?? [])
      setLoading(false)
    },
    [period]
  )

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  const handleAdd = async (ml: number) => {
    const res = await fetch('/api/nutrition/water', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ml }),
    }).then((r) => r.json())
    setWater((prev) => ({ ...prev, amountMl: res.amountMl, glasses: res.glasses }))
    if (res.coachMessage) {
      setCoachMessage(res.coachMessage)
      setTimeout(() => setCoachMessage(null), 5000)
    }
    fetch('/api/nutrition/water/streak')
      .then((r) => r.json())
      .then((d) => setStreak((prev) => ({ ...prev, ...d.streak })))
  }

  const handleRemove = async (ml: number) => {
    const res = await fetch('/api/nutrition/water', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ml }),
    }).then((r) => r.json())
    setWater((prev) => ({ ...prev, amountMl: res.amountMl, glasses: res.glasses }))
  }

  const handleSaveSettings = async (
    dailyGoalMl: number,
    cupSizeMl: number,
    reminder: ReminderSettings,
    city: string,
    isManualGoal: boolean
  ) => {
    await fetch('/api/nutrition/water/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dailyGoalMl, cupSizeMl, ...reminder, city, isManualGoal }),
    })
    setWater((prev) => ({ ...prev, dailyGoalMl, cupSizeMl, ...reminder }))
  }

  const handlePeriodChange = (p: 'week' | 'month') => {
    setPeriod(p)
  }

  const percentage = water.dailyGoalMl > 0 ? (water.amountMl / water.dailyGoalMl) * 100 : 0

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#3B82F6] border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-lg space-y-5 pb-10">
      {/* Başlık */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <Droplets size={24} className="text-[#3B82F6]" />
          <h1 className="text-2xl font-black text-white">Su Takibi</h1>
        </div>
        <WaterSettingsPanel
          dailyGoalMl={water.dailyGoalMl}
          cupSizeMl={water.cupSizeMl}
          reminderMode={water.reminderMode}
          reminderIntervalHours={water.reminderIntervalHours}
          reminderTimes={water.reminderTimes}
          city={water.city ?? ''}
          isManualGoal={water.isManualGoal ?? false}
          onSave={handleSaveSettings}
        />
      </motion.div>

      {/* Su Dalgası */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="flex justify-center"
      >
        <WaterWave percentage={percentage} amountMl={water.amountMl} goalMl={water.dailyGoalMl} />
      </motion.div>

      {/* AI Koç Yorumu */}
      <CoachToast message={coachMessage} />

      {/* Hızlı Ekleme */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <WaterActions cupSizeMl={water.cupSizeMl} onAdd={handleAdd} onRemove={handleRemove} />
      </motion.div>

      {/* Streak */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <WaterStreakCard
          currentStreak={streak.currentStreak}
          longestStreak={streak.longestStreak}
          totalDaysGoal={streak.totalDaysGoal}
        />
      </motion.div>

      {/* Geçmiş */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        <WaterHistory
          history={history}
          dailyGoalMl={water.dailyGoalMl}
          period={period}
          onPeriodChange={handlePeriodChange}
        />
      </motion.div>

      {/* Başarımlar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <WaterAchievements stats={streak} />
      </motion.div>

      {/* Diğer İçecekler */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.32 }}
      >
        <DrinkTracker />
      </motion.div>

      {/* Bildirimler */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4"
      >
        <h3 className="mb-3 text-sm font-semibold text-white">Su Bildirimleri</h3>
        <NotificationSettings />
      </motion.div>
    </div>
  )
}

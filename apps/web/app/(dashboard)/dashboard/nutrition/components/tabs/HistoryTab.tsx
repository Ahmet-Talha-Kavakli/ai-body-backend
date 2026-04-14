'use client'

import { useState } from 'react'
import { Download, Loader2 } from 'lucide-react'
import { useHistoryStats } from '../../hooks/useHistoryStats'
import { CalorieTrendChart } from '../history/CalorieTrendChart'
import { MacroBarChart } from '../history/MacroBarChart'
import { MealTimingChart } from '../history/MealTimingChart'
import { WeeklySummaryCards } from '../history/WeeklySummaryCards'
import { StreakCalendar } from '../history/StreakCalendar'
import { TopFoodsList } from '../history/TopFoodsList'
import { WeekSelector } from '../history/WeekSelector'
import { computeWeeklyStats } from '@/lib/nutrition/history'

export function HistoryTab() {
  const { stats, loading, error } = useHistoryStats()
  const [selectedWeek, setSelectedWeek] = useState(0)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-[#6366F1]" />
      </div>
    )
  }

  if (error || !stats) {
    return (
      <div className="py-20 text-center text-sm text-[#64748B]">
        Veriler yüklenemedi. Lütfen tekrar deneyin.
      </div>
    )
  }

  const goalCalories = stats.goal?.dailyCalories ?? 2000
  const weeks = computeWeeklyStats(stats.daily, goalCalories)

  // Filter daily entries to selected week
  const weekStart = selectedWeek * 7
  const weekDaily = stats.daily.slice(
    Math.max(stats.daily.length - 7 - weekStart, 0),
    Math.max(stats.daily.length - weekStart, 0)
  )

  const handleExport = () => {
    window.open('/api/nutrition/history/export', '_blank')
  }

  return (
    <div className="space-y-4">
      {/* Header row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <WeekSelector
          selectedWeek={selectedWeek}
          onChange={setSelectedWeek}
          maxWeeks={Math.max(weeks.length, 1)}
        />
        <button
          onClick={handleExport}
          className="flex items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.04] px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-white/[0.08]"
        >
          <Download size={14} /> CSV İndir
        </button>
      </div>

      {/* Summary cards */}
      <WeeklySummaryCards weeks={weeks} goalHitPercent={stats.goalHitPercent} />

      {/* Calorie trend */}
      <CalorieTrendChart daily={stats.daily} goalCalories={goalCalories} />

      {/* Macro bar chart */}
      {weeks.length > 0 && <MacroBarChart weeks={weeks} />}

      {/* Bottom grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <MealTimingChart timing={stats.mealTiming} />
        <TopFoodsList foods={stats.topFoods} />
      </div>

      {/* Streak calendar */}
      <StreakCalendar calendar={stats.streakCalendar} />
    </div>
  )
}

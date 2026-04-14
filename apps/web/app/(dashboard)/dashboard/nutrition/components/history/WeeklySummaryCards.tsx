'use client'

import { Trophy, TrendingUp, Target } from 'lucide-react'
import type { WeeklyStats } from '@/lib/nutrition/types'

interface Props {
  weeks: WeeklyStats[]
  goalHitPercent: number
}

const BADGE_CONFIG = {
  excellent: { label: 'Mükemmel', color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
  good: { label: 'İyi', color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
  needs_work: { label: 'Geliştirilmeli', color: 'text-red-400', bg: 'bg-red-400/10' },
}

export function WeeklySummaryCards({ weeks, goalHitPercent }: Props) {
  const latest = weeks[weeks.length - 1]
  const badge = latest ? BADGE_CONFIG[latest.badge] : null

  return (
    <div className="grid grid-cols-3 gap-3">
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4">
        <div className="mb-2 flex items-center gap-2">
          <Target size={14} className="text-[#6366F1]" />
          <span className="text-xs text-[#64748B]">Hedef Tutturma</span>
        </div>
        <p className="text-2xl font-bold text-white">{Math.round(goalHitPercent)}%</p>
        <p className="mt-1 text-xs text-[#64748B]">son 30 gün</p>
      </div>

      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4">
        <div className="mb-2 flex items-center gap-2">
          <TrendingUp size={14} className="text-emerald-400" />
          <span className="text-xs text-[#64748B]">Bu Hafta Ort.</span>
        </div>
        <p className="text-2xl font-bold text-white">{latest?.avgCalories ?? '—'}</p>
        <p className="mt-1 text-xs text-[#64748B]">kcal/gün</p>
      </div>

      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4">
        <div className="mb-2 flex items-center gap-2">
          <Trophy size={14} className="text-yellow-400" />
          <span className="text-xs text-[#64748B]">Performans</span>
        </div>
        {badge ? (
          <span
            className={`inline-block rounded-lg px-2 py-1 text-xs font-semibold ${badge.bg} ${badge.color}`}
          >
            {badge.label}
          </span>
        ) : (
          <p className="text-sm text-[#64748B]">—</p>
        )}
      </div>
    </div>
  )
}

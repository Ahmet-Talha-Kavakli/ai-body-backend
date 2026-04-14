'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'

interface Props {
  selectedWeek: number // 0 = this week, 1 = last week, 2 = 2 weeks ago
  onChange: (week: number) => void
  maxWeeks?: number
}

const LABELS = ['Bu Hafta', 'Geçen Hafta', '2 Hafta Önce', '3 Hafta Önce']

export function WeekSelector({ selectedWeek, onChange, maxWeeks = 4 }: Props) {
  return (
    <div className="flex items-center gap-3">
      <button
        onClick={() => onChange(Math.min(selectedWeek + 1, maxWeeks - 1))}
        disabled={selectedWeek >= maxWeeks - 1}
        className="rounded-lg p-1.5 text-[#64748B] transition-colors hover:bg-white/[0.06] disabled:opacity-30"
      >
        <ChevronLeft size={16} />
      </button>
      <span className="min-w-[120px] text-center text-sm font-semibold text-white">
        {LABELS[selectedWeek] ?? `${selectedWeek + 1} Hafta Önce`}
      </span>
      <button
        onClick={() => onChange(Math.max(selectedWeek - 1, 0))}
        disabled={selectedWeek <= 0}
        className="rounded-lg p-1.5 text-[#64748B] transition-colors hover:bg-white/[0.06] disabled:opacity-30"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  )
}

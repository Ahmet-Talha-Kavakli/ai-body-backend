'use client'

import { motion } from 'framer-motion'

interface DayData {
  day: string
  ml: number
  goal: number
}

export function WeeklyChart({ data }: { data: DayData[] }) {
  const today = new Date().getDay()
  const todayIdx = today === 0 ? 6 : today - 1

  return (
    <div className="flex items-end justify-between gap-2 px-1">
      {data.map((d, i) => {
        const pct = Math.min(d.ml / Math.max(d.goal, 1), 1)
        const isToday = i === todayIdx

        return (
          <div key={i} className="flex flex-1 flex-col items-center gap-1">
            <div className="relative flex h-20 w-full items-end overflow-hidden rounded-lg bg-white/5">
              <motion.div
                className={`w-full rounded-lg ${
                  isToday
                    ? 'bg-gradient-to-t from-teal-500 to-indigo-500'
                    : pct >= 1
                      ? 'bg-teal-500/60'
                      : 'bg-teal-500/25'
                }`}
                style={{ minHeight: pct > 0 ? '4px' : '0' }}
                initial={{ height: 0 }}
                animate={{ height: `${Math.max(pct * 100, pct > 0 ? 5 : 0)}%` }}
                transition={{ delay: i * 0.07, duration: 0.6, ease: 'easeOut' }}
              />
            </div>
            <span
              className={`text-[10px] font-medium ${isToday ? 'text-teal-400' : 'text-white/30'}`}
            >
              {d.day}
            </span>
          </div>
        )
      })}
    </div>
  )
}

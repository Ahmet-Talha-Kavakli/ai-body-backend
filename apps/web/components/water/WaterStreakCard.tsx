'use client'

import { motion } from 'framer-motion'
import { Flame, Trophy, Calendar, Snowflake } from 'lucide-react'

interface WaterStreakCardProps {
  currentStreak: number
  longestStreak: number
  totalDaysGoal: number
  freezeCharges?: number
}

export function WaterStreakCard({
  currentStreak,
  longestStreak,
  totalDaysGoal,
  freezeCharges = 0,
}: WaterStreakCardProps) {
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-3 gap-2">
        {[
          {
            icon: <Flame size={18} className="text-orange-400" />,
            value: currentStreak,
            label: 'Günlük Seri',
            color: 'text-orange-400',
            bg: 'bg-orange-500/10',
            border: 'border-orange-500/20',
          },
          {
            icon: <Trophy size={18} className="text-yellow-400" />,
            value: longestStreak,
            label: 'En Uzun Seri',
            color: 'text-yellow-400',
            bg: 'bg-yellow-500/10',
            border: 'border-yellow-500/20',
          },
          {
            icon: <Calendar size={18} className="text-purple-400" />,
            value: totalDaysGoal,
            label: 'Toplam Gün',
            color: 'text-purple-400',
            bg: 'bg-purple-500/10',
            border: 'border-purple-500/20',
          },
        ].map((item) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex flex-col items-center gap-1.5 rounded-2xl ${item.bg} border ${item.border} p-3`}
          >
            {item.icon}
            <motion.span
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className={`text-2xl font-black ${item.color}`}
            >
              {item.value}
            </motion.span>
            <span className="text-center text-[10px] leading-tight text-[#64748B]">
              {item.label}
            </span>
          </motion.div>
        ))}
      </div>

      {/* Freeze Charges */}
      <div className="flex items-center gap-2 rounded-2xl border border-cyan-500/20 bg-cyan-500/10 px-4 py-2.5">
        <Snowflake size={15} className="shrink-0 text-cyan-400" />
        <div className="flex-1">
          <p className="text-xs font-semibold text-cyan-400">{freezeCharges} Dondurma Hakkı</p>
          <p className="text-[10px] text-[#64748B]">
            7 ve 30 günlük serilerde kazanılır. Streak kırılmadan önce otomatik kullanılır.
          </p>
        </div>
        <div className="flex gap-0.5">
          {Array.from({ length: Math.min(freezeCharges, 5) }).map((_, i) => (
            <div
              key={i}
              className="flex h-4 w-4 items-center justify-center rounded-full bg-cyan-500/40"
            >
              <div className="h-2 w-2 rounded-full bg-cyan-400" />
            </div>
          ))}
          {freezeCharges === 0 && <span className="text-[10px] text-[#64748B]">Henüz hak yok</span>}
        </div>
      </div>
    </div>
  )
}

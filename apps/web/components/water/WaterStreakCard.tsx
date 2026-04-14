'use client'

import { motion } from 'framer-motion'
import { Flame, Trophy, Calendar } from 'lucide-react'

interface WaterStreakCardProps {
  currentStreak: number
  longestStreak: number
  totalDaysGoal: number
}

export function WaterStreakCard({
  currentStreak,
  longestStreak,
  totalDaysGoal,
}: WaterStreakCardProps) {
  return (
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
            key={item.value}
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className={`text-2xl font-black ${item.color}`}
          >
            {item.value}
          </motion.span>
          <span className="text-center text-[10px] leading-tight text-[#64748B]">{item.label}</span>
        </motion.div>
      ))}
    </div>
  )
}

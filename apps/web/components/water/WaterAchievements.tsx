'use client'

import { motion } from 'framer-motion'

interface AchievementDef {
  id: string
  title: string
  desc: string
  icon: string
  check: (stats: AchievementStats) => boolean
}

interface AchievementStats {
  totalDaysGoal: number
  currentStreak: number
  longestStreak: number
  totalMlEver: number
}

const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: 'first_drop',
    title: 'İlk Yudum',
    desc: 'İlk kez su kaydetti',
    icon: '💧',
    check: (s) => s.totalDaysGoal >= 1,
  },
  {
    id: 'three_days',
    title: '3 Gün Şampiyonu',
    desc: '3 gün üst üste hedefe ulaştı',
    icon: '🥉',
    check: (s) => s.longestStreak >= 3,
  },
  {
    id: 'week_warrior',
    title: 'Hafta Savaşçısı',
    desc: '7 gün üst üste hedefe ulaştı',
    icon: '🥈',
    check: (s) => s.longestStreak >= 7,
  },
  {
    id: 'month_master',
    title: 'Ay Ustası',
    desc: '30 gün üst üste hedefe ulaştı',
    icon: '🥇',
    check: (s) => s.longestStreak >= 30,
  },
  {
    id: 'ten_days',
    title: 'On Günlük Disiplin',
    desc: 'Toplamda 10 gün hedefe ulaştı',
    icon: '⭐',
    check: (s) => s.totalDaysGoal >= 10,
  },
  {
    id: 'fifty_days',
    title: 'Su Abidesi',
    desc: 'Toplamda 50 gün hedefe ulaştı',
    icon: '🌟',
    check: (s) => s.totalDaysGoal >= 50,
  },
  {
    id: 'ocean_50',
    title: 'Göl',
    desc: 'Toplamda 50 litre içti',
    icon: '🏞️',
    check: (s) => s.totalMlEver >= 50000,
  },
  {
    id: 'ocean_100',
    title: 'Okyanus',
    desc: 'Toplamda 100 litre içti',
    icon: '🌊',
    check: (s) => s.totalMlEver >= 100000,
  },
]

interface WaterAchievementsProps {
  stats: AchievementStats
}

export function WaterAchievements({ stats }: WaterAchievementsProps) {
  const unlocked = ACHIEVEMENTS.filter((a) => a.check(stats))
  const locked = ACHIEVEMENTS.filter((a) => !a.check(stats))

  return (
    <div className="space-y-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">Başarımlar</h3>
        <span className="text-xs text-[#64748B]">
          {unlocked.length}/{ACHIEVEMENTS.length}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {[...unlocked, ...locked].map((achievement, i) => {
          const isUnlocked = achievement.check(stats)
          return (
            <motion.div
              key={achievement.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              className={`flex items-center gap-3 rounded-2xl border p-3 transition-all ${
                isUnlocked
                  ? 'border-[#3B82F6]/20 bg-[#3B82F6]/10'
                  : 'border-white/[0.04] bg-white/[0.02] opacity-40'
              }`}
            >
              <span className="text-2xl">{isUnlocked ? achievement.icon : '🔒'}</span>
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-white">{achievement.title}</p>
                <p className="text-[10px] leading-tight text-[#64748B]">{achievement.desc}</p>
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

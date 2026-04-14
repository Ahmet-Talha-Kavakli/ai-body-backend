'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'

const TABS = [
  { id: 'today', label: 'Bugün' },
  { id: 'explore', label: 'Keşfet' },
  { id: 'history', label: 'Geçmiş' },
  { id: 'profile', label: 'Profil' },
]

export function NutritionTabs() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const active = searchParams.get('tab') ?? 'today'

  return (
    <div className="flex w-fit gap-1 rounded-xl border border-white/[0.06] bg-white/[0.03] p-1">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          onClick={() => router.push(`?tab=${tab.id}`)}
          className="relative cursor-pointer rounded-lg px-4 py-2 text-sm font-medium transition-colors"
          style={{ color: active === tab.id ? '#fff' : '#64748B' }}
        >
          {active === tab.id && (
            <motion.div
              layoutId="activeTab"
              className="absolute inset-0 rounded-lg border border-[#6366F1]/30 bg-[#6366F1]/20"
              transition={{ type: 'spring', stiffness: 100, damping: 20 }}
            />
          )}
          <span className="relative z-10">{tab.label}</span>
        </button>
      ))}
    </div>
  )
}

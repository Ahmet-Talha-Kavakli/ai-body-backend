'use client'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Droplets, Utensils, Pill, Moon, Dumbbell, ChevronRight } from 'lucide-react'

const MODULES = [
  {
    href: '/dashboard/water',
    icon: Droplets,
    label: 'Su & İçecek',
    desc: 'Günlük su ve kahve takibi',
    gradient: 'from-blue-500 to-cyan-500',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
  },
  {
    href: '/dashboard/nutrition',
    icon: Utensils,
    label: 'Yemek',
    desc: 'Kalori ve makro takibi',
    gradient: 'from-orange-500 to-amber-500',
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/20',
  },
  {
    href: '/dashboard/supplements',
    icon: Dumbbell,
    label: 'Supplement & Vitamin',
    desc: 'Takviye ve vitamin takibi',
    gradient: 'from-green-500 to-emerald-500',
    bg: 'bg-green-500/10',
    border: 'border-green-500/20',
  },
  {
    href: '/dashboard/medications',
    icon: Pill,
    label: 'İlaç',
    desc: 'İlaç hatırlatıcı ve takip',
    gradient: 'from-red-500 to-rose-500',
    bg: 'bg-red-500/10',
    border: 'border-red-500/20',
  },
  {
    href: '/dashboard/sleep',
    icon: Moon,
    label: 'Uyku',
    desc: 'Uyku kalitesi ve analizi',
    gradient: 'from-purple-500 to-violet-500',
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/20',
  },
]

export default function TrackingPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="mb-1 text-2xl font-black text-white">Takip</h1>
        <p className="text-sm text-white/50">Sağlık verilerini kaydet ve analiz et</p>
      </div>
      <div className="space-y-3">
        {MODULES.map((mod, i) => (
          <motion.div
            key={mod.href}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.07 }}
            whileHover={{ x: 4 }}
            whileTap={{ scale: 0.98 }}
          >
            <Link href={mod.href}>
              <div
                className={`flex items-center gap-4 rounded-2xl p-4 ${mod.bg} border ${mod.border}`}
              >
                <div
                  className={`h-12 w-12 rounded-2xl bg-gradient-to-br ${mod.gradient} flex items-center justify-center shadow-lg`}
                >
                  <mod.icon size={22} className="text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-white">{mod.label}</p>
                  <p className="text-sm text-white/50">{mod.desc}</p>
                </div>
                <ChevronRight size={18} className="text-white/30" />
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

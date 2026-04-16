'use client'

import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { Cat, User, Bell, Trophy, X } from 'lucide-react'

const ITEMS = [
  {
    href: '/dashboard/pet',
    icon: Cat,
    label: 'Kedi',
    color: 'text-pink-400',
    bg: 'bg-pink-500/10',
    border: 'border-pink-500/20',
  },
  {
    href: '/dashboard/profile',
    icon: User,
    label: 'Profil',
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
  },
  {
    href: '/dashboard/settings/notifications',
    icon: Bell,
    label: 'Bildirimler',
    color: 'text-yellow-400',
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-500/20',
  },
  {
    href: '/dashboard/achievements',
    icon: Trophy,
    label: 'Başarımlar',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
  },
]

interface MoreSheetProps {
  open: boolean
  onClose: () => void
}

export function MoreSheet({ open, onClose }: MoreSheetProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          {/* Sheet */}
          <motion.div
            className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl border-t border-white/10 bg-[#0a0f1e] pb-10 pt-4 lg:hidden"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            {/* Handle */}
            <div className="mx-auto mb-6 h-1 w-12 rounded-full bg-white/20" />

            <div className="flex items-center justify-between px-6 pb-4">
              <h2 className="text-lg font-bold text-white">Daha Fazlası</h2>
              <button onClick={onClose} className="rounded-xl p-2 hover:bg-white/5">
                <X size={20} className="text-white/50" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 px-4">
              {ITEMS.map((item, i) => (
                <motion.div
                  key={item.href}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                >
                  <Link href={item.href} onClick={onClose}>
                    <div
                      className={`flex flex-col items-center gap-3 rounded-2xl border p-5 ${item.bg} ${item.border}`}
                    >
                      <div className={`rounded-xl p-3 ${item.bg}`}>
                        <item.icon size={24} className={item.color} />
                      </div>
                      <span className="text-sm font-semibold text-white">{item.label}</span>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

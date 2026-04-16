'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Map, Zap, BarChart3, MoreHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'
import { MoreSheet } from './MoreSheet'

interface Tab {
  id: string
  label: string
  icon: React.ComponentType<{ size?: number; className?: string }>
  path: string
  isCenter?: boolean
  isMore?: boolean
}

const TABS: Tab[] = [
  { id: 'home', label: 'Ev', icon: Home, path: '/dashboard' },
  { id: 'roadmap', label: 'Yol', icon: Map, path: '/dashboard/roadmap' },
  { id: 'sessions', label: 'Seans', icon: Zap, path: '/dashboard/sessions', isCenter: true },
  { id: 'tracking', label: 'Takip', icon: BarChart3, path: '/dashboard/tracking' },
  { id: 'more', label: 'Daha', icon: MoreHorizontal, path: '', isMore: true },
]

const MORE_PATHS = [
  '/dashboard/pet',
  '/dashboard/profile',
  '/dashboard/settings/notifications',
  '/dashboard/achievements',
]

function isTabActive(tab: Tab, pathname: string): boolean {
  if (tab.isMore) return MORE_PATHS.some((p) => pathname.startsWith(p))
  if (tab.id === 'home') return pathname === tab.path
  return pathname === tab.path || pathname.startsWith(tab.path + '/')
}

export function BottomNav() {
  const pathname = usePathname()
  const [moreOpen, setMoreOpen] = useState(false)
  const openMore = useCallback(() => setMoreOpen(true), [])
  const closeMore = useCallback(() => setMoreOpen(false), [])

  return (
    <>
      <MoreSheet open={moreOpen} onClose={closeMore} />
      <motion.div
        className="fixed bottom-4 left-1/2 z-40 lg:hidden"
        style={{ x: '-50%' }}
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30, delay: 0.1 }}
      >
        <div
          className={cn(
            'flex items-end justify-around',
            'w-[calc(100vw-2rem)] max-w-sm',
            'px-3 py-2',
            'rounded-2xl',
            'bg-black/60 backdrop-blur-xl',
            'border border-white/10',
            'shadow-2xl'
          )}
        >
          {TABS.map((tab) => {
            const active = isTabActive(tab, pathname)
            const Icon = tab.icon

            if (tab.isCenter) {
              return (
                <Link key={tab.id} href={tab.path} className="flex flex-col items-center">
                  <motion.div
                    className="relative -translate-y-3"
                    whileTap={{ scale: 0.92 }}
                    animate={{ scale: active ? 1.05 : 1 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  >
                    <motion.div
                      className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/40"
                      animate={
                        active
                          ? { boxShadow: '0 0 20px 4px rgba(99,102,241,0.5)' }
                          : { boxShadow: '0 4px 14px 0 rgba(99,102,241,0.3)' }
                      }
                      transition={{ duration: 0.3 }}
                    >
                      <motion.div
                        animate={{ scale: [1, 1.08, 1] }}
                        transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
                      >
                        <Zap size={24} className="text-white" fill="white" />
                      </motion.div>
                    </motion.div>
                    <span className="mt-1 block text-center text-[10px] font-medium text-indigo-300">
                      {tab.label}
                    </span>
                  </motion.div>
                </Link>
              )
            }

            if (tab.isMore) {
              return (
                <button
                  key={tab.id}
                  onClick={openMore}
                  className="flex min-w-[48px] flex-col items-center"
                  aria-label="Daha fazlasını göster"
                  aria-expanded={moreOpen}
                  aria-haspopup="dialog"
                >
                  <motion.div
                    className="flex flex-col items-center gap-0.5 rounded-xl px-2 py-1"
                    whileTap={{ scale: 0.9 }}
                    animate={active ? { scale: 1.05 } : { scale: 1 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  >
                    <motion.div animate={active ? { y: -1 } : { y: 0 }}>
                      <Icon
                        size={22}
                        className={cn(
                          'transition-colors duration-200',
                          active ? 'text-indigo-400' : 'text-white/40'
                        )}
                      />
                    </motion.div>
                    <AnimatePresence>
                      {active && (
                        <motion.span
                          key="label"
                          className="text-[10px] font-medium leading-none text-indigo-400"
                          initial={{ opacity: 0, y: -4, height: 0 }}
                          animate={{ opacity: 1, y: 0, height: 'auto' }}
                          exit={{ opacity: 0, y: -4, height: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          {tab.label}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </motion.div>
                </button>
              )
            }

            return (
              <Link
                key={tab.id}
                href={tab.path}
                className="flex min-w-[48px] flex-col items-center"
                aria-current={active ? 'page' : undefined}
              >
                <motion.div
                  className="flex flex-col items-center gap-0.5 rounded-xl px-2 py-1"
                  whileTap={{ scale: 0.9 }}
                  animate={active ? { scale: 1.05 } : { scale: 1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                >
                  <motion.div animate={active ? { y: -1 } : { y: 0 }}>
                    <Icon
                      size={22}
                      className={cn(
                        'transition-colors duration-200',
                        active ? 'text-indigo-400' : 'text-white/40'
                      )}
                    />
                  </motion.div>
                  <AnimatePresence>
                    {active && (
                      <motion.span
                        key="label"
                        className="text-[10px] font-medium leading-none text-indigo-400"
                        initial={{ opacity: 0, y: -4, height: 0 }}
                        animate={{ opacity: 1, y: 0, height: 'auto' }}
                        exit={{ opacity: 0, y: -4, height: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        {tab.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.div>
              </Link>
            )
          })}
        </div>
      </motion.div>
    </>
  )
}

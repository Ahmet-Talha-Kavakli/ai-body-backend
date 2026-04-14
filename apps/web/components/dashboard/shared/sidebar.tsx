'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { useMemo } from 'react'
import Image from 'next/image'
import { LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { THIINGS } from '@/lib/thiings'

const NAV_ITEMS = [
  { label: 'Home', href: '/dashboard', icon: THIINGS.trendingUp },
  { label: 'Seans', href: '/dashboard/session', icon: THIINGS.flame },
  { label: 'Egzersiz Planım', href: '/dashboard/workouts', icon: THIINGS.dumbbell },
  { label: 'Beslenme', href: '/dashboard/nutrition', icon: THIINGS.apple },
  { label: 'Su Takibi', href: '/dashboard/water', icon: THIINGS.waterBottle },
  { label: 'Sağlık & Akıllı Saat', href: '/dashboard/health', icon: THIINGS.heart },
  { label: 'İlerleyiş', href: '/dashboard/progress', icon: THIINGS.trophy },
  { label: 'Başarımlar', href: '/dashboard/achievements', icon: THIINGS.award },
  { label: 'Ayarlar', href: '/dashboard/settings', icon: THIINGS.settings },
]

interface DashboardSidebarProps {
  isOpen: boolean
  onClose: () => void
}

export function DashboardSidebar({ isOpen, onClose }: DashboardSidebarProps) {
  const pathname = usePathname()

  const sidebarItems = useMemo(() => NAV_ITEMS, [])

  return (
    <>
      {/* Desktop Sidebar */}
      <motion.div
        initial={{ x: -280 }}
        animate={{ x: 0 }}
        exit={{ x: -280 }}
        transition={{ duration: 0.3 }}
        className="border-border/30 bg-card/50 hidden w-64 flex-col border-r backdrop-blur-sm lg:flex"
      >
        <div className="flex items-center gap-2 px-6 py-8">
          <div className="bg-primary h-8 w-8 rounded-lg" />
          <span className="text-xl font-bold">FitAI</span>
        </div>

        <nav className="flex-1 space-y-2 px-4">
          {sidebarItems.map((item, idx) => {
            const isActive = pathname === item.href

            return (
              <motion.div
                key={item.href}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.98 }}
              >
                <Link href={item.href} prefetch>
                  <Button
                    variant={isActive ? 'default' : 'ghost'}
                    className={cn(
                      'w-full justify-start gap-3 transition-all',
                      isActive && 'bg-primary text-primary-foreground shadow-primary/20 shadow-lg'
                    )}
                  >
                    <Image
                      src={item.icon}
                      alt={item.label}
                      width={16}
                      height={16}
                      unoptimized
                      className="h-4 w-4"
                    />
                    {item.label}
                  </Button>
                </Link>
              </motion.div>
            )
          })}
        </nav>

        <div className="border-border/30 border-t px-4 py-6">
          <motion.div whileHover={{ x: 4 }} whileTap={{ scale: 0.98 }} className="w-full">
            <Button variant="ghost" className="w-full justify-start gap-3 transition-all">
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </motion.div>
        </div>
      </motion.div>

      {/* Mobile Sidebar */}
      {isOpen && (
        <motion.div
          initial={{ x: -280 }}
          animate={{ x: 0 }}
          exit={{ x: -280 }}
          className="border-border/30 bg-card fixed inset-y-0 left-0 z-50 w-64 border-r backdrop-blur-sm lg:hidden"
        >
          <div className="flex items-center gap-2 px-6 py-8">
            <div className="bg-primary h-8 w-8 rounded-lg" />
            <span className="text-xl font-bold">FitAI</span>
          </div>

          <nav className="space-y-2 px-4">
            {sidebarItems.map((item, idx) => {
              const isActive = pathname === item.href

              return (
                <motion.div
                  key={item.href}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Link href={item.href} onClick={onClose} prefetch>
                    <Button
                      variant={isActive ? 'default' : 'ghost'}
                      className={cn(
                        'w-full justify-start gap-3 transition-all',
                        isActive && 'bg-primary text-primary-foreground shadow-primary/20 shadow-lg'
                      )}
                    >
                      <Image
                        src={item.icon}
                        alt={item.label}
                        width={16}
                        height={16}
                        unoptimized
                        className="h-4 w-4"
                      />
                      {item.label}
                    </Button>
                  </Link>
                </motion.div>
              )
            })}
          </nav>

          <div className="absolute bottom-6 left-4 right-4">
            <motion.div whileHover={{ x: 4 }} whileTap={{ scale: 0.98 }} className="w-full">
              <Button variant="ghost" className="w-full justify-start gap-3 transition-all">
                <LogOut className="h-4 w-4" />
                Sign Out
              </Button>
            </motion.div>
          </div>
        </motion.div>
      )}
    </>
  )
}

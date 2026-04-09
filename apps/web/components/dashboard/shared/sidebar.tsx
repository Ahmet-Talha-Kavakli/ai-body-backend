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
  { label: 'Sağlık & Akıllı Saat', href: '/dashboard/health', icon: THIINGS.heart },
  { label: 'İlerleyiş', href: '/dashboard/progress', icon: THIINGS.trophy },
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
        className="hidden lg:flex flex-col w-64 border-r border-border/30 bg-card/50 backdrop-blur-sm"
      >
        <div className="flex items-center gap-2 px-6 py-8">
          <div className="w-8 h-8 bg-primary rounded-lg" />
          <span className="font-bold text-xl">FitAI</span>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          {sidebarItems.map((item, idx) => {
            const isActive = pathname === item.href

            return (
              <motion.div
                key={item.href}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Link href={item.href} prefetch>
                  <motion.div
                    whileHover={{ x: 4 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      variant={isActive ? 'default' : 'ghost'}
                      className={cn(
                        'w-full justify-start gap-3 transition-all',
                        isActive && 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                      )}
                    >
                      <Image src={item.icon} alt={item.label} width={16} height={16} unoptimized className="w-4 h-4" />
                      {item.label}
                    </Button>
                  </motion.div>
                </Link>
              </motion.div>
            )
          })}
        </nav>

        <div className="px-4 py-6 border-t border-border/30">
          <motion.div
            whileHover={{ x: 4 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button variant="ghost" className="w-full justify-start gap-3 transition-all">
              <LogOut className="w-4 h-4" />
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
          className="fixed inset-y-0 left-0 z-50 w-64 border-r border-border/30 bg-card backdrop-blur-sm lg:hidden"
        >
          <div className="flex items-center gap-2 px-6 py-8">
            <div className="w-8 h-8 bg-primary rounded-lg" />
            <span className="font-bold text-xl">FitAI</span>
          </div>

          <nav className="px-4 space-y-2">
            {sidebarItems.map((item, idx) => {
              const isActive = pathname === item.href

              return (
                <motion.div
                  key={item.href}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Link
                    href={item.href}
                    onClick={onClose}
                    prefetch
                  >
                    <motion.div
                      whileHover={{ x: 4 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Button
                        variant={isActive ? 'default' : 'ghost'}
                        className={cn(
                          'w-full justify-start gap-3 transition-all',
                          isActive && 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                        )}
                      >
                        <Image src={item.icon} alt={item.label} width={16} height={16} unoptimized className="w-4 h-4" />
                        {item.label}
                      </Button>
                    </motion.div>
                  </Link>
                </motion.div>
              )
            })}
          </nav>

          <div className="absolute bottom-6 left-4 right-4">
            <motion.div
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button variant="ghost" className="w-full justify-start gap-3 transition-all">
                <LogOut className="w-4 h-4" />
                Sign Out
              </Button>
            </motion.div>
          </div>
        </motion.div>
      )}
    </>
  )
}

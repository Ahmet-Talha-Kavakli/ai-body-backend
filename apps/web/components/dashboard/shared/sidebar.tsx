'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { useMemo } from 'react'
import {
  Home,
  Video,
  Dumbbell,
  Apple,
  Heart,
  TrendingUp,
  Settings,
  LogOut,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

const NAV_ITEMS = [
  { label: 'Home', href: '/dashboard', icon: Home },
  { label: 'Seans', href: '/dashboard/session', icon: Video },
  { label: 'Egzersiz Planım', href: '/dashboard/workouts', icon: Dumbbell },
  { label: 'Beslenme', href: '/dashboard/nutrition', icon: Apple },
  { label: 'Sağlık & Akıllı Saat', href: '/dashboard/health', icon: Heart },
  { label: 'İlerleyiş', href: '/dashboard/progress', icon: TrendingUp },
  { label: 'Ayarlar', href: '/dashboard/settings', icon: Settings },
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
          {sidebarItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href

            return (
              <Link key={item.href} href={item.href} prefetch>
                <Button
                  variant={isActive ? 'default' : 'ghost'}
                  className={cn(
                    'w-full justify-start gap-2',
                    isActive && 'bg-primary text-primary-foreground'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Button>
              </Link>
            )
          })}
        </nav>

        <div className="px-4 py-6 border-t border-border/30">
          <Button variant="ghost" className="w-full justify-start gap-2">
            <LogOut className="w-4 h-4" />
            Sign Out
          </Button>
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
            {sidebarItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  prefetch
                >
                  <Button
                    variant={isActive ? 'default' : 'ghost'}
                    className={cn(
                      'w-full justify-start gap-2',
                      isActive && 'bg-primary text-primary-foreground'
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </Button>
                </Link>
              )
            })}
          </nav>

          <div className="absolute bottom-6 left-4 right-4">
            <Button variant="ghost" className="w-full justify-start gap-2">
              <LogOut className="w-4 h-4" />
              Sign Out
            </Button>
          </div>
        </motion.div>
      )}
    </>
  )
}

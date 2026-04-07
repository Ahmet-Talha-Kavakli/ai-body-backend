'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Dumbbell,
  Apple,
  Heart,
  BarChart3,
  Watch,
  Settings,
  LogOut,
} from 'lucide-react'
import { SignOutButton } from '@clerk/nextjs'

const MENU_ITEMS = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Workouts', href: '/dashboard/workouts', icon: Dumbbell },
  { label: 'Nutrition', href: '/dashboard/nutrition', icon: Apple },
  { label: 'Health', href: '/dashboard/health', icon: Heart },
  { label: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
  { label: 'Devices', href: '/dashboard/devices', icon: Watch },
  { label: 'Settings', href: '/dashboard/settings', icon: Settings },
]

export function DashboardSidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 border-r border-border/50 bg-background/40 backdrop-blur flex flex-col">
      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 border-b border-border/30"
      >
        <Link href="/dashboard" className="flex items-center gap-2 font-bold text-xl">
          <div className="w-8 h-8 rounded-lg bg-green-500 flex items-center justify-center">
            <Dumbbell className="w-4 h-4 text-white" />
          </div>
          <span>FitAI</span>
        </Link>
      </motion.div>

      {/* Menu */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {MENU_ITEMS.map((item, i) => {
          const Icon = item.icon
          const isActive = pathname === item.href

          return (
            <motion.div
              key={item.href}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Link
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
                  isActive
                    ? 'bg-green-500/10 text-green-500'
                    : 'text-muted-foreground hover:bg-accent'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-sm font-medium">{item.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute right-0 w-1 h-6 bg-green-500 rounded-l-full"
                  />
                )}
              </Link>
            </motion.div>
          )
        })}
      </nav>

      {/* Sign out */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4 border-t border-border/30"
      >
        <SignOutButton redirectUrl="/">
          <button className="w-full flex items-center gap-3 px-4 py-3 text-muted-foreground hover:text-red-500 hover:bg-red-500/5 rounded-lg transition-colors text-sm font-medium">
            <LogOut className="w-5 h-5" />
            <span>Sign Out</span>
          </button>
        </SignOutButton>
      </motion.div>
    </aside>
  )
}

'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Dumbbell,
  Apple,
  Heart,
  BarChart3,
  Settings,
  Watch,
  ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'

const navItems = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    label: 'Workouts',
    href: '/programs',
    icon: Dumbbell,
  },
  {
    label: 'Nutrition',
    href: '/nutrition',
    icon: Apple,
  },
  {
    label: 'Health',
    href: '/health',
    icon: Heart,
  },
  {
    label: 'Analytics',
    href: '/analytics',
    icon: BarChart3,
  },
  {
    label: 'Devices',
    href: '/settings/devices',
    icon: Watch,
  },
  {
    label: 'Settings',
    href: '/settings',
    icon: Settings,
  },
]

export function DashboardSidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden w-64 shrink-0 border-r border-border bg-card lg:flex lg:flex-col">
      {/* Logo */}
      <div className="flex h-16 items-center border-b border-border px-6">
        <Link href="/dashboard" className="flex items-center gap-2 font-bold text-lg">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
            <Dumbbell className="h-3.5 w-3.5 text-primary-foreground" />
          </div>
          FitAI
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {item.label}
                  {isActive && <ChevronRight className="ml-auto h-3.5 w-3.5" />}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    </aside>
  )
}

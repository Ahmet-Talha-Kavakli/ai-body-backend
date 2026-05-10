import {
  LayoutDashboard,
  Users,
  TrendingUp,
  Banknote,
  Settings,
  type LucideIcon,
} from 'lucide-react'

export interface NavItem {
  label: string
  href: string
  icon: LucideIcon
}

export const dashboardNav: NavItem[] = [
  { label: 'Genel Bakış', href: '/', icon: LayoutDashboard },
  { label: 'Karakterlerim', href: '/characters', icon: Users },
  { label: 'Kazanç', href: '/earnings', icon: TrendingUp },
  { label: 'Çekim', href: '/payout', icon: Banknote },
  { label: 'Ayarlar', href: '/settings', icon: Settings },
]

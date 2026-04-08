import type { Metadata } from 'next'
import { ReactNode } from 'react'
import { DashboardShell } from '@/components/dashboard/shared/layout'

export const metadata: Metadata = {
  title: {
    default: 'Dashboard',
    template: '%s | FitAI',
  },
  description: 'Your AI Personal Training Dashboard',
}

interface DashboardLayoutProps {
  children: ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return <DashboardShell>{children}</DashboardShell>
}

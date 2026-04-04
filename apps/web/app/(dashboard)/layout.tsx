import type { Metadata } from 'next'
import { DashboardSidebar } from '@/components/shared/dashboard-sidebar'
import { DashboardHeader } from '@/components/shared/dashboard-header'

export const metadata: Metadata = {
  title: {
    default: 'Dashboard',
    template: '%s | FitAI Dashboard',
  },
}

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <DashboardSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <DashboardHeader />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  )
}

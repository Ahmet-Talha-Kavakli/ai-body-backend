'use client'

import { ReactNode, useState } from 'react'
import { DashboardSidebar } from './sidebar'
import { DashboardHeader } from './header'
import { BottomNav } from '@/components/navigation/BottomNav'

interface DashboardShellProps {
  children: ReactNode
}

export function DashboardShell({ children }: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="mesh-bg-animated flex h-screen overflow-hidden">
      {/* Sidebar */}
      <DashboardSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <DashboardHeader onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

        {/* Page content */}
        <main className="flex-1 overflow-y-auto pb-24 lg:pb-0">
          <div className="px-4 py-8 sm:px-6 lg:px-8">{children}</div>
        </main>
      </div>

      {/* Floating bottom navigation for mobile */}
      <BottomNav />

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  )
}

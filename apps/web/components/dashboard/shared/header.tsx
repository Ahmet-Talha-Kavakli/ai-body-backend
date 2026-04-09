'use client'

import { Search } from 'lucide-react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { THIINGS } from '@/lib/thiings'

interface DashboardHeaderProps {
  onMenuClick: () => void
}

export function DashboardHeader({ onMenuClick }: DashboardHeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-border/30 bg-card/50 backdrop-blur-sm">
      <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
        {/* Menu button (mobile only) */}
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={onMenuClick}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <line x1="2" y1="4" x2="18" y2="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <line x1="2" y1="10" x2="18" y2="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <line x1="2" y1="16" x2="18" y2="16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </Button>

        {/* Logo (mobile only) */}
        <div className="lg:hidden font-bold text-lg">FitAI</div>

        {/* Search bar (hidden on mobile) */}
        <div className="hidden sm:flex flex-1 max-w-xs ml-4">
          <div className="relative w-full">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search workouts..."
              className="pl-8"
            />
          </div>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon">
            <Image src={THIINGS.bell} alt="notifications" width={20} height={20} unoptimized className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon">
            <Image src={THIINGS.profileIcon} alt="user" width={20} height={20} unoptimized className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </header>
  )
}

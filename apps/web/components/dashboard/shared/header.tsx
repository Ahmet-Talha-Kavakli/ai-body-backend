'use client'

import { useUser } from '@clerk/nextjs'
import { Menu } from 'lucide-react'
import Image from 'next/image'
import { NotificationPopover } from '@/components/notifications/NotificationPopover'

interface DashboardHeaderProps {
  onMenuClick: () => void
}

export function DashboardHeader({ onMenuClick }: DashboardHeaderProps) {
  const { user } = useUser()
  const avatarUrl = user?.imageUrl
  const initials = user?.firstName?.[0] ?? 'U'

  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-black/60 backdrop-blur-xl">
      <div className="flex h-16 items-center justify-between px-4">
        {/* MOBILE */}
        <div className="flex w-full items-center justify-between lg:hidden">
          {/* Sol: Avatar */}
          <div className="h-9 w-9 overflow-hidden rounded-full ring-2 ring-indigo-500/30">
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt="avatar"
                width={36}
                height={36}
                className="h-full w-full object-cover"
                unoptimized
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-indigo-500 text-sm font-bold text-white">
                {initials}
              </div>
            )}
          </div>

          {/* Orta: Logo */}
          <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-lg font-black text-transparent">
            FitAI
          </span>

          {/* Sağ: Bildirim */}
          <NotificationPopover />
        </div>

        {/* DESKTOP */}
        <div className="hidden w-full items-center justify-between lg:flex">
          {/* Sol: Hamburger menü */}
          <button
            onClick={onMenuClick}
            className="rounded-lg p-2 text-white/70 transition-colors hover:bg-white/5"
          >
            <Menu size={20} />
          </button>

          {/* Sağ: Bildirim + Avatar */}
          <div className="flex items-center gap-4">
            <NotificationPopover />

            <div className="h-8 w-8 overflow-hidden rounded-full ring-2 ring-indigo-500/30">
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt="avatar"
                  width={32}
                  height={32}
                  className="h-full w-full object-cover"
                  unoptimized
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-indigo-500 text-xs font-bold text-white">
                  {initials}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

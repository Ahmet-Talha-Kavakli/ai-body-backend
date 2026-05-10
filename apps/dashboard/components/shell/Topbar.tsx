'use client'

import { Bell, Search } from 'lucide-react'
import { UserButton } from '@clerk/nextjs'

export function Topbar() {
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border bg-bg/60 px-6 backdrop-blur-xl lg:px-8">
      <div className="max-w-md flex-1">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-subtle" />
          <input
            type="text"
            placeholder="Ara…"
            className="h-9 w-full rounded-lg border border-border bg-white/5 pl-9 pr-3 text-[14px] text-ink transition-colors placeholder:text-ink-subtle focus:border-border-strong focus:bg-white/10 focus:outline-none"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          aria-label="Bildirimler"
          className="relative flex h-9 w-9 items-center justify-center rounded-lg text-ink-muted transition-all hover:bg-white/5 hover:text-ink"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-accent shadow-[0_0_8px_rgba(48,209,88,0.6)]" />
        </button>

        <UserButton
          appearance={{
            elements: {
              avatarBox: 'w-9 h-9',
            },
          }}
        />
      </div>
    </header>
  )
}

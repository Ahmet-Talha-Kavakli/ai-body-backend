'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/cn'
import { dashboardNav } from '@/lib/nav'

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-border bg-bg-elevated lg:flex">
      <div className="flex h-16 items-center border-b border-border px-6">
        <Link href="/" className="group flex items-center gap-2">
          <div className="h-7 w-7 rounded-full bg-gradient-to-br from-accent via-accent-bright to-accent-deep shadow-[0_0_16px_rgba(48,209,88,0.4)]" />
          <div className="flex flex-col leading-none">
            <span className="text-[15px] font-semibold tracking-tight">FitAI</span>
            <span className="text-[11px] text-ink-muted">Yaratıcı Paneli</span>
          </div>
        </Link>
      </div>

      <nav className="scrollbar-thin flex-1 space-y-0.5 overflow-y-auto p-3">
        {dashboardNav.map((item) => {
          const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'group flex h-10 items-center gap-3 rounded-lg px-3 text-[14px] transition-all duration-200',
                active
                  ? 'border border-border bg-white/5 text-ink'
                  : 'border border-transparent text-ink-muted hover:bg-white/5 hover:text-ink'
              )}
            >
              <item.icon
                className={cn(
                  'h-4 w-4 transition-colors',
                  active ? 'text-accent' : 'text-ink-subtle group-hover:text-ink-muted'
                )}
              />
              <span className="font-medium">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-border p-3">
        <a
          href="https://fitai.com"
          target="_blank"
          rel="noreferrer"
          className="flex h-9 items-center gap-2 rounded-lg px-3 text-[13px] text-ink-muted transition-all hover:bg-white/5 hover:text-ink"
        >
          ← Ana siteye dön
        </a>
      </div>
    </aside>
  )
}

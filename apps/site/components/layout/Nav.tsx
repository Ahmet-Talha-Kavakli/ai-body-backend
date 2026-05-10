'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { SignedIn, SignedOut, UserButton } from '@clerk/nextjs'
import { siteConfig } from '@/lib/site-config'
import { Container } from '@/components/ui/Container'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/cn'

export function Nav() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 8)
    handler()
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        'fixed inset-x-0 top-0 z-50 transition-all duration-300',
        scrolled ? 'py-3' : 'py-5'
      )}
    >
      <Container size="xl">
        <div
          className={cn(
            'flex items-center justify-between rounded-full px-5 py-2.5 transition-all duration-300',
            scrolled ? 'glass border border-border-strong' : 'border border-transparent'
          )}
        >
          <Link href="/" className="group flex items-center gap-2">
            <div className="relative h-8 w-8 rounded-full bg-gradient-to-br from-accent via-accent-bright to-accent-deep shadow-[0_0_20px_rgba(48,209,88,0.4)] transition-shadow group-hover:shadow-[0_0_28px_rgba(48,209,88,0.6)]" />
            <span className="text-[17px] font-semibold tracking-tight">{siteConfig.name}</span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {siteConfig.nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-full px-4 py-2 text-[14px] text-ink-muted transition-colors duration-200 hover:bg-white/5 hover:text-ink"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <SignedOut>
              <Link
                href="/sign-in"
                className="hidden px-4 py-2 text-[14px] text-ink-muted transition-colors hover:text-ink sm:inline-block"
              >
                Giriş
              </Link>
              <Link href="/sign-up">
                <Button size="sm" variant="primary">
                  Başla
                </Button>
              </Link>
            </SignedOut>
            <SignedIn>
              <Link
                href="https://app.fitai.com"
                className="hidden px-4 py-2 text-[14px] text-ink-muted transition-colors hover:text-ink sm:inline-block"
              >
                Dashboard
              </Link>
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: 'w-9 h-9',
                  },
                }}
              />
            </SignedIn>
          </div>
        </div>
      </Container>
    </motion.header>
  )
}

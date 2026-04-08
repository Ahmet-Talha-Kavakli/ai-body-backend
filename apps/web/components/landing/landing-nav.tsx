'use client'

import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'
import { SignedIn, SignedOut, UserButton } from '@clerk/nextjs'
import { motion, useScroll, useMotionValueEvent, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils/cn'
import { Dumbbell, Menu, X } from 'lucide-react'

// ─── Scroll Detection ────────────────────────────────────────────────────────

// ─── Types ────────────────────────────────────────────────────────────────────

interface NavLink {
  label: string
  href: string
}

// ─── Constants ────────────────────────────────────────────────────────────────

const NAV_LINKS: NavLink[] = [
  { label: 'Features', href: '#features' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'Blog', href: '/blog' },
]

// ─── Animated Pill Nav Item ───────────────────────────────────────────────────

interface NavItemProps {
  link: NavLink
  isActive: boolean
  onHover: (href: string | null) => void
  hoveredHref: string | null
}

function NavItem({ link, isActive, onHover, hoveredHref }: NavItemProps) {
  return (
    <Link
      href={link.href}
      onMouseEnter={() => onHover(link.href)}
      onMouseLeave={() => onHover(null)}
      className="relative px-4 py-2 text-sm font-medium transition-colors duration-200"
      style={{ mixBlendMode: hoveredHref ? 'normal' : 'normal' }}
    >
      {hoveredHref === link.href && (
        <motion.span
          layoutId="nav-pill"
          className="absolute inset-0 rounded-full bg-primary/10"
          transition={{ type: 'spring', stiffness: 350, damping: 30 }}
        />
      )}
      <span
        className={cn(
          'relative z-10 transition-colors duration-200',
          isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
        )}
      >
        {link.label}
      </span>
    </Link>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function LandingNav() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [hoveredHref, setHoveredHref] = useState<string | null>(null)
  const [activeHref, setActiveHref] = useState<string | null>(null)
  const [isMounted, setIsMounted] = useState(false)
  const { scrollY } = useScroll()

  useMotionValueEvent(scrollY, 'change', (latest) => {
    setIsScrolled(latest > 20)
  })

  // Only mount client-side to prevent hydration mismatch
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Close mobile menu on resize
  useEffect(() => {
    if (!isMounted) return
    const handler = () => setMobileOpen(false)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [isMounted])

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (!isMounted) return
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen, isMounted])

  return (
    <motion.header
      className={cn(
        'fixed inset-x-0 top-0 z-50 transition-all duration-300',
        isScrolled
          ? 'bg-background/85 shadow-lg shadow-primary/5 backdrop-blur-md border-b border-border/30'
          : 'bg-transparent border-b border-transparent'
      )}
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 280, damping: 28, delay: 0.1 }}
      style={{
        boxShadow: isScrolled
          ? '0 4px 20px rgba(0, 0, 0, 0.1)'
          : '0 0px 0px rgba(0, 0, 0, 0)',
      }}
    >
      <div className="container flex h-16 items-center justify-between">

        {/* ── Logo ── */}
        <Link
          href="/"
          className="group flex items-center gap-2.5 font-bold text-xl"
          aria-label="FitAI Home"
        >
          <motion.div
            className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/20"
            whileHover={{ scale: 1.08, rotate: -6 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          >
            <Dumbbell className="h-4 w-4 text-primary-foreground" />
          </motion.div>
          <span className="text-foreground tracking-tight">FitAI</span>
        </Link>

        {/* ── Desktop Nav ── */}
        <nav className="hidden items-center md:flex" aria-label="Main navigation">
          {NAV_LINKS.map((link) => (
            <NavItem
              key={link.href}
              link={link}
              isActive={activeHref === link.href}
              onHover={setHoveredHref}
              hoveredHref={hoveredHref}
            />
          ))}
        </nav>

        {/* ── Desktop CTA ── */}
        <div className="hidden items-center gap-3 md:flex">
          <SignedOut>
            <Link
              href="/sign-in"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Sign In
            </Link>
            <Link
              href="/sign-up"
              className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/20 transition-all hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/25 active:scale-95"
            >
              Start Free
            </Link>
          </SignedOut>
          <SignedIn>
            <Link
              href="/dashboard"
              className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/20 transition-all hover:bg-primary/90 active:scale-95"
            >
              Dashboard
            </Link>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
        </div>

        {/* ── Mobile Menu Button ── */}
        <motion.button
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-border/50 bg-background/80 backdrop-blur-sm md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileOpen}
          whileTap={{ scale: 0.92 }}
        >
          <AnimatePresence mode="wait" initial={false}>
            {mobileOpen ? (
              <motion.span
                key="close"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <X className="h-4 w-4" />
              </motion.span>
            ) : (
              <motion.span
                key="menu"
                initial={{ rotate: 90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: -90, opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <Menu className="h-4 w-4" />
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </div>

      {/* ── Mobile Menu ── */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className="border-t border-border/50 bg-background/95 backdrop-blur-xl md:hidden"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
          >
            <nav className="flex flex-col gap-1 px-4 py-4" aria-label="Mobile navigation">
              {NAV_LINKS.map((link, i) => (
                <motion.div
                  key={link.href}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Link
                    href={link.href}
                    className="flex items-center rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                    onClick={() => setMobileOpen(false)}
                  >
                    {link.label}
                  </Link>
                </motion.div>
              ))}

              <div className="mt-3 flex flex-col gap-2 border-t border-border/50 pt-3">
                <SignedOut>
                  <Link
                    href="/sign-in"
                    className="flex h-10 items-center justify-center rounded-xl border border-border text-sm font-medium transition-colors hover:bg-accent"
                    onClick={() => setMobileOpen(false)}
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/sign-up"
                    className="flex h-10 items-center justify-center rounded-xl bg-primary text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 active:scale-95"
                    onClick={() => setMobileOpen(false)}
                  >
                    Start Free
                  </Link>
                </SignedOut>
                <SignedIn>
                  <Link
                    href="/dashboard"
                    className="flex h-10 items-center justify-center rounded-xl bg-primary text-sm font-semibold text-primary-foreground"
                    onClick={() => setMobileOpen(false)}
                  >
                    Dashboard
                  </Link>
                </SignedIn>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  )
}

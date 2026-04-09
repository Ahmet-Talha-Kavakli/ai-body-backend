# Landing Page Redesign Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fully rewrite the FitAI marketing landing page with a premium "Editorial Motion" aesthetic — scroll-driven animations, large editorial typography, no generic AI site patterns.

**Architecture:** Each landing section is a standalone `'use client'` component in `apps/web/components/landing/`. Two shared UI components (`gradient-hover-button`, `star-rating`) need prop modifications before landing components are built. `page.tsx` imports remain unchanged.

**Tech Stack:** Next.js 15, framer-motion, Tailwind CSS, existing `components/ui/` library

> **Spec deviations (intentional):**
> - `scroll-expansion-hero` (ScrollExpandMedia) requires mandatory `mediaSrc` + `bgImageSrc` URL props — no real media assets exist yet. Hero uses `particle-text-effect` as the animated background layer instead. Same cinematic intent, no missing-asset risk.
> - `stagger-testimonials` is a carousel with hardcoded data — not configurable. Testimonials use a custom framer-motion masonry grid that achieves the stagger effect with real FitAI copy.

---

## Chunk 1: UI Component Modifications

### Task 1: Modify `gradient-hover-button` to accept props

**Files:**

- Modify: `apps/web/components/ui/gradient-hover-button.tsx`

- [ ] **Step 1: Add props interface and update component**

Replace the entire file content with:

```tsx
'use client'

import React from 'react'
import Link from 'next/link'

interface GradientHoverButtonProps {
  children: React.ReactNode
  href?: string
  onClick?: () => void
  className?: string
  hoverText?: string
}

export function GradientHoverButton({
  children,
  href,
  onClick,
  className = '',
  hoverText,
}: GradientHoverButtonProps) {
  const display = hoverText ?? children

  const inner = (
    <button
      onClick={onClick}
      className={`relative inline-flex h-14 items-center rounded-full px-8 font-semibold text-lg text-gray-800 transition-all duration-300 ${className}`}
      style={{ backgroundColor: 'rgba(255, 208, 116)' }}
    >
      <div
        className="absolute inset-0 overflow-hidden rounded-full"
        style={{ transform: 'scale(1)', transition: 'transform 1.8s cubic-bezier(0.19, 1, 0.22, 1)' }}
      >
        <div className="absolute top-[-60%] left-1/2 aspect-square w-[max(200%,10rem)]" style={{ transform: 'translate(-50%)' }}>
          <div className="absolute inset-0 rounded-full" style={{ backgroundColor: 'rgba(163, 116, 255)', transform: 'scale(0)', transition: 'transform 1.3s cubic-bezier(0.19, 1, 0.22, 1)' }} />
          <div className="absolute inset-0 rounded-full" style={{ backgroundColor: 'rgba(23, 241, 209)', transform: 'scale(0)', transition: 'transform 1.3s cubic-bezier(0.19, 1, 0.22, 1)', transitionDelay: '0.1s' }} />
          <div className="absolute inset-0 rounded-full" style={{ backgroundColor: 'rgba(255, 208, 116)', transform: 'scale(0)', transition: 'transform 1.3s cubic-bezier(0.19, 1, 0.22, 1)', transitionDelay: '0.2s' }} />
        </div>
      </div>
      <div className="relative pointer-events-none">
        <span className="block transition-all duration-300" style={{ transform: 'translateY(0)', opacity: 1 }}>{children}</span>
        <span className="absolute top-0 left-0 block transition-all duration-300" style={{ transform: 'translateY(70%)', opacity: 0 }}>{display}</span>
      </div>
      <style>{`
        button:hover > div:first-child { transform: scale(1.1); }
        button:hover > div:first-child > div:nth-child(1) { transform: scale(1) !important; }
        button:hover > div:first-child > div:nth-child(2) { transform: scale(1) !important; }
        button:hover > div:first-child > div:nth-child(3) { transform: scale(1) !important; }
        button:hover > div:last-child > span:first-child { opacity: 0; transform: translateY(-70%); }
        button:hover > div:last-child > span:last-child { opacity: 1; transform: translateY(0); }
      `}</style>
    </button>
  )

  if (href) return <Link href={href}>{inner}</Link>
  return inner
}
```

- [ ] **Step 2: Commit**

```bash
cd apps/web && git add components/ui/gradient-hover-button.tsx && git commit -m "feat: make GradientHoverButton accept children and href props"
```

---

### Task 2: Modify `star-rating` to support read-only display mode

**Files:**

- Modify: `apps/web/components/ui/star-rating.tsx`

- [ ] **Step 1: Add readOnly + defaultValue props**

Replace the entire file content with:

```tsx
'use client'

import React, { useState } from 'react'

interface StarRatingProps {
  defaultValue?: number
  readOnly?: boolean
  onChange?: (rating: number) => void
}

const StarIcon = ({ filled, isHovered }: { filled: boolean; isHovered: boolean }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    className={`w-6 h-6 transition-all duration-500 ${
      filled
        ? 'fill-yellow-400 stroke-yellow-400 stroke-0'
        : isHovered
          ? 'fill-transparent stroke-yellow-400'
          : 'fill-transparent stroke-gray-500'
    }`}
    strokeWidth="1"
    strokeLinejoin="bevel"
    style={{
      animation: filled ? 'yippee 0.75s ease-out backwards' : 'idle 4s linear infinite',
      strokeDasharray: filled ? 0 : 12,
      strokeDashoffset: filled ? 0 : 24,
    }}
  >
    <path pathLength={360} d="M12,17.27L18.18,21L16.54,13.97L22,9.24L14.81,8.62L12,2L9.19,8.62L2,9.24L7.45,13.97L5.82,21L12,17.27Z" />
  </svg>
)

export function StarRating({ defaultValue = 0, readOnly = false, onChange }: StarRatingProps) {
  const [rating, setRating] = useState(defaultValue)
  const [hovered, setHovered] = useState(0)

  const handleClick = (star: number) => {
    if (readOnly) return
    setRating(star)
    onChange?.(star)
  }

  return (
    <div className={`flex flex-row gap-1 ${readOnly ? '' : 'flex-row-reverse cursor-pointer'}`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <label
          key={star}
          onMouseEnter={() => !readOnly && setHovered(star)}
          onMouseLeave={() => !readOnly && setHovered(0)}
          onClick={() => handleClick(star)}
          className={readOnly ? 'pointer-events-none' : 'cursor-pointer'}
        >
          <input type="radio" name="star-rating" value={star} checked={rating === star} onChange={() => handleClick(star)} className="hidden" />
          <StarIcon filled={rating >= star} isHovered={!readOnly && hovered >= star} />
        </label>
      ))}
      <style>{`
        @keyframes idle { from { stroke-dashoffset: 24; } to { stroke-dashoffset: 0; } }
        @keyframes yippee {
          0% { transform: scale(1); fill-opacity: 0; stroke-opacity: 1; stroke-dasharray: 10; stroke-width: 1px; }
          30% { transform: scale(0); fill-opacity: 0; stroke-opacity: 1; stroke-dasharray: 10; stroke-width: 1px; }
          30.1% { stroke-dasharray: 0; stroke-width: 8px; }
          60% { transform: scale(1.2); }
          100% { transform: scale(1); }
        }
      `}</style>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/ui/star-rating.tsx && git commit -m "feat: add readOnly and defaultValue props to StarRating"
```

---

## Chunk 2: Navigation + Hero

### Task 3: Rewrite `landing-nav.tsx`

**Files:**

- Modify: `apps/web/components/landing/landing-nav.tsx`

- [ ] **Step 1: Rewrite the navigation component**

Replace entire file:

```tsx
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { GradientHoverButton } from '@/components/ui/gradient-hover-button'
import { HamburgerMenu } from '@/components/ui/hamburger-menu'

const navLinks = [
  { label: 'Features', href: '#features' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Pricing', href: '#pricing' },
]

export function LandingNav() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-[#080808]/90 backdrop-blur-md border-b border-zinc-800/50'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-bold text-white tracking-tight">
              Fit<span className="text-primary">AI</span>
            </span>
          </Link>

          {/* Desktop nav links */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-zinc-400 hover:text-white transition-colors duration-200"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Desktop CTAs */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/sign-in"
              className="text-sm text-zinc-400 hover:text-white transition-colors duration-200 px-4 py-2"
            >
              Sign In
            </Link>
            <GradientHoverButton href="/sign-up" className="!h-10 !px-5 !text-sm !rounded-full">
              Get Started
            </GradientHoverButton>
          </div>

          {/* Mobile hamburger */}
          <div className="md:hidden">
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="text-zinc-400 hover:text-white p-2"
              aria-label="Toggle menu"
            >
              <div className="w-5 h-4 flex flex-col justify-between">
                <span className={`block h-0.5 bg-current transition-all duration-300 ${mobileOpen ? 'rotate-45 translate-y-1.5' : ''}`} />
                <span className={`block h-0.5 bg-current transition-all duration-300 ${mobileOpen ? 'opacity-0' : ''}`} />
                <span className={`block h-0.5 bg-current transition-all duration-300 ${mobileOpen ? '-rotate-45 -translate-y-2' : ''}`} />
              </div>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-zinc-800 py-4 flex flex-col gap-4"
          >
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="text-zinc-400 hover:text-white transition-colors text-sm px-1"
              >
                {link.label}
              </Link>
            ))}
            <Link href="/sign-in" className="text-zinc-400 hover:text-white text-sm px-1">Sign In</Link>
            <Link href="/sign-up" className="text-primary font-medium text-sm px-1">Get Started →</Link>
          </motion.div>
        )}
      </div>
    </motion.header>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/landing/landing-nav.tsx && git commit -m "feat: rewrite landing nav with scroll-aware style and mobile menu"
```

---

### Task 4: Rewrite `hero-section.tsx`

**Files:**

- Modify: `apps/web/components/landing/hero-section.tsx`

- [ ] **Step 1: Rewrite the hero section**

Replace entire file:

```tsx
'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { GradientHoverButton } from '@/components/ui/gradient-hover-button'
import { ParticleTextEffect } from '@/components/ui/particle-text-effect'
import { ScrollDownIndicator } from '@/components/ui/scroll-down-indicator'

const socialProofAvatars = ['JK', 'AM', 'SR', 'TL', 'DM']

export function HeroSection() {
  return (
    <section className="relative min-h-screen w-full overflow-hidden bg-[#080808] flex flex-col">
      {/* Subtle grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '80px 80px',
        }}
      />

      {/* Single focused glow — top center, no blob pattern */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-primary/8 blur-[120px] pointer-events-none" />

      {/* Particle text canvas — background layer */}
      <div className="absolute inset-0 pointer-events-none opacity-60">
        <ParticleTextEffect words={['FITAI', 'AI TRAINER', 'YOUR COACH', 'GET FIT']} />
      </div>

      {/* Main content */}
      <div className="relative z-10 flex-1 flex items-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16 w-full">
          <div className="max-w-3xl">
            {/* Eyebrow label */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/10 text-primary text-xs font-medium mb-6"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              Powered by AI — Personalized for You
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-5xl sm:text-6xl lg:text-7xl font-black text-white leading-[1.05] tracking-tight mb-6"
            >
              Your AI
              <br />
              <span className="text-primary">Personal</span>
              <br />
              Trainer
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.35 }}
              className="text-lg text-zinc-400 max-w-md leading-relaxed mb-10"
            >
              AI-generated workout programs, real-time form feedback, and nutrition tracking — all in one place.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="flex flex-wrap items-center gap-4 mb-12"
            >
              <GradientHoverButton href="/sign-up">
                Start Free Trial
              </GradientHoverButton>
              <Link
                href="#how-it-works"
                className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors text-sm font-medium"
              >
                <span className="w-8 h-8 rounded-full border border-zinc-700 flex items-center justify-center">
                  <svg width="10" height="12" viewBox="0 0 10 12" fill="currentColor">
                    <path d="M8.5 6L2 2v8l6.5-4z" />
                  </svg>
                </span>
                Watch Demo
              </Link>
            </motion.div>

            {/* Social proof */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.7 }}
              className="flex items-center gap-3"
            >
              <div className="flex -space-x-2">
                {socialProofAvatars.map((initials, i) => (
                  <div
                    key={i}
                    className="w-8 h-8 rounded-full bg-zinc-700 border-2 border-[#080808] flex items-center justify-center text-[10px] font-bold text-zinc-300"
                  >
                    {initials}
                  </div>
                ))}
              </div>
              <div>
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-3 h-3 fill-yellow-400" viewBox="0 0 24 24">
                      <path d="M12,17.27L18.18,21L16.54,13.97L22,9.24L14.81,8.62L12,2L9.19,8.62L2,9.24L7.45,13.97L5.82,21L12,17.27Z" />
                    </svg>
                  ))}
                </div>
                <p className="text-xs text-zinc-500 mt-0.5">10,000+ active users</p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="relative z-10 flex justify-center pb-8"
      >
        <ScrollDownIndicator />
      </motion.div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#080808] to-transparent pointer-events-none" />
    </section>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/landing/hero-section.tsx && git commit -m "feat: rewrite hero section with particle text, editorial layout"
```

---

## Chunk 3: Features + How It Works

### Task 5: Rewrite `features-section.tsx`

**Files:**

- Modify: `apps/web/components/landing/features-section.tsx`

- [ ] **Step 1: Rewrite features section**

Replace entire file:

```tsx
'use client'

import { motion } from 'framer-motion'
import { GlowCard } from '@/components/ui/spotlight-card'
import { BackgroundPaths } from '@/components/ui/background-paths'

const features = [
  {
    number: '01',
    title: 'AI Program Generation',
    description: 'Answer a few questions and get a fully personalized workout program in seconds. Adapts weekly based on your progress and feedback.',
    tag: 'Core',
    featured: false,
  },
  {
    number: '02',
    title: 'Real-time Form Analysis',
    description: 'Your phone camera becomes your coach. Get instant feedback on your form during workouts to maximize gains and prevent injury.',
    tag: 'Pro',
    featured: true,
  },
  {
    number: '03',
    title: 'Nutrition Tracking',
    description: 'Log meals with a photo, get macro breakdowns, and receive AI-powered nutrition advice aligned with your fitness goals.',
    tag: 'Core',
    featured: false,
  },
  {
    number: '04',
    title: 'Progress Analytics',
    description: 'Visualize your transformation over time. Track strength gains, body composition, and habit consistency with beautiful charts.',
    tag: 'Core',
    featured: false,
  },
]

export function FeaturesSection() {
  return (
    <section id="features" className="relative py-24 lg:py-32 bg-[#080808] overflow-hidden">
      {/* Background paths texture */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <BackgroundPaths title="" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-20"
        >
          <p className="text-primary text-sm font-medium uppercase tracking-widest mb-3">Features</p>
          <h2 className="text-4xl lg:text-5xl font-black text-white max-w-lg leading-tight">
            Everything you need to transform your body
          </h2>
        </motion.div>

        {/* Features list */}
        <div className="space-y-16 lg:space-y-24">
          {features.map((feature, i) => (
            <motion.div
              key={feature.number}
              initial={{ opacity: 0, x: i % 2 === 0 ? -40 : 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            >
              {feature.featured ? (
                /* Featured feature — full spotlight card */
                <GlowCard
                  glowColor="green"
                  customSize
                  className="w-full !h-auto p-10 lg:p-14"
                >
                  <div className="flex flex-col lg:flex-row lg:items-end gap-8">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-4">
                        <span className="text-6xl lg:text-8xl font-black text-white/10 leading-none select-none">
                          {feature.number}
                        </span>
                        <span className="px-2 py-1 rounded text-xs font-medium bg-primary/20 text-primary border border-primary/30">
                          {feature.tag}
                        </span>
                      </div>
                      <h3 className="text-3xl lg:text-4xl font-black text-white mb-4">
                        {feature.title}
                      </h3>
                      <p className="text-zinc-400 text-lg leading-relaxed max-w-xl">
                        {feature.description}
                      </p>
                    </div>
                    <div className="text-primary/30 text-[120px] font-black leading-none select-none hidden lg:block">
                      ↗
                    </div>
                  </div>
                </GlowCard>
              ) : (
                /* Regular feature row */
                <div className={`flex flex-col ${i % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'} items-start gap-8 lg:gap-16`}>
                  {/* Number */}
                  <div className="flex-shrink-0">
                    <span className="text-7xl lg:text-9xl font-black text-white/5 leading-none select-none">
                      {feature.number}
                    </span>
                  </div>
                  {/* Content */}
                  <div className="flex-1 pt-2">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-2xl lg:text-3xl font-black text-white">{feature.title}</h3>
                      <span className="px-2 py-1 rounded text-xs font-medium bg-zinc-800 text-zinc-400 border border-zinc-700">
                        {feature.tag}
                      </span>
                    </div>
                    <p className="text-zinc-400 text-lg leading-relaxed max-w-lg">
                      {feature.description}
                    </p>
                    {/* Decorative line */}
                    <div className="mt-6 h-px w-24 bg-gradient-to-r from-primary/50 to-transparent" />
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/landing/features-section.tsx && git commit -m "feat: rewrite features section with editorial alternating layout"
```

---

### Task 6: Rewrite `how-it-works-section.tsx`

**Files:**

- Modify: `apps/web/components/landing/how-it-works-section.tsx`

- [ ] **Step 1: Rewrite how it works section**

Replace entire file:

```tsx
'use client'

import { motion } from 'framer-motion'
import { ContainerScroll } from '@/components/ui/container-scroll-animation'

const steps = [
  {
    number: '01',
    title: 'Onboard in minutes',
    description: 'Tell us your goals, fitness level, and available equipment. No gym required.',
    icon: '→',
  },
  {
    number: '02',
    title: 'Get your AI program',
    description: 'Your personalized workout and nutrition plan is ready in seconds. Fully explained, fully yours.',
    icon: '⚡',
  },
  {
    number: '03',
    title: 'Track & improve',
    description: 'Log sessions, measure progress, and watch your AI coach adapt the plan as you grow stronger.',
    icon: '↑',
  },
]

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-24 lg:py-32 bg-[#080808]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ContainerScroll
          titleComponent={
            <div className="mb-16 text-center">
              <motion.p
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                className="text-primary text-sm font-medium uppercase tracking-widest mb-3"
              >
                How It Works
              </motion.p>
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="text-4xl lg:text-5xl font-black text-white"
              >
                From zero to training
                <br />
                <span className="text-primary">in three steps</span>
              </motion.h2>
            </div>
          }
        >
          <div className="bg-zinc-900 rounded-2xl p-8 lg:p-12 w-full">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-0 relative">
              {/* Connecting line (desktop only) */}
              <div className="hidden lg:block absolute top-10 left-[16.66%] right-[16.66%] h-px bg-gradient-to-r from-primary/30 via-primary/60 to-primary/30" />

              {steps.map((step, i) => (
                <motion.div
                  key={step.number}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.15 }}
                  className="relative flex flex-col items-center text-center px-4"
                >
                  {/* Step circle */}
                  <div className="relative z-10 w-20 h-20 rounded-full bg-[#080808] border-2 border-primary/50 flex items-center justify-center mb-6">
                    <span className="text-2xl font-black text-primary">{step.icon}</span>
                  </div>
                  <span className="text-xs text-zinc-600 font-mono mb-2">{step.number}</span>
                  <h3 className="text-xl font-bold text-white mb-3">{step.title}</h3>
                  <p className="text-zinc-400 text-sm leading-relaxed">{step.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </ContainerScroll>
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/landing/how-it-works-section.tsx && git commit -m "feat: rewrite how-it-works with ContainerScroll animation"
```

---

## Chunk 4: Testimonials + Pricing

### Task 7: Rewrite `testimonials-section.tsx`

**Files:**

- Modify: `apps/web/components/landing/testimonials-section.tsx`

- [ ] **Step 1: Rewrite testimonials section**

Replace entire file:

```tsx
'use client'

import { motion } from 'framer-motion'
import { StarRating } from '@/components/ui/star-rating'

const testimonials = [
  {
    quote: "I've tried every fitness app out there. FitAI is the first one that actually adapts to me — not a template.",
    name: 'Sarah K.',
    role: 'Busy mom of two',
    rating: 5,
    initials: 'SK',
  },
  {
    quote: 'Lost 12kg in 4 months. The AI nutrition coach changed everything about how I eat.',
    name: 'Marcus T.',
    role: 'Software engineer',
    rating: 5,
    initials: 'MT',
  },
  {
    quote: "Form feedback during workouts is insane. Like having a PT in your pocket for 1% of the cost.",
    name: 'Aisha R.',
    role: 'Nurse, amateur runner',
    rating: 5,
    initials: 'AR',
  },
  {
    quote: 'Finally hit my first pull-up after years of trying. The progressive programming just works.',
    name: 'Jake L.',
    role: 'Office worker',
    rating: 5,
    initials: 'JL',
  },
  {
    quote: 'The weekly plan adjustments are scary accurate. It knows when I need a rest day before I do.',
    name: 'Diana M.',
    role: 'Yoga instructor',
    rating: 5,
    initials: 'DM',
  },
  {
    quote: "Recommended FitAI to my entire team. We do weekly challenges now. Productivity is actually up.",
    name: 'Ravi P.',
    role: 'Startup founder',
    rating: 5,
    initials: 'RP',
  },
]

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.08, ease: 'easeOut' },
  }),
}

export function TestimonialsSection() {
  return (
    <section className="py-24 lg:py-32 bg-[#080808]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-16"
        >
          <p className="text-primary text-sm font-medium uppercase tracking-widest mb-3">Testimonials</p>
          <h2 className="text-4xl lg:text-5xl font-black text-white">
            Real people.
            <br />
            Real results.
          </h2>
        </motion.div>

        {/* Staggered masonry grid */}
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-5 space-y-5">
          {testimonials.map((t, i) => (
            <motion.div
              key={i}
              custom={i}
              variants={cardVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-40px' }}
              className="break-inside-avoid bg-zinc-900 border border-zinc-800 rounded-2xl p-6 hover:border-zinc-700 transition-colors duration-300"
            >
              <StarRating defaultValue={t.rating} readOnly />
              <p className="text-zinc-300 text-sm leading-relaxed mt-4 mb-5">
                &ldquo;{t.quote}&rdquo;
              </p>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-400">
                  {t.initials}
                </div>
                <div>
                  <p className="text-white text-sm font-medium">{t.name}</p>
                  <p className="text-zinc-500 text-xs">{t.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/landing/testimonials-section.tsx && git commit -m "feat: rewrite testimonials with staggered masonry grid"
```

---

### Task 8: Rewrite `pricing-section.tsx`

**Files:**

- Modify: `apps/web/components/landing/pricing-section.tsx`

- [ ] **Step 1: Rewrite pricing section**

Replace entire file:

```tsx
'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { GlowCard } from '@/components/ui/spotlight-card'
import { GradientHoverButton } from '@/components/ui/gradient-hover-button'

const plans = [
  {
    name: 'Free',
    monthly: 0,
    annual: 0,
    description: 'For curious beginners',
    features: ['3 AI workouts / month', 'Basic nutrition logging', 'Progress tracking', 'Mobile app access'],
    cta: 'Get started free',
    href: '/sign-up',
    highlight: false,
  },
  {
    name: 'Pro',
    monthly: 19,
    annual: 15,
    description: 'For serious progress',
    features: ['Unlimited AI workouts', 'Real-time form analysis', 'Full nutrition AI coach', 'Advanced analytics', 'Priority support'],
    cta: 'Start Pro trial',
    href: '/sign-up?plan=pro',
    highlight: true,
  },
  {
    name: 'Elite',
    monthly: 49,
    annual: 39,
    description: 'For peak performance',
    features: ['Everything in Pro', '1-on-1 AI coaching sessions', 'Custom meal plans', 'Wearable device sync', 'Team challenges'],
    cta: 'Go Elite',
    href: '/sign-up?plan=elite',
    highlight: false,
  },
]

export function PricingSection() {
  const [annual, setAnnual] = useState(false)

  return (
    <section id="pricing" className="py-24 lg:py-32 bg-[#080808]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <p className="text-primary text-sm font-medium uppercase tracking-widest mb-3">Pricing</p>
          <h2 className="text-4xl lg:text-5xl font-black text-white mb-6">
            Simple, honest pricing
          </h2>

          {/* Billing toggle */}
          <div className="inline-flex items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-full px-4 py-2">
            <span className={`text-sm transition-colors ${!annual ? 'text-white' : 'text-zinc-500'}`}>Monthly</span>
            <button
              onClick={() => setAnnual(!annual)}
              className={`relative w-10 h-5 rounded-full transition-colors duration-300 ${annual ? 'bg-primary' : 'bg-zinc-700'}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform duration-300 ${annual ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
            <span className={`text-sm transition-colors ${annual ? 'text-white' : 'text-zinc-500'}`}>
              Annual
              <span className="ml-1.5 text-xs text-primary font-medium">Save 20%</span>
            </span>
          </div>
        </motion.div>

        {/* Pricing cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className={plan.highlight ? 'md:-mt-4 md:mb-4' : ''}
            >
              {plan.highlight ? (
                <GlowCard glowColor="green" customSize className="w-full !h-auto p-8">
                  <PricingCardContent plan={plan} annual={annual} />
                </GlowCard>
              ) : (
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 hover:border-zinc-700 transition-colors">
                  <PricingCardContent plan={plan} annual={annual} />
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

function PricingCardContent({ plan, annual }: { plan: typeof plans[0]; annual: boolean }) {
  const price = annual ? plan.annual : plan.monthly

  return (
    <>
      {plan.highlight && (
        <div className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-primary/20 text-primary border border-primary/30 mb-4">
          Most Popular
        </div>
      )}
      <h3 className="text-2xl font-black text-white mb-1">{plan.name}</h3>
      <p className="text-zinc-500 text-sm mb-6">{plan.description}</p>

      {/* Price */}
      <div className="flex items-end gap-1 mb-8">
        <motion.span
          key={price}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-5xl font-black text-white"
        >
          {price === 0 ? 'Free' : `$${price}`}
        </motion.span>
        {price > 0 && <span className="text-zinc-500 text-sm mb-2">/mo</span>}
      </div>

      {/* Features */}
      <ul className="space-y-3 mb-8">
        {plan.features.map((feature) => (
          <li key={feature} className="flex items-start gap-2.5 text-sm text-zinc-400">
            <span className="text-primary mt-0.5 flex-shrink-0">✓</span>
            {feature}
          </li>
        ))}
      </ul>

      {/* CTA */}
      {plan.highlight ? (
        <GradientHoverButton href={plan.href} className="!w-full !justify-center">
          {plan.cta}
        </GradientHoverButton>
      ) : (
        <Link
          href={plan.href}
          className="block w-full text-center py-3 px-6 rounded-full border border-zinc-700 text-zinc-300 text-sm font-medium hover:border-zinc-500 hover:text-white transition-colors"
        >
          {plan.cta}
        </Link>
      )}
    </>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/landing/pricing-section.tsx && git commit -m "feat: rewrite pricing section with toggle and spotlight highlight"
```

---

## Chunk 5: CTA + Footer + Cleanup

### Task 9: Rewrite `cta-section.tsx`

**Files:**

- Modify: `apps/web/components/landing/cta-section.tsx`

- [ ] **Step 1: Rewrite CTA section**

Replace entire file:

```tsx
'use client'

import { motion } from 'framer-motion'
import { WarpBackground } from '@/components/ui/warp-background'
import { GradientHoverButton } from '@/components/ui/gradient-hover-button'

export function CtaSection() {
  return (
    <section className="py-24 lg:py-32 bg-[#080808]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <WarpBackground className="rounded-3xl overflow-hidden">
          <div className="relative z-10 flex flex-col items-center justify-center py-24 px-8 text-center">
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-primary text-sm font-medium uppercase tracking-widest mb-4"
            >
              Ready?
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-4xl lg:text-6xl font-black text-white mb-10 leading-tight"
            >
              Start training smarter today.
            </motion.h2>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <GradientHoverButton href="/sign-up">
                Get Started Free
              </GradientHoverButton>
            </motion.div>
          </div>
        </WarpBackground>
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/landing/cta-section.tsx && git commit -m "feat: rewrite CTA section with WarpBackground"
```

---

### Task 10: Rewrite `landing-footer.tsx`

**Files:**

- Modify: `apps/web/components/landing/landing-footer.tsx`

- [ ] **Step 1: Rewrite footer**

Replace entire file:

```tsx
import Link from 'next/link'

const footerLinks = {
  Product: [
    { label: 'Features', href: '#features' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'How It Works', href: '#how-it-works' },
    { label: 'Dashboard', href: '/dashboard' },
  ],
  Company: [
    { label: 'About', href: '/about' },
    { label: 'Blog', href: '/blog' },
    { label: 'Careers', href: '/careers' },
    { label: 'Contact', href: '/contact' },
  ],
  Legal: [
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms of Service', href: '/terms' },
    { label: 'Cookie Policy', href: '/cookies' },
  ],
}

export function LandingFooter() {
  return (
    <footer className="bg-[#080808] border-t border-zinc-800/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          {/* Brand column */}
          <div className="col-span-2 lg:col-span-1">
            <Link href="/" className="inline-block mb-4">
              <span className="text-xl font-bold text-white tracking-tight">
                Fit<span className="text-primary">AI</span>
              </span>
            </Link>
            <p className="text-zinc-500 text-sm leading-relaxed max-w-xs">
              Your AI personal trainer. Smarter workouts, better nutrition, real results.
            </p>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([section, links]) => (
            <div key={section}>
              <h4 className="text-white text-sm font-semibold mb-4">{section}</h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-zinc-500 hover:text-zinc-300 text-sm transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between pt-8 border-t border-zinc-800/50 gap-4">
          <p className="text-zinc-600 text-sm">
            © {new Date().getFullYear()} FitAI. All rights reserved.
          </p>
          <div className="flex items-center gap-5">
            {['Twitter', 'Instagram', 'LinkedIn'].map((social) => (
              <Link
                key={social}
                href="#"
                className="text-zinc-600 hover:text-zinc-400 text-sm transition-colors"
              >
                {social}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/landing/landing-footer.tsx && git commit -m "feat: rewrite footer with clean 4-column layout"
```

---

### Task 11: Update `page.tsx` — remove StatsSection

**Files:**

- Modify: `apps/web/app/page.tsx`

- [ ] **Step 1: Remove StatsSection import and usage**

Edit `apps/web/app/page.tsx`:

```tsx
import { HeroSection } from '@/components/landing/hero-section'
import { FeaturesSection } from '@/components/landing/features-section'
import { HowItWorksSection } from '@/components/landing/how-it-works-section'
import { TestimonialsSection } from '@/components/landing/testimonials-section'
import { PricingSection } from '@/components/landing/pricing-section'
import { CtaSection } from '@/components/landing/cta-section'
import { LandingNav } from '@/components/landing/landing-nav'
import { LandingFooter } from '@/components/landing/landing-footer'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#080808]">
      <LandingNav />
      <main>
        <HeroSection />
        <FeaturesSection />
        <HowItWorksSection />
        <TestimonialsSection />
        <PricingSection />
        <CtaSection />
      </main>
      <LandingFooter />
    </div>
  )
}
```

- [ ] **Step 2: Verify dev server has no TypeScript errors**

```bash
cd apps/web && pnpm tsc --noEmit 2>&1 | head -30
```

Expected: No errors (or only pre-existing unrelated errors)

- [ ] **Step 3: Commit**

```bash
git add app/page.tsx && git commit -m "feat: remove StatsSection, finalize landing page assembly"
```

---

## Final Verification

- [ ] Open [http://localhost:3001](http://localhost:3001) and verify:
  - Nav is transparent, becomes frosted glass on scroll
  - Hero particle effect renders, layout is left-aligned
  - Features section alternates left/right with scroll animation
  - How It Works uses ContainerScroll
  - Testimonials appear in staggered masonry grid
  - Pricing toggle switches between monthly/annual prices
  - Pro card is highlighted with green glow
  - CTA section has WarpBackground
  - Footer is clean 4-column layout

- [ ] Mobile check at 375px width — all sections readable, nav collapses correctly

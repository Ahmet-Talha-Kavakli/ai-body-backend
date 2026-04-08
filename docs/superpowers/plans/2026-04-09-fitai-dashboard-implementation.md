# FitAI Dashboard & Landing Page Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development to execute this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a complete, production-ready dashboard and landing site with real-time AI coaching infrastructure, featuring a 50/50 video session page, responsive navigation, and integrated UI component library.

**Architecture:** 
- **Landing**: Separate routes with reusable section components, strategic UI component integration
- **Dashboard**: Authenticated area with collapsible sidebar, 7 main pages (Home, Session, Workouts, Nutrition, Health, Progress, Settings)
- **Core**: Session page with video layout, form feedback system, smartwatch integration placeholders
- **Structure**: File-based organization by responsibility, modular components, clear interfaces

**Tech Stack:**
- Next.js 14+ (App Router)
- React 19, TypeScript (strict)
- Tailwind CSS 4, Framer Motion
- Existing UI component library (40+ components)
- Lucide React (icons)
- Clerk (auth - already integrated)
- Prisma (database layer - ready)

---

# Chunk 1: Project Structure & Foundation Setup

## Task 1: Create Directory Structure

**Files:**
- Create: Directory structure for organized component layout
- Modify: None

- [ ] **Step 1: Create landing component subdirectories**

Run:
```bash
mkdir -p apps/web/components/landing
mkdir -p apps/web/components/dashboard
mkdir -p apps/web/components/dashboard/shared
mkdir -p apps/web/components/session
mkdir -p apps/web/app/dashboard
```

- [ ] **Step 2: Create app route files (empty)**

Run:
```bash
# Dashboard routes
touch apps/web/app/\(dashboard\)/dashboard/page.tsx
touch apps/web/app/\(dashboard\)/dashboard/session/page.tsx
touch apps/web/app/\(dashboard\)/dashboard/workouts/page.tsx
touch apps/web/app/\(dashboard\)/dashboard/nutrition/page.tsx
touch apps/web/app/\(dashboard\)/dashboard/health/page.tsx
touch apps/web/app/\(dashboard\)/dashboard/progress/page.tsx
touch apps/web/app/\(dashboard\)/dashboard/settings/page.tsx

# Landing routes
touch apps/web/app/features/page.tsx
touch apps/web/app/pricing/page.tsx
touch apps/web/app/about/page.tsx
```

- [ ] **Step 3: Verify directory structure**

Run:
```bash
ls -la apps/web/components/landing
ls -la apps/web/components/dashboard
ls -la apps/web/app
```

Expected: All directories exist with proper permissions

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: create directory structure for dashboard and landing pages"
```

---

## Task 2: Create Dashboard Layout Component

**Files:**
- Create: `apps/web/app/(dashboard)/layout.tsx`
- Modify: `apps/web/components/dashboard/shared/layout.tsx` (new file)
- Create: `apps/web/components/dashboard/shared/sidebar.tsx`
- Create: `apps/web/components/dashboard/shared/header.tsx`

- [ ] **Step 1: Create Dashboard Layout (main wrapper)**

Create `apps/web/app/(dashboard)/layout.tsx`:
```typescript
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
```

- [ ] **Step 2: Create DashboardShell (layout logic)**

Create `apps/web/components/dashboard/shared/layout.tsx`:
```typescript
'use client'

import { ReactNode, useState } from 'react'
import { DashboardSidebar } from './sidebar'
import { DashboardHeader } from './header'

interface DashboardShellProps {
  children: ReactNode
}

export function DashboardShell({ children }: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <DashboardSidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <DashboardHeader 
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
        />

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="px-4 py-8 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>

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
```

- [ ] **Step 3: Create Sidebar Component**

Create `apps/web/components/dashboard/shared/sidebar.tsx`:
```typescript
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Home,
  Video,
  Dumbbell,
  Apple,
  Heart,
  TrendingUp,
  Settings,
  LogOut,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

const NAV_ITEMS = [
  { label: 'Home', href: '/dashboard', icon: Home },
  { label: 'Seans', href: '/dashboard/session', icon: Video },
  { label: 'Egzersiz Planım', href: '/dashboard/workouts', icon: Dumbbell },
  { label: 'Beslenme', href: '/dashboard/nutrition', icon: Apple },
  { label: 'Sağlık & Akıllı Saat', href: '/dashboard/health', icon: Heart },
  { label: 'İlerleyiş', href: '/dashboard/progress', icon: TrendingUp },
  { label: 'Ayarlar', href: '/dashboard/settings', icon: Settings },
]

interface DashboardSidebarProps {
  isOpen: boolean
  onClose: () => void
}

export function DashboardSidebar({ isOpen, onClose }: DashboardSidebarProps) {
  const pathname = usePathname()

  return (
    <>
      {/* Desktop Sidebar */}
      <motion.div
        initial={{ x: -280 }}
        animate={{ x: 0 }}
        exit={{ x: -280 }}
        transition={{ duration: 0.3 }}
        className="hidden lg:flex flex-col w-64 border-r border-border/30 bg-card/50 backdrop-blur-sm"
      >
        <div className="flex items-center gap-2 px-6 py-8">
          <div className="w-8 h-8 bg-primary rounded-lg" />
          <span className="font-bold text-xl">FitAI</span>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href

            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={isActive ? 'default' : 'ghost'}
                  className={cn(
                    'w-full justify-start gap-2',
                    isActive && 'bg-primary text-primary-foreground'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Button>
              </Link>
            )
          })}
        </nav>

        <div className="px-4 py-6 border-t border-border/30">
          <Button variant="ghost" className="w-full justify-start gap-2">
            <LogOut className="w-4 h-4" />
            Sign Out
          </Button>
        </div>
      </motion.div>

      {/* Mobile Sidebar */}
      {isOpen && (
        <motion.div
          initial={{ x: -280 }}
          animate={{ x: 0 }}
          exit={{ x: -280 }}
          className="fixed inset-y-0 left-0 z-50 w-64 border-r border-border/30 bg-card backdrop-blur-sm lg:hidden"
        >
          <div className="flex items-center gap-2 px-6 py-8">
            <div className="w-8 h-8 bg-primary rounded-lg" />
            <span className="font-bold text-xl">FitAI</span>
          </div>

          <nav className="px-4 space-y-2">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                >
                  <Button
                    variant={isActive ? 'default' : 'ghost'}
                    className={cn(
                      'w-full justify-start gap-2',
                      isActive && 'bg-primary text-primary-foreground'
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </Button>
                </Link>
              )
            })}
          </nav>

          <div className="absolute bottom-6 left-4 right-4">
            <Button variant="ghost" className="w-full justify-start gap-2">
              <LogOut className="w-4 h-4" />
              Sign Out
            </Button>
          </div>
        </motion.div>
      )}
    </>
  )
}
```

- [ ] **Step 4: Create Header Component**

Create `apps/web/components/dashboard/shared/header.tsx`:
```typescript
'use client'

import { Menu, Search, Bell, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

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
          <Menu className="w-5 h-5" />
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
            <Bell className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon">
            <User className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </header>
  )
}
```

- [ ] **Step 5: Verify components compile**

Run:
```bash
cd apps/web
npm run build 2>&1 | head -50
```

Expected: No TypeScript errors related to new components

- [ ] **Step 6: Commit**

```bash
git add apps/web/app/\(dashboard\)/layout.tsx
git add apps/web/components/dashboard/shared/layout.tsx
git add apps/web/components/dashboard/shared/sidebar.tsx
git add apps/web/components/dashboard/shared/header.tsx
git commit -m "feat: create dashboard layout with collapsible sidebar and header"
```

---

# Chunk 2: Dashboard Home Page

## Task 3: Create Dashboard Home Page

**Files:**
- Create: `apps/web/app/(dashboard)/dashboard/page.tsx`
- Create: `apps/web/components/dashboard/home-stats.tsx`
- Create: `apps/web/components/dashboard/todays-workout.tsx`
- Create: `apps/web/components/dashboard/weekly-activity.tsx`
- Create: `apps/web/components/dashboard/nutrition-summary.tsx`
- Create: `apps/web/components/dashboard/upcoming-sessions.tsx`

- [ ] **Step 1: Create Today's Workout Card**

Create `apps/web/components/dashboard/todays-workout.tsx`:
```typescript
'use client'

import { motion } from 'framer-motion'
import { Clock, Target, Flame, Dumbbell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { GlowCard } from '@/components/ui/spotlight-card'

export function TodaysWorkout() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      <GlowCard className="p-8 bg-gradient-to-br from-primary/10 to-secondary/10">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold mb-2">Upper Body Strength</h2>
            <p className="text-muted-foreground">AI Recommended for today</p>
          </div>
          <Dumbbell className="w-8 h-8 text-primary opacity-50" />
        </div>

        <div className="grid grid-cols-3 gap-4 mb-8 p-4 bg-background/50 rounded-lg border border-border/30">
          <div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Clock className="w-4 h-4" />
              Duration
            </div>
            <p className="text-lg font-bold">45 min</p>
          </div>
          <div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Target className="w-4 h-4" />
              Difficulty
            </div>
            <p className="text-lg font-bold">Intermediate</p>
          </div>
          <div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Flame className="w-4 h-4" />
              Calories
            </div>
            <p className="text-lg font-bold">320</p>
          </div>
        </div>

        <Button className="w-full h-12 text-base font-semibold bg-gradient-to-r from-primary to-secondary hover:opacity-90">
          Start Session
        </Button>
      </GlowCard>
    </motion.div>
  )
}
```

- [ ] **Step 2: Create Stats Cards**

Create `apps/web/components/dashboard/home-stats.tsx`:
```typescript
'use client'

import { motion } from 'framer-motion'
import { Flame, Moon, Heart, TrendingUp } from 'lucide-react'
import { GlowCard } from '@/components/ui/spotlight-card'

const STATS = [
  {
    label: 'Calories This Week',
    value: '1,850',
    icon: Flame,
    color: 'from-orange-500/20 to-red-500/20',
  },
  {
    label: "Last Night's Sleep",
    value: '7.5h',
    icon: Moon,
    color: 'from-blue-500/20 to-indigo-500/20',
  },
  {
    label: 'Resting Heart Rate',
    value: '62',
    icon: Heart,
    color: 'from-red-500/20 to-pink-500/20',
  },
  {
    label: 'Weekly Goal Progress',
    value: '85%',
    icon: TrendingUp,
    color: 'from-green-500/20 to-emerald-500/20',
  },
]

export function HomeStats() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
      {STATS.map((stat, idx) => {
        const Icon = stat.icon
        return (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + idx * 0.05 }}
          >
            <GlowCard className={`p-6 bg-gradient-to-br ${stat.color}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    {stat.label}
                  </p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
                <Icon className="w-8 h-8 text-primary opacity-50" />
              </div>
            </GlowCard>
          </motion.div>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 3: Create Weekly Activity**

Create `apps/web/components/dashboard/weekly-activity.tsx`:
```typescript
'use client'

import { motion } from 'framer-motion'
import { CheckCircle2, Circle } from 'lucide-react'
import { GlowCard } from '@/components/ui/spotlight-card'

const WEEK_DAYS = [
  { day: 'Mon', completed: true },
  { day: 'Tue', completed: false },
  { day: 'Wed', completed: true },
  { day: 'Thu', completed: false },
  { day: 'Fri', completed: false },
  { day: 'Sat', completed: true },
  { day: 'Sun', completed: false },
]

export function WeeklyActivity() {
  const completed = WEEK_DAYS.filter(d => d.completed).length

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="mb-12"
    >
      <GlowCard className="p-6">
        <h3 className="text-lg font-bold mb-4">This Week's Activity</h3>
        
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-sm text-muted-foreground">Completed</p>
            <p className="text-2xl font-bold">{completed}/7 sessions</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Current Streak</p>
            <p className="text-2xl font-bold">5 days</p>
          </div>
        </div>

        <div className="flex justify-between gap-2">
          {WEEK_DAYS.map((item, idx) => (
            <motion.div
              key={item.day}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 + idx * 0.05 }}
              className="flex flex-col items-center gap-1"
            >
              <div className="w-10 h-10 rounded-lg bg-background/50 border border-border/30 flex items-center justify-center">
                {item.completed ? (
                  <CheckCircle2 className="w-6 h-6 text-primary" />
                ) : (
                  <Circle className="w-6 h-6 text-muted-foreground" />
                )}
              </div>
              <span className="text-xs text-muted-foreground">{item.day}</span>
            </motion.div>
          ))}
        </div>
      </GlowCard>
    </motion.div>
  )
}
```

- [ ] **Step 4: Create Nutrition Summary**

Create `apps/web/components/dashboard/nutrition-summary.tsx`:
```typescript
'use client'

import { motion } from 'framer-motion'
import { Flame, Zap, Apple, Droplets } from 'lucide-react'
import { GlowCard } from '@/components/ui/spotlight-card'

const MACROS = [
  {
    name: 'Calories',
    icon: Flame,
    current: 1850,
    goal: 2200,
    color: 'from-orange-500 to-red-500',
  },
  {
    name: 'Protein',
    icon: Zap,
    current: 145,
    goal: 160,
    color: 'from-blue-500 to-cyan-500',
  },
  {
    name: 'Carbs',
    icon: Apple,
    current: 210,
    goal: 250,
    color: 'from-yellow-500 to-orange-500',
  },
  {
    name: 'Fat',
    icon: Droplets,
    current: 62,
    goal: 75,
    color: 'from-pink-500 to-rose-500',
  },
]

export function NutritionSummary() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="mb-12"
    >
      <h3 className="text-xl font-bold mb-4">Daily Nutrition</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {MACROS.map((macro, idx) => {
          const Icon = macro.icon
          const progress = Math.min((macro.current / macro.goal) * 100, 100)

          return (
            <motion.div
              key={macro.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + idx * 0.05 }}
            >
              <GlowCard className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Icon className="w-5 h-5 text-primary" />
                  <p className="font-semibold text-sm">{macro.name}</p>
                </div>
                <p className="text-xs text-muted-foreground mb-2">
                  {macro.current}/{macro.goal}
                </p>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ delay: 0.6, duration: 0.8 }}
                    className={`h-full bg-gradient-to-r ${macro.color}`}
                  />
                </div>
              </GlowCard>
            </motion.div>
          )
        })}
      </div>
    </motion.div>
  )
}
```

- [ ] **Step 5: Create Upcoming Sessions**

Create `apps/web/components/dashboard/upcoming-sessions.tsx`:
```typescript
'use client'

import { motion } from 'framer-motion'
import { ChevronRight } from 'lucide-react'
import { GlowCard } from '@/components/ui/spotlight-card'
import { Button } from '@/components/ui/button'

const UPCOMING = [
  { day: 'Tomorrow', workout: 'Lower Body Power', duration: '50 min' },
  { day: 'Thursday', workout: 'Upper Body B', duration: '45 min' },
  { day: 'Friday', workout: 'HIIT Cardio', duration: '30 min' },
]

export function UpcomingSessions() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold">Upcoming Sessions</h3>
        <Button variant="ghost" size="sm">
          View All <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      <div className="space-y-3">
        {UPCOMING.map((item, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 + idx * 0.05 }}
          >
            <GlowCard className="p-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{item.day}</p>
                <p className="font-semibold">{item.workout}</p>
              </div>
              <p className="text-sm text-muted-foreground">{item.duration}</p>
            </GlowCard>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}
```

- [ ] **Step 6: Create Home Page**

Create `apps/web/app/(dashboard)/dashboard/page.tsx`:
```typescript
'use client'

import { motion } from 'framer-motion'
import { TodaysWorkout } from '@/components/dashboard/todays-workout'
import { HomeStats } from '@/components/dashboard/home-stats'
import { WeeklyActivity } from '@/components/dashboard/weekly-activity'
import { NutritionSummary } from '@/components/dashboard/nutrition-summary'
import { UpcomingSessions } from '@/components/dashboard/upcoming-sessions'

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-4xl font-black mb-2">Good Morning, John!</h1>
        <p className="text-muted-foreground">Today, April 9, 2026</p>
      </motion.div>

      {/* Today's Workout */}
      <TodaysWorkout />

      {/* Quick Stats */}
      <HomeStats />

      {/* Weekly Activity */}
      <WeeklyActivity />

      {/* Nutrition Summary */}
      <NutritionSummary />

      {/* Upcoming Sessions */}
      <UpcomingSessions />
    </div>
  )
}
```

- [ ] **Step 7: Verify components compile**

Run:
```bash
cd apps/web
npm run build 2>&1 | head -50
```

Expected: No TypeScript errors

- [ ] **Step 8: Commit**

```bash
git add apps/web/components/dashboard/todays-workout.tsx
git add apps/web/components/dashboard/home-stats.tsx
git add apps/web/components/dashboard/weekly-activity.tsx
git add apps/web/components/dashboard/nutrition-summary.tsx
git add apps/web/components/dashboard/upcoming-sessions.tsx
git add apps/web/app/\(dashboard\)/dashboard/page.tsx
git commit -m "feat: create dashboard home page with stats and recommendations"
```

---

# Chunk 3: Core Session Page

## Task 4: Create Session Page (Video Coaching)

**Files:**
- Create: `apps/web/app/(dashboard)/dashboard/session/page.tsx`
- Create: `apps/web/components/session/session-video.tsx`
- Create: `apps/web/components/session/session-controls.tsx`
- Create: `apps/web/components/session/form-feedback.tsx`

- [ ] **Step 1: Create Session Video Component**

Create `apps/web/components/session/session-video.tsx`:
```typescript
'use client'

import { motion } from 'framer-motion'
import { useState, useRef, useEffect } from 'react'

interface SessionVideoProps {
  exerciseName: string
  setNumber: number
  totalSets: number
  repNumber: number
  totalReps: number
  formQuality: number
  heartRate: number
}

export function SessionVideo({
  exerciseName,
  setNumber,
  totalSets,
  repNumber,
  totalReps,
  formQuality,
  heartRate,
}: SessionVideoProps) {
  const [webcamActive, setWebcamActive] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (webcamActive && videoRef.current) {
      navigator.mediaDevices
        .getUserMedia({ video: { facingMode: 'user' } })
        .then((stream) => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream
          }
        })
        .catch((err) => console.error('Camera error:', err))
    }
  }, [webcamActive])

  return (
    <div className="w-full h-full max-h-[600px] rounded-2xl overflow-hidden border border-border/30 bg-background flex gap-4 p-4">
      {/* AI Coach (Left) */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex-1 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-xl flex items-center justify-center border border-border/30 relative overflow-hidden"
      >
        {/* 3D Character Placeholder */}
        <div className="text-center z-10">
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-6xl mb-4"
          >
            🏋️
          </motion.div>
          <h3 className="text-xl font-bold mb-2">{exerciseName}</h3>
          <p className="text-sm text-muted-foreground mb-4">
            AI Coach demonstration
          </p>
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="inline-block px-4 py-2 bg-primary/20 rounded-lg border border-primary/30"
          >
            <p className="text-sm font-medium">
              "Lower your elbows slowly!"
            </p>
          </motion.div>
        </div>

        {/* Animated background */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-10 left-10 w-32 h-32 bg-primary rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-10 right-10 w-40 h-40 bg-secondary rounded-full blur-3xl animate-pulse" />
        </div>
      </motion.div>

      {/* User Video (Right) */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="flex-1 bg-gradient-to-br from-muted/20 to-muted/10 rounded-xl flex flex-col items-center justify-center border border-border/30 relative overflow-hidden"
      >
        {!webcamActive ? (
          <div className="text-center">
            <div className="text-6xl mb-4">📹</div>
            <p className="text-sm text-muted-foreground mb-4">
              Camera not active
            </p>
            <button
              onClick={() => setWebcamActive(true)}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90"
            >
              Enable Camera
            </button>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />

            {/* Overlay stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute top-4 right-4 bg-black/60 backdrop-blur rounded-lg p-3 text-white text-sm space-y-1"
            >
              <div>
                <p className="text-xs text-gray-400">Form Quality</p>
                <p className="font-bold text-base">{formQuality}%</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Heart Rate</p>
                <p className="font-bold text-base">{heartRate} bpm</p>
              </div>
            </motion.div>
          </>
        )}
      </motion.div>
    </div>
  )
}
```

- [ ] **Step 2: Create Session Controls**

Create `apps/web/components/session/session-controls.tsx`:
```typescript
'use client'

import { motion } from 'framer-motion'
import { Pause, Play, Square, Volume2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface SessionControlsProps {
  isPaused: boolean
  onPlayPause: () => void
  onEnd: () => void
  exerciseName: string
  setNumber: number
  totalSets: number
  repNumber: number
  totalReps: number
  formQuality: number
  heartRate: number
  restTime?: number
}

export function SessionControls({
  isPaused,
  onPlayPause,
  onEnd,
  exerciseName,
  setNumber,
  totalSets,
  repNumber,
  totalReps,
  formQuality,
  heartRate,
  restTime,
}: SessionControlsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full bg-card/50 border border-border/30 rounded-xl p-6 space-y-4"
    >
      {/* Current exercise info */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <p className="text-xs text-muted-foreground mb-1">Exercise</p>
          <p className="font-semibold">{exerciseName}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">
            Set / Total
          </p>
          <p className="font-semibold">
            {setNumber} / {totalSets}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">
            Rep / Total
          </p>
          <p className="font-semibold">
            {repNumber} / {totalReps}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">Form Quality</p>
          <p className="font-semibold text-primary">{formQuality}%</p>
        </div>
      </div>

      {/* AI coaching feedback */}
      <motion.div
        animate={{ opacity: [1, 0.8, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="p-4 bg-primary/10 rounded-lg border border-primary/20"
      >
        <div className="flex items-start gap-3">
          <Volume2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium">AI Coaching</p>
            <p className="text-sm text-muted-foreground">
              "Perfect form! Keep the elbows tucked!"
            </p>
          </div>
        </div>
      </motion.div>

      {/* Rest timer or next rep */}
      {restTime && restTime > 0 ? (
        <motion.div
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
          className="p-4 bg-secondary/10 rounded-lg border border-secondary/20 text-center"
        >
          <p className="text-sm text-muted-foreground mb-1">Rest Timer</p>
          <p className="text-3xl font-bold text-secondary">{restTime}s</p>
        </motion.div>
      ) : (
        <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/20 text-center">
          <p className="text-sm font-medium text-green-600">
            Ready for next rep!
          </p>
        </div>
      )}

      {/* Control buttons */}
      <div className="flex gap-3 justify-center pt-4">
        <Button
          size="lg"
          variant="outline"
          className="gap-2"
          onClick={onPlayPause}
        >
          {isPaused ? (
            <>
              <Play className="w-4 h-4" />
              Resume
            </>
          ) : (
            <>
              <Pause className="w-4 h-4" />
              Pause
            </>
          )}
        </Button>

        <Button
          size="lg"
          variant="destructive"
          className="gap-2"
          onClick={onEnd}
        >
          <Square className="w-4 h-4" />
          End Session
        </Button>
      </div>
    </motion.div>
  )
}
```

- [ ] **Step 3: Create Form Feedback Overlay**

Create `apps/web/components/session/form-feedback.tsx`:
```typescript
'use client'

import { motion } from 'framer-motion'
import { CheckCircle2, AlertCircle } from 'lucide-react'

interface FormFeedbackProps {
  quality: number
  feedback: string[]
  status: 'good' | 'warning' | 'error'
}

export function FormFeedback({ quality, feedback, status }: FormFeedbackProps) {
  const colors = {
    good: 'from-green-500/20 to-emerald-500/20 border-green-500/30',
    warning: 'from-yellow-500/20 to-orange-500/20 border-yellow-500/30',
    error: 'from-red-500/20 to-rose-500/20 border-red-500/30',
  }

  const textColors = {
    good: 'text-green-600',
    warning: 'text-yellow-600',
    error: 'text-red-600',
  }

  const icons = {
    good: <CheckCircle2 className="w-5 h-5" />,
    warning: <AlertCircle className="w-5 h-5" />,
    error: <AlertCircle className="w-5 h-5" />,
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`bg-gradient-to-br ${colors[status]} border rounded-lg p-4 space-y-2`}
    >
      <div className="flex items-center gap-2">
        <div className={textColors[status]}>{icons[status]}</div>
        <p className={`font-semibold ${textColors[status]}`}>
          Form Quality: {quality}%
        </p>
      </div>

      {feedback.length > 0 && (
        <ul className="space-y-1 ml-7">
          {feedback.map((item, idx) => (
            <motion.li
              key={idx}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="text-sm text-muted-foreground"
            >
              • {item}
            </motion.li>
          ))}
        </ul>
      )}
    </motion.div>
  )
}
```

- [ ] **Step 4: Create Session Page**

Create `apps/web/app/(dashboard)/dashboard/session/page.tsx`:
```typescript
'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { SessionVideo } from '@/components/session/session-video'
import { SessionControls } from '@/components/session/session-controls'
import { FormFeedback } from '@/components/session/form-feedback'

export default function SessionPage() {
  const [isPaused, setIsPaused] = useState(false)
  const [sessionStarted, setSessionStarted] = useState(false)

  if (!sessionStarted) {
    return (
      <div className="h-full flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md"
        >
          <div className="text-6xl mb-6">🎬</div>
          <h1 className="text-4xl font-black mb-4">Start Your Session</h1>
          <p className="text-muted-foreground mb-8">
            Get ready for real-time AI coaching. Make sure your camera and
            microphone are ready.
          </p>
          <button
            onClick={() => setSessionStarted(true)}
            className="w-full py-3 bg-gradient-to-r from-primary to-secondary rounded-lg font-bold text-lg hover:opacity-90 transition-opacity"
          >
            Start Session
          </button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-4xl font-black mb-2">Live Coaching Session</h1>
        <p className="text-muted-foreground">
          Real-time form analysis with AI trainer
        </p>
      </motion.div>

      {/* Video area */}
      <SessionVideo
        exerciseName="Barbell Bench Press"
        setNumber={1}
        totalSets={4}
        repNumber={2}
        totalReps={5}
        formQuality={92}
        heartRate={145}
      />

      {/* Form feedback */}
      <FormFeedback
        quality={92}
        feedback={[
          'Lower elbows slightly for better form',
          'Keep core engaged throughout movement',
        ]}
        status="good"
      />

      {/* Controls */}
      <SessionControls
        isPaused={isPaused}
        onPlayPause={() => setIsPaused(!isPaused)}
        onEnd={() => setSessionStarted(false)}
        exerciseName="Barbell Bench Press"
        setNumber={1}
        totalSets={4}
        repNumber={2}
        totalReps={5}
        formQuality={92}
        heartRate={145}
        restTime={45}
      />
    </div>
  )
}
```

- [ ] **Step 5: Verify components compile**

Run:
```bash
cd apps/web
npm run build 2>&1 | head -50
```

Expected: No TypeScript errors

- [ ] **Step 6: Commit**

```bash
git add apps/web/components/session/session-video.tsx
git add apps/web/components/session/session-controls.tsx
git add apps/web/components/session/form-feedback.tsx
git add apps/web/app/\(dashboard\)/dashboard/session/page.tsx
git commit -m "feat: create core session page with video coaching and form feedback"
```

---

# Chunk 4: Remaining Dashboard Pages (Will continue in next chunk)

*[Plan continues with remaining dashboard pages: Workouts, Nutrition, Health, Progress, Settings, plus Landing pages pages]*

---

## Summary of Chunk Boundaries

- **Chunk 1**: Project structure + Dashboard layout (sidebar, header)
- **Chunk 2**: Dashboard home page with all stat cards
- **Chunk 3**: Core session page (video, controls, feedback) 
- **Chunk 4**: Remaining dashboard pages (workouts, nutrition, health, progress, settings)
- **Chunk 5**: Landing pages (home, features, pricing, about)
- **Chunk 6**: Onboarding flow + polish + testing

**Total estimated tasks:** 25-30  
**Estimated timeline:** 4-5 weeks of focused development

---

**Status:** Ready for execution with subagent-driven-development

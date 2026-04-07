'use client'

import Link from 'next/link'
import { useRef, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  Dumbbell,
  Apple,
  TrendingUp,
  ArrowRight,
  Sparkles,
  Heart,
  Zap,
} from 'lucide-react'

interface DashboardOverviewProps {
  user: {
    name: string
    healthProfile: { fitnessLevel: string } | null
  }
}

interface StatCard {
  icon: React.ReactNode
  label: string
  value: string | number
  unit?: string
  trend?: string
  color: string
  spotlightColor: string
}

interface QuickAction {
  icon: React.ReactNode
  label: string
  description: string
  href: string
  color: string
}

const STAT_CARDS: StatCard[] = [
  {
    icon: <Zap className="h-5 w-5" />,
    label: 'This Week',
    value: 4,
    unit: 'workouts',
    trend: '+1 vs last week',
    color: 'text-emerald-400',
    spotlightColor: 'rgba(52, 211, 153, 0.06)',
  },
  {
    icon: <TrendingUp className="h-5 w-5" />,
    label: 'Avg Form Score',
    value: 94,
    unit: '%',
    trend: '+3% improvement',
    color: 'text-blue-400',
    spotlightColor: 'rgba(96, 165, 250, 0.06)',
  },
  {
    icon: <Heart className="h-5 w-5" />,
    label: 'Avg Heart Rate',
    value: 142,
    unit: 'bpm',
    trend: 'Zone 3',
    color: 'text-red-400',
    spotlightColor: 'rgba(248, 113, 113, 0.06)',
  },
  {
    icon: <Apple className="h-5 w-5" />,
    label: 'Protein Today',
    value: 142,
    unit: 'g',
    trend: '28g to goal',
    color: 'text-orange-400',
    spotlightColor: 'rgba(251, 146, 60, 0.06)',
  },
]

const QUICK_ACTIONS: QuickAction[] = [
  {
    icon: <Dumbbell className="h-5 w-5" />,
    label: 'Start Workout',
    description: 'Begin your next session',
    href: '/programs',
    color: 'text-emerald-400',
  },
  {
    icon: <Apple className="h-5 w-5" />,
    label: 'Log Meal',
    description: 'Track your nutrition',
    href: '/nutrition',
    color: 'text-orange-400',
  },
  {
    icon: <TrendingUp className="h-5 w-5" />,
    label: 'View Progress',
    description: 'Check your analytics',
    href: '/analytics',
    color: 'text-blue-400',
  },
]

// ─── Spotlight Card ───────────────────────────────────────────────────────────

interface StatCardComponentProps {
  card: StatCard
  index: number
}

function StatCardComponent({ card, index }: StatCardComponentProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [spotPos, setSpotPos] = useState({ x: 0, y: 0 })
  const [isHovered, setIsHovered] = useState(false)

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    setSpotPos({ x: e.clientX - rect.left, y: e.clientY - rect.top })
  }, [])

  return (
    <motion.div
      ref={cardRef}
      className="relative overflow-hidden rounded-2xl border border-border/50 bg-card p-5 transition-all duration-300 hover:shadow-lg hover:shadow-black/5"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Spotlight */}
      <div
        className="pointer-events-none absolute inset-0 transition-opacity duration-300"
        style={{
          background: isHovered
            ? `radial-gradient(250px circle at ${spotPos.x}px ${spotPos.y}px, ${card.spotlightColor}, transparent 70%)`
            : 'none',
          opacity: isHovered ? 1 : 0,
        }}
        aria-hidden="true"
      />

      <div className="relative z-10">
        <div className="flex items-center justify-between">
          <div className={`${card.color}`}>{card.icon}</div>
          {card.trend && (
            <span className="text-xs font-medium text-emerald-400/80">{card.trend}</span>
          )}
        </div>
        <p className="mt-3 text-xs font-medium uppercase tracking-widest text-muted-foreground">
          {card.label}
        </p>
        <div className="mt-2 flex items-baseline gap-1">
          <span className="text-2xl font-bold text-foreground">{card.value}</span>
          {card.unit && <span className="text-sm text-muted-foreground">{card.unit}</span>}
        </div>
      </div>
    </motion.div>
  )
}

// ─── Dashboard Overview ───────────────────────────────────────────────────────

export function DashboardOverview({ user }: DashboardOverviewProps) {
  const isOnboarded = !!user.healthProfile

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome back, {user.name.split(' ')[0] ?? 'Athlete'} 👋
        </h1>
        <p className="mt-1 text-muted-foreground">
          {isOnboarded ? "Here's your training overview." : "Let's get you set up."}
        </p>
      </motion.div>

      {/* Onboarding CTA */}
      {!isOnboarded && (
        <motion.div
          className="flex items-center gap-4 rounded-2xl border border-primary/30 bg-primary/8 p-5"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-foreground">Complete your profile to unlock AI coaching</p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Takes 3 minutes. Unlocks personalized programs and AI coaching.
            </p>
          </div>
          <Link
            href="/health"
            className="ml-4 inline-flex shrink-0 items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90"
          >
            Get Started
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </motion.div>
      )}

      {/* Stats Grid */}
      <motion.div
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.15 }}
      >
        {STAT_CARDS.map((card, i) => (
          <StatCardComponent key={card.label} card={card} index={i} />
        ))}
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        className="grid grid-cols-1 gap-4 sm:grid-cols-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        {QUICK_ACTIONS.map((action, i) => (
          <Link
            key={action.href}
            href={action.href}
            className="group flex items-center gap-4 rounded-2xl border border-border/50 bg-card p-5 transition-all hover:border-primary/30 hover:shadow-md"
          >
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 ${action.color}`}>
              {action.icon}
            </div>
            <div className="flex-1">
              <p className="font-semibold text-foreground">{action.label}</p>
              <p className="text-sm text-muted-foreground">{action.description}</p>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
          </Link>
        ))}
      </motion.div>

      {/* Coming soon section */}
      <motion.div
        className="rounded-2xl border border-border/50 bg-card p-8 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.25 }}
      >
        <Zap className="mx-auto h-8 w-8 text-muted-foreground/50" />
        <p className="mt-3 font-semibold text-foreground">Live Session Coming Soon</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Start your AI-coached workout with real-time form analysis and live voice coaching.
        </p>
      </motion.div>
    </div>
  )
}

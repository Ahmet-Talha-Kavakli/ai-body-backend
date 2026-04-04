import Link from 'next/link'
import { Dumbbell, Apple, TrendingUp, ArrowRight, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface DashboardOverviewProps {
  user: {
    name: string
    healthProfile: { fitnessLevel: string } | null
  }
}

export function DashboardOverview({ user }: DashboardOverviewProps) {
  const isOnboarded = !!user.healthProfile

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold">
          Welcome back, {user.name.split(' ')[0] ?? 'Athlete'} 👋
        </h1>
        <p className="text-muted-foreground">
          {isOnboarded ? "Here's your training overview." : "Let's get you set up."}
        </p>
      </div>

      {/* Onboarding CTA */}
      {!isOnboarded && (
        <div className="flex items-center gap-4 rounded-xl border border-primary/30 bg-primary/5 p-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <p className="font-semibold">Complete your profile to unlock AI coaching</p>
            <p className="text-sm text-muted-foreground">
              Takes 3 minutes. Unlocks personalized programs and AI coaching.
            </p>
          </div>
          <Button asChild>
            <Link href="/health">
              Get Started <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      )}

      {/* Quick actions */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          href="/programs"
          className="group flex items-center gap-4 rounded-xl border border-border bg-card p-5 transition-all hover:border-primary/30 hover:shadow-sm"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
            <Dumbbell className="h-5 w-5 text-green-400" />
          </div>
          <div>
            <p className="font-semibold">Start Workout</p>
            <p className="text-sm text-muted-foreground">Continue your program</p>
          </div>
          <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
        </Link>

        <Link
          href="/nutrition"
          className="group flex items-center gap-4 rounded-xl border border-border bg-card p-5 transition-all hover:border-primary/30 hover:shadow-sm"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500/10">
            <Apple className="h-5 w-5 text-orange-400" />
          </div>
          <div>
            <p className="font-semibold">Log Meal</p>
            <p className="text-sm text-muted-foreground">Track today&apos;s nutrition</p>
          </div>
          <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
        </Link>

        <Link
          href="/analytics"
          className="group flex items-center gap-4 rounded-xl border border-border bg-card p-5 transition-all hover:border-primary/30 hover:shadow-sm"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
            <TrendingUp className="h-5 w-5 text-blue-400" />
          </div>
          <div>
            <p className="font-semibold">View Progress</p>
            <p className="text-sm text-muted-foreground">Analytics & insights</p>
          </div>
          <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
        </Link>
      </div>
    </div>
  )
}

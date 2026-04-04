'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, Play, Sparkles, Zap, Camera } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

const stats = [
  { value: '10k+', label: 'Active Athletes' },
  { value: '98%', label: 'Form Accuracy' },
  { value: '3x', label: 'Faster Results' },
  { value: '24/7', label: 'AI Coaching' },
]

export function HeroSection() {
  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 pt-16">
      {/* Background gradients */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/4 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute right-0 top-1/2 h-[400px] w-[400px] -translate-y-1/2 rounded-full bg-neon-blue/5 blur-[100px]" />
        <div className="absolute bottom-0 left-0 h-[400px] w-[400px] rounded-full bg-neon-purple/5 blur-[100px]" />
      </div>

      {/* Grid pattern overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
          backgroundSize: '50px 50px',
        }}
      />

      <div className="relative z-10 mx-auto max-w-5xl text-center">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6 flex justify-center"
        >
          <Badge
            variant="outline"
            className="gap-1.5 border-primary/30 bg-primary/5 px-4 py-1.5 text-primary"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Powered by Claude AI
          </Badge>
        </motion.div>

        {/* Headline */}
        <motion.h1
          className="mb-6 text-5xl font-bold leading-tight tracking-tight sm:text-6xl md:text-7xl lg:text-8xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          Your Personal Trainer.{' '}
          <span className="bg-gradient-to-r from-primary via-neon-green to-neon-blue bg-clip-text text-transparent">
            Powered by AI.
          </span>
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          className="mx-auto mb-10 max-w-2xl text-lg text-muted-foreground sm:text-xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          Real-time movement analysis, 3D coaching sessions, personalized programs, and nutrition
          guidance — all adapting to you in real time.
        </motion.p>

        {/* CTAs */}
        <motion.div
          className="mb-16 flex flex-col items-center gap-4 sm:flex-row sm:justify-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Button size="lg" className="group h-12 gap-2 px-8 text-base" asChild>
            <Link href="/sign-up">
              Start Training Free
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
          <Button variant="outline" size="lg" className="h-12 gap-2 px-8 text-base" asChild>
            <Link href="#how-it-works">
              <Play className="h-4 w-4" />
              See How It Works
            </Link>
          </Button>
        </motion.div>

        {/* Stats */}
        <motion.div
          className="mb-16 grid grid-cols-2 gap-6 sm:grid-cols-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-3xl font-bold text-foreground">{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </motion.div>

        {/* Session preview mockup */}
        <motion.div
          className="relative mx-auto max-w-4xl overflow-hidden rounded-2xl border border-border/50 bg-card shadow-2xl"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.5 }}
        >
          {/* Mockup header bar */}
          <div className="flex items-center gap-2 border-b border-border/50 bg-muted/30 px-4 py-3">
            <div className="h-3 w-3 rounded-full bg-red-500/70" />
            <div className="h-3 w-3 rounded-full bg-yellow-500/70" />
            <div className="h-3 w-3 rounded-full bg-green-500/70" />
            <span className="ml-2 text-xs text-muted-foreground">FitAI — Live Session</span>
          </div>

          {/* Session split layout preview */}
          <div className="grid grid-cols-2 gap-0 bg-background">
            {/* Left: 3D Trainer */}
            <div className="relative flex min-h-[300px] flex-col items-center justify-center bg-gradient-to-br from-primary/5 to-primary/10 p-6">
              <div className="mb-4 flex h-32 w-32 items-center justify-center rounded-full border-2 border-primary/30 bg-primary/10">
                <Zap className="h-16 w-16 text-primary opacity-60" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">AI Trainer</p>
              <p className="text-lg font-bold">Demonstrating</p>
              <p className="text-sm text-primary">Barbell Squat</p>
              <div className="mt-4 rounded-full bg-primary/10 px-3 py-1 text-xs text-primary">
                ▶ Watch form carefully
              </div>
            </div>

            {/* Right: User camera */}
            <div className="relative flex min-h-[300px] flex-col items-center justify-center bg-gradient-to-br from-muted/30 to-muted/50 p-6">
              <div className="mb-4 flex h-32 w-32 items-center justify-center rounded-full border-2 border-border bg-muted">
                <Camera className="h-16 w-16 text-muted-foreground opacity-50" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">Your Camera</p>
              <div className="mt-2 flex items-center gap-2">
                <div className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
                <span className="text-sm text-green-400">Live Analysis Active</span>
              </div>
              {/* Form score overlay */}
              <div className="mt-4 flex gap-3">
                <div className="rounded-lg bg-green-500/20 px-3 py-1.5 text-center">
                  <div className="text-xl font-bold text-green-400">94</div>
                  <div className="text-xs text-green-400/70">Form</div>
                </div>
                <div className="rounded-lg bg-blue-500/20 px-3 py-1.5 text-center">
                  <div className="text-xl font-bold text-blue-400">8</div>
                  <div className="text-xs text-blue-400/70">Reps</div>
                </div>
                <div className="rounded-lg bg-orange-500/20 px-3 py-1.5 text-center">
                  <div className="text-xl font-bold text-orange-400">142</div>
                  <div className="text-xs text-orange-400/70">BPM</div>
                </div>
              </div>
            </div>
          </div>

          {/* AI coaching bar */}
          <div className="flex items-center gap-3 border-t border-border/50 bg-primary/5 px-6 py-3">
            <Sparkles className="h-4 w-4 shrink-0 text-primary" />
            <p className="text-sm text-foreground">
              <span className="font-medium text-primary">AI Coach: </span>
              Great depth! Keep your chest up and drive through your heels. 2 more reps — you&apos;ve
              got this! 💪
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

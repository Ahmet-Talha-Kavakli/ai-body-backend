'use client'

import { motion } from 'framer-motion'
import { Star, Quote } from 'lucide-react'

const testimonials = [
  {
    name: 'Marcus Johnson',
    handle: '@marcuslifts',
    role: 'Powerlifter',
    avatar: 'MJ',
    content:
      'The form analysis is insane. It caught that I was favoring my right side during squats — something I\'d been doing for years without noticing. My squat jumped 30kg in 3 months.',
    rating: 5,
  },
  {
    name: 'Sofia Chen',
    handle: '@sofiafit',
    role: 'Fitness enthusiast',
    avatar: 'SC',
    content:
      'I\'ve tried every fitness app out there. FitAI is the only one that actually feels like having a real trainer. The 3D demonstrations make every exercise crystal clear.',
    rating: 5,
  },
  {
    name: 'James Parker',
    handle: '@jamesrunner',
    role: 'Marathon runner',
    avatar: 'JP',
    content:
      'Injured my knee last year. The injury-aware programming is a game changer — it built a whole program around my limitation and I came back stronger than before.',
    rating: 5,
  },
  {
    name: 'Aisha Okafor',
    handle: '@aishafitness',
    role: 'CrossFit athlete',
    avatar: 'AO',
    content:
      'The nutrition AI is like having a dietitian in my pocket. It analyzed my macros and adjusted my fueling strategy based on my training volume. My energy levels are through the roof.',
    rating: 5,
  },
  {
    name: 'David Kim',
    handle: '@davidkstrength',
    role: 'Personal trainer',
    avatar: 'DK',
    content:
      'As a trainer myself, I was skeptical. But the AI\'s programming logic is genuinely impressive — periodization, progressive overload, deload weeks. It knows its stuff.',
    rating: 5,
  },
  {
    name: 'Emma Rodriguez',
    handle: '@emmafitlife',
    role: 'Beginner',
    avatar: 'ER',
    content:
      'I was completely lost at the gym before FitAI. Now I feel confident every session because I know exactly what I\'m doing and why. Lost 12kg in 4 months!',
    rating: 5,
  },
]

export function TestimonialsSection() {
  return (
    <section className="bg-muted/20 py-24">
      <div className="container">
        <motion.div
          className="mb-16 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="mb-4 text-3xl font-bold sm:text-4xl md:text-5xl">
            Trusted by{' '}
            <span className="bg-gradient-to-r from-primary to-neon-blue bg-clip-text text-transparent">
              athletes worldwide
            </span>
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            From beginners to professional athletes — real results from real people.
          </p>
        </motion.div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((t, index) => (
            <motion.div
              key={t.name}
              className="flex flex-col gap-4 rounded-xl border border-border/50 bg-card p-6"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: (index % 3) * 0.1 }}
            >
              <Quote className="h-6 w-6 text-primary/40" />
              <p className="flex-1 text-sm leading-relaxed text-muted-foreground">
                &ldquo;{t.content}&rdquo;
              </p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                    {t.avatar}
                  </div>
                  <div>
                    <div className="text-sm font-semibold">{t.name}</div>
                    <div className="text-xs text-muted-foreground">{t.role}</div>
                  </div>
                </div>
                <div className="flex">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

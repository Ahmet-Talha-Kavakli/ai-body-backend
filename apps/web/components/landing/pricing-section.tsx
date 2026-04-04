'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Check, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils/cn'

const plans = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    description: 'Get started and experience AI coaching.',
    features: [
      '3 AI workout sessions/month',
      'Basic pose detection',
      'Pre-built workout programs',
      'Nutrition logging (manual)',
      'Progress tracking',
    ],
    cta: 'Get Started',
    href: '/sign-up',
    highlighted: false,
  },
  {
    name: 'Pro',
    price: '$19',
    period: '/month',
    description: 'Full AI coaching experience, unlimited sessions.',
    badge: 'Most Popular',
    features: [
      'Unlimited AI workout sessions',
      'Real-time form analysis & corrections',
      '3D trainer demonstrations',
      'AI-generated personalized programs',
      'Photo meal analysis (AI dietitian)',
      'Smartwatch integration',
      'Heart rate zone training',
      'Injury-aware program adaptation',
      'Priority AI response speed',
    ],
    cta: 'Start Pro Free',
    href: '/sign-up?plan=pro',
    highlighted: true,
  },
  {
    name: 'Elite',
    price: '$49',
    period: '/month',
    description: 'For serious athletes who want everything.',
    features: [
      'Everything in Pro',
      'Advanced biomechanics analysis',
      'Multi-camera session support',
      'Body composition tracking',
      'VR sessions (coming soon)',
      'Export data to CSV/PDF',
      'Priority support',
      'Early access to new features',
    ],
    cta: 'Go Elite',
    href: '/sign-up?plan=elite',
    highlighted: false,
  },
]

export function PricingSection() {
  return (
    <section id="pricing" className="py-24">
      <div className="container">
        <motion.div
          className="mb-16 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="mb-4 text-3xl font-bold sm:text-4xl md:text-5xl">
            Simple, transparent{' '}
            <span className="bg-gradient-to-r from-primary to-neon-blue bg-clip-text text-transparent">
              pricing
            </span>
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Cancel anytime. No hidden fees. Start free and upgrade when you&apos;re ready.
          </p>
        </motion.div>

        <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-3">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              className={cn(
                'relative flex flex-col rounded-2xl border p-8',
                plan.highlighted
                  ? 'border-primary bg-primary/5 shadow-lg shadow-primary/10'
                  : 'border-border bg-card'
              )}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="gap-1 bg-primary px-3 py-1 text-primary-foreground">
                    <Zap className="h-3 w-3" />
                    {plan.badge}
                  </Badge>
                </div>
              )}

              <div className="mb-6">
                <h3 className="mb-1 text-lg font-bold">{plan.name}</h3>
                <div className="mb-2 flex items-end gap-1">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="mb-1 text-muted-foreground">{plan.period}</span>
                </div>
                <p className="text-sm text-muted-foreground">{plan.description}</p>
              </div>

              <ul className="mb-8 flex-1 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5 text-sm">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                className={cn('w-full', !plan.highlighted && 'variant-outline')}
                variant={plan.highlighted ? 'default' : 'outline'}
                asChild
              >
                <Link href={plan.href}>{plan.cta}</Link>
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

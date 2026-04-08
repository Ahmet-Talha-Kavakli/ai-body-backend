'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Check, Star } from 'lucide-react'
import { MultiTypeRippleButtons } from '@/components/ui/multi-type-ripple-buttons'

const PLANS = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    description: 'Get started with basic AI coaching',
    features: [
      '3 AI workouts/month',
      'Basic form detection',
      'Progress tracking',
      'Community access',
    ],
    cta: 'Get Started',
    href: '/sign-up',
    highlighted: false,
  },
  {
    name: 'Pro',
    price: '$19',
    period: '/month',
    description: 'Full AI coaching experience',
    badge: 'Most Popular',
    features: [
      'Unlimited AI workouts',
      'Real-time form analysis',
      'Personalized programs',
      'AI meal analysis',
      'Smartwatch sync',
      'Priority support',
    ],
    cta: 'Start Free Trial',
    href: '/sign-up?plan=pro',
    highlighted: true,
  },
  {
    name: 'Elite',
    price: '$49',
    period: '/month',
    description: 'Advanced features for serious athletes',
    features: [
      'Everything in Pro',
      'Advanced biomechanics',
      'Multi-camera support',
      'Body composition tracking',
      'VR sessions (coming)',
      'Dedicated coach',
      'Early feature access',
    ],
    cta: 'Start Free Trial',
    href: '/sign-up?plan=elite',
    highlighted: false,
  },
]

import { RippleButton } from '@/components/ui/multi-type-ripple-buttons'
import { UpgradeBanner } from '@/components/ui/upgrade-banner'
import { CountdownBanner } from '@/components/ui/countdown-banner'
import { GlowCard } from '@/components/ui/spotlight-card'

function PricingCard({ plan, index }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
      className={`relative rounded-2xl transition-all duration-300 ${
        plan.highlighted
          ? 'md:scale-105'
          : ''
      }`}
    >
      <GlowCard
        glowColor={plan.highlighted ? 'green' : 'blue'}
        className="h-full"
        customSize
        width="100%"
        height="100%"
      >
        {/* Badge */}
        {plan.badge && (
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
            <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-primary/10 border border-primary/30">
              <Star className="w-4 h-4 text-primary fill-primary" />
              <span className="text-sm font-semibold text-primary">
                {plan.badge}
              </span>
            </div>
          </div>
        )}

        <div className="p-8">
          {/* Header */}
          <h3 className="text-2xl font-bold text-foreground mb-2">
            {plan.name}
          </h3>
          <p className="text-sm text-muted-foreground mb-6">
            {plan.description}
          </p>

          {/* Price */}
          <div className="mb-8">
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-bold text-foreground">
                {plan.price}
              </span>
              <span className="text-muted-foreground">{plan.period}</span>
            </div>
          </div>

          {/* CTA - RippleButton */}
          <div className="mb-8">
            <RippleButton
              href={plan.href}
              className={`w-full py-3 rounded-lg font-semibold transition-all duration-200 block text-center ${
                plan.highlighted
                  ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:shadow-lg hover:shadow-green-500/30'
                  : 'border border-border hover:bg-accent'
              }`}
            >
              {plan.cta}
            </RippleButton>
          </div>

          {/* Features */}
          <div className="space-y-3">
            {plan.features.map((feature) => (
              <div key={feature} className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-foreground">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </GlowCard>
    </motion.div>
  )
}

export function PricingSection() {
  return (
    <section id="pricing" className="py-20 px-4">
      <div className="container mx-auto">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Choose the perfect plan for your fitness journey
          </p>
        </motion.div>

        {/* Pricing cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {PLANS.map((plan, i) => (
            <PricingCard key={plan.name} plan={plan} index={i} />
          ))}
        </div>

        {/* Upgrade promotion banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-16"
        >
          <UpgradeBanner />
        </motion.div>

        {/* Footer note */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="text-center mt-8"
        >
          <p className="text-sm text-muted-foreground">
            All plans include 7-day free trial. No credit card required.
          </p>
          <p className="text-sm text-muted-foreground mt-4">
            Need a custom enterprise plan? <a href="/contact" className="text-primary hover:underline">Contact our sales team</a>
          </p>
        </motion.div>
      </div>
    </section>
  )
}

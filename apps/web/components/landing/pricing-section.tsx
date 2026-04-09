'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { GlowCard } from '@/components/ui/spotlight-card'
import { GradientHoverButton } from '@/components/ui/gradient-hover-button'
import { SectionAnimations } from '@/components/landing/section-animations'

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
    features: [
      'Unlimited AI workouts',
      'Real-time form analysis',
      'Full nutrition AI coach',
      'Advanced analytics',
      'Priority support',
    ],
    cta: 'Start Pro trial',
    href: '/sign-up?plan=pro',
    highlight: true,
  },
  {
    name: 'Elite',
    monthly: 49,
    annual: 39,
    description: 'For peak performance',
    features: [
      'Everything in Pro',
      '1-on-1 AI coaching sessions',
      'Custom meal plans',
      'Wearable device sync',
      'Team challenges',
    ],
    cta: 'Go Elite',
    href: '/sign-up?plan=elite',
    highlight: false,
  },
]

function PricingCardContent({
  plan,
  annual,
}: {
  plan: (typeof plans)[0]
  annual: boolean
}) {
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

export function PricingSection() {
  const [annual, setAnnual] = useState(false)

  return (
    <SectionAnimations>
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
          <h2 className="text-4xl lg:text-5xl font-black text-white mb-6">Simple, honest pricing</h2>

          {/* Billing toggle */}
          <div className="inline-flex items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-full px-4 py-2">
            <span className={`text-sm transition-colors ${!annual ? 'text-white' : 'text-zinc-500'}`}>
              Monthly
            </span>
            <button
              onClick={() => setAnnual(!annual)}
              className={`relative w-10 h-5 rounded-full transition-colors duration-300 ${
                annual ? 'bg-primary' : 'bg-zinc-700'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform duration-300 ${
                  annual ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
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
              data-animate="true"
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
    </SectionAnimations>
  )
}

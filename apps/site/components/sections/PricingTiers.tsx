'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import { Container } from '@/components/ui/Container'
import { Section } from '@/components/ui/Section'
import { Button } from '@/components/ui/Button'
import { subscriptions } from '@/lib/pricing'
import { cn } from '@/lib/cn'

const EASE = [0.16, 1, 0.3, 1] as const

export function PricingTiers() {
  const [yearly, setYearly] = useState(false)

  return (
    <Section spacing="md">
      <Container size="lg">
        <div className="mb-12 flex justify-center">
          <div className="inline-flex items-center gap-1 rounded-full border border-border bg-bg-elevated p-1">
            <button
              onClick={() => setYearly(false)}
              className={cn(
                'rounded-full px-5 py-2 text-[14px] font-medium transition-all',
                !yearly ? 'bg-ink text-bg' : 'text-ink-muted hover:text-ink'
              )}
            >
              Aylık
            </button>
            <button
              onClick={() => setYearly(true)}
              className={cn(
                'flex items-center gap-2 rounded-full px-5 py-2 text-[14px] font-medium transition-all',
                yearly ? 'bg-ink text-bg' : 'text-ink-muted hover:text-ink'
              )}
            >
              Yıllık
              <span
                className={cn(
                  'rounded-full px-2 py-0.5 text-[11px] font-semibold',
                  yearly ? 'bg-bg/20 text-bg' : 'bg-accent/15 text-accent'
                )}
              >
                %33 indirim
              </span>
            </button>
          </div>
        </div>

        <div className="mx-auto grid max-w-4xl grid-cols-1 gap-5 md:grid-cols-2">
          {subscriptions.map((tier, idx) => {
            const isPremium = tier.highlight
            const displayPrice =
              yearly && tier.yearly ? (tier.yearly / 12).toFixed(2) : tier.price.toFixed(2)
            const periodLabel = yearly && tier.yearly ? 'ay (yıllık)' : tier.period

            return (
              <motion.div
                key={tier.name}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: EASE, delay: idx * 0.08 }}
                className={cn(
                  'relative rounded-3xl border p-8 sm:p-10',
                  isPremium
                    ? 'border-accent/40 bg-gradient-to-br from-accent/10 via-bg-elevated to-bg-elevated'
                    : 'border-border bg-bg-elevated'
                )}
              >
                {isPremium && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-accent px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-bg">
                    Önerilen
                  </div>
                )}

                <div className="mb-2 flex items-baseline gap-1">
                  <h3 className="text-[19px] font-semibold tracking-tight">{tier.name}</h3>
                </div>
                <p className="mb-6 text-[14px] text-ink-muted">{tier.description}</p>

                <div className="mb-8 flex items-baseline gap-1">
                  <span className="text-[48px] font-bold tracking-tightest">${displayPrice}</span>
                  <span className="text-[14px] text-ink-muted">/{periodLabel}</span>
                </div>

                <Button size="md" variant={isPremium ? 'gradient' : 'secondary'} className="w-full">
                  {tier.cta}
                </Button>

                <ul className="mt-8 space-y-3">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3 text-[14px]">
                      <span
                        className={cn(
                          'mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full',
                          isPremium ? 'bg-accent/20 text-accent' : 'bg-white/5 text-ink-muted'
                        )}
                      >
                        <Check className="h-3 w-3" strokeWidth={3} />
                      </span>
                      <span className="leading-relaxed text-ink-muted">{feature}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            )
          })}
        </div>
      </Container>
    </Section>
  )
}

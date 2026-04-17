'use client'

import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import Link from 'next/link'

const plans = [
  {
    name: 'STARTER',
    price: 'Free',
    period: 'forever',
    description: 'Get started and feel the difference.',
    features: [
      '3 AI-generated workouts / week',
      'Basic form feedback',
      'Nutrition photo logging',
      'Progress tracking',
    ],
    cta: 'Start Free',
    href: '/sign-up',
    highlight: false,
  },
  {
    name: 'PRO',
    price: '$19',
    period: '/ month',
    description: 'Unlock your full potential.',
    features: [
      'Unlimited AI workouts',
      'Real-time form correction',
      '3D body movement analysis',
      'Adaptive weekly reprogramming',
      'Voice AI coaching (VAPI)',
      'Injury risk prediction',
      'Leaderboards & social',
      'Priority support',
    ],
    cta: 'Go Pro',
    href: '/sign-up?plan=pro',
    highlight: true,
  },
]

export function PricingSection() {
  const ref = useRef<HTMLElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-60px 0px' })

  return (
    <section id="pricing" ref={ref} className="border-t border-white/[0.06] bg-[#080808]">
      {/* Header */}
      <div className="flex flex-col gap-4 border-b border-white/[0.06] px-5 py-12 sm:flex-row sm:items-end sm:justify-between sm:px-10 sm:py-16 lg:px-16">
        <div>
          <div className="mb-4 flex items-center gap-3">
            <span className="block h-[2px] w-6 bg-[#C8FF00]" />
            <span className="font-barlow text-[10px] uppercase tracking-[0.22em] text-[#C8FF00] sm:text-xs">
              Pricing
            </span>
          </div>
          <h2
            className="font-bebas leading-[0.9] text-white"
            style={{ fontSize: 'clamp(3rem, 8vw, 7rem)' }}
          >
            SIMPLE.
            <br />
            TRANSPARENT.
          </h2>
        </div>
        <p className="max-w-xs text-sm leading-relaxed text-zinc-500 sm:pb-2">
          No hidden fees. Cancel anytime.
          <br />
          Start free, upgrade when ready.
        </p>
      </div>

      {/* Plans */}
      <div className="grid grid-cols-1 divide-y divide-white/[0.06] sm:grid-cols-2 sm:divide-x sm:divide-y-0">
        {plans.map((plan, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 24 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.55, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
            className={`relative flex flex-col px-5 py-10 sm:px-10 sm:py-14 lg:px-16 ${
              plan.highlight ? 'bg-[#C8FF00]/[0.03]' : ''
            }`}
          >
            {/* Popular badge */}
            {plan.highlight && (
              <div className="absolute right-0 top-0">
                <div className="font-barlow bg-[#C8FF00] px-3 py-1.5 text-[9px] font-bold uppercase tracking-widest text-black">
                  Most Popular
                </div>
              </div>
            )}

            {/* Plan name */}
            <div className="font-bebas mb-4 text-lg tracking-widest text-zinc-500">{plan.name}</div>

            {/* Price */}
            <div className="mb-2 flex items-end gap-1">
              <span
                className="font-bebas leading-none text-white"
                style={{ fontSize: 'clamp(3.5rem, 8vw, 5.5rem)' }}
              >
                {plan.price}
              </span>
              <span className="font-barlow mb-3 text-sm text-zinc-500">{plan.period}</span>
            </div>

            <p className="mb-8 text-sm text-zinc-400">{plan.description}</p>

            {/* Features */}
            <ul className="mb-10 flex-1 space-y-3">
              {plan.features.map((f, j) => (
                <li key={j} className="flex items-start gap-3 text-sm text-zinc-300">
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 14 14"
                    fill="none"
                    className="mt-0.5 shrink-0"
                  >
                    <path
                      d="M2 7l4 4 6-6"
                      stroke={plan.highlight ? '#C8FF00' : '#555'}
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  {f}
                </li>
              ))}
            </ul>

            {/* CTA */}
            <Link
              href={plan.href}
              className={`font-barlow inline-flex items-center justify-center gap-2 px-6 py-4 text-xs font-bold uppercase tracking-[0.18em] transition-all duration-200 active:scale-[0.98] ${
                plan.highlight
                  ? 'bg-[#C8FF00] text-black hover:bg-white'
                  : 'border border-zinc-700 text-white hover:border-white hover:bg-white/[0.05]'
              }`}
            >
              {plan.cta}
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  )
}

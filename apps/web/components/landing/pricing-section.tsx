'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import Link from 'next/link'

const PLANS = [
  {
    name: 'STARTER',
    price: 'FREE',
    priceNote: 'forever',
    pitch: 'Everything you need to begin.',
    features: [
      '3 AI workouts per week',
      'Basic form feedback',
      'Nutrition photo logging',
      'Progress tracking',
    ],
    cta: 'Get Started',
    href: '/sign-up',
    highlighted: false,
  },
  {
    name: 'PRO',
    price: '$19',
    priceNote: 'per month',
    pitch: 'Unlimited. Uncompromising.',
    features: [
      'Unlimited AI workouts',
      'Real-time form correction',
      '3D movement analysis',
      'Adaptive weekly programming',
      'Voice AI coaching (VAPI)',
      'Injury risk prediction',
      'Leaderboards & social',
      'Priority support',
    ],
    cta: 'Go Pro',
    href: '/sign-up?plan=pro',
    highlighted: true,
  },
]

export function PricingSection() {
  const ref = useRef<HTMLElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-80px 0px' })

  return (
    <section id="pricing" ref={ref} className="border-t border-white/10 bg-[#0a0a0a]">
      {/* Header */}
      <div className="flex flex-col gap-4 border-b border-white/10 px-6 py-10 sm:flex-row sm:items-end sm:justify-between sm:px-10 lg:px-16">
        <div className="flex items-center gap-4">
          <div className="h-px w-8 bg-[#C8FF00]" aria-hidden="true" />
          <span className="font-barlow text-[10px] font-semibold uppercase tracking-[0.3em] text-[#C8FF00]">
            Pricing
          </span>
        </div>
        <h2
          className="font-bebas leading-[0.88] text-white"
          style={{ fontSize: 'clamp(2.5rem, 8vw, 7rem)' }}
        >
          SIMPLE. TRANSPARENT.
        </h2>
      </div>

      {/* Plans */}
      <div className="grid grid-cols-1 divide-y divide-white/10 sm:grid-cols-2 sm:divide-x sm:divide-y-0">
        {PLANS.map((plan, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 28 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.55, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
            className={`relative flex flex-col px-6 py-12 sm:px-10 lg:px-16 ${
              plan.highlighted ? 'bg-[#C8FF00]/[0.03]' : ''
            }`}
          >
            {/* Popular badge */}
            {plan.highlighted && (
              <div className="absolute right-0 top-0">
                <span className="font-barlow block bg-[#C8FF00] px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.25em] text-black">
                  Most Popular
                </span>
              </div>
            )}

            {/* Plan name */}
            <div className="font-bebas mb-6 text-base tracking-[0.3em] text-zinc-600">
              {plan.name}
            </div>

            {/* Price — huge editorial */}
            <div className="mb-2 flex items-end gap-3">
              <span
                className="font-bebas leading-none text-white"
                style={{ fontSize: 'clamp(4.5rem, 10vw, 8rem)' }}
              >
                {plan.price}
              </span>
              <span className="font-barlow mb-3 text-xs uppercase tracking-widest text-zinc-600">
                {plan.priceNote}
              </span>
            </div>

            <p className="font-barlow mb-8 text-sm text-zinc-500">{plan.pitch}</p>

            <div className="mb-8 h-px bg-white/10" aria-hidden="true" />

            {/* Features */}
            <ul className="mb-10 flex flex-1 flex-col gap-4" role="list">
              {plan.features.map((f, j) => (
                <li key={j} className="flex items-start gap-3">
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 14 14"
                    fill="none"
                    className="mt-0.5 shrink-0"
                    aria-hidden="true"
                  >
                    <path
                      d="M2 7l3.5 3.5L12 3"
                      stroke={plan.highlighted ? '#C8FF00' : '#3f3f46'}
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span className="font-barlow text-sm text-zinc-400">{f}</span>
                </li>
              ))}
            </ul>

            {/* CTA */}
            <Link
              href={plan.href}
              className={`font-barlow group inline-flex w-full cursor-pointer items-center justify-center gap-3 px-8 py-4 text-[11px] font-bold uppercase tracking-[0.22em] transition-colors duration-200 ${
                plan.highlighted
                  ? 'bg-[#C8FF00] text-black hover:bg-white'
                  : 'border border-zinc-700 text-white hover:border-zinc-500 hover:bg-white/5'
              }`}
            >
              {plan.cta}
              <svg
                width="12"
                height="12"
                viewBox="0 0 14 14"
                fill="none"
                aria-hidden="true"
                className="transition-transform duration-200 group-hover:translate-x-1"
              >
                <path
                  d="M1 7h12M7 1l6 6-6 6"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  )
}

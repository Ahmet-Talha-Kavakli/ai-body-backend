'use client'

import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'

const steps = [
  {
    step: '01',
    title: 'Create Your Profile',
    description:
      'Tell us your goals, fitness level, and schedule. Takes 2 minutes. AI builds your baseline.',
  },
  {
    step: '02',
    title: 'Get Your Program',
    description:
      'AI generates a fully personalized training plan — workouts, rest days, and nutrition targets.',
  },
  {
    step: '03',
    title: 'Train With AI',
    description:
      'Open your camera, start your workout. AI tracks your form, counts reps, and coaches in real time.',
  },
  {
    step: '04',
    title: 'Adapt & Improve',
    description:
      "After every session, AI analyzes performance and adjusts next week's plan automatically.",
  },
]

export function HowItWorksSection() {
  const ref = useRef<HTMLElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-60px 0px' })

  return (
    <section id="how-it-works" ref={ref} className="border-t border-white/[0.06] bg-[#080808]">
      {/* Header */}
      <div className="flex flex-col gap-4 border-b border-white/[0.06] px-5 pb-10 pt-12 sm:flex-row sm:items-end sm:justify-between sm:px-10 sm:pb-12 sm:pt-16 lg:px-16">
        <div>
          <div className="mb-4 flex items-center gap-3">
            <span className="block h-[2px] w-6 bg-[#C8FF00]" />
            <span className="font-barlow text-[10px] uppercase tracking-[0.22em] text-[#C8FF00] sm:text-xs">
              The Process
            </span>
          </div>
          <h2
            className="font-bebas leading-[0.9] text-white"
            style={{ fontSize: 'clamp(3rem, 8vw, 7rem)' }}
          >
            HOW IT
            <br />
            WORKS
          </h2>
        </div>
        <p className="max-w-xs text-sm leading-relaxed text-zinc-500 sm:pb-2">
          From zero to optimized in minutes. No gym needed.
        </p>
      </div>

      {/* Steps */}
      <div className="divide-y divide-white/[0.06]">
        {steps.map((s, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -20 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.1 + i * 0.08, ease: [0.16, 1, 0.3, 1] }}
            className="group flex items-start gap-6 px-5 py-7 transition-colors duration-300 hover:bg-white/[0.015] sm:gap-12 sm:px-10 sm:py-10 lg:px-16"
          >
            {/* Step number */}
            <span
              className="font-bebas flex-shrink-0 leading-none text-zinc-800 transition-colors duration-300 group-hover:text-[#C8FF00]/40"
              style={{ fontSize: 'clamp(2rem, 4vw, 3.5rem)' }}
            >
              {s.step}
            </span>

            {/* Content */}
            <div className="flex-1 pt-1">
              <h3 className="font-barlow text-base font-bold uppercase tracking-wide text-white sm:text-lg">
                {s.title}
              </h3>
              <p className="mt-2 max-w-lg text-sm leading-relaxed text-zinc-400">{s.description}</p>
            </div>

            {/* Progress indicator */}
            <div className="hidden flex-shrink-0 flex-col items-center gap-1 pt-2 sm:flex">
              <div className="h-1.5 w-1.5 rounded-full bg-zinc-700 transition-colors duration-300 group-hover:bg-[#C8FF00]" />
              {i < steps.length - 1 && <div className="h-8 w-px bg-zinc-800" />}
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  )
}

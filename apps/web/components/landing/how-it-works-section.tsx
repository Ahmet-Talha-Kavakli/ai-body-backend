'use client'

import { useRef } from 'react'
import { motion, useInView, useScroll, useTransform } from 'framer-motion'

const STEPS = [
  {
    step: '01',
    title: 'Create Your Profile',
    body: 'Tell us your goals, fitness level, and schedule. 2 minutes. AI builds your baseline.',
  },
  {
    step: '02',
    title: 'Get Your Program',
    body: 'AI generates a fully personalized plan — workouts, rest days, nutrition targets.',
  },
  {
    step: '03',
    title: 'Train With AI',
    body: 'Open your camera, start. AI tracks form, counts reps, coaches in real time.',
  },
  {
    step: '04',
    title: 'Adapt & Improve',
    body: 'After every session, AI analyzes and adjusts next week automatically.',
  },
]

export function HowItWorksSection() {
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const lineWidth = useTransform(scrollYProgress, [0.1, 0.8], ['0%', '100%'])

  return (
    <section id="how-it-works" ref={ref} className="border-t border-white/10 bg-[#0a0a0a]">
      {/* Header */}
      <div className="border-b border-white/10 px-6 py-10 sm:px-10 lg:px-16">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="h-px w-8 bg-[#C8FF00]" aria-hidden="true" />
            <span className="font-barlow text-[10px] font-semibold uppercase tracking-[0.3em] text-[#C8FF00]">
              The Process
            </span>
          </div>
          <h2
            className="font-bebas leading-[0.88] text-white"
            style={{ fontSize: 'clamp(3rem, 9vw, 8rem)' }}
          >
            HOW IT WORKS
          </h2>
        </div>

        {/* Scroll progress line */}
        <div className="mt-8 h-px w-full overflow-hidden bg-white/10" aria-hidden="true">
          <motion.div className="h-full bg-[#C8FF00]" style={{ width: lineWidth }} />
        </div>
      </div>

      {/* Steps — 2 columns on desktop */}
      <div className="grid grid-cols-1 divide-y divide-white/10 sm:grid-cols-2 sm:divide-y-0">
        {STEPS.map((s, i) => (
          <StepCard key={i} step={s} index={i} />
        ))}
      </div>
    </section>
  )
}

function StepCard({ step, index }: { step: (typeof STEPS)[0]; index: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-80px 0px' })

  const borders = [
    'sm:border-r sm:border-b border-white/10',
    'sm:border-b border-white/10',
    'sm:border-r border-white/10',
    '',
  ]

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: index * 0.08, ease: [0.16, 1, 0.3, 1] }}
      className={`group flex flex-col gap-6 px-6 py-10 transition-colors duration-300 hover:bg-white/[0.02] sm:px-10 sm:py-14 ${borders[index]}`}
    >
      {/* Number */}
      <span
        className="font-bebas select-none leading-none text-zinc-800 transition-colors duration-300 group-hover:text-[#C8FF00]/20"
        style={{ fontSize: 'clamp(4rem, 8vw, 7rem)' }}
        aria-hidden="true"
      >
        {step.step}
      </span>

      {/* Content */}
      <div className="flex flex-col gap-3">
        <h3
          className="font-bebas leading-none text-white"
          style={{ fontSize: 'clamp(1.6rem, 3vw, 2.5rem)' }}
        >
          {step.title}
        </h3>
        <p className="font-barlow text-sm leading-relaxed text-zinc-500">{step.body}</p>
      </div>

      {/* Bottom indicator */}
      <div
        className="mt-auto h-px w-0 bg-[#C8FF00] transition-all duration-500 group-hover:w-full"
        aria-hidden="true"
      />
    </motion.div>
  )
}

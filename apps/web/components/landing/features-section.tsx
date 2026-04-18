'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'

const FEATURES = [
  {
    number: '01',
    tag: 'Computer Vision',
    headline: ['REAL-TIME', 'AI COACHING'],
    body: 'Your AI coach watches every rep. Detects form errors, counts reps, gives instant verbal feedback. Like a pro trainer in your pocket — every session.',
    accent: true,
  },
  {
    number: '02',
    tag: 'Machine Learning',
    headline: ['ADAPTIVE', 'PROGRAMS'],
    body: 'No two workouts are the same. Your plan evolves daily based on performance, recovery, sleep, and goals. Load, volume, intensity — all adjusted in real time.',
    accent: false,
  },
  {
    number: '03',
    tag: 'Body Tracking',
    headline: ['3D MOVEMENT', 'ANALYSIS'],
    body: 'Full skeletal tracking maps 33 body landmarks live. Visualize muscle engagement, detect imbalances, predict injury risk — before it happens.',
    accent: false,
  },
  {
    number: '04',
    tag: 'Vision AI',
    headline: ['NUTRITION', 'INTELLIGENCE'],
    body: 'Snap a photo of your meal. Get instant macros — calories, protein, carbs, fat. Auto-synced with your training plan. No logging, no guessing.',
    accent: false,
  },
]

export function FeaturesSection() {
  return (
    <section id="features" className="border-t border-white/10 bg-[#0a0a0a]">
      {/* Section header */}
      <div className="flex items-end justify-between border-b border-white/10 px-6 py-10 sm:px-10 lg:px-16">
        <div className="flex items-center gap-4">
          <div className="h-px w-8 bg-[#C8FF00]" aria-hidden="true" />
          <span className="font-barlow text-[10px] font-semibold uppercase tracking-[0.3em] text-[#C8FF00]">
            Core Features
          </span>
        </div>
        <h2
          className="font-bebas hidden leading-none text-white sm:block"
          style={{ fontSize: 'clamp(2rem, 5vw, 4.5rem)' }}
        >
          WHAT WE DO
        </h2>
      </div>

      {/* Feature blocks */}
      <div className="divide-y divide-white/10">
        {FEATURES.map((f, i) => (
          <FeatureBlock key={i} feature={f} index={i} />
        ))}
      </div>
    </section>
  )
}

function FeatureBlock({ feature, index }: { feature: (typeof FEATURES)[0]; index: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-100px 0px' })
  const isEven = index % 2 === 0

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 32 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
      className={`group flex flex-col gap-0 lg:flex-row ${isEven ? '' : 'lg:flex-row-reverse'}`}
    >
      {/* Left/Right — number + tag */}
      <div
        className={`flex items-start justify-between border-b border-white/10 px-6 py-8 sm:px-10 lg:w-72 lg:flex-col lg:justify-between lg:border-b-0 lg:py-16 xl:w-96 ${
          isEven ? 'lg:border-r' : 'lg:border-l'
        } border-white/10`}
      >
        <span
          className="font-bebas leading-none text-zinc-800 transition-colors duration-300 group-hover:text-[#C8FF00]/20"
          style={{ fontSize: 'clamp(3rem, 6vw, 5rem)' }}
        >
          {feature.number}
        </span>
        <span className="font-barlow border border-zinc-800 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-600 transition-colors duration-300 group-hover:border-[#C8FF00]/30 group-hover:text-[#C8FF00]/60">
          {feature.tag}
        </span>
      </div>

      {/* Center — main content */}
      <div className="flex flex-1 flex-col justify-between gap-8 px-6 py-10 sm:px-10 lg:py-16">
        <h3
          className="font-bebas leading-[0.88] text-white"
          style={{ fontSize: 'clamp(2.5rem, 6vw, 5.5rem)' }}
        >
          {feature.headline[0]}
          <br />
          <span
            className={
              feature.accent
                ? 'text-[#C8FF00]'
                : 'transition-colors duration-300 group-hover:text-[#C8FF00]'
            }
          >
            {feature.headline[1]}
          </span>
        </h3>

        <p className="font-barlow max-w-lg text-sm leading-relaxed text-zinc-400 sm:text-base">
          {feature.body}
        </p>
      </div>

      {/* Right/Left — arrow indicator */}
      <div
        className={`hidden items-center px-10 lg:flex ${
          isEven ? 'lg:border-l' : 'lg:border-r'
        } border-white/10`}
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          className="text-zinc-800 transition-all duration-300 group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-[#C8FF00]"
          aria-hidden="true"
        >
          <path
            d="M7 17L17 7M17 7H9M17 7v8"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </motion.div>
  )
}

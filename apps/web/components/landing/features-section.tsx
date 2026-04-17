'use client'

import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'

const features = [
  {
    number: '01',
    title: 'REAL-TIME\nAI COACHING',
    description:
      'Your AI coach watches every rep. It detects form errors, counts reps automatically, and gives you instant verbal feedback — like having a pro trainer in your pocket.',
    tag: 'Computer Vision',
  },
  {
    number: '02',
    title: 'ADAPTIVE\nPROGRAMS',
    description:
      'No two workouts are the same. Your program evolves daily based on your performance, recovery score, sleep, and goals. AI adjusts load, volume, and intensity in real time.',
    tag: 'Machine Learning',
  },
  {
    number: '03',
    title: '3D MOVEMENT\nANALYSIS',
    description:
      'Full skeletal tracking maps 33 body landmarks in real time. Visualize muscle engagement, detect imbalances, and predict injury risk before it happens.',
    tag: 'Body Tracking',
  },
  {
    number: '04',
    title: 'NUTRITION\nINTELLIGENCE',
    description:
      'Snap a photo of your meal and get instant macros. AI estimates calories, protein, carbs, and fat — then syncs nutrition with your training plan automatically.',
    tag: 'Vision AI',
  },
]

export function FeaturesSection() {
  const ref = useRef<HTMLElement>(null)

  return (
    <section id="features" ref={ref} className="border-t border-white/[0.06] bg-[#080808]">
      {/* Header row */}
      <div className="flex flex-col gap-4 border-b border-white/[0.06] px-5 py-12 sm:flex-row sm:items-end sm:justify-between sm:px-10 sm:py-16 lg:px-16">
        <div className="flex items-center gap-3">
          <span className="block h-[2px] w-6 bg-[#C8FF00]" />
          <span className="font-barlow text-[10px] uppercase tracking-[0.22em] text-[#C8FF00] sm:text-xs">
            Core Features
          </span>
        </div>
        <p className="max-w-xs text-sm leading-relaxed text-zinc-500">
          Everything your training needs,
          <br className="hidden sm:block" /> powered by AI.
        </p>
      </div>

      {/* Feature rows */}
      <div className="divide-y divide-white/[0.06]">
        {features.map((f, i) => (
          <FeatureRow key={i} feature={f} index={i} />
        ))}
      </div>
    </section>
  )
}

function FeatureRow({ feature, index }: { feature: (typeof features)[0]; index: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-80px 0px' })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, delay: index * 0.06, ease: [0.16, 1, 0.3, 1] }}
      className="group flex flex-col gap-6 px-5 py-8 transition-colors duration-300 hover:bg-white/[0.015] sm:flex-row sm:items-start sm:gap-10 sm:px-10 sm:py-12 lg:px-16"
    >
      {/* Number */}
      <div className="flex-shrink-0">
        <span
          className="font-bebas text-zinc-700 transition-colors duration-300 group-hover:text-[#C8FF00]"
          style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)' }}
        >
          {feature.number}
        </span>
      </div>

      {/* Title */}
      <div className="flex-shrink-0 sm:w-56 lg:w-72">
        <h3
          className="font-bebas whitespace-pre-line leading-[0.9] text-white"
          style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)' }}
        >
          {feature.title}
        </h3>
        <span className="font-barlow mt-3 inline-block border border-zinc-800 px-2.5 py-1 text-[10px] uppercase tracking-widest text-zinc-600">
          {feature.tag}
        </span>
      </div>

      {/* Description */}
      <div className="flex-1 sm:pt-1">
        <p className="max-w-lg text-sm leading-relaxed text-zinc-400 sm:text-base">
          {feature.description}
        </p>
      </div>

      {/* Arrow */}
      <div className="hidden flex-shrink-0 items-start pt-2 sm:flex">
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          className="text-zinc-700 transition-all duration-300 group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-[#C8FF00]"
        >
          <path
            d="M4 16L16 4M16 4H8M16 4v8"
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

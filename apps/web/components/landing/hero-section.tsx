'use client'

import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import Link from 'next/link'

const MARQUEE_ITEMS = [
  'AI COACHING',
  'REAL-TIME FORM',
  'ADAPTIVE PROGRAMS',
  '3D ANALYSIS',
  'NUTRITION AI',
  'VOICE COACH',
  'INJURY PREVENTION',
  'PERSONAL RECORDS',
]

export function HeroSection() {
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '30%'])
  const opacity = useTransform(scrollYProgress, [0, 0.6], [1, 0])

  return (
    <section
      ref={ref}
      className="relative flex min-h-[100svh] flex-col overflow-hidden bg-[#0a0a0a]"
    >
      {/* Thin horizontal rule at top */}
      <div className="absolute left-0 right-0 top-0 h-px bg-[#C8FF00]/30" aria-hidden="true" />

      {/* Main headline block */}
      <motion.div
        style={{ y, opacity }}
        className="relative z-10 flex flex-1 flex-col justify-center px-6 pb-8 pt-24 sm:px-10 lg:px-16"
      >
        {/* Eyebrow */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="mb-8 flex items-center gap-4"
        >
          <div className="h-px w-10 bg-[#C8FF00]" aria-hidden="true" />
          <span className="font-barlow text-[11px] font-semibold uppercase tracking-[0.3em] text-[#C8FF00]">
            AI-Powered Personal Training
          </span>
        </motion.div>

        {/* Giant headline — 2 lines, staggered reveal */}
        <div className="overflow-hidden">
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: '0%' }}
            transition={{ duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          >
            <h1
              className="font-bebas leading-[0.82] tracking-tight text-white"
              style={{ fontSize: 'clamp(5.5rem, 22vw, 18rem)' }}
            >
              TRAIN
            </h1>
          </motion.div>
        </div>

        <div className="overflow-hidden">
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: '0%' }}
            transition={{ duration: 0.7, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
          >
            <h1
              className="font-bebas leading-[0.82] tracking-tight"
              style={{
                fontSize: 'clamp(5.5rem, 22vw, 18rem)',
                WebkitTextStroke: '2px #C8FF00',
                color: 'transparent',
              }}
            >
              SMARTER.
            </h1>
          </motion.div>
        </div>

        {/* Bottom row — description left, CTA right */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.45 }}
          className="mt-10 flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between"
        >
          <p className="font-barlow max-w-sm text-sm leading-relaxed text-zinc-400 sm:text-base">
            Real-time AI coaching, personalized programs, and 3D movement analysis. No gym needed.
          </p>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href="/sign-up"
              className="font-barlow group inline-flex cursor-pointer items-center gap-3 bg-[#C8FF00] px-8 py-4 text-[11px] font-bold uppercase tracking-[0.22em] text-black transition-colors duration-200 hover:bg-white"
            >
              Start Free
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
            <Link
              href="#how-it-works"
              className="font-barlow inline-flex cursor-pointer items-center gap-2.5 border border-zinc-700 px-8 py-4 text-[11px] font-semibold uppercase tracking-[0.22em] text-white transition-colors duration-200 hover:border-zinc-500 hover:bg-white/5"
            >
              See How It Works
            </Link>
          </div>
        </motion.div>
      </motion.div>

      {/* Marquee strip */}
      <div
        className="relative z-10 overflow-hidden border-b border-t border-white/10 bg-[#C8FF00]/5 py-4"
        aria-hidden="true"
      >
        <div className="animate-marquee flex whitespace-nowrap">
          {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, i) => (
            <span key={i} className="font-bebas mx-8 text-sm tracking-[0.2em] text-zinc-500">
              {item}
              <span className="ml-8 text-[#C8FF00]/40">✦</span>
            </span>
          ))}
        </div>
      </div>

      {/* Stats row */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.7 }}
        className="relative z-10 grid grid-cols-2 border-t border-white/10 sm:grid-cols-4"
      >
        {[
          { value: '10K+', label: 'Athletes' },
          { value: '98%', label: 'Form Accuracy' },
          { value: '500+', label: 'Exercises' },
          { value: '2.4×', label: 'Faster Results' },
        ].map((stat, i) => (
          <div
            key={i}
            className={`flex flex-col gap-1 px-6 py-6 sm:px-10 lg:px-16 ${i < 3 ? 'border-r border-white/10' : ''}`}
          >
            <span className="font-bebas text-3xl leading-none text-white sm:text-5xl">
              {stat.value}
            </span>
            <span className="font-barlow text-[10px] uppercase tracking-widest text-zinc-600">
              {stat.label}
            </span>
          </div>
        ))}
      </motion.div>
    </section>
  )
}

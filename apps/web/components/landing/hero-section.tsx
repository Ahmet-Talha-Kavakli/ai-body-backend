'use client'

import { motion, useScroll, useTransform } from 'framer-motion'
import Link from 'next/link'
import { useRef } from 'react'

const stats = [
  { value: '10K+', label: 'Athletes' },
  { value: '98%', label: 'Accuracy' },
  { value: '500+', label: 'Exercises' },
  { value: '2.4×', label: 'Faster' },
]

export function HeroSection() {
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '18%'])
  const opacity = useTransform(scrollYProgress, [0, 0.6], [1, 0])

  return (
    <section
      ref={ref}
      className="relative flex min-h-[100svh] flex-col overflow-hidden bg-[#080808]"
    >
      {/* Grain overlay */}
      <div
        className="pointer-events-none absolute inset-0 z-10 opacity-[0.035]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundSize: '180px 180px',
        }}
      />

      {/* Vertical lime accent line — right edge */}
      <div className="pointer-events-none absolute right-0 top-0 hidden h-full w-px bg-gradient-to-b from-transparent via-[#C8FF00]/25 to-transparent sm:block" />

      {/* Main content */}
      <motion.div
        style={{ y, opacity }}
        className="relative z-10 flex flex-1 flex-col justify-center"
      >
        <div className="w-full px-5 pb-6 pt-24 sm:px-10 lg:px-16">
          {/* Eyebrow */}
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.45, delay: 0.1 }}
            className="mb-5 flex items-center gap-3 sm:mb-7"
          >
            <span className="block h-[2px] w-6 bg-[#C8FF00] sm:w-8" />
            <span className="font-barlow text-[10px] uppercase tracking-[0.22em] text-[#C8FF00] sm:text-xs">
              AI-Powered Personal Training
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 36 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="font-bebas select-none leading-[0.88] tracking-tight text-white"
            style={{ fontSize: 'clamp(4.5rem, 18vw, 14rem)' }}
          >
            TRAIN
          </motion.h1>

          <motion.h1
            initial={{ opacity: 0, y: 36 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="font-bebas select-none leading-[0.88] tracking-tight text-[#C8FF00]"
            style={{ fontSize: 'clamp(4.5rem, 18vw, 14rem)' }}
          >
            SMARTER.
          </motion.h1>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.48 }}
            className="mt-5 max-w-xs text-sm leading-relaxed text-zinc-400 sm:mt-7 sm:max-w-sm sm:text-base"
          >
            Real-time AI coaching, personalized programs, and 3D movement analysis — all in one
            place.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.62 }}
            className="mt-7 flex flex-col items-start gap-3 sm:mt-9 sm:flex-row sm:items-center sm:gap-5"
          >
            <Link
              href="/sign-up"
              className="font-barlow group inline-flex w-full items-center justify-center gap-2.5 bg-[#C8FF00] px-7 py-4 text-xs font-bold uppercase tracking-[0.18em] text-black transition-all duration-200 hover:bg-white active:scale-[0.98] sm:w-auto sm:justify-start"
            >
              Start Free
              <svg
                width="13"
                height="13"
                viewBox="0 0 14 14"
                fill="none"
                className="shrink-0 transition-transform group-hover:translate-x-1"
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
              className="font-barlow inline-flex items-center gap-2 py-2 text-xs uppercase tracking-[0.18em] text-zinc-400 transition-colors hover:text-white"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-zinc-700">
                <svg width="8" height="9" viewBox="0 0 8 9" fill="currentColor">
                  <path d="M7 4.5L1.5 1.5v6L7 4.5z" />
                </svg>
              </span>
              Watch Demo
            </Link>
          </motion.div>
        </div>
      </motion.div>

      {/* Stats bar */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.85 }}
        className="relative z-10 mt-auto border-t border-white/[0.07]"
      >
        <div className="grid grid-cols-4 divide-x divide-white/[0.07]">
          {stats.map((s, i) => (
            <div
              key={i}
              className="flex flex-col items-center py-4 sm:items-start sm:px-10 sm:py-6 lg:px-16"
            >
              <div className="font-bebas text-2xl leading-none text-white sm:text-4xl">
                {s.value}
              </div>
              <div className="mt-0.5 text-[9px] uppercase tracking-widest text-zinc-500 sm:text-xs">
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </section>
  )
}

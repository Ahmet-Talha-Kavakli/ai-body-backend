'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import Link from 'next/link'

export function CtaSection() {
  const ref = useRef<HTMLElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-100px 0px' })

  return (
    <section ref={ref} className="relative overflow-hidden border-t border-white/10 bg-[#0a0a0a]">
      {/* Subtle lime glow — single centered */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 h-[500px] w-[800px] -translate-x-1/2 -translate-y-1/2 bg-[#C8FF00]/[0.04] blur-[160px]"
        aria-hidden="true"
      />

      {/* Corner accents */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute left-0 top-0 h-20 w-20 border-l-2 border-t-2 border-[#C8FF00]/20" />
        <div className="absolute bottom-0 right-0 h-20 w-20 border-b-2 border-r-2 border-[#C8FF00]/20" />
      </div>

      <div className="relative z-10 px-6 py-24 sm:px-10 sm:py-40 lg:px-16">
        {/* Eyebrow */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="mb-8 flex items-center gap-4"
        >
          <div className="h-px w-8 bg-[#C8FF00]" aria-hidden="true" />
          <span className="font-barlow text-[10px] font-semibold uppercase tracking-[0.3em] text-[#C8FF00]">
            Get Started Today
          </span>
        </motion.div>

        {/* Headline */}
        <div className="mb-3 overflow-hidden">
          <motion.h2
            initial={{ y: '100%' }}
            animate={isInView ? { y: '0%' } : {}}
            transition={{ duration: 0.75, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="font-bebas leading-[0.85] text-white"
            style={{ fontSize: 'clamp(4.5rem, 16vw, 14rem)' }}
          >
            START YOUR
          </motion.h2>
        </div>
        <div className="mb-12 overflow-hidden">
          <motion.h2
            initial={{ y: '100%' }}
            animate={isInView ? { y: '0%' } : {}}
            transition={{ duration: 0.75, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="font-bebas leading-[0.85]"
            style={{
              fontSize: 'clamp(4.5rem, 16vw, 14rem)',
              WebkitTextStroke: '2px #C8FF00',
              color: 'transparent',
            }}
          >
            TRANSFORMATION.
          </motion.h2>
        </div>

        {/* Bottom row */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.35 }}
          className="flex flex-col gap-6 sm:flex-row sm:items-center"
        >
          <p className="font-barlow max-w-xs text-sm leading-relaxed text-zinc-500">
            Free to start. No credit card required. Cancel anytime.
          </p>
          <Link
            href="/sign-up"
            className="font-barlow group inline-flex cursor-pointer items-center gap-3 whitespace-nowrap bg-[#C8FF00] px-10 py-5 text-[11px] font-bold uppercase tracking-[0.25em] text-black transition-colors duration-200 hover:bg-white"
          >
            Train Free Now
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
      </div>
    </section>
  )
}

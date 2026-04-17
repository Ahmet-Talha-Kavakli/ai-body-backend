'use client'

import { motion, useInView } from 'framer-motion'
import Link from 'next/link'
import { useRef } from 'react'

export function CtaSection() {
  const ref = useRef<HTMLElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-80px 0px' })

  return (
    <section
      ref={ref}
      className="relative overflow-hidden border-t border-white/[0.06] bg-[#0C0C0C]"
    >
      {/* Big background text */}
      <div
        className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden"
        aria-hidden="true"
      >
        <span
          className="font-bebas select-none whitespace-nowrap leading-none text-white/[0.025]"
          style={{ fontSize: 'clamp(6rem, 22vw, 22rem)' }}
        >
          FITAI
        </span>
      </div>

      <div className="relative z-10 flex flex-col items-start px-5 py-16 sm:px-10 sm:py-24 lg:px-16">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="mb-6 flex items-center gap-3"
        >
          <span className="block h-[2px] w-6 bg-[#C8FF00]" />
          <span className="font-barlow text-[10px] uppercase tracking-[0.22em] text-[#C8FF00] sm:text-xs">
            Start Today
          </span>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 32 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.65, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="font-bebas max-w-3xl leading-[0.88] text-white"
          style={{ fontSize: 'clamp(3.5rem, 11vw, 10rem)' }}
        >
          READY TO
          <br />
          <span className="text-[#C8FF00]">TRAIN</span>
          <br />
          SMARTER?
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="mt-6 max-w-sm text-sm leading-relaxed text-zinc-400 sm:text-base"
        >
          Join 10,000+ athletes training with AI. No equipment needed. Start free in 2 minutes.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.38 }}
          className="mt-8 flex w-full flex-col items-stretch gap-3 sm:w-auto sm:flex-row sm:items-center"
        >
          <Link
            href="/sign-up"
            className="font-barlow group inline-flex items-center justify-center gap-2.5 bg-[#C8FF00] px-8 py-4 text-xs font-bold uppercase tracking-[0.18em] text-black transition-all duration-200 hover:bg-white active:scale-[0.98]"
          >
            Start Free Today
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
            href="/sign-in"
            className="font-barlow inline-flex items-center justify-center border border-zinc-700 px-8 py-4 text-xs font-bold uppercase tracking-[0.18em] text-white transition-all duration-200 hover:border-zinc-500"
          >
            Sign In
          </Link>
        </motion.div>
      </div>
    </section>
  )
}

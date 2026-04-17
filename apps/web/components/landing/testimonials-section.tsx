'use client'

import { motion, useInView } from 'framer-motion'
import { useRef, useState } from 'react'

const testimonials = [
  {
    quote:
      "I've tried every fitness app out there. FitAI is the first one that actually felt like working with a real coach. The form feedback is insane.",
    name: 'Jordan K.',
    role: 'Marathon Runner',
    initials: 'JK',
    result: 'Cut 18min off 10K in 8 weeks',
  },
  {
    quote:
      'Lost 12kg in 3 months without stepping foot in a gym. The AI adjusted my plan every week — it knew when I was tired before I did.',
    name: 'Ariel M.',
    role: 'Remote Worker',
    initials: 'AM',
    result: '12kg down, 8% body fat',
  },
  {
    quote:
      'As a personal trainer myself, I was skeptical. Now I recommend FitAI to all my clients between sessions. The movement analysis is pro-level.',
    name: 'Sam R.',
    role: 'Certified Personal Trainer',
    initials: 'SR',
    result: '94% client retention improvement',
  },
]

export function TestimonialsSection() {
  const ref = useRef<HTMLElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-60px 0px' })
  const [active, setActive] = useState(0)

  const t = testimonials[active]

  return (
    <section ref={ref} className="border-t border-white/[0.06] bg-[#080808]">
      {/* Header */}
      <div className="flex flex-col gap-4 border-b border-white/[0.06] px-5 py-12 sm:flex-row sm:items-end sm:justify-between sm:px-10 sm:py-16 lg:px-16">
        <div className="flex items-center gap-3">
          <span className="block h-[2px] w-6 bg-[#C8FF00]" />
          <span className="font-barlow text-[10px] uppercase tracking-[0.22em] text-[#C8FF00] sm:text-xs">
            Real Results
          </span>
        </div>
        <div className="flex items-center gap-1">
          {[...Array(5)].map((_, i) => (
            <svg key={i} className="h-3.5 w-3.5 fill-[#C8FF00]" viewBox="0 0 24 24">
              <path d="M12,17.27L18.18,21L16.54,13.97L22,9.24L14.81,8.62L12,2L9.19,8.62L2,9.24L7.45,13.97L5.82,21L12,17.27Z" />
            </svg>
          ))}
          <span className="ml-2 text-xs text-zinc-500">4.9 / 5</span>
        </div>
      </div>

      {/* Main quote area */}
      <div className="px-5 py-12 sm:px-10 sm:py-16 lg:px-16">
        <motion.div
          key={active}
          initial={{ opacity: 0, y: 16 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Large quote mark */}
          <div
            className="font-bebas mb-2 leading-none text-[#C8FF00]/20"
            style={{ fontSize: '6rem' }}
          >
            "
          </div>

          <blockquote
            className="font-barlow max-w-3xl font-semibold leading-snug text-white"
            style={{ fontSize: 'clamp(1.2rem, 3vw, 2rem)' }}
          >
            {t.quote}
          </blockquote>

          <div className="mt-8 flex flex-col gap-6 sm:mt-10 sm:flex-row sm:items-center sm:justify-between">
            {/* Author */}
            <div className="flex items-center gap-4">
              <div className="font-barlow flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-zinc-700 bg-zinc-800 text-sm font-bold text-white sm:h-12 sm:w-12">
                {t.initials}
              </div>
              <div>
                <div className="font-barlow text-sm font-bold text-white">{t.name}</div>
                <div className="mt-0.5 text-xs text-zinc-500">{t.role}</div>
              </div>
            </div>

            {/* Result badge */}
            <div className="inline-flex items-center gap-2 self-start border border-[#C8FF00]/30 bg-[#C8FF00]/5 px-4 py-2.5 sm:self-auto">
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path
                  d="M5 0L6.12 3.45H9.76L6.82 5.59L7.94 9.04L5 6.9L2.06 9.04L3.18 5.59L0.24 3.45H3.88L5 0Z"
                  fill="#C8FF00"
                />
              </svg>
              <span className="font-barlow text-xs tracking-wide text-[#C8FF00]">{t.result}</span>
            </div>
          </div>
        </motion.div>

        {/* Navigation dots */}
        <div className="mt-10 flex items-center gap-3 sm:mt-12">
          {testimonials.map((_, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={`transition-all duration-300 ${
                i === active
                  ? 'h-1.5 w-8 bg-[#C8FF00]'
                  : 'h-1.5 w-1.5 rounded-full bg-zinc-700 hover:bg-zinc-500'
              }`}
              aria-label={`Testimonial ${i + 1}`}
            />
          ))}
          <span className="font-barlow ml-2 text-xs text-zinc-600">
            {active + 1} / {testimonials.length}
          </span>
        </div>
      </div>
    </section>
  )
}

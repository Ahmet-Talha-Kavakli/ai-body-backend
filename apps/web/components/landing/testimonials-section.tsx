'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'

const TESTIMONIALS = [
  {
    quote:
      'The AI caught a knee alignment issue I had been ignoring for months. Fixed it in two sessions. My squat PR went up 20kg.',
    name: 'Marcus T.',
    role: 'Powerlifter',
    size: 'large',
  },
  {
    quote: 'Finally a training app that actually adapts. Not just a program selector.',
    name: 'Yuki S.',
    role: 'Marathon Runner',
    size: 'small',
  },
  {
    quote:
      'I travel constantly. Having a trainer that adjusts to hotel gyms and bodyweight sessions is a game changer.',
    name: 'Aisha R.',
    role: 'Business Executive',
    size: 'medium',
  },
  {
    quote: 'The nutrition snap feature alone is worth the subscription.',
    name: 'Dan K.',
    role: 'CrossFit Competitor',
    size: 'small',
  },
  {
    quote:
      'Within 3 weeks my form was completely transformed. The 3D analysis showed things a mirror never could.',
    name: 'Sofia L.',
    role: 'Yoga & Strength',
    size: 'medium',
  },
  {
    quote: "Voice coaching mid-rep is insane. It's like someone is actually watching you.",
    name: 'Ryan O.',
    role: 'HIIT Athlete',
    size: 'small',
  },
]

export function TestimonialsSection() {
  const ref = useRef<HTMLElement>(null)

  return (
    <section id="testimonials" ref={ref} className="border-t border-white/10 bg-[#0a0a0a]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 px-6 py-10 sm:px-10 lg:px-16">
        <div className="flex items-center gap-4">
          <div className="h-px w-8 bg-[#C8FF00]" aria-hidden="true" />
          <span className="font-barlow text-[10px] font-semibold uppercase tracking-[0.3em] text-[#C8FF00]">
            Social Proof
          </span>
        </div>
        <h2
          className="font-bebas leading-none text-white"
          style={{ fontSize: 'clamp(2rem, 5vw, 4.5rem)' }}
        >
          REAL RESULTS
        </h2>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 divide-y divide-white/10 sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-3">
        {TESTIMONIALS.map((t, i) => (
          <QuoteCard key={i} testimonial={t} index={i} />
        ))}
      </div>
    </section>
  )
}

function QuoteCard({
  testimonial,
  index,
}: {
  testimonial: (typeof TESTIMONIALS)[0]
  index: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-60px 0px' })

  const borderMap: Record<number, string> = {
    0: 'sm:border-r lg:border-r border-white/10',
    1: 'lg:border-r border-white/10',
    2: '',
    3: 'sm:border-r lg:border-r border-white/10',
    4: 'lg:border-r border-white/10',
    5: '',
  }

  const isLarge = testimonial.size === 'large'

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: index * 0.06, ease: [0.16, 1, 0.3, 1] }}
      className={`group relative flex flex-col justify-between gap-8 border-b border-white/10 p-8 transition-colors duration-300 hover:bg-white/[0.02] sm:p-10 lg:last:border-b-0 ${borderMap[index] ?? ''} ${
        isLarge ? 'lg:col-span-1' : ''
      }`}
    >
      {/* Quote mark */}
      <div
        className="font-bebas select-none leading-none text-[#C8FF00]/10 transition-colors duration-300 group-hover:text-[#C8FF00]/20"
        style={{ fontSize: 'clamp(5rem, 10vw, 8rem)' }}
        aria-hidden="true"
      >
        "
      </div>

      {/* Quote */}
      <blockquote
        className={`font-barlow leading-relaxed text-white ${
          isLarge ? 'text-lg sm:text-xl' : 'text-sm sm:text-base'
        }`}
      >
        {testimonial.quote}
      </blockquote>

      {/* Author + stars */}
      <div className="flex items-center justify-between">
        <div>
          <div className="font-barlow text-sm font-semibold text-white">{testimonial.name}</div>
          <div className="font-barlow text-[10px] uppercase tracking-widest text-zinc-600">
            {testimonial.role}
          </div>
        </div>
        <div className="flex gap-0.5" aria-label="5 out of 5 stars">
          {Array.from({ length: 5 }).map((_, i) => (
            <svg
              key={i}
              className="h-3 w-3 fill-[#C8FF00]/50"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
            </svg>
          ))}
        </div>
      </div>

      {/* Bottom line reveal */}
      <div
        className="absolute bottom-0 left-0 h-[2px] w-0 bg-[#C8FF00] transition-all duration-500 group-hover:w-full"
        aria-hidden="true"
      />
    </motion.div>
  )
}

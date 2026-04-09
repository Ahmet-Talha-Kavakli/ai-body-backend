'use client'

import { motion } from 'framer-motion'
import { StarRating } from '@/components/ui/star-rating'
import { SectionAnimations } from '@/components/landing/section-animations'

const testimonials = [
  {
    quote: "I've tried every fitness app out there. FitAI is the first one that actually adapts to me — not a template.",
    name: 'Sarah K.',
    role: 'Busy mom of two',
    rating: 5,
    initials: 'SK',
  },
  {
    quote: 'Lost 12kg in 4 months. The AI nutrition coach changed everything about how I eat.',
    name: 'Marcus T.',
    role: 'Software engineer',
    rating: 5,
    initials: 'MT',
  },
  {
    quote: 'Form feedback during workouts is insane. Like having a PT in your pocket for 1% of the cost.',
    name: 'Aisha R.',
    role: 'Nurse, amateur runner',
    rating: 5,
    initials: 'AR',
  },
  {
    quote: 'Finally hit my first pull-up after years of trying. The progressive programming just works.',
    name: 'Jake L.',
    role: 'Office worker',
    rating: 5,
    initials: 'JL',
  },
  {
    quote: 'The weekly plan adjustments are scary accurate. It knows when I need a rest day before I do.',
    name: 'Diana M.',
    role: 'Yoga instructor',
    rating: 5,
    initials: 'DM',
  },
  {
    quote: 'Recommended FitAI to my entire team. We do weekly challenges now. Productivity is actually up.',
    name: 'Ravi P.',
    role: 'Startup founder',
    rating: 5,
    initials: 'RP',
  },
]

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.08 },
  }),
}

export function TestimonialsSection() {
  return (
    <SectionAnimations>
      <section className="py-24 lg:py-32 bg-[#080808]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-16"
        >
          <p className="text-primary text-sm font-medium uppercase tracking-widest mb-3">Testimonials</p>
          <h2 className="text-4xl lg:text-5xl font-black text-white">
            Real people.
            <br />
            Real results.
          </h2>
        </motion.div>

        {/* Staggered masonry grid */}
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-5 space-y-5">
          {testimonials.map((t, i) => (
            <motion.div
              key={i}
              custom={i}
              variants={cardVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-40px' }}
              className="break-inside-avoid bg-zinc-900 border border-zinc-800 rounded-2xl p-6 hover:border-zinc-700 transition-colors duration-300"
              data-animate="true"
            >
              <StarRating defaultValue={t.rating} readOnly />
              <p className="text-zinc-300 text-sm leading-relaxed mt-4 mb-5">
                &ldquo;{t.quote}&rdquo;
              </p>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-400">
                  {t.initials}
                </div>
                <div>
                  <p className="text-white text-sm font-medium">{t.name}</p>
                  <p className="text-zinc-500 text-xs">{t.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
        </div>
      </section>
    </SectionAnimations>
  )
}

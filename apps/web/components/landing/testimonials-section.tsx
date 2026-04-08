'use client'

import { motion } from 'framer-motion'
import { StaggerTestimonials } from '@/components/ui/stagger-testimonials'
import { TestimonialSlider } from '@/components/ui/testimonial-slider-1'
import { TransactionCard } from '@/components/ui/transaction-card'
import { StarRating } from '@/components/ui/star-rating'
import { useState } from 'react'

const testimonials = [
  {
    id: 1,
    name: 'Sarah Chen',
    role: 'Fitness Coach',
    text: 'The real-time form corrections have been absolutely transformative. My clients see results faster than ever.',
    rating: 5,
    avatar: 'SC',
  },
  {
    id: 2,
    name: 'Mike Johnson',
    role: 'Professional Athlete',
    text: 'Training with FitAI is like having a championship coach available 24/7. Incredible experience.',
    rating: 5,
    avatar: 'MJ',
  },
  {
    id: 3,
    name: 'Emma Rodriguez',
    role: 'Busy Professional',
    text: 'Perfect for my schedule. Personalized workouts whenever I want, and the app adapts to my progress.',
    rating: 5,
    avatar: 'ER',
  },
]

export function TestimonialsSection() {
  const [activeIdx, setActiveIdx] = useState(0)

  return (
    <section
      id="testimonials"
      className="relative min-h-screen w-full py-24 px-4 bg-background"
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl opacity-20" />
        <div className="absolute bottom-1/4 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl opacity-20" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full mb-4">
            <span className="w-2 h-2 bg-primary rounded-full" />
            <span className="text-sm font-medium text-primary">Testimonials</span>
          </div>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight mb-6">
            Loved by Fitness<br />Professionals & Athletes
          </h2>
        </motion.div>

        {/* Featured Testimonial with Star Rating */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-16 p-8 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 text-center"
        >
          <div className="flex justify-center mb-4">
            <StarRating />
          </div>
          <p className="text-2xl font-bold mb-4 max-w-2xl mx-auto">
            "{testimonials[activeIdx].text}"
          </p>
          <p className="font-bold text-lg">{testimonials[activeIdx].name}</p>
          <p className="text-muted-foreground">{testimonials[activeIdx].role}</p>

          {/* Navigation dots */}
          <div className="flex justify-center gap-2 mt-6">
            {testimonials.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setActiveIdx(idx)}
                className={`w-2 h-2 rounded-full transition-all ${
                  idx === activeIdx ? 'bg-primary w-8' : 'bg-primary/40'
                }`}
              />
            ))}
          </div>
        </motion.div>

        {/* Grid of Testimonials with Cards */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="grid md:grid-cols-3 gap-8 mb-16"
        >
          {testimonials.map((testimonial, idx) => (
            <motion.div
              key={testimonial.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="p-6 rounded-xl bg-card/50 border border-border/30 hover:border-primary/20 transition-colors"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center font-bold text-sm">
                  {testimonial.avatar}
                </div>
                <div>
                  <p className="font-bold text-sm">{testimonial.name}</p>
                  <p className="text-xs text-muted-foreground">{testimonial.role}</p>
                </div>
              </div>
              <div className="flex gap-1 mb-3">
                {Array(testimonial.rating).fill(null).map((_, i) => (
                  <span key={i} className="text-yellow-400">★</span>
                ))}
              </div>
              <p className="text-muted-foreground text-sm italic">"{testimonial.text}"</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Stagger Testimonials Component - Fancy animation */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.5 }}
        >
          <StaggerTestimonials />
        </motion.div>
      </div>
    </section>
  )
}

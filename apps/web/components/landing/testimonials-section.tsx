'use client'

import { motion } from 'framer-motion'

const testimonials = [
  {
    id: 1,
    name: 'Sarah Chen',
    role: 'Fitness Coach',
    text: 'The real-time form corrections have been absolutely transformative. My clients see results faster than ever.',
  },
  {
    id: 2,
    name: 'Mike Johnson',
    role: 'Professional Athlete',
    text: 'Training with FitAI is like having a championship coach available 24/7. Incredible experience.',
  },
  {
    id: 3,
    name: 'Emma Rodriguez',
    role: 'Busy Professional',
    text: 'Perfect for my schedule. Personalized workouts whenever I want, and the app adapts to my progress.',
  },
]

export function TestimonialsSection() {
  return (
    <section
      id="testimonials"
      className="relative min-h-screen w-full py-24 px-4 bg-background"
    >
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

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, idx) => (
            <motion.div
              key={testimonial.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="p-6 rounded-xl bg-card/50 border border-border/30 hover:border-primary/20 transition-colors"
            >
              <p className="text-muted-foreground mb-4 italic">"{testimonial.text}"</p>
              <div>
                <p className="font-bold">{testimonial.name}</p>
                <p className="text-sm text-muted-foreground">{testimonial.role}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

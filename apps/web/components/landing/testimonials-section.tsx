'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Star } from 'lucide-react'

const TESTIMONIALS = [
  {
    name: 'Sarah Chen',
    role: 'Fitness Enthusiast',
    image: '👩‍🦰',
    quote:
      'The real-time form corrections have been a game-changer for my workouts. I finally feel confident with my technique.',
    rating: 5,
  },
  {
    name: 'Mike Johnson',
    role: 'Professional Athlete',
    image: '👨‍🦱',
    quote:
      'Training with FitAI is like having a personal coach in my pocket 24/7. The AI understands my body better than anyone.',
    rating: 5,
  },
  {
    name: 'Emma Rodriguez',
    role: 'Busy Professional',
    image: '👩',
    quote:
      'Perfect for my schedule. I can fit in personalized workouts whenever I have time, and the app adapts to my progress.',
    rating: 5,
  },
]

export function TestimonialsSection() {
  const [current, setCurrent] = useState(0)
  const [direction, setDirection] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setDirection(1)
      setCurrent((prev) => (prev + 1) % TESTIMONIALS.length)
    }, 5000)

    return () => clearInterval(timer)
  }, [])

  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 1000 : -1000,
      opacity: 0,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
    },
    exit: (dir: number) => ({
      zIndex: 0,
      x: dir > 0 ? -1000 : 1000,
      opacity: 0,
    }),
  }

  const paginate = (newDirection: number) => {
    setDirection(newDirection)
    setCurrent(
      (prev) =>
        (prev + newDirection + TESTIMONIALS.length) % TESTIMONIALS.length
    )
  }

  return (
    <section className="py-20 px-4 bg-muted/20">
      <div className="container mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Loved by Athletes
          </h2>
          <p className="text-lg text-muted-foreground">
            Join thousands of people transforming their fitness journey
          </p>
        </motion.div>

        {/* Slider */}
        <div className="max-w-3xl mx-auto relative h-80">
          <AnimatePresence initial={false} custom={direction} mode="wait">
            <motion.div
              key={current}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: 'spring', stiffness: 300, damping: 30 },
                opacity: { duration: 0.2 },
              }}
              className="absolute inset-0 w-full"
            >
              <div className="bg-background border border-border/50 rounded-2xl p-8 h-full flex flex-col justify-between">
                {/* Stars */}
                <div className="flex gap-1">
                  {Array(5)
                    .fill(0)
                    .map((_, i) => (
                      <Star
                        key={i}
                        className="w-5 h-5 text-yellow-400 fill-yellow-400"
                      />
                    ))}
                </div>

                {/* Quote */}
                <p className="text-xl font-semibold text-foreground">
                  "{TESTIMONIALS[current].quote}"
                </p>

                {/* Author */}
                <div className="flex items-center gap-4">
                  <div className="text-4xl">
                    {TESTIMONIALS[current].image}
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">
                      {TESTIMONIALS[current].name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {TESTIMONIALS[current].role}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Controls */}
          <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 flex items-center gap-4">
            <button
              onClick={() => paginate(-1)}
              className="p-2 rounded-lg border border-border hover:bg-accent transition-colors"
              aria-label="Previous testimonial"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div className="flex gap-2">
              {TESTIMONIALS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setDirection(i > current ? 1 : -1)
                    setCurrent(i)
                  }}
                  className={`w-2 h-2 rounded-full transition-all ${
                    i === current ? 'bg-green-500 w-8' : 'bg-muted-foreground'
                  }`}
                  aria-label={`Go to testimonial ${i + 1}`}
                />
              ))}
            </div>

            <button
              onClick={() => paginate(1)}
              className="p-2 rounded-lg border border-border hover:bg-accent transition-colors"
              aria-label="Next testimonial"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}

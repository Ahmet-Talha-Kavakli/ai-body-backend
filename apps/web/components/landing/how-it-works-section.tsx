'use client'

import { motion } from 'framer-motion'
import { BookFlip } from '@/components/ui/book-flip'
import { useState } from 'react'

const STEPS = [
  {
    title: 'Set Up Your Profile',
    description: 'Tell us about your fitness level, goals, and available equipment. Our AI learns your preferences.',
    details: [
      'Answer quick fitness assessment questions',
      'Define your goals (strength, endurance, flexibility)',
      'List available equipment',
    ],
    image: 'https://images.unsplash.com/photo-1566886387580-e4f08f78d7f9?w=500&auto=format&fit=crop&q=60',
  },
  {
    title: 'Start Your AI Workout',
    description: 'Position your camera and begin your personalized workout session guided by our AI trainer.',
    details: [
      'Choose from 100+ personalized workouts',
      'Get real-time form corrections',
      'Receive instant feedback on every rep',
    ],
    image: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=500&auto=format&fit=crop&q=60',
  },
  {
    title: 'Track & Improve',
    description: 'Watch your progress with detailed analytics and AI-powered insights about your performance.',
    details: [
      'See detailed performance metrics',
      'Get weekly progress reports',
      'Receive personalized recommendations',
    ],
    image: 'https://images.unsplash.com/photo-1516321314726-8acf3b289635?w=500&auto=format&fit=crop&q=60',
  },
]

export function HowItWorksSection() {
  const [expandedIdx, setExpandedIdx] = useState(0)

  return (
    <section
      id="how-it-works"
      className="relative min-h-screen w-full py-24 px-4 bg-background"
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl opacity-30" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full mb-4">
            <span className="w-2 h-2 bg-primary rounded-full" />
            <span className="text-sm font-medium text-primary">How It Works</span>
          </div>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight mb-6">
            Three Simple Steps <br />to Transform Your Fitness
          </h2>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
            Get started with FitAI in minutes and begin your fitness transformation
          </p>
        </motion.div>

        {/* Interactive Accordion Steps */}
        <div className="space-y-6 mb-16">
          {STEPS.map((step, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: idx * 0.1 }}
              className="cursor-pointer"
              onClick={() => setExpandedIdx(expandedIdx === idx ? -1 : idx)}
            >
              <div className="border border-border/50 rounded-xl overflow-hidden bg-card/50 backdrop-blur hover:border-primary/30 transition-all">
                <div className="p-8">
                  <div className="flex items-start gap-6">
                    <div className="flex-shrink-0">
                      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/20 text-primary font-bold text-lg">
                        {idx + 1}
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold mb-2">{step.title}</h3>
                      <p className="text-muted-foreground mb-4">{step.description}</p>
                      {expandedIdx === idx && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-6"
                        >
                          <ul className="space-y-2">
                            {step.details.map((detail, i) => (
                              <li
                                key={i}
                                className="flex items-center gap-3 text-sm"
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                                {detail}
                              </li>
                            ))}
                          </ul>
                        </motion.div>
                      )}
                    </div>
                    <div className="hidden lg:block flex-shrink-0">
                      <img
                        src={step.image}
                        alt={step.title}
                        className="w-48 h-48 rounded-lg object-cover"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* BookFlip Component - Additional Interactive Element */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="flex justify-center mt-20"
        >
          <div className="text-center">
            <h3 className="text-2xl font-bold mb-8">Explore FitAI Workouts</h3>
            <BookFlip />
          </div>
        </motion.div>
      </div>
    </section>
  )
}

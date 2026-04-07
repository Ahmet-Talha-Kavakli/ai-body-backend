'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

const STEPS = [
  {
    title: 'Set Up Your Profile',
    description: 'Tell us about your fitness level, goals, and available equipment. Our AI learns your preferences.',
    details: [
      'Answer quick fitness assessment questions',
      'Define your goals (strength, endurance, flexibility)',
      'List available equipment',
    ],
  },
  {
    title: 'Start Your AI Workout',
    description: 'Position your camera and begin your personalized workout session guided by our AI trainer.',
    details: [
      'Choose from 100+ personalized workouts',
      'Get real-time form corrections',
      'Receive instant feedback on every rep',
    ],
  },
  {
    title: 'Track & Improve',
    description: 'Watch your progress with detailed analytics and AI-powered insights about your performance.',
    details: [
      'See detailed performance metrics',
      'Get weekly progress reports',
      'Receive personalized recommendations',
    ],
  },
]

function AccordionItem({ step, index, isOpen, onToggle }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
      className="border border-border/50 rounded-lg overflow-hidden bg-background/40 backdrop-blur"
    >
      <button
        onClick={onToggle}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-accent/50 transition-colors"
      >
        <div className="text-left flex-1">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-3">
            <span className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center text-green-500 font-bold">
              {index + 1}
            </span>
            {step.title}
          </h3>
        </div>
        <ChevronDown
          className={`w-5 h-5 text-muted-foreground transition-transform duration-300 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="border-t border-border/30"
        >
          <div className="px-6 py-4 bg-background/20">
            <p className="text-muted-foreground mb-4">{step.description}</p>
            <ul className="space-y-2">
              {step.details.map((detail) => (
                <li key={detail} className="flex items-start gap-3">
                  <span className="text-green-500 mt-1">✓</span>
                  <span className="text-sm text-foreground">{detail}</span>
                </li>
              ))}
            </ul>
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}

export function HowItWorksSection() {
  const [openIndex, setOpenIndex] = useState(0)

  return (
    <section id="how-it-works" className="py-20 px-4">
      <div className="container mx-auto max-w-3xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            How It Works
          </h2>
          <p className="text-lg text-muted-foreground">
            Get started in three simple steps with our AI-powered fitness platform
          </p>
        </motion.div>

        {/* Accordion */}
        <div className="space-y-3">
          {STEPS.map((step, i) => (
            <AccordionItem
              key={step.title}
              step={step}
              index={i}
              isOpen={openIndex === i}
              onToggle={() => setOpenIndex(openIndex === i ? -1 : i)}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

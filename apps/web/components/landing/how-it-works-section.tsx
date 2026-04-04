'use client'

import { motion } from 'framer-motion'
import { ClipboardList, Dumbbell, TrendingUp } from 'lucide-react'

const steps = [
  {
    number: '01',
    icon: ClipboardList,
    title: 'Complete Your Profile',
    description:
      'Tell us about your fitness goals, health history, injuries, available equipment, and schedule. The more we know, the better your program.',
    color: 'text-primary',
    bg: 'bg-primary/10',
    border: 'border-primary/30',
  },
  {
    number: '02',
    icon: Dumbbell,
    title: 'Train With Your AI Coach',
    description:
      'Follow 3D demonstrations, get real-time form corrections from computer vision, and receive live voice coaching from your AI trainer.',
    color: 'text-blue-400',
    bg: 'bg-blue-400/10',
    border: 'border-blue-400/30',
  },
  {
    number: '03',
    icon: TrendingUp,
    title: 'Adapt & Progress',
    description:
      'Your program automatically evolves based on your performance, recovery data, and progress. The AI adjusts intensity, exercises, and nutrition as you improve.',
    color: 'text-purple-400',
    bg: 'bg-purple-400/10',
    border: 'border-purple-400/30',
  },
]

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="bg-muted/20 py-24">
      <div className="container">
        <motion.div
          className="mb-16 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="mb-4 text-3xl font-bold sm:text-4xl md:text-5xl">
            From setup to gains in{' '}
            <span className="bg-gradient-to-r from-primary to-neon-blue bg-clip-text text-transparent">
              minutes
            </span>
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            No confusing settings or manual configurations. FitAI adapts to you automatically.
          </p>
        </motion.div>

        <div className="relative">
          {/* Connector line */}
          <div className="absolute left-1/2 top-24 hidden h-[calc(100%-6rem)] w-px -translate-x-1/2 bg-gradient-to-b from-primary/50 via-blue-400/50 to-purple-400/50 lg:block" />

          <div className="flex flex-col gap-12 lg:gap-0">
            {steps.map((step, index) => {
              const Icon = step.icon
              const isEven = index % 2 === 1
              return (
                <motion.div
                  key={step.number}
                  className={`relative flex flex-col gap-8 lg:flex-row lg:items-center lg:gap-0 ${
                    isEven ? 'lg:flex-row-reverse' : ''
                  }`}
                  initial={{ opacity: 0, x: isEven ? 40 : -40 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6 }}
                >
                  {/* Content */}
                  <div className={`flex-1 ${isEven ? 'lg:pl-20 lg:text-left' : 'lg:pr-20 lg:text-right'}`}>
                    <div
                      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium ${step.bg} ${step.color} mb-4`}
                    >
                      Step {step.number}
                    </div>
                    <h3 className="mb-3 text-2xl font-bold">{step.title}</h3>
                    <p className="text-muted-foreground">{step.description}</p>
                  </div>

                  {/* Center icon */}
                  <div className="relative flex shrink-0 items-center justify-center lg:w-16">
                    <div
                      className={`flex h-16 w-16 items-center justify-center rounded-full border-2 ${step.border} ${step.bg} z-10`}
                    >
                      <Icon className={`h-7 w-7 ${step.color}`} />
                    </div>
                  </div>

                  {/* Empty spacer for opposite side */}
                  <div className="hidden flex-1 lg:block" />
                </motion.div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}

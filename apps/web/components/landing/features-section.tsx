'use client'

import { motion } from 'framer-motion'
import {
  Brain,
  Camera,
  Activity,
  Apple,
  Watch,
  Dumbbell,
  TrendingUp,
  Shield,
} from 'lucide-react'

const features = [
  {
    icon: Camera,
    title: 'Real-Time Form Analysis',
    description:
      'Computer vision analyzes every movement at 30fps. Get instant corrections on your posture, range of motion, and tempo.',
    color: 'text-blue-400',
    bg: 'bg-blue-400/10',
  },
  {
    icon: Brain,
    title: 'AI Personalized Programs',
    description:
      'Claude AI builds a unique program based on your goals, fitness level, injuries, and available equipment. Updates weekly.',
    color: 'text-purple-400',
    bg: 'bg-purple-400/10',
  },
  {
    icon: Dumbbell,
    title: '3D Trainer Sessions',
    description:
      'Your AI trainer demonstrates every exercise in 3D before you do it. Side-by-side comparison keeps you on track.',
    color: 'text-green-400',
    bg: 'bg-green-400/10',
  },
  {
    icon: Apple,
    title: 'Smart Nutrition Tracking',
    description:
      'Snap a photo of your meal for instant macro analysis. AI adjusts your nutrition plan based on your training load.',
    color: 'text-orange-400',
    bg: 'bg-orange-400/10',
  },
  {
    icon: Activity,
    title: 'Heart Rate & Recovery',
    description:
      'Monitor your heart rate zones in real time. AI optimizes rest periods and workout intensity based on your recovery.',
    color: 'text-red-400',
    bg: 'bg-red-400/10',
  },
  {
    icon: Watch,
    title: 'Wearable Integration',
    description:
      'Sync with Apple Watch, Garmin, Fitbit, and Google Fit. All your health data in one place, powering smarter workouts.',
    color: 'text-cyan-400',
    bg: 'bg-cyan-400/10',
  },
  {
    icon: Shield,
    title: 'Injury-Aware Training',
    description:
      'Tell us about your injuries and limitations. AI automatically avoids aggravating movements and suggests alternatives.',
    color: 'text-yellow-400',
    bg: 'bg-yellow-400/10',
  },
  {
    icon: TrendingUp,
    title: 'Progress Analytics',
    description:
      'Detailed progress tracking across strength, endurance, form, and body composition. See exactly how far you\'ve come.',
    color: 'text-pink-400',
    bg: 'bg-pink-400/10',
  },
]

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
}

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
}

export function FeaturesSection() {
  return (
    <section id="features" className="py-24">
      <div className="container">
        {/* Header */}
        <motion.div
          className="mb-16 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="mb-4 text-3xl font-bold sm:text-4xl md:text-5xl">
            Everything you need to{' '}
            <span className="bg-gradient-to-r from-primary to-neon-blue bg-clip-text text-transparent">
              train like a pro
            </span>
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Powered by the latest AI technology, FitAI brings professional-grade training to
            everyone — no gym membership required.
          </p>
        </motion.div>

        {/* Feature grid */}
        <motion.div
          className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {features.map((feature) => {
            const Icon = feature.icon
            return (
              <motion.div
                key={feature.title}
                variants={cardVariants}
                className="group rounded-xl border border-border/50 bg-card p-6 transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
              >
                <div
                  className={`mb-4 flex h-10 w-10 items-center justify-center rounded-lg ${feature.bg}`}
                >
                  <Icon className={`h-5 w-5 ${feature.color}`} />
                </div>
                <h3 className="mb-2 font-semibold">{feature.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {feature.description}
                </p>
              </motion.div>
            )
          })}
        </motion.div>
      </div>
    </section>
  )
}

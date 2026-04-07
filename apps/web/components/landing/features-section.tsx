'use client'

import { motion } from 'framer-motion'
import { useRef, useState } from 'react'
import { Brain, Zap, Heart, Target, Smartphone, BarChart3 } from 'lucide-react'

const FEATURES = [
  {
    icon: Brain,
    title: 'AI-Powered Analysis',
    description: 'Real-time form analysis with advanced computer vision technology',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    icon: Zap,
    title: 'Instant Feedback',
    description: 'Get immediate corrections and guidance during your workouts',
    color: 'from-yellow-500 to-orange-500',
  },
  {
    icon: Heart,
    title: 'Smart Coaching',
    description: 'Personalized guidance tailored to your fitness level and goals',
    color: 'from-pink-500 to-rose-500',
  },
  {
    icon: Target,
    title: 'Progress Tracking',
    description: 'Detailed analytics and insights about your training progress',
    color: 'from-green-500 to-emerald-500',
  },
  {
    icon: Smartphone,
    title: 'Mobile Friendly',
    description: 'Train anywhere with our fully responsive mobile app',
    color: 'from-purple-500 to-pink-500',
  },
  {
    icon: BarChart3,
    title: 'Advanced Metrics',
    description: 'Track multiple metrics including form accuracy and performance',
    color: 'from-indigo-500 to-blue-500',
  },
]

function FeatureCard({ feature, index }: any) {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const cardRef = useRef<HTMLDivElement>(null)

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!cardRef.current) return

    const rect = cardRef.current.getBoundingClientRect()
    setMousePosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    })
  }

  const Icon = feature.icon

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
      className="relative group"
    >
      <div
        className="absolute inset-0 rounded-xl transition-opacity duration-300 opacity-0 group-hover:opacity-100"
        style={{
          background: `radial-gradient(600px at ${mousePosition.x}px ${mousePosition.y}px, rgba(34, 197, 94, 0.2), transparent 80%)`,
        }}
      />

      <div className="relative p-6 rounded-xl border border-border/50 bg-background/40 backdrop-blur hover:border-green-500/30 transition-all duration-300 h-full">
        <motion.div
          className={`w-12 h-12 rounded-lg bg-gradient-to-br ${feature.color} p-0.5 mb-4 shadow-lg`}
          whileHover={{ scale: 1.1, rotate: 5 }}
        >
          <div className="w-full h-full rounded-lg bg-background flex items-center justify-center">
            <Icon className="w-6 h-6 text-white" />
          </div>
        </motion.div>

        <h3 className="text-lg font-semibold text-foreground mb-2">
          {feature.title}
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {feature.description}
        </p>

        <div className="mt-4 pt-4 border-t border-border/30 flex items-center text-sm text-green-500 group-hover:text-green-400 transition-colors">
          <span>Learn more</span>
          <svg
            className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </motion.div>
  )
}

export function FeaturesSection() {
  return (
    <section id="features" className="py-20 px-4">
      <div className="container mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Powerful Features
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Everything you need to transform your fitness journey with AI-powered coaching
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((feature, i) => (
            <FeatureCard key={feature.title} feature={feature} index={i} />
          ))}
        </div>
      </div>
    </section>
  )
}

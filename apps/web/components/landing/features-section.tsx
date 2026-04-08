'use client'

import { motion } from 'framer-motion'
import { GlowCard } from '@/components/ui/spotlight-card'
import { ProgressiveBlur } from '@/components/ui/progressive-blur'
import { RevealImageList } from '@/components/ui/reveal-images'
import { Sparkles, Zap, Target } from 'lucide-react'

const features = [
  {
    icon: <Zap className="w-8 h-8" />,
    number: '98%',
    label: 'Form Accuracy',
    description: 'AI-powered real-time form analysis',
    color: 'from-blue-400 to-cyan-400',
  },
  {
    icon: <Sparkles className="w-8 h-8" />,
    number: '24/7',
    label: 'AI Coaching',
    description: 'Always-on personalized guidance',
    color: 'from-purple-400 to-pink-400',
  },
  {
    icon: <Target className="w-8 h-8" />,
    number: '100%',
    label: 'Customizable',
    description: 'Tailored to your specific goals',
    color: 'from-orange-400 to-red-400',
  },
]

const imageData = [
  { src: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=500&auto=format&fit=crop&q=60', alt: 'AI Form Analysis' },
  { src: 'https://images.unsplash.com/photo-1517836357463-d25ddfcbf042?w=500&auto=format&fit=crop&q=60', alt: 'Personal Training' },
  { src: 'https://images.unsplash.com/photo-1566886387580-e4f08f78d7f9?w=500&auto=format&fit=crop&q=60', alt: 'Workout Tracking' },
]

export function FeaturesSection() {
  return (
    <section
      id="features"
      className="relative min-h-screen w-full py-24 px-4 bg-background"
    >
      {/* Progressive Blur Background */}
      <div className="absolute inset-0 opacity-20">
        <ProgressiveBlur angle={45} colors={['#3b82f6', '#8b5cf6', '#ec4899']} />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto">
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
            <span className="text-sm font-medium text-primary">Features</span>
          </div>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight mb-6">
            Everything You Need<br />to Transform Your Fitness
          </h2>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
            Cutting-edge technology meets personalized coaching
          </p>
        </motion.div>

        {/* Feature Cards Grid - Glow Effect */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16"
        >
          {features.map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: idx * 0.1 }}
            >
              <GlowCard className="h-full">
                <div className={`inline-block p-3 rounded-lg bg-gradient-to-br ${item.color} mb-4`}>
                  <div className="text-white">{item.icon}</div>
                </div>
                <div className="text-4xl sm:text-5xl font-black text-primary mb-2">
                  {item.number}
                </div>
                <h3 className="text-xl font-bold mb-2">{item.label}</h3>
                <p className="text-muted-foreground">{item.description}</p>
              </GlowCard>
            </motion.div>
          ))}
        </motion.div>

      </div>
    </section>
  )
}

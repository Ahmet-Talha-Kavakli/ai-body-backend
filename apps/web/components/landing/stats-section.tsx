'use client'

import { motion } from 'framer-motion'
import { CommitsGrid } from '@/components/ui/commits-grid'
import { ParticleTextEffect } from '@/components/ui/particle-text-effect'
import { ParticleCanvas } from '@/components/ui/particle-canvas'
import { ScrollDownIndicator } from '@/components/ui/scroll-down-indicator'
import { AnimatedDots } from '@/components/ui/animated-dots'

export function StatsSection() {
  const stats = [
    { label: 'Active Users', value: '100K+' },
    { label: 'Form Accuracy', value: '98%' },
    { label: 'Workouts Completed', value: '5M+' },
    { label: 'Avg. Improvement', value: '35%' },
  ]

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: 'easeOut' },
    },
  }

  return (
    <section className="relative w-full py-24 px-4 bg-background">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl opacity-30" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl opacity-20" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="space-y-16"
        >
          {/* Header */}
          <motion.div variants={itemVariants} className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full mb-4">
              <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
              <span className="text-sm font-medium text-primary">Our Impact</span>
            </div>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight mb-6">
              Trusted by the Fitness <br />Community Worldwide
            </h2>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
              Real results from real users transforming their fitness journey
            </p>
          </motion.div>

          {/* Stats Grid */}
          <motion.div
            variants={itemVariants}
            className="grid grid-cols-2 md:grid-cols-4 gap-6"
          >
            {stats.map((stat, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="p-6 rounded-xl bg-card/50 border border-border/50 text-center hover:border-primary/30 transition-colors"
              >
                <div className="text-3xl sm:text-4xl font-black text-primary mb-2">
                  {stat.value}
                </div>
                <p className="text-sm sm:text-base text-muted-foreground">
                  {stat.label}
                </p>
              </motion.div>
            ))}
          </motion.div>

          {/* Commits Grid - "FITAI" visualization */}
          <motion.div variants={itemVariants} className="flex justify-center py-8">
            <CommitsGrid text="FITAI" />
          </motion.div>

          {/* Particle Canvas */}
          <motion.div
            variants={itemVariants}
            className="flex justify-center items-center min-h-[300px] bg-card/30 rounded-2xl border border-border/30 backdrop-blur overflow-hidden"
          >
            <div className="w-full h-full">
              <ParticleCanvas colors={['#3b82f6', '#8b5cf6', '#ec4899']} />
            </div>
          </motion.div>

          {/* Particle Text Effect */}
          <motion.div
            variants={itemVariants}
            className="flex justify-center items-center min-h-[300px] bg-card/30 rounded-2xl border border-border/30 backdrop-blur"
          >
            <div>
              <ParticleTextEffect text="AI-POWERED FITNESS" />
            </div>
          </motion.div>

          {/* Animated Dots */}
          <motion.div
            variants={itemVariants}
            className="flex justify-center items-center gap-6"
          >
            <AnimatedDots />
          </motion.div>

          {/* Scroll Down Indicator */}
          <motion.div
            variants={itemVariants}
            className="flex justify-center"
          >
            <ScrollDownIndicator />
          </motion.div>

          {/* Additional Feature Highlights */}
          <motion.div
            variants={itemVariants}
            className="grid md:grid-cols-3 gap-8"
          >
            {[
              {
                icon: '🎯',
                title: 'Precision Coaching',
                description:
                  'Real-time form analysis using cutting-edge computer vision AI',
              },
              {
                icon: '📊',
                title: 'Smart Analytics',
                description:
                  'Detailed insights and personalized recommendations for progress',
              },
              {
                icon: '⚡',
                title: 'Lightning Fast',
                description:
                  'Instant feedback to keep you in the zone during workouts',
              },
            ].map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: idx * 0.1 }}
                className="p-6 rounded-xl bg-background border border-border/30 hover:border-primary/20 transition-colors"
              >
                <div className="text-4xl mb-3">{feature.icon}</div>
                <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}

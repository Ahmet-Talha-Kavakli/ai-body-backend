'use client'

import { motion } from 'framer-motion'
import { GlowCard } from '@/components/ui/spotlight-card'
import { BackgroundPaths } from '@/components/ui/background-paths'
import { SectionAnimations } from '@/components/landing/section-animations'

const features = [
  {
    number: '01',
    title: 'AI Program Generation',
    description:
      'Answer a few questions and get a fully personalized workout program in seconds. Adapts weekly based on your progress and feedback.',
    tag: 'Core',
    featured: false,
  },
  {
    number: '02',
    title: 'Real-time Form Analysis',
    description:
      'Your phone camera becomes your coach. Get instant feedback on your form during workouts to maximize gains and prevent injury.',
    tag: 'Pro',
    featured: true,
  },
  {
    number: '03',
    title: 'Nutrition Tracking',
    description:
      'Log meals with a photo, get macro breakdowns, and receive AI-powered nutrition advice aligned with your fitness goals.',
    tag: 'Core',
    featured: false,
  },
  {
    number: '04',
    title: 'Progress Analytics',
    description:
      'Visualize your transformation over time. Track strength gains, body composition, and habit consistency with beautiful charts.',
    tag: 'Core',
    featured: false,
  },
]

export function FeaturesSection() {
  return (
    <SectionAnimations>
      <section id="features" className="relative py-24 lg:py-32 bg-[#080808] overflow-hidden">
        {/* Background paths texture */}
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <BackgroundPaths title="" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-20"
        >
          <p className="text-primary text-sm font-medium uppercase tracking-widest mb-3">Features</p>
          <h2 className="text-4xl lg:text-5xl font-black text-white max-w-lg leading-tight">
            Everything you need to transform your body
          </h2>
        </motion.div>

        {/* Features list */}
        <div className="space-y-16 lg:space-y-24">
          {features.map((feature, i) => (
            <motion.div
              key={feature.number}
              initial={{ opacity: 0, x: i % 2 === 0 ? -40 : 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              data-animate="true"
            >
              {feature.featured ? (
                <GlowCard
                  glowColor="green"
                  customSize
                  className="w-full !h-auto p-10 lg:p-14"
                >
                  <div className="flex flex-col lg:flex-row lg:items-end gap-8">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-4">
                        <span className="text-6xl lg:text-8xl font-black text-white/10 leading-none select-none">
                          {feature.number}
                        </span>
                        <span className="px-2 py-1 rounded text-xs font-medium bg-primary/20 text-primary border border-primary/30">
                          {feature.tag}
                        </span>
                      </div>
                      <h3 className="text-3xl lg:text-4xl font-black text-white mb-4">
                        {feature.title}
                      </h3>
                      <p className="text-zinc-400 text-lg leading-relaxed max-w-xl">
                        {feature.description}
                      </p>
                    </div>
                    <div className="text-primary/30 text-[120px] font-black leading-none select-none hidden lg:block">
                      ↗
                    </div>
                  </div>
                </GlowCard>
              ) : (
                <div
                  className={`flex flex-col ${
                    i % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'
                  } items-start gap-8 lg:gap-16`}
                >
                  <div className="flex-shrink-0">
                    <span className="text-7xl lg:text-9xl font-black text-white/5 leading-none select-none">
                      {feature.number}
                    </span>
                  </div>
                  <div className="flex-1 pt-2">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-2xl lg:text-3xl font-black text-white">{feature.title}</h3>
                      <span className="px-2 py-1 rounded text-xs font-medium bg-zinc-800 text-zinc-400 border border-zinc-700">
                        {feature.tag}
                      </span>
                    </div>
                    <p className="text-zinc-400 text-lg leading-relaxed max-w-lg">
                      {feature.description}
                    </p>
                    <div className="mt-6 h-px w-24 bg-gradient-to-r from-primary/50 to-transparent" />
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
    </SectionAnimations>
  )
}

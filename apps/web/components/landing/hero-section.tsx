'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { GradientHoverButton } from '@/components/ui/gradient-hover-button'
import { ParticleTextEffect } from '@/components/ui/particle-text-effect'
import { ScrollDownIndicator } from '@/components/ui/scroll-down-indicator'
import { TextReveal } from '@/components/landing/text-reveal'

const socialProofAvatars = ['JK', 'AM', 'SR', 'TL', 'DM']

export function HeroSection() {
  return (
    <section className="relative min-h-screen w-full overflow-hidden bg-[#080808] flex flex-col">
      {/* Subtle grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '80px 80px',
        }}
      />

      {/* Single focused glow — top center */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-primary/8 blur-[120px] pointer-events-none" />

      {/* Particle text canvas — background layer */}
      <div className="absolute inset-0 pointer-events-none opacity-60">
        <ParticleTextEffect words={['FITAI', 'AI TRAINER', 'YOUR COACH', 'GET FIT']} />
      </div>

      {/* Main content */}
      <div className="relative z-10 flex-1 flex items-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16 w-full">
          <div className="max-w-3xl">
            {/* Eyebrow label */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/10 text-primary text-xs font-medium mb-6"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              Powered by AI — Personalized for You
            </motion.div>

            {/* Headline */}
            <div className="mb-6">
              <TextReveal
                text="Your AI Personal Trainer"
                variant="h1"
                accentWords={['AI', 'Personal']}
                className="text-white leading-[1.05]"
              />
            </div>

            {/* Subheadline */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.35 }}
              className="text-lg text-zinc-400 max-w-md leading-relaxed mb-10"
            >
              AI-generated workout programs, real-time form feedback, and nutrition tracking — all in one place.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="flex flex-wrap items-center gap-4 mb-12"
            >
              <GradientHoverButton href="/sign-up">
                Start Free Trial
              </GradientHoverButton>
              <Link
                href="#how-it-works"
                className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors text-sm font-medium"
              >
                <span className="w-8 h-8 rounded-full border border-zinc-700 flex items-center justify-center">
                  <svg width="10" height="12" viewBox="0 0 10 12" fill="currentColor">
                    <path d="M8.5 6L2 2v8l6.5-4z" />
                  </svg>
                </span>
                Watch Demo
              </Link>
            </motion.div>

            {/* Social proof */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.7 }}
              className="flex items-center gap-3"
            >
              <div className="flex -space-x-2">
                {socialProofAvatars.map((initials, i) => (
                  <div
                    key={i}
                    className="w-8 h-8 rounded-full bg-zinc-700 border-2 border-[#080808] flex items-center justify-center text-[10px] font-bold text-zinc-300"
                  >
                    {initials}
                  </div>
                ))}
              </div>
              <div>
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-3 h-3 fill-yellow-400" viewBox="0 0 24 24">
                      <path d="M12,17.27L18.18,21L16.54,13.97L22,9.24L14.81,8.62L12,2L9.19,8.62L2,9.24L7.45,13.97L5.82,21L12,17.27Z" />
                    </svg>
                  ))}
                </div>
                <p className="text-xs text-zinc-500 mt-0.5">10,000+ active users</p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="relative z-10 flex justify-center pb-8"
      >
        <ScrollDownIndicator />
      </motion.div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#080808] to-transparent pointer-events-none" />
    </section>
  )
}

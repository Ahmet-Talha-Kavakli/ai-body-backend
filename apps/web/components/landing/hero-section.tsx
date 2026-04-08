'use client'

import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { ChevronDown } from 'lucide-react'
import Link from 'next/link'
import { ContainerScroll } from '@/components/ui/container-scroll-animation'
import { GlobePulse } from '@/components/ui/cobe-globe-pulse'
import { GooeyText } from '@/components/ui/gooey-text-morphing'
import { ScrollMorphHero } from '@/components/ui/scroll-morph-hero'
import { WarpBackground } from '@/components/ui/warp-background'
import { AnimatedShaderHero } from '@/components/ui/animated-shader-hero'

export function HeroSection() {
  const morphingWords = ['Stronger', 'Faster', 'Smarter', 'Better']

  return (
    <section className="relative min-h-screen w-full overflow-hidden bg-background flex items-center justify-center">
      {/* Warp Background Effect */}
      <div className="absolute inset-0">
        <WarpBackground />
      </div>

      {/* Animated Shader Background */}
      <div className="absolute inset-0 opacity-30">
        <AnimatedShaderHero />
      </div>

      {/* Glowing blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-primary/10 rounded-full blur-3xl opacity-30" />
        <div className="absolute bottom-1/2 right-0 w-80 h-80 bg-primary/10 rounded-full blur-3xl opacity-20" />
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 py-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-6"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full">
            <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
            <span className="text-sm font-medium text-primary">
              Powered by Advanced AI
            </span>
          </div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight mb-6"
        >
          Your AI Personal <br />
          <span className="text-primary inline-block">
            <GooeyText words={morphingWords} />
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-8"
        >
          Experience the future of fitness with real-time form analysis, AI-powered coaching, and personalized workout plans tailored to your goals.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-4 justify-center mb-12"
        >
          <Link href="/sign-up">
            <Button size="lg" className="text-base">
              Get Started Free
            </Button>
          </Link>
          <Link href="#features">
            <Button size="lg" variant="outline">
              Learn More
            </Button>
          </Link>
        </motion.div>

        {/* Globe Pulse - Interactive Globe */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="mb-12 flex justify-center"
        >
          <div className="w-80 h-80">
            <GlobePulse />
          </div>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="grid grid-cols-3 gap-8 max-w-2xl mx-auto mb-12"
        >
          <div>
            <div className="text-3xl font-bold text-primary">100K+</div>
            <p className="text-sm text-muted-foreground">Active Users</p>
          </div>
          <div>
            <div className="text-3xl font-bold text-primary">98%</div>
            <p className="text-sm text-muted-foreground">Form Accuracy</p>
          </div>
          <div>
            <div className="text-3xl font-bold text-primary">24/7</div>
            <p className="text-sm text-muted-foreground">AI Coach</p>
          </div>
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <ChevronDown className="w-6 h-6 text-primary/50" />
        </motion.div>
      </div>
    </section>
  )
}

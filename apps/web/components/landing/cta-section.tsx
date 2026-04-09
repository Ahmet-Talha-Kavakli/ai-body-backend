'use client'

import { motion } from 'framer-motion'
import { WarpBackground } from '@/components/ui/warp-background'
import { GradientHoverButton } from '@/components/ui/gradient-hover-button'

export function CtaSection() {
  return (
    <section className="py-24 lg:py-32 bg-[#080808]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <WarpBackground className="rounded-3xl overflow-hidden">
          <div className="relative z-10 flex flex-col items-center justify-center py-24 px-8 text-center">
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-primary text-sm font-medium uppercase tracking-widest mb-4"
            >
              Ready?
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-4xl lg:text-6xl font-black text-white mb-10 leading-tight"
            >
              Start training smarter today.
            </motion.h2>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <GradientHoverButton href="/sign-up">Get Started Free</GradientHoverButton>
            </motion.div>
          </div>
        </WarpBackground>
      </div>
    </section>
  )
}

'use client'

import { motion } from 'framer-motion'
import { Container } from '@/components/ui/Container'
import { Badge } from '@/components/ui/Badge'
import { Sparkles } from 'lucide-react'

const EASE = [0.16, 1, 0.3, 1] as const

export function PricingHero() {
  return (
    <section className="relative overflow-hidden pb-16 pt-40 sm:pb-20 sm:pt-48">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-0 h-[600px] w-[1000px] -translate-x-1/2 bg-gradient-to-b from-accent/20 via-accent-bright/5 to-transparent opacity-60 blur-3xl" />
      </div>

      <Container size="md">
        <div className="flex flex-col items-center text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE }}
          >
            <Badge>
              <Sparkles className="h-3.5 w-3.5 text-accent" />
              <span>Basit ve adil</span>
            </Badge>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: EASE, delay: 0.1 }}
            className="mt-8 text-balance text-[44px] font-bold leading-[1.02] tracking-tightest sm:text-[64px]"
          >
            İlişki kurmanın bedeli <span className="gradient-text">çok değil.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: EASE, delay: 0.2 }}
            className="mt-7 max-w-2xl text-pretty text-[17px] leading-relaxed text-ink-muted sm:text-[19px]"
          >
            Free ile başla, hazır olduğunda büyü. İstediğin zaman iptal et, soru sormayız.
          </motion.p>
        </div>
      </Container>
    </section>
  )
}

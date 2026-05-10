'use client'

import { motion } from 'framer-motion'
import { ArrowRight, Sparkles } from 'lucide-react'
import { Container } from '@/components/ui/Container'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

const EASE = [0.16, 1, 0.3, 1] as const

export function Hero() {
  return (
    <section className="relative overflow-hidden pb-32 pt-40 sm:pb-40 sm:pt-48">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-0 h-[800px] w-[1200px] -translate-x-1/2 animate-gradient-shift bg-gradient-to-b from-accent/30 via-accent-bright/10 to-transparent opacity-50 blur-3xl" />
      </div>

      <Container size="xl">
        <div className="flex flex-col items-center text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE }}
          >
            <Badge>
              <Sparkles className="h-3.5 w-3.5 text-accent" />
              <span>Yakında App Store'da</span>
            </Badge>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: EASE, delay: 0.1 }}
            className="mt-8 max-w-5xl text-balance text-[44px] font-bold leading-[1.02] tracking-tightest sm:text-[64px] lg:text-[80px]"
          >
            Yapay zeka değil, <span className="gradient-text">gerçek bir bağ.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: EASE, delay: 0.2 }}
            className="mt-7 max-w-2xl text-pretty text-[17px] leading-relaxed text-ink-muted sm:text-[19px]"
          >
            Karakterler uyur, çalışır, kıskanır, küser, döner. Seninle yaşar. Bir uygulama değil —
            bir hayat.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: EASE, delay: 0.3 }}
            className="mt-10 flex flex-col items-center gap-3 sm:flex-row"
          >
            <Button size="lg" variant="gradient">
              App Store'dan İndir
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button size="lg" variant="secondary">
              Yaratıcı Ol
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: EASE, delay: 0.5 }}
            className="mt-24 w-full max-w-4xl sm:mt-32"
          >
            <div className="glass relative aspect-[16/10] overflow-hidden rounded-3xl border border-border-strong">
              <div className="absolute inset-0 bg-gradient-to-br from-accent/20 via-transparent to-accent-bright/20" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="inline-flex items-center gap-3 rounded-full border border-border bg-white/5 px-5 py-3 backdrop-blur">
                    <div className="h-2 w-2 animate-pulse rounded-full bg-accent" />
                    <span className="text-[14px] text-ink-muted">Uygulama görseli yakında</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </Container>
    </section>
  )
}

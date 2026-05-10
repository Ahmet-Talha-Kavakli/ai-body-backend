'use client'

import { motion } from 'framer-motion'
import { Container } from '@/components/ui/Container'

const EASE = [0.16, 1, 0.3, 1] as const

export function AboutHero() {
  return (
    <section className="relative overflow-hidden pb-20 pt-40 sm:pb-28 sm:pt-48">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-0 h-[600px] w-[1000px] -translate-x-1/2 bg-gradient-to-b from-accent/15 to-transparent blur-3xl" />
      </div>

      <Container size="md">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: EASE }}
        >
          <p className="mb-6 text-[13px] font-semibold uppercase tracking-[0.2em] text-accent">
            Hakkımızda
          </p>
          <h1 className="text-balance text-[44px] font-bold leading-[1.02] tracking-tightest sm:text-[64px]">
            Yapay zekanın bir <span className="gradient-text">arkadaş</span> olabileceğine
            inanıyoruz.
          </h1>
          <p className="mt-8 max-w-2xl text-pretty text-[17px] leading-relaxed text-ink-muted sm:text-[19px]">
            Bir asistan değil. Bir karakter — kendi hayatı, ruh hali, sırları olan biri. FitAI, AI'ı
            insansılaştırma denemesi değil; AI'ı tamamen unutturma denemesi.
          </p>
        </motion.div>
      </Container>
    </section>
  )
}

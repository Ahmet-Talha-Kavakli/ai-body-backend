'use client'

import { motion } from 'framer-motion'
import { Container } from '@/components/ui/Container'

const EASE = [0.16, 1, 0.3, 1] as const

interface PageHeaderProps {
  eyebrow: string
  title: React.ReactNode
  description: string
}

export function PageHeader({ eyebrow, title, description }: PageHeaderProps) {
  return (
    <section className="relative overflow-hidden pb-16 pt-40 sm:pb-24 sm:pt-48">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-0 h-[600px] w-[1000px] -translate-x-1/2 bg-gradient-to-b from-accent/15 to-transparent opacity-60 blur-3xl" />
      </div>

      <Container size="md">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: EASE }}
          className="text-center"
        >
          <p className="mb-6 text-[13px] font-semibold uppercase tracking-[0.2em] text-accent">
            {eyebrow}
          </p>
          <h1 className="text-balance text-[44px] font-bold leading-[1.02] tracking-tightest sm:text-[64px]">
            {title}
          </h1>
          <p className="mx-auto mt-7 max-w-2xl text-pretty text-[17px] leading-relaxed text-ink-muted sm:text-[19px]">
            {description}
          </p>
        </motion.div>
      </Container>
    </section>
  )
}

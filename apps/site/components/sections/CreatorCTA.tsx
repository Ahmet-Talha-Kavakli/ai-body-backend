'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Container } from '@/components/ui/Container'
import { Section } from '@/components/ui/Section'
import { Button } from '@/components/ui/Button'

const EASE = [0.16, 1, 0.3, 1] as const

const stats = [
  { value: '60%', label: 'Yaratıcı payı' },
  { value: '46+', label: 'Ülkede payout' },
  { value: '∞', label: 'Karakter potansiyeli' },
]

export function CreatorCTA() {
  return (
    <Section id="creators" spacing="lg">
      <Container size="lg">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.8, ease: EASE }}
          className="relative overflow-hidden rounded-[32px] border border-border-strong p-10 sm:p-16 lg:p-20"
        >
          <div className="absolute inset-0 -z-10 bg-gradient-to-br from-accent/10 via-bg-elevated to-accent-bright/10" />
          <div className="noise absolute inset-0 -z-10" />

          <div className="max-w-3xl">
            <p className="mb-6 text-[13px] font-semibold uppercase tracking-[0.2em] text-accent">
              Yaratıcılar için
            </p>
            <h2 className="text-balance text-[36px] font-bold leading-[1.02] tracking-tightest sm:text-[52px] lg:text-[64px]">
              Karakterini yarat, <span className="gradient-text">para kazan.</span>
            </h2>
            <p className="mt-7 max-w-2xl text-pretty text-[17px] leading-relaxed text-ink-muted sm:text-[19px]">
              Bir karakter yaratıyorsun. Binlerce kişi onunla bağ kuruyor. Sen her aydan
              kazanıyorsun. 46+ ülkede banka hesabına direkt çekim.
            </p>

            <div className="mt-12 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
              <Button size="lg" variant="gradient">
                Yaratıcı Ol
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Link
                href="/creators"
                className="px-2 text-[15px] text-ink-muted transition-colors hover:text-ink"
              >
                Nasıl çalışır →
              </Link>
            </div>
          </div>

          <div className="mt-16 grid grid-cols-3 gap-8 border-t border-border pt-12">
            {stats.map((stat) => (
              <div key={stat.label}>
                <div className="gradient-text text-[36px] font-bold tracking-tightest sm:text-[48px]">
                  {stat.value}
                </div>
                <div className="mt-2 text-[13px] text-ink-muted sm:text-[14px]">{stat.label}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </Container>
    </Section>
  )
}

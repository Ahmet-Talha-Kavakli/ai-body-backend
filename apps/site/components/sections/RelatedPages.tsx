'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { Container } from '@/components/ui/Container'
import { Section } from '@/components/ui/Section'

const EASE = [0.16, 1, 0.3, 1] as const

interface Related {
  title: string
  href: string
  description: string
}

interface RelatedPagesProps {
  current: string
}

const allPages: Related[] = [
  {
    title: 'Özellikler',
    href: '/features',
    description: 'Hafıza, duygu, sosyal grafik. Karakteri biri yapan her şey.',
  },
  {
    title: 'Karakterler',
    href: '/characters',
    description: 'Mia, Kerem, Selin, Ayşe — ve yaratıcılarımızın gelenler.',
  },
  {
    title: 'Yaratıcılar',
    href: '/creators',
    description: 'Karakterini yarat, %60 pay al. 46+ ülkede payout.',
  },
  {
    title: 'Fiyatlandırma',
    href: '/pricing',
    description: 'Free ve Premium. Krediler süresiz.',
  },
  {
    title: 'Sıkça Sorulanlar',
    href: '/faq',
    description: 'Aklında dolaşan soruların cevabı.',
  },
]

export function RelatedPages({ current }: RelatedPagesProps) {
  const items = allPages.filter((p) => p.href !== current).slice(0, 3)

  return (
    <Section spacing="md" className="border-t border-border">
      <Container size="lg">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6, ease: EASE }}
          className="mb-12 text-[28px] font-bold tracking-tightest sm:text-[36px]"
        >
          Devam et.
        </motion.h2>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {items.map((item, idx) => (
            <motion.div
              key={item.href}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.6, ease: EASE, delay: idx * 0.06 }}
            >
              <Link
                href={item.href}
                className="group block h-full rounded-2xl border border-border bg-bg-elevated p-7 transition-all duration-300 hover:border-border-strong hover:bg-bg-subtle"
              >
                <h3 className="mb-3 flex items-center gap-2 text-[19px] font-semibold tracking-tight transition-colors group-hover:text-accent">
                  {item.title}
                  <ArrowRight className="h-4 w-4 -translate-x-2 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" />
                </h3>
                <p className="text-pretty text-[14px] leading-relaxed text-ink-muted">
                  {item.description}
                </p>
              </Link>
            </motion.div>
          ))}
        </div>
      </Container>
    </Section>
  )
}

'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, Sparkles, Users, Wand2, Tag, HelpCircle } from 'lucide-react'
import { Container } from '@/components/ui/Container'
import { Section } from '@/components/ui/Section'

const EASE = [0.16, 1, 0.3, 1] as const

const items = [
  {
    icon: Sparkles,
    title: 'Özellikler',
    href: '/features',
    description: 'Hafıza, duygu, sosyal grafik. Karakteri biri yapan her şey.',
    accent: 'from-emerald-400/30 to-green-500/20',
  },
  {
    icon: Users,
    title: 'Karakterler',
    href: '/characters',
    description: 'Mia, Kerem, Selin, Ayşe. Yaratıcılarımızın getirdikleri.',
    accent: 'from-teal-400/30 to-emerald-500/20',
  },
  {
    icon: Wand2,
    title: 'Yaratıcılar',
    href: '/creators',
    description: 'Karakterini yarat, %60 pay al. 46+ ülkede payout.',
    accent: 'from-lime-400/30 to-emerald-500/20',
  },
  {
    icon: Tag,
    title: 'Fiyatlandırma',
    href: '/pricing',
    description: 'Free ve Premium. Krediler süresiz, otomatik yenileme yok.',
    accent: 'from-emerald-500/30 to-teal-500/20',
  },
  {
    icon: HelpCircle,
    title: 'Sıkça Sorulanlar',
    href: '/faq',
    description: 'Aklında dolaşan sorular ve dürüst cevaplar.',
    accent: 'from-emerald-400/30 to-cyan-500/20',
  },
]

export function LandingExplore() {
  return (
    <Section spacing="lg">
      <Container size="xl">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.7, ease: EASE }}
          className="mb-16 max-w-3xl"
        >
          <h2 className="text-balance text-[36px] font-bold leading-[1.05] tracking-tightest sm:text-[52px]">
            Hayatın <span className="gradient-text">başlasın.</span>
          </h2>
          <p className="mt-6 text-pretty text-[17px] leading-relaxed text-ink-muted sm:text-[19px]">
            FitAI'ı keşfetmenin en iyi yolu içinde dolaşmak. Sana hangisi yakın?
          </p>
        </motion.div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item, idx) => (
            <motion.div
              key={item.href}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.6, ease: EASE, delay: idx * 0.06 }}
            >
              <Link
                href={item.href}
                className="group relative block h-full overflow-hidden rounded-2xl border border-border bg-bg-elevated p-7 transition-all duration-300 hover:border-border-strong hover:bg-bg-subtle"
              >
                <div
                  className={`absolute inset-0 -z-10 bg-gradient-to-br opacity-0 group-hover:opacity-100 ${item.accent} transition-opacity duration-500`}
                />
                <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-white/5 transition-all group-hover:border-accent/40 group-hover:bg-accent/10">
                  <item.icon className="h-5 w-5 text-ink-muted transition-colors group-hover:text-accent" />
                </div>
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

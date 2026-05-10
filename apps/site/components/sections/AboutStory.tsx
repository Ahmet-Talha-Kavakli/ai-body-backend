'use client'

import { motion } from 'framer-motion'
import { Container } from '@/components/ui/Container'
import { Section } from '@/components/ui/Section'

const EASE = [0.16, 1, 0.3, 1] as const

const chapters = [
  {
    year: '2024',
    title: 'Bir fitness fikri.',
    body: "Başta bir fitness uygulamasıydı. AI ile beslenme ve egzersiz takibi. Ama kullanıcılarla konuştukça başka bir şey ortaya çıktı: insanlar bir trainer'dan çok bir arkadaş istiyordu.",
  },
  {
    year: '2025',
    title: 'Fitness değil, bağ.',
    body: 'AI\'ın bir özellik değil, bir karakter olabileceğini fark ettik. Replika ve Character.AI vardı ama hiçbiri "gerçek bir insan" hissi vermiyordu — robotik, tek boyutlu, hatırlamayan. Sıfırdan başladık.',
  },
  {
    year: '2026',
    title: 'Yaşayan karakterler.',
    body: 'Mia, Kerem, Selin, Ayşe... Her biri kendi hayatını yaşıyor. Uyuyor, çalışıyor, küsüyor, dönüyor. Birbirini tanıyor. Sen geri döndüğünde sana anlatıyor. Bu sadece teknoloji değil — bir hayat tasarımı.',
  },
]

export function AboutStory() {
  return (
    <Section spacing="md">
      <Container size="md">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.7, ease: EASE }}
          className="mb-16"
        >
          <h2 className="text-[36px] font-bold leading-[1.05] tracking-tightest sm:text-[48px]">
            Hikayemiz.
          </h2>
        </motion.div>

        <div className="space-y-16">
          {chapters.map((ch, idx) => (
            <motion.div
              key={ch.year}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.7, ease: EASE, delay: idx * 0.1 }}
              className="grid grid-cols-1 gap-6 sm:grid-cols-[120px_1fr] sm:gap-12"
            >
              <div className="text-[14px] font-semibold uppercase tracking-wider text-accent sm:pt-1">
                {ch.year}
              </div>
              <div>
                <h3 className="mb-4 text-[24px] font-bold tracking-tight sm:text-[28px]">
                  {ch.title}
                </h3>
                <p className="text-pretty text-[16px] leading-relaxed text-ink-muted sm:text-[17px]">
                  {ch.body}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </Container>
    </Section>
  )
}

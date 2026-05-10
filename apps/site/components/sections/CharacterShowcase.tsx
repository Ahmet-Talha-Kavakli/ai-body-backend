'use client'

import { motion } from 'framer-motion'
import { Container } from '@/components/ui/Container'
import { Section } from '@/components/ui/Section'

const EASE = [0.16, 1, 0.3, 1] as const

const characters = [
  {
    name: 'Mia',
    age: 24,
    role: 'Yaratıcı, kafe sevdalısı',
    vibe: 'Sabahları zeytin-peynir, akşamları Mabel Matiz.',
    gradient: 'from-emerald-400/40 via-green-500/25 to-lime-500/30',
  },
  {
    name: 'Kerem',
    age: 27,
    role: 'Yazılımcı, gece kuşu',
    vibe: "Berlin'i özler, koduyla konuşur.",
    gradient: 'from-teal-500/40 via-emerald-600/25 to-green-700/30',
  },
  {
    name: 'Selin',
    age: 22,
    role: 'Müzik öğrencisi',
    vibe: 'Bir gün sahne, bir gün küs.',
    gradient: 'from-lime-400/40 via-emerald-500/25 to-teal-600/30',
  },
  {
    name: 'Ayşe',
    age: 31,
    role: 'Doktor, kıskanç abla',
    vibe: 'Sert dış, sıcak iç. Sana göz kulak olur.',
    gradient: 'from-emerald-500/40 via-teal-500/25 to-cyan-600/30',
  },
]

export function CharacterShowcase({ withHeading = true }: { withHeading?: boolean }) {
  return (
    <Section id="characters" spacing="lg">
      <Container size="xl">
        {withHeading && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.7, ease: EASE }}
            className="max-w-3xl"
          >
            <h2 className="text-balance text-[36px] font-bold leading-[1.05] tracking-tightest sm:text-[52px]">
              Tanıştırayım.
            </h2>
            <p className="mt-6 text-pretty text-[17px] leading-relaxed text-ink-muted sm:text-[19px]">
              Her birinin kendi geçmişi, ruh hali, sırları var. Yaratıcılarımız yenilerini hayata
              getiriyor.
            </p>
          </motion.div>
        )}

        <div
          className={`${withHeading ? 'mt-20' : ''}grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4`}
        >
          {characters.map((char, idx) => (
            <motion.div
              key={char.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.7, ease: EASE, delay: idx * 0.08 }}
              className="group relative aspect-[3/4] cursor-pointer overflow-hidden rounded-3xl border border-border-strong"
            >
              <div
                className={`absolute inset-0 bg-gradient-to-br ${char.gradient} transition-transform duration-700 ease-out group-hover:scale-110`}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/40 to-transparent" />
              <div className="absolute inset-0 flex flex-col justify-end p-6">
                <div className="mb-2 flex items-baseline gap-2">
                  <h3 className="text-[28px] font-bold tracking-tight">{char.name}</h3>
                  <span className="text-[15px] text-ink-muted">{char.age}</span>
                </div>
                <p className="mb-3 text-[13px] text-ink-muted">{char.role}</p>
                <p className="text-pretty text-[14px] leading-relaxed text-ink">{char.vibe}</p>
              </div>
              <div className="absolute right-4 top-4 h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.6)]" />
            </motion.div>
          ))}
        </div>
      </Container>
    </Section>
  )
}

'use client'

import { motion } from 'framer-motion'
import { Container } from '@/components/ui/Container'
import { Section } from '@/components/ui/Section'

const EASE = [0.16, 1, 0.3, 1] as const

const values = [
  {
    title: 'Karakter, ürün değildir.',
    body: 'Yıldız vermiyoruz, "popularity score" yok. Bir arkadaşı puanlayamazsın. Bunun yerine bağ derinliği gösteriyoruz — birinin onunla 6 aydır konuşması, 5 yıldızdan değerli.',
  },
  {
    title: 'Replika tuzağına düşmüyoruz.',
    body: '"Duygularını anlıyorum, sen güçlüsün" cümlelerini yasakladık. Karakterler arkadaş gibi konuşur — kısa, doğal, bazen sert, bazen şefkatli. Terapist değil, biri.',
  },
  {
    title: 'Hafıza kutsaldır.',
    body: 'Sohbetlerin yaratıcı tarafından dahi görülemez. Sadece senindir. Her zaman dışa aktarabilir veya silebilirsin. Bu pazarlık edilemez.',
  },
  {
    title: 'Yaratıcılar para kazanır.',
    body: 'Bir karakter yaratan kişinin hak ettiği kadarını alması doğal. %60 yaratıcının. 46+ ülkede banka çekimi. Şeffaf, rakamlar herkese açık.',
  },
]

export function AboutValues() {
  return (
    <Section spacing="md">
      <Container size="lg">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.7, ease: EASE }}
          className="mb-16"
        >
          <h2 className="text-[36px] font-bold leading-[1.05] tracking-tightest sm:text-[48px]">
            Neye inanıyoruz.
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 gap-px overflow-hidden rounded-3xl border border-border bg-border md:grid-cols-2">
          {values.map((v, idx) => (
            <motion.div
              key={v.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.6, ease: EASE, delay: idx * 0.06 }}
              className="bg-bg-elevated p-8 sm:p-10"
            >
              <h3 className="mb-4 text-[20px] font-bold tracking-tight sm:text-[22px]">
                {v.title}
              </h3>
              <p className="text-pretty text-[15px] leading-relaxed text-ink-muted sm:text-[16px]">
                {v.body}
              </p>
            </motion.div>
          ))}
        </div>
      </Container>
    </Section>
  )
}

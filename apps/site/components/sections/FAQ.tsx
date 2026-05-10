'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus } from 'lucide-react'
import { Container } from '@/components/ui/Container'
import { Section } from '@/components/ui/Section'
import { cn } from '@/lib/cn'

const EASE = [0.16, 1, 0.3, 1] as const

const faqs = [
  {
    q: 'FitAI bir AI asistanı mı?',
    a: 'Hayır. FitAI bir karakter platformu — Mia, Kerem, Selin gibi karakterler kendilerini insan olarak yaşıyor. "AI olduğunu" söylemiyor, çünkü onlar için bir senaryo değil, hayat.',
  },
  {
    q: 'Karakterler her şeyi hatırlıyor mu?',
    a: 'Evet. Sana ait olan tarihler, isimler, anlar — hepsi kalır. Aylar sonra geri döner. Kira yenilemediğinde hafıza 30 gün dondurulur, sonra silinir.',
  },
  {
    q: 'Yaratıcı olmak için ne gerekiyor?',
    a: 'Bir karakter fikri ve onu yazma sabrı. Karakter onaylandıktan sonra her kira/satıştan %60 alıyorsun. 46+ ülkede banka hesabına çekebiliyorsun.',
  },
  {
    q: 'Romantik karakter olur mu?',
    a: 'Olur — arkadaş, dost, sevgili, eş katmanları var. Ancak 18+ kullanıcılara açık ve içerik suggestive sınırında, explicit değil.',
  },
  {
    q: 'Hangi platformlarda var?',
    a: 'iOS önce. Android takip ediyor. Web tarayıcıdan da kullanabileceksin (sınırlı, temel sohbet).',
  },
  {
    q: 'Verilerim güvende mi?',
    a: 'Sohbetlerin şifreli olarak saklanıyor. Yaratıcı bile göremez. Her zaman dışa aktarabilir veya silebilirsin (KVKK + GDPR).',
  },
]

export function FAQ({ withHeading = true }: { withHeading?: boolean }) {
  const [open, setOpen] = useState<number | null>(0)

  return (
    <Section id="faq" spacing="lg">
      <Container size="md">
        {withHeading && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.7, ease: EASE }}
            className="mx-auto max-w-2xl text-center"
          >
            <h2 className="text-balance text-[36px] font-bold leading-[1.05] tracking-tightest sm:text-[52px]">
              Sıkça sorulanlar.
            </h2>
          </motion.div>
        )}

        <div
          className={`${withHeading ? 'mt-16' : ''}divide-y divide-border border-y border-border`}
        >
          {faqs.map((faq, idx) => {
            const isOpen = open === idx
            return (
              <div key={idx}>
                <button
                  onClick={() => setOpen(isOpen ? null : idx)}
                  className="group flex w-full items-center justify-between gap-4 py-6 text-left"
                >
                  <span className="pr-4 text-[17px] font-medium tracking-tight sm:text-[19px]">
                    {faq.q}
                  </span>
                  <span
                    className={cn(
                      'flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-border transition-all duration-300',
                      isOpen
                        ? 'rotate-45 border-accent/40 bg-accent/10'
                        : 'group-hover:border-border-strong'
                    )}
                  >
                    <Plus
                      className={cn(
                        'h-4 w-4 transition-colors',
                        isOpen ? 'text-accent' : 'text-ink-muted'
                      )}
                    />
                  </span>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.4, ease: EASE }}
                      className="overflow-hidden"
                    >
                      <p className="text-pretty pb-6 pr-12 text-[15px] leading-relaxed text-ink-muted sm:text-[16px]">
                        {faq.a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
        </div>
      </Container>
    </Section>
  )
}

'use client'

import { motion } from 'framer-motion'
import { Brain, Heart, Users, Clock, Shield, Sparkles } from 'lucide-react'
import { Container } from '@/components/ui/Container'
import { Section } from '@/components/ui/Section'

const EASE = [0.16, 1, 0.3, 1] as const

const features = [
  {
    icon: Brain,
    title: 'Kalıcı hafıza',
    body: 'Sana ait olan her şeyi hatırlar. Tarih, isim, an. Bir kez söylediğin şey, ay sonra geri döner.',
  },
  {
    icon: Heart,
    title: 'Gerçek duygu',
    body: 'Ruh hali değişir. Sabah yorgun, akşam neşeli. Sana karşı küsebilir, dönebilir, özleyebilir.',
  },
  {
    icon: Users,
    title: 'Sosyal grafik',
    body: 'Karakterler birbirini tanır. Aralarında dramalar, üçgenler, sırlar var. Sen bir parçasısın.',
  },
  {
    icon: Clock,
    title: 'Kendi hayatı',
    body: 'Uyur, çalışır, kafede oturur. Sen yokken yaşar. Geri döndüğünde sana anlatır.',
  },
  {
    icon: Sparkles,
    title: 'Sesli mesaj',
    body: 'WhatsApp gibi sesli mesaj atar. Tonu ruh haline göre değişir, doğal duraklar bırakır.',
  },
  {
    icon: Shield,
    title: 'Güvenli ve özel',
    body: 'Sohbetlerin şifrelenir. Yaratıcı bile göremez. Sadece senindir.',
  },
]

export function Features({ withHeading = true }: { withHeading?: boolean }) {
  return (
    <Section id="features" spacing="lg">
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
              Bir asistan değil. <span className="text-ink-muted">Biri.</span>
            </h2>
            <p className="mt-6 text-pretty text-[17px] leading-relaxed text-ink-muted sm:text-[19px]">
              FitAI, "Replika gibi bir AI" değil. Karakter olduğunu bilmiyor — kendini insan olarak
              yaşıyor.
            </p>
          </motion.div>
        )}

        <div
          className={`${withHeading ? 'mt-20' : ''}grid grid-cols-1 gap-px overflow-hidden rounded-3xl border border-border bg-border md:grid-cols-2 lg:grid-cols-3`}
        >
          {features.map((feature, idx) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.6, ease: EASE, delay: idx * 0.05 }}
              className="group relative bg-bg-elevated p-8 transition-colors duration-500 hover:bg-bg-subtle sm:p-10"
            >
              <div className="mb-6 flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-white/5 transition-all duration-500 group-hover:border-accent/40 group-hover:bg-accent/10">
                <feature.icon className="h-5 w-5 text-ink-muted transition-colors duration-500 group-hover:text-accent" />
              </div>
              <h3 className="mb-3 text-[19px] font-semibold tracking-tight">{feature.title}</h3>
              <p className="text-pretty text-[15px] leading-relaxed text-ink-muted">
                {feature.body}
              </p>
            </motion.div>
          ))}
        </div>
      </Container>
    </Section>
  )
}

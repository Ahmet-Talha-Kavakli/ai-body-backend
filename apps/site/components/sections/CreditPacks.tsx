'use client'

import { motion } from 'framer-motion'
import { Coins } from 'lucide-react'
import { Container } from '@/components/ui/Container'
import { Section } from '@/components/ui/Section'
import { Button } from '@/components/ui/Button'
import { creditPacks } from '@/lib/pricing'
import { cn } from '@/lib/cn'

const EASE = [0.16, 1, 0.3, 1] as const

export function CreditPacks() {
  return (
    <Section spacing="md">
      <Container size="xl">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.7, ease: EASE }}
          className="mx-auto mb-16 max-w-2xl text-center"
        >
          <h2 className="text-balance text-[36px] font-bold leading-[1.05] tracking-tightest sm:text-[48px]">
            Kredi paketleri.
          </h2>
          <p className="mt-5 text-pretty text-[16px] leading-relaxed text-ink-muted sm:text-[17px]">
            Yaratıcı karakterleri kiralamak veya satın almak için kredi kullanırsın. Aboneliğinden
            bağımsız, istediğinde yükle.
          </p>
        </motion.div>

        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {creditPacks.map((pack, idx) => (
            <motion.div
              key={pack.credits}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.6, ease: EASE, delay: idx * 0.06 }}
              className={cn(
                'group relative rounded-3xl border bg-bg-elevated p-6 transition-all duration-300 hover:border-border-strong hover:bg-bg-subtle sm:p-7',
                pack.popular ? 'border-accent/40' : 'border-border'
              )}
            >
              {pack.popular && (
                <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-accent px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-bg">
                  En Popüler
                </div>
              )}

              <div
                className={cn(
                  'mb-5 flex h-10 w-10 items-center justify-center rounded-xl transition-colors',
                  pack.popular
                    ? 'bg-accent/20 text-accent'
                    : 'bg-white/5 text-ink-muted group-hover:bg-accent/10 group-hover:text-accent'
                )}
              >
                <Coins className="h-5 w-5" />
              </div>

              <p className="mb-1 text-[12px] uppercase tracking-wider text-ink-muted">
                {pack.label}
              </p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-[32px] font-bold tracking-tightest">
                  {pack.credits.toLocaleString()}
                </span>
                <span className="text-[13px] text-ink-muted">kredi</span>
              </div>

              {pack.badge && (
                <div className="mt-2 inline-block text-[11px] font-semibold text-accent">
                  {pack.badge}
                </div>
              )}

              <div className="mt-6 flex items-baseline gap-1">
                <span className="text-[24px] font-bold tracking-tight">${pack.price}</span>
                <span className="text-[12px] text-ink-subtle">
                  · ${pack.perCredit.toFixed(3)}/kredi
                </span>
              </div>

              <Button
                size="sm"
                variant={pack.popular ? 'gradient' : 'secondary'}
                className="mt-6 w-full"
              >
                Satın Al
              </Button>
            </motion.div>
          ))}
        </div>

        <p className="mx-auto mt-10 max-w-xl text-center text-[13px] text-ink-subtle">
          Krediler süresizdir, sona ermez. Tek seferlik ödeme, otomatik yenileme yok.
        </p>
      </Container>
    </Section>
  )
}

'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import { THIINGS } from '@/lib/thiings'

const PLANS = [
  {
    name: 'Ücretsiz',
    price: '₺0',
    period: 'sonsuza kadar',
    description: 'Temel AI koçluğu ile başla',
    features: [
      '3 seans/ay',
      'Temel form tespiti',
      'İlerleme takibi',
      'Topluluk erişimi',
    ],
    cta: 'Başla',
    href: '/sign-up',
    highlighted: false,
  },
  {
    name: 'Basic',
    price: '₺149',
    period: '/ay',
    description: 'Geliştirilmiş AI koçluğu deneyimi',
    features: [
      '10 seans/ay',
      'Gerçek zamanlı form analizi',
      '1 kişiselleştirilmiş program/ay',
      '5 AI koç mesajı',
      'Akıllı saat senkronizasyonu',
    ],
    cta: 'Ücretsiz Deneyin',
    href: '/sign-up?plan=basic',
    highlighted: false,
  },
  {
    name: 'Standart',
    price: '₺299',
    period: '/ay',
    description: 'Kapsamlı AI koçluğu ve analitikler',
    badge: 'En Popüler',
    features: [
      '30 seans/ay',
      'Sınırsız AI koç mesajları',
      '5 kişiselleştirilmiş program/ay',
      '10 AI yemek analizi',
      'Gelişmiş ilerleme analizi',
      'Akıllı saat senkronizasyonu',
      'Öncelikli destek',
    ],
    cta: 'Ücretsiz Deneyin',
    href: '/sign-up?plan=standard',
    highlighted: true,
  },
  {
    name: 'Pro',
    price: '₺599',
    period: '/ay',
    description: 'Ciddi sporcular için sınırsız özellikler',
    features: [
      'Sınırsız seans',
      'Sınırsız AI özellikleri',
      'Sınırsız kişiselleştirilmiş programlar',
      'Sınırsız AI yemek analizi',
      'Gelişmiş ilerleme analizi',
      'Akıllı saat senkronizasyonu',
      'Öncelikli destek',
      'Öncü özellik erişimi',
    ],
    cta: 'Ücretsiz Deneyin',
    href: '/sign-up?plan=pro',
    highlighted: false,
  },
]

import { UpgradeBanner } from '@/components/ui/upgrade-banner'
import { GlowCard } from '@/components/ui/spotlight-card'

function PricingCard({ plan, index }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
      className={`relative rounded-2xl transition-all duration-300 ${
        plan.highlighted
          ? 'md:scale-105'
          : ''
      }`}
    >
      <GlowCard
        glowColor={plan.highlighted ? 'green' : 'blue'}
        className="h-full"
        customSize
        width="100%"
        height="100%"
      >
        {/* Badge */}
        {plan.badge && (
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
            <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-primary/10 border border-primary/30">
              <Image src={THIINGS.star} alt="badge" width={16} height={16} unoptimized className="w-4 h-4" />
              <span className="text-sm font-semibold text-primary">
                {plan.badge}
              </span>
            </div>
          </div>
        )}

        <div className="p-8">
          {/* Header */}
          <h3 className="text-2xl font-bold text-foreground mb-2">
            {plan.name}
          </h3>
          <p className="text-sm text-muted-foreground mb-6">
            {plan.description}
          </p>

          {/* Price */}
          <div className="mb-8">
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-bold text-foreground">
                {plan.price}
              </span>
              <span className="text-muted-foreground">{plan.period}</span>
            </div>
          </div>

          {/* CTA - Button */}
          <div className="mb-8">
            <a
              href={plan.href}
              className={`w-full py-3 rounded-lg font-semibold transition-all duration-200 block text-center ${
                plan.highlighted
                  ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:shadow-lg hover:shadow-green-500/30'
                  : 'border border-border hover:bg-accent'
              }`}
            >
              {plan.cta}
            </a>
          </div>

          {/* Features */}
          <div className="space-y-3">
            {plan.features.map((feature: string) => (
              <div key={feature} className="flex items-start gap-3">
                <Image src={THIINGS.checkMark} alt="check" width={20} height={20} unoptimized className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-foreground">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </GlowCard>
    </motion.div>
  )
}

export function PricingSection() {
  return (
    <section id="pricing" className="py-20 px-4">
      <div className="container mx-auto">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Basit ve Şeffaf Fiyatlandırma
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Fitness yolculuğun için mükemmel planı seç
          </p>
        </motion.div>

        {/* Pricing cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
          {PLANS.map((plan, i) => (
            <PricingCard key={plan.name} plan={plan} index={i} />
          ))}
        </div>

        {/* Upgrade promotion banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-16"
        >
          <UpgradeBanner />
        </motion.div>

        {/* Footer note */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="text-center mt-8"
        >
          <p className="text-sm text-muted-foreground">
            Tüm planlar 7 gün ücretsiz deneme içerir. Kredi kartı gerekli değildir.
          </p>
          <p className="text-sm text-muted-foreground mt-4">
            Özel kurumsal plan mı gerekli? <a href="/contact" className="text-primary hover:underline">Satış ekibimize ulaş</a>
          </p>
        </motion.div>
      </div>
    </section>
  )
}

import type { Metadata } from 'next'
import { Nav } from '@/components/layout/Nav'
import { Footer } from '@/components/layout/Footer'
import { PricingHero } from '@/components/sections/PricingHero'
import { PricingTiers } from '@/components/sections/PricingTiers'
import { CreditPacks } from '@/components/sections/CreditPacks'
import { FAQ } from '@/components/sections/FAQ'

export const metadata: Metadata = {
  title: 'Fiyatlandırma',
  description: 'FitAI fiyatlandırması — Free ve Premium tier, kredi paketleri.',
}

export default function PricingPage() {
  return (
    <>
      <Nav />
      <main className="relative">
        <PricingHero />
        <PricingTiers />
        <CreditPacks />
        <FAQ />
      </main>
      <Footer />
    </>
  )
}

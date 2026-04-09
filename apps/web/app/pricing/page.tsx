import { LandingNav } from '@/components/landing/landing-nav'
import { LandingFooter } from '@/components/landing/landing-footer'
import { PricingSection } from '@/components/landing/pricing-section'
import { CtaSection } from '@/components/landing/cta-section'

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background">
      <LandingNav />
      <main className="pt-20">
        <PricingSection />
        <CtaSection />
      </main>
      <LandingFooter />
    </div>
  )
}

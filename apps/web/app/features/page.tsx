import { LandingNav } from '@/components/landing/landing-nav'
import { LandingFooter } from '@/components/landing/landing-footer'
import { FeaturesSection } from '@/components/landing/features-section'
import { HowItWorksSection } from '@/components/landing/how-it-works-section'
import { CtaSection } from '@/components/landing/cta-section'

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-background">
      <LandingNav />
      <main className="pt-20">
        <FeaturesSection />
        <HowItWorksSection />
        <CtaSection />
      </main>
      <LandingFooter />
    </div>
  )
}

import { BackgroundAurora } from '@/components/landing/background-aurora'
import { HeroSection } from '@/components/landing/hero-section'
import { FeaturesSection } from '@/components/landing/features-section'
import { HowItWorksSection } from '@/components/landing/how-it-works-section'
import { TestimonialsSection } from '@/components/landing/testimonials-section'
import { PricingSection } from '@/components/landing/pricing-section'
import { CtaSection } from '@/components/landing/cta-section'
import { LandingFooter } from '@/components/landing/landing-footer'
import { SectionTransition } from '@/components/landing/section-transition'

export default function HomePage() {
  return (
    <BackgroundAurora>
      <main>
        <HeroSection />

        <SectionTransition divider="gradient">
          <FeaturesSection />
        </SectionTransition>

        <SectionTransition divider="glow" delay={0.05}>
          <HowItWorksSection />
        </SectionTransition>

        <SectionTransition divider="gradient" delay={0.05}>
          <TestimonialsSection />
        </SectionTransition>

        <SectionTransition divider="glow" delay={0.05}>
          <PricingSection />
        </SectionTransition>

        <SectionTransition divider="fade" delay={0.05}>
          <CtaSection />
        </SectionTransition>

        <SectionTransition divider="gradient" delay={0.1}>
          <LandingFooter />
        </SectionTransition>
      </main>
    </BackgroundAurora>
  )
}

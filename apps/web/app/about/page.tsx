import { LandingNav } from '@/components/landing/landing-nav'
import { LandingFooter } from '@/components/landing/landing-footer'
import { StatsSection } from '@/components/landing/stats-section'
import { TestimonialsSection } from '@/components/landing/testimonials-section'
import { CtaSection } from '@/components/landing/cta-section'

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <LandingNav />
      <main className="pt-20">
        <StatsSection />
        <TestimonialsSection />
        <CtaSection />
      </main>
      <LandingFooter />
    </div>
  )
}

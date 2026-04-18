import { LandingNav } from '@/components/landing/landing-nav'
import { LandingFooter } from '@/components/landing/landing-footer'
import { TestimonialsSection } from '@/components/landing/testimonials-section'
import { CtaSection } from '@/components/landing/cta-section'

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <LandingNav />
      <main className="pt-20">
        <TestimonialsSection />
        <CtaSection />
      </main>
      <LandingFooter />
    </div>
  )
}

import { Nav } from '@/components/layout/Nav'
import { Footer } from '@/components/layout/Footer'
import { Hero } from '@/components/sections/Hero'
import { LandingExplore } from '@/components/sections/LandingExplore'

export default function HomePage() {
  return (
    <>
      <Nav />
      <main className="relative">
        <Hero />
        <LandingExplore />
      </main>
      <Footer />
    </>
  )
}

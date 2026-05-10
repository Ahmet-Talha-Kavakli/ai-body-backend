import type { Metadata } from 'next'
import { Nav } from '@/components/layout/Nav'
import { Footer } from '@/components/layout/Footer'
import { AboutHero } from '@/components/sections/AboutHero'
import { AboutStory } from '@/components/sections/AboutStory'
import { AboutValues } from '@/components/sections/AboutValues'

export const metadata: Metadata = {
  title: 'Hakkımızda',
  description:
    "FitAI, AI'ın bir asistan değil, bir karakter olabileceğine inanıyor. Hikayemiz ve değerlerimiz.",
}

export default function AboutPage() {
  return (
    <>
      <Nav />
      <main className="relative">
        <AboutHero />
        <AboutStory />
        <AboutValues />
      </main>
      <Footer />
    </>
  )
}

import type { Metadata } from 'next'
import { Nav } from '@/components/layout/Nav'
import { Footer } from '@/components/layout/Footer'
import { PageHeader } from '@/components/sections/PageHeader'
import { CharacterShowcase } from '@/components/sections/CharacterShowcase'
import { RelatedPages } from '@/components/sections/RelatedPages'

export const metadata: Metadata = {
  title: 'Karakterler',
  description: 'Mia, Kerem, Selin, Ayşe ve yaratıcılarımızın getirdiği karakterler.',
}

export default function CharactersPage() {
  return (
    <>
      <Nav />
      <main className="relative">
        <PageHeader
          eyebrow="Karakterler"
          title={
            <>
              Tanıştır <span className="gradient-text">kendini.</span>
            </>
          }
          description="Her birinin kendi geçmişi, ruh hali, sırları var. Birini seç, hayatına davet et — ya da kendi karakterini yarat."
        />
        <CharacterShowcase withHeading={false} />
        <RelatedPages current="/characters" />
      </main>
      <Footer />
    </>
  )
}

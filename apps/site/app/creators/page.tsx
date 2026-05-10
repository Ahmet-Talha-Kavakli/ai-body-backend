import type { Metadata } from 'next'
import { Nav } from '@/components/layout/Nav'
import { Footer } from '@/components/layout/Footer'
import { PageHeader } from '@/components/sections/PageHeader'
import { CreatorCTA } from '@/components/sections/CreatorCTA'
import { RelatedPages } from '@/components/sections/RelatedPages'

export const metadata: Metadata = {
  title: 'Yaratıcılar',
  description: 'Karakterini yarat, %60 pay al. 46+ ülkede banka hesabına direkt çekim.',
}

export default function CreatorsPage() {
  return (
    <>
      <Nav />
      <main className="relative">
        <PageHeader
          eyebrow="Yaratıcılar İçin"
          title={
            <>
              Hayalini kur, <span className="gradient-text">para kazan.</span>
            </>
          }
          description="Bir karakter yarat. Binlerce kişi onunla bağ kursun. Her ay kazan."
        />
        <CreatorCTA />
        <RelatedPages current="/creators" />
      </main>
      <Footer />
    </>
  )
}

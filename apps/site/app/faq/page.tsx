import type { Metadata } from 'next'
import { Nav } from '@/components/layout/Nav'
import { Footer } from '@/components/layout/Footer'
import { PageHeader } from '@/components/sections/PageHeader'
import { FAQ } from '@/components/sections/FAQ'
import { RelatedPages } from '@/components/sections/RelatedPages'

export const metadata: Metadata = {
  title: 'Sıkça Sorulanlar',
  description: 'FitAI hakkında merak ettiklerin.',
}

export default function FAQPage() {
  return (
    <>
      <Nav />
      <main className="relative">
        <PageHeader
          eyebrow="SSS"
          title={
            <>
              Sıkça <span className="gradient-text">sorulanlar.</span>
            </>
          }
          description="Aklında dolaşan sorular ve dürüst cevaplar."
        />
        <FAQ withHeading={false} />
        <RelatedPages current="/faq" />
      </main>
      <Footer />
    </>
  )
}

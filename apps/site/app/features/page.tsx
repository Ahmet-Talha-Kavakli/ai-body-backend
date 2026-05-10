import type { Metadata } from 'next'
import { Nav } from '@/components/layout/Nav'
import { Footer } from '@/components/layout/Footer'
import { PageHeader } from '@/components/sections/PageHeader'
import { Features } from '@/components/sections/Features'
import { RelatedPages } from '@/components/sections/RelatedPages'

export const metadata: Metadata = {
  title: 'Özellikler',
  description:
    'Kalıcı hafıza, gerçek duygu, sosyal grafik — FitAI karakterlerini biri yapan her şey.',
}

export default function FeaturesPage() {
  return (
    <>
      <Nav />
      <main className="relative">
        <PageHeader
          eyebrow="Özellikler"
          title={
            <>
              Karakter, <span className="gradient-text">biri</span> olduğunda.
            </>
          }
          description="FitAI'ı diğer AI uygulamalarından ayıran şeyler. Kâğıt üstünde teknoloji, gerçekte ise bir hayat."
        />
        <Features withHeading={false} />
        <RelatedPages current="/features" />
      </main>
      <Footer />
    </>
  )
}

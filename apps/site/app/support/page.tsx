import type { Metadata } from 'next'
import Link from 'next/link'
import { Mail, MessageCircle, Shield, FileText } from 'lucide-react'
import { Nav } from '@/components/layout/Nav'
import { Footer } from '@/components/layout/Footer'
import { Container } from '@/components/ui/Container'

export const metadata: Metadata = {
  title: 'Destek',
  description: 'FitAI destek ekibiyle iletişime geç.',
}

const channels = [
  {
    icon: Mail,
    title: 'Genel destek',
    description: 'Hesap, ödeme, teknik sorular için.',
    cta: 'support@fitai.com',
    href: 'mailto:support@fitai.com',
  },
  {
    icon: Shield,
    title: 'Gizlilik & veri talepleri',
    description: 'Verilerini görme, silme, dışa aktarma.',
    cta: 'privacy@fitai.com',
    href: 'mailto:privacy@fitai.com',
  },
  {
    icon: FileText,
    title: 'Yasal & DMCA',
    description: 'Telif hakkı, yasal bildirimler.',
    cta: 'legal@fitai.com',
    href: 'mailto:legal@fitai.com',
  },
  {
    icon: MessageCircle,
    title: 'Topluluk',
    description: 'Discord sunucumuzda diğer kullanıcılarla buluş.',
    cta: "Discord'a katıl",
    href: '#',
  },
]

export default function SupportPage() {
  return (
    <>
      <Nav />
      <main>
        <section className="pb-20 pt-40 sm:pb-28 sm:pt-48">
          <Container size="md">
            <div className="mx-auto mb-16 max-w-2xl text-center">
              <p className="mb-6 text-[13px] font-semibold uppercase tracking-[0.2em] text-accent">
                Destek
              </p>
              <h1 className="text-balance text-[44px] font-bold leading-[1.05] tracking-tightest sm:text-[56px]">
                Yardıma ihtiyacın varsa <span className="gradient-text">buradayız.</span>
              </h1>
              <p className="mt-6 text-pretty text-[17px] leading-relaxed text-ink-muted">
                Genellikle 24 saat içinde yanıtlıyoruz. Acil bir durum varsa doğrudan ilgili adrese
                yaz.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {channels.map((ch) => (
                <Link
                  key={ch.title}
                  href={ch.href}
                  className="group rounded-2xl border border-border bg-bg-elevated p-6 transition-all duration-300 hover:border-border-strong hover:bg-bg-subtle"
                >
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-white/5 transition-all group-hover:border-accent/40 group-hover:bg-accent/10 group-hover:text-accent">
                    <ch.icon className="h-5 w-5 text-ink-muted transition-colors group-hover:text-accent" />
                  </div>
                  <h3 className="mb-2 text-[17px] font-semibold tracking-tight">{ch.title}</h3>
                  <p className="mb-4 text-[14px] leading-relaxed text-ink-muted">
                    {ch.description}
                  </p>
                  <p className="text-[14px] text-accent transition-colors group-hover:text-accent-bright">
                    {ch.cta} →
                  </p>
                </Link>
              ))}
            </div>
          </Container>
        </section>
      </main>
      <Footer />
    </>
  )
}

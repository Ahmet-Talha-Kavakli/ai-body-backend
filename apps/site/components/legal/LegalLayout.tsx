import Link from 'next/link'
import { Container } from '@/components/ui/Container'

interface LegalLayoutProps {
  title: string
  updatedAt: string
  children: React.ReactNode
}

const legalNav = [
  { label: 'Gizlilik Politikası', href: '/legal/privacy' },
  { label: 'Kullanım Şartları', href: '/legal/terms' },
  { label: 'DMCA', href: '/legal/dmca' },
]

export function LegalLayout({ title, updatedAt, children }: LegalLayoutProps) {
  return (
    <section className="pb-24 pt-32 sm:pb-32 sm:pt-40">
      <Container size="lg">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[240px_1fr] lg:gap-20">
          <aside className="self-start lg:sticky lg:top-28">
            <p className="mb-4 text-[12px] font-semibold uppercase tracking-[0.2em] text-ink-subtle">
              Yasal
            </p>
            <nav className="flex flex-col gap-1">
              {legalNav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="py-2 text-[14px] text-ink-muted transition-colors hover:text-ink"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </aside>

          <article className="min-w-0">
            <header className="mb-12 border-b border-border pb-8">
              <h1 className="text-[36px] font-bold leading-[1.05] tracking-tightest sm:text-[48px]">
                {title}
              </h1>
              <p className="mt-4 text-[14px] text-ink-subtle">Son güncelleme: {updatedAt}</p>
            </header>

            <div className="prose-legal">{children}</div>
          </article>
        </div>
      </Container>
    </section>
  )
}

import Link from 'next/link'
import { siteConfig } from '@/lib/site-config'
import { Container } from '@/components/ui/Container'

export function Footer() {
  const groups = [
    { title: 'Ürün', links: siteConfig.footerLinks.product },
    { title: 'Yaratıcılar', links: siteConfig.footerLinks.creators },
    { title: 'Şirket', links: siteConfig.footerLinks.company },
    { title: 'Yasal', links: siteConfig.footerLinks.legal },
  ]

  return (
    <footer className="relative mt-32 border-t border-border">
      <Container size="xl" className="py-20">
        <div className="grid grid-cols-2 gap-12 md:grid-cols-6">
          <div className="col-span-2 md:col-span-2">
            <Link href="/" className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-accent via-accent-bright to-accent-deep shadow-[0_0_20px_rgba(48,209,88,0.4)]" />
              <span className="text-[17px] font-semibold tracking-tight">{siteConfig.name}</span>
            </Link>
            <p className="mt-4 max-w-xs text-pretty text-[14px] leading-relaxed text-ink-muted">
              Yapay zekayla gerçek bir bağ. Karakterler bir uygulama özelliği değil — bir hayatın
              parçası.
            </p>
          </div>

          {groups.map((group) => (
            <div key={group.title}>
              <h4 className="mb-4 text-[13px] font-semibold uppercase tracking-wider text-ink">
                {group.title}
              </h4>
              <ul className="space-y-3">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-[14px] text-ink-muted transition-colors duration-200 hover:text-ink"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-16 flex flex-col items-start justify-between gap-4 border-t border-border pt-8 sm:flex-row sm:items-center">
          <p className="text-[13px] text-ink-subtle">
            © {new Date().getFullYear()} {siteConfig.name}. Tüm hakları saklıdır.
          </p>
          <p className="text-[13px] text-ink-subtle">Türkiye'de tasarlandı, dünya için.</p>
        </div>
      </Container>
    </footer>
  )
}

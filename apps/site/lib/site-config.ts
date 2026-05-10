export const siteConfig = {
  name: 'FitAI',
  description:
    'Yapay zekayla gerçek bir bağ. Karakterler bir uygulama özelliği değil — bir hayatın parçası.',
  url: 'https://fitai.com',
  appStoreUrl: '#',
  playStoreUrl: '#',
  social: {
    twitter: '#',
    instagram: '#',
    discord: '#',
  },
  nav: [
    { label: 'Özellikler', href: '/features' },
    { label: 'Karakterler', href: '/characters' },
    { label: 'Yaratıcılar', href: '/creators' },
    { label: 'Fiyatlandırma', href: '/pricing' },
    { label: 'SSS', href: '/faq' },
  ],
  footerLinks: {
    product: [
      { label: 'Özellikler', href: '/features' },
      { label: 'Karakterler', href: '/characters' },
      { label: 'Fiyatlandırma', href: '/pricing' },
      { label: 'SSS', href: '/faq' },
    ],
    creators: [
      { label: 'Yaratıcı Ol', href: '/creators' },
      { label: 'Dashboard', href: 'https://app.fitai.com' },
      { label: 'Fiyatlandırma', href: '/pricing' },
    ],
    company: [
      { label: 'Hakkımızda', href: '/about' },
      { label: 'Blog', href: '/blog' },
      { label: 'Destek', href: '/support' },
    ],
    legal: [
      { label: 'Gizlilik', href: '/legal/privacy' },
      { label: 'Kullanım Şartları', href: '/legal/terms' },
      { label: 'DMCA', href: '/legal/dmca' },
      { label: 'Destek', href: '/support' },
    ],
  },
}

export type SiteConfig = typeof siteConfig

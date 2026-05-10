import type { Metadata, Viewport } from 'next'
import { Sora } from 'next/font/google'
import { ClerkProvider } from '@clerk/nextjs'
import { clerkAppearance } from '@/lib/clerk-appearance'
import './globals.css'

const sora = Sora({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sora',
  weight: ['300', '400', '500', '600', '700', '800'],
})

export const metadata: Metadata = {
  title: {
    default: 'FitAI Dashboard',
    template: '%s · FitAI Dashboard',
  },
  description: 'Yaratıcı paneli — karakterlerini yönet, kazancını takip et, payout iste.',
  metadataBase: new URL('https://app.fitai.com'),
  robots: { index: false, follow: false },
}

export const viewport: Viewport = {
  themeColor: '#0A0A0F',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider appearance={clerkAppearance}>
      <html lang="tr" className={`${sora.variable} dark`}>
        <body className="min-h-screen antialiased">{children}</body>
      </html>
    </ClerkProvider>
  )
}

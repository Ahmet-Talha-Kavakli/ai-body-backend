import type { Metadata, Viewport } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { Barlow_Condensed } from 'next/font/google'

const barlowCondensed = Barlow_Condensed({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-barlow-condensed',
})
import { ClerkProvider } from '@clerk/nextjs'
import { Providers } from '@/components/shared/providers'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'FitAI — Your AI Personal Trainer',
    template: '%s | FitAI',
  },
  description:
    'Train smarter with real-time AI coaching, personalized programs, and 3D movement analysis. The future of fitness is here.',
  keywords: ['AI personal trainer', 'fitness', 'workout', 'computer vision', 'nutrition'],
  authors: [{ name: 'FitAI Team' }],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://fitai.app',
    siteName: 'FitAI',
    title: 'FitAI — Your AI Personal Trainer',
    description:
      'Train smarter with real-time AI coaching, personalized programs, and 3D movement analysis.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FitAI — Your AI Personal Trainer',
    description: 'Train smarter with real-time AI coaching and 3D movement analysis.',
  },
  robots: { index: true, follow: true },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
  width: 'device-width',
  initialScale: 1,
}

interface RootLayoutProps {
  children: React.ReactNode
}

import { PillBase } from '@/components/ui/3d-adaptive-navigation-bar'

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body className={`${GeistSans.variable} ${GeistMono.variable} ${barlowCondensed.variable} font-sans antialiased`}>
          <Providers>
            <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50">
              <PillBase />
            </div>
            {children}
          </Providers>
        </body>
      </html>
    </ClerkProvider>
  )
}

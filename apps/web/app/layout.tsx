import type { Metadata, Viewport } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { Barlow, Bebas_Neue } from 'next/font/google'
import { ClerkProvider } from '@clerk/nextjs'
import { Providers } from '@/components/shared/providers'
import './globals.css'

const barlow = Barlow({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-barlow',
})

const bebasNeue = Bebas_Neue({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-bebas',
})

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
    { media: '(prefers-color-scheme: light)', color: '#080808' },
    { media: '(prefers-color-scheme: dark)', color: '#080808' },
  ],
  width: 'device-width',
  initialScale: 1,
}

interface RootLayoutProps {
  children: React.ReactNode
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body
          className={`${GeistSans.variable} ${GeistMono.variable} ${barlow.variable} ${bebasNeue.variable} font-sans antialiased`}
        >
          <Providers>{children}</Providers>
        </body>
      </html>
    </ClerkProvider>
  )
}

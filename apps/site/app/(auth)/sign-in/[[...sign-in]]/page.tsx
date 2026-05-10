import type { Metadata } from 'next'
import Link from 'next/link'
import { SignIn } from '@clerk/nextjs'

export const metadata: Metadata = {
  title: 'Giriş',
  description: 'FitAI hesabına giriş yap.',
}

export default function SignInPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-0 h-[600px] w-[1000px] -translate-x-1/2 bg-gradient-to-b from-accent/15 to-transparent opacity-60 blur-3xl" />
      </div>

      <header className="px-6 py-6 sm:px-10">
        <Link href="/" className="group inline-flex items-center gap-2">
          <div className="h-7 w-7 rounded-full bg-gradient-to-br from-accent via-accent-bright to-accent-deep shadow-[0_0_16px_rgba(48,209,88,0.4)]" />
          <span className="text-[15px] font-semibold tracking-tight">FitAI</span>
        </Link>
      </header>

      <main className="flex flex-1 items-center justify-center px-6 py-12">
        <SignIn />
      </main>
    </div>
  )
}

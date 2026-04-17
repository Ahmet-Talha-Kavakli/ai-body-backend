import Link from 'next/link'

const links = [
  { label: 'Features', href: '#features' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'Sign In', href: '/sign-in' },
  { label: 'Privacy', href: '/privacy' },
]

export function LandingFooter() {
  return (
    <footer className="border-t border-white/[0.06] bg-[#080808]">
      <div className="flex flex-col items-start justify-between gap-6 px-5 py-8 sm:flex-row sm:items-center sm:gap-4 sm:px-10 sm:py-10 lg:px-16">
        {/* Logo */}
        <Link href="/" className="font-bebas text-2xl tracking-tight text-white">
          Fit<span className="text-[#C8FF00]">AI</span>
        </Link>

        {/* Nav links */}
        <nav className="flex flex-wrap items-center gap-x-6 gap-y-2">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="font-barlow text-xs uppercase tracking-widest text-zinc-500 transition-colors hover:text-white"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        {/* Copyright */}
        <p className="font-barlow text-xs text-zinc-700">© {new Date().getFullYear()} FitAI</p>
      </div>
    </footer>
  )
}

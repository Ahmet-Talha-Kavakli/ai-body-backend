'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'

const NAV_LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Pricing', href: '#pricing' },
]

export function LandingNav() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav
      className={`fixed left-0 right-0 top-0 z-50 flex items-center justify-between px-6 py-4 transition-colors duration-300 sm:px-10 lg:px-16 ${
        scrolled ? 'border-b border-white/10 bg-[#0a0a0a]' : 'bg-transparent'
      }`}
      aria-label="Main navigation"
    >
      {/* Logo */}
      <Link href="/" className="group flex cursor-pointer items-center gap-3">
        <span className="font-bebas text-2xl leading-none tracking-widest text-[#C8FF00]">FIT</span>
        <span className="font-bebas text-2xl leading-none tracking-widest text-white">AI</span>
        <span
          className="hidden h-[2px] w-0 bg-[#C8FF00] transition-all duration-300 group-hover:w-6 sm:block"
          aria-hidden="true"
        />
      </Link>

      {/* Links */}
      <div className="hidden items-center gap-8 md:flex">
        {NAV_LINKS.map((link) => (
          <a
            key={link.label}
            href={link.href}
            className="font-barlow cursor-pointer text-[10px] font-semibold uppercase tracking-[0.25em] text-zinc-500 transition-colors duration-200 hover:text-white"
          >
            {link.label}
          </a>
        ))}
      </div>

      {/* CTA */}
      <div className="flex items-center gap-4">
        <Link
          href="/sign-in"
          className="font-barlow cursor-pointer text-[10px] font-semibold uppercase tracking-[0.25em] text-zinc-500 transition-colors duration-200 hover:text-white"
        >
          Sign In
        </Link>
        <Link
          href="/sign-up"
          className="font-barlow cursor-pointer bg-[#C8FF00] px-5 py-2.5 text-[10px] font-bold uppercase tracking-[0.2em] text-black transition-colors duration-200 hover:bg-white"
        >
          Start Free
        </Link>
      </div>
    </nav>
  )
}

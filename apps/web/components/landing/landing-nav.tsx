'use client'

import React, { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import gsap from 'gsap'
import { CustomEase } from 'gsap/CustomEase'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(CustomEase)
}

const navLinks = [
  { label: 'Features', href: '#features', shape: '1' },
  { label: 'How It Works', href: '#how-it-works', shape: '2' },
  { label: 'Pricing', href: '#pricing', shape: '3' },
  { label: 'Dashboard', href: '/dashboard', shape: '4' },
  { label: 'Get Started', href: '/sign-up', shape: '5' },
]

export function LandingNav() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  // Initial setup & hover effects
  useEffect(() => {
    if (!containerRef.current) return

    try {
      if (!gsap.parseEase('main')) {
        CustomEase.create('main', '0.65, 0.01, 0.05, 0.99')
        gsap.defaults({ ease: 'main', duration: 0.7 })
      }
    } catch {
      gsap.defaults({ ease: 'power2.out', duration: 0.7 })
    }

    const ctx = gsap.context(() => {
      const menuItems = containerRef.current!.querySelectorAll('.menu-list-item[data-shape]')
      const shapesContainer = containerRef.current!.querySelector('.ambient-background-shapes')

      menuItems.forEach((item) => {
        const shapeIndex = item.getAttribute('data-shape')
        const shape = shapesContainer?.querySelector(`.bg-shape-${shapeIndex}`) ?? null
        if (!shape) return
        const shapeEls = shape.querySelectorAll('.shape-element')

        const onEnter = () => {
          shapesContainer?.querySelectorAll('.bg-shape').forEach((s) => s.classList.remove('active'))
          shape.classList.add('active')
          gsap.fromTo(
            shapeEls,
            { scale: 0.5, opacity: 0, rotation: -10 },
            { scale: 1, opacity: 1, rotation: 0, duration: 0.6, stagger: 0.08, ease: 'back.out(1.7)', overwrite: 'auto' }
          )
        }
        const onLeave = () => {
          gsap.to(shapeEls, {
            scale: 0.8, opacity: 0, duration: 0.3, ease: 'power2.in',
            onComplete: () => shape.classList.remove('active'),
            overwrite: 'auto',
          })
        }

        item.addEventListener('mouseenter', onEnter)
        item.addEventListener('mouseleave', onLeave)
        ;(item as any)._cleanup = () => {
          item.removeEventListener('mouseenter', onEnter)
          item.removeEventListener('mouseleave', onLeave)
        }
      })
    }, containerRef)

    return () => {
      ctx.revert()
      containerRef.current?.querySelectorAll('.menu-list-item[data-shape]').forEach((item: any) => item._cleanup?.())
    }
  }, [])

  // Menu open/close animation
  useEffect(() => {
    if (!containerRef.current) return

    const ctx = gsap.context(() => {
      const navWrap = containerRef.current!.querySelector('.nav-overlay-wrapper')
      const menu = containerRef.current!.querySelector('.menu-content')
      const overlay = containerRef.current!.querySelector('.overlay')
      const bgPanels = containerRef.current!.querySelectorAll('.backdrop-layer')
      const menuLinks = containerRef.current!.querySelectorAll('.nav-link')
      const fadeTargets = containerRef.current!.querySelectorAll('[data-menu-fade]')
      const menuButton = containerRef.current!.querySelector('.nav-close-btn')
      const menuButtonTexts = menuButton?.querySelectorAll('p')
      const menuButtonIcon = menuButton?.querySelector('.menu-button-icon')

      const tl = gsap.timeline()

      if (isMenuOpen) {
        navWrap?.setAttribute('data-nav', 'open')
        tl.set(navWrap, { display: 'block' })
          .set(menu, { xPercent: 0 }, '<')
          .fromTo(menuButtonTexts ?? [], { yPercent: 0 }, { yPercent: -100, stagger: 0.2 })
          .fromTo(menuButtonIcon ?? [], { rotate: 0 }, { rotate: 315 }, '<')
          .fromTo(overlay, { autoAlpha: 0 }, { autoAlpha: 1 }, '<')
          .fromTo(bgPanels, { xPercent: 101 }, { xPercent: 0, stagger: 0.12, duration: 0.575 }, '<')
          .fromTo(menuLinks, { yPercent: 140, rotate: 10 }, { yPercent: 0, rotate: 0, stagger: 0.05 }, '<+=0.35')
        if (fadeTargets.length) {
          tl.fromTo(fadeTargets, { autoAlpha: 0, yPercent: 50 }, { autoAlpha: 1, yPercent: 0, stagger: 0.04, clearProps: 'all' }, '<+=0.2')
        }
      } else {
        navWrap?.setAttribute('data-nav', 'closed')
        tl.to(overlay, { autoAlpha: 0 })
          .to(menu, { xPercent: 120 }, '<')
          .to(menuButtonTexts ?? [], { yPercent: 0 }, '<')
          .to(menuButtonIcon ?? [], { rotate: 0 }, '<')
          .set(navWrap, { display: 'none' })
      }
    }, containerRef)

    return () => ctx.revert()
  }, [isMenuOpen])

  // ESC key handler
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMenuOpen) setIsMenuOpen(false)
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [isMenuOpen])

  const toggleMenu = () => setIsMenuOpen((prev) => !prev)
  const closeMenu = () => setIsMenuOpen(false)

  return (
    <div ref={containerRef}>
      {/* Top bar */}
      <header className="fixed top-0 left-0 right-0 z-50 px-4 sm:px-8 py-5">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          {/* Logo */}
          <Link href="/" className="text-xl font-black text-white tracking-tight z-50 relative">
            Fit<span className="text-primary">AI</span>
          </Link>

          {/* Desktop links */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.slice(0, 3).map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-zinc-400 hover:text-white transition-colors duration-200"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right side: sign in + menu button */}
          <div className="flex items-center gap-4">
            <Link
              href="/sign-in"
              className="hidden md:block text-sm text-zinc-400 hover:text-white transition-colors"
            >
              Sign In
            </Link>

            {/* Menu toggle button */}
            <button
              className="nav-close-btn relative flex items-center gap-2 overflow-hidden cursor-pointer bg-transparent border-0 p-0"
              onClick={toggleMenu}
            >
              <div className="menu-button-text relative h-5 overflow-hidden flex flex-col">
                <p className="p-large text-sm font-semibold text-white whitespace-nowrap">Menu</p>
                <p className="p-large text-sm font-semibold text-white whitespace-nowrap">Close</p>
              </div>
              <div className="icon-wrap w-5 h-5 flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  className="menu-button-icon text-white"
                >
                  <path d="M7.33333 16L7.33333 0L8.66667 0L8.66667 16L7.33333 16Z" fill="currentColor" />
                  <path d="M16 8.66667L0 8.66667L0 7.33333L16 7.33333L16 8.66667Z" fill="currentColor" />
                  <path d="M6 7.33333L7.33333 7.33333L7.33333 6C7.33333 6.73637 6.73638 7.33333 6 7.33333Z" fill="currentColor" />
                  <path d="M10 7.33333L8.66667 7.33333L8.66667 6C8.66667 6.73638 9.26362 7.33333 10 7.33333Z" fill="currentColor" />
                  <path d="M6 8.66667L7.33333 8.66667L7.33333 10C7.33333 9.26362 6.73638 8.66667 6 8.66667Z" fill="currentColor" />
                  <path d="M10 8.66667L8.66667 8.66667L8.66667 10C8.66667 9.26362 9.26362 8.66667 10 8.66667Z" fill="currentColor" />
                </svg>
              </div>
            </button>
          </div>
        </div>
      </header>

      {/* Fullscreen menu overlay */}
      <section>
        <div
          data-nav="closed"
          className="nav-overlay-wrapper"
          style={{ display: 'none', position: 'fixed', inset: 0, zIndex: 100 }}
        >
          <div
            className="overlay"
            onClick={closeMenu}
            style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', opacity: 0 }}
          />
          <nav
            className="menu-content"
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: '100%',
              maxWidth: '600px',
              height: '100%',
              overflow: 'hidden',
            }}
          >
            {/* Background layers */}
            <div className="menu-bg" style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
              <div className="backdrop-layer first" style={{ position: 'absolute', inset: 0, background: '#111111', transform: 'translateX(101%)' }} />
              <div className="backdrop-layer second" style={{ position: 'absolute', inset: 0, background: '#0d0d0d', transform: 'translateX(101%)' }} />
              <div className="backdrop-layer" style={{ position: 'absolute', inset: 0, background: '#080808', transform: 'translateX(101%)' }} />

              {/* Abstract shapes */}
              <div className="ambient-background-shapes" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
                <svg className="bg-shape bg-shape-1" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0 }} viewBox="0 0 400 400" fill="none">
                  <circle className="shape-element" cx="80" cy="120" r="40" fill="rgba(74,222,128,0.1)" />
                  <circle className="shape-element" cx="300" cy="80" r="60" fill="rgba(74,222,128,0.07)" />
                  <circle className="shape-element" cx="200" cy="300" r="80" fill="rgba(74,222,128,0.05)" />
                  <circle className="shape-element" cx="350" cy="280" r="30" fill="rgba(74,222,128,0.1)" />
                </svg>
                <svg className="bg-shape bg-shape-2" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0 }} viewBox="0 0 400 400" fill="none">
                  <path className="shape-element" d="M0 200 Q100 100, 200 200 T 400 200" stroke="rgba(74,222,128,0.15)" strokeWidth="60" fill="none" />
                  <path className="shape-element" d="M0 280 Q100 180, 200 280 T 400 280" stroke="rgba(74,222,128,0.1)" strokeWidth="40" fill="none" />
                </svg>
                <svg className="bg-shape bg-shape-3" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0 }} viewBox="0 0 400 400" fill="none">
                  {[50,150,250,350].map(x => <circle key={x} className="shape-element" cx={x} cy="50" r="8" fill="rgba(74,222,128,0.25)" />)}
                  {[100,200,300].map(x => <circle key={x} className="shape-element" cx={x} cy="150" r="12" fill="rgba(74,222,128,0.2)" />)}
                  {[50,150,250,350].map(x => <circle key={x} className="shape-element" cx={x} cy="250" r="10" fill="rgba(74,222,128,0.25)" />)}
                </svg>
                <svg className="bg-shape bg-shape-4" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0 }} viewBox="0 0 400 400" fill="none">
                  <path className="shape-element" d="M100 100 Q150 50, 200 100 Q250 150, 200 200 Q150 250, 100 200 Q50 150, 100 100" fill="rgba(74,222,128,0.08)" />
                  <path className="shape-element" d="M250 200 Q300 150, 350 200 Q400 250, 350 300 Q300 350, 250 300 Q200 250, 250 200" fill="rgba(74,222,128,0.06)" />
                </svg>
                <svg className="bg-shape bg-shape-5" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0 }} viewBox="0 0 400 400" fill="none">
                  <line className="shape-element" x1="0" y1="100" x2="300" y2="400" stroke="rgba(74,222,128,0.1)" strokeWidth="30" />
                  <line className="shape-element" x1="100" y1="0" x2="400" y2="300" stroke="rgba(74,222,128,0.08)" strokeWidth="25" />
                  <line className="shape-element" x1="200" y1="0" x2="400" y2="200" stroke="rgba(74,222,128,0.06)" strokeWidth="20" />
                </svg>
              </div>
            </div>

            {/* Menu links */}
            <div
              style={{
                position: 'relative',
                zIndex: 10,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                height: '100%',
                padding: '80px 60px',
              }}
            >
              {/* Close button inside menu */}
              <button
                onClick={closeMenu}
                className="absolute top-6 right-8 text-zinc-500 hover:text-white transition-colors text-sm"
              >
                ESC
              </button>

              <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                {navLinks.map((link) => (
                  <li key={link.href} className="menu-list-item" data-shape={link.shape} style={{ overflow: 'hidden', marginBottom: '8px' }}>
                    <Link
                      href={link.href}
                      onClick={closeMenu}
                      className="nav-link w-inline-block"
                      style={{ display: 'block', textDecoration: 'none' }}
                    >
                      <p
                        className="nav-link-text"
                        style={{
                          fontSize: 'clamp(2rem, 5vw, 3.5rem)',
                          fontWeight: 900,
                          color: link.href === '/sign-up' ? 'hsl(142, 76%, 48%)' : 'white',
                          lineHeight: 1.1,
                          transition: 'opacity 0.2s',
                        }}
                        onMouseEnter={(e) => { (e.target as HTMLElement).style.opacity = '0.6' }}
                        onMouseLeave={(e) => { (e.target as HTMLElement).style.opacity = '1' }}
                      >
                        {link.label}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>

              {/* Bottom links */}
              <div
                data-menu-fade
                style={{ marginTop: '60px', display: 'flex', gap: '24px', alignItems: 'center' }}
              >
                <Link href="/sign-in" onClick={closeMenu} className="text-zinc-500 hover:text-white text-sm transition-colors">
                  Sign In
                </Link>
                <span className="text-zinc-700">·</span>
                <Link href="/about" onClick={closeMenu} className="text-zinc-500 hover:text-white text-sm transition-colors">
                  About
                </Link>
                <span className="text-zinc-700">·</span>
                <Link href="/privacy" onClick={closeMenu} className="text-zinc-500 hover:text-white text-sm transition-colors">
                  Privacy
                </Link>
              </div>
            </div>
          </nav>
        </div>
      </section>
    </div>
  )
}

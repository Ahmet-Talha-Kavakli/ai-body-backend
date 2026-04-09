'use client'

import React, { useState, useRef, useEffect } from 'react'
import { motion, useSpring, AnimatePresence } from 'framer-motion'
import Link from 'next/link'

interface NavItem {
  label: string
  id: string
  href: string
}

/**
 * 3D Adaptive Navigation Pill
 * Smart navigation with hover expansion — adapted for FitAI dark theme
 */
export const PillBase: React.FC = () => {
  const [activeSection, setActiveSection] = useState('home')
  const [expanded, setExpanded] = useState(false)
  const [hovering, setHovering] = useState(false)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const prevSectionRef = useRef('home')

  const navItems: NavItem[] = [
    { label: 'Home', id: 'home', href: '/' },
    { label: 'Features', id: 'features', href: '#features' },
    { label: 'How It Works', id: 'how-it-works', href: '#how-it-works' },
    { label: 'Pricing', id: 'pricing', href: '#pricing' },
    { label: 'Sign In', id: 'signin', href: '/sign-in' },
    { label: 'Get Started', id: 'signup', href: '/sign-up' },
  ]

  // Spring animations for smooth motion
  const pillWidth = useSpring(140, { stiffness: 220, damping: 25, mass: 1 })
  const pillShift = useSpring(0, { stiffness: 220, damping: 25, mass: 1 })

  // Scroll spy — detect which section is in view
  useEffect(() => {
    const sectionIds = ['features', 'how-it-works', 'pricing']

    const handleScroll = () => {
      const scrollY = window.scrollY + 200

      for (const id of sectionIds) {
        const el = document.getElementById(id)
        if (el) {
          const top = el.offsetTop
          const bottom = top + el.offsetHeight
          if (scrollY >= top && scrollY < bottom) {
            setActiveSection(id)
            return
          }
        }
      }

      // Default to home if above all sections
      if (window.scrollY < 300) {
        setActiveSection('home')
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Handle hover expansion
  useEffect(() => {
    if (hovering) {
      setExpanded(true)
      pillWidth.set(680)
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current)
      }
    } else {
      hoverTimeoutRef.current = setTimeout(() => {
        setExpanded(false)
        pillWidth.set(140)
      }, 600)
    }

    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current)
      }
    }
  }, [hovering, pillWidth])

  const handleMouseEnter = () => {
    setHovering(true)
  }

  const handleMouseLeave = () => {
    setHovering(false)
  }

  const handleSectionClick = (item: NavItem) => {
    setIsTransitioning(true)
    prevSectionRef.current = item.id
    setActiveSection(item.id)

    // Collapse the pill after selection
    setHovering(false)

    // Smooth scroll to section if it's a hash link
    if (item.href.startsWith('#')) {
      const el = document.getElementById(item.href.slice(1))
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' })
      }
    }

    setTimeout(() => {
      setIsTransitioning(false)
    }, 400)
  }

  const activeItem = navItems.find((item) => item.id === activeSection) || navItems[0]

  return (
    <motion.nav
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="relative rounded-full"
      style={{
        width: pillWidth,
        height: '56px',
        background: `
          linear-gradient(135deg, 
            #1a1d21 0%, 
            #16181c 15%, 
            #131518 30%, 
            #101214 45%, 
            #0e1012 60%, 
            #0c0e10 75%, 
            #0a0c0e 90%, 
            #0d0f11 100%
          )
        `,
        boxShadow: expanded
          ? `
            0 2px 4px rgba(0, 0, 0, 0.25),
            0 6px 12px rgba(0, 0, 0, 0.35),
            0 12px 24px rgba(0, 0, 0, 0.30),
            0 24px 48px rgba(0, 0, 0, 0.20),
            inset 0 2px 2px rgba(255, 255, 255, 0.08),
            inset 0 -3px 8px rgba(0, 0, 0, 0.30),
            inset 3px 3px 8px rgba(0, 0, 0, 0.25),
            inset -3px 3px 8px rgba(0, 0, 0, 0.20),
            inset 0 -1px 2px rgba(0, 0, 0, 0.20),
            0 0 30px rgba(74, 222, 128, 0.06)
          `
          : isTransitioning
            ? `
            0 3px 6px rgba(0, 0, 0, 0.30),
            0 8px 16px rgba(0, 0, 0, 0.25),
            0 16px 32px rgba(0, 0, 0, 0.15),
            0 1px 2px rgba(0, 0, 0, 0.25),
            inset 0 2px 1px rgba(255, 255, 255, 0.06),
            inset 0 -2px 6px rgba(0, 0, 0, 0.20),
            inset 2px 2px 8px rgba(0, 0, 0, 0.15),
            inset -2px 2px 8px rgba(0, 0, 0, 0.12),
            inset 0 0 1px rgba(255, 255, 255, 0.05),
            inset 0 0 20px rgba(74, 222, 128, 0.04)
          `
            : `
            0 3px 6px rgba(0, 0, 0, 0.35),
            0 8px 16px rgba(0, 0, 0, 0.28),
            0 16px 32px rgba(0, 0, 0, 0.20),
            0 1px 2px rgba(0, 0, 0, 0.30),
            inset 0 2px 1px rgba(255, 255, 255, 0.05),
            inset 0 -2px 6px rgba(0, 0, 0, 0.25),
            inset 2px 2px 8px rgba(0, 0, 0, 0.20),
            inset -2px 2px 8px rgba(0, 0, 0, 0.18),
            inset 0 0 1px rgba(255, 255, 255, 0.06)
          `,
        x: pillShift,
        overflow: 'hidden',
        transition: 'box-shadow 0.3s ease-out',
      }}
    >
      {/* Primary top edge ridge */}
      <div
        className="absolute inset-x-0 top-0 rounded-t-full pointer-events-none"
        style={{
          height: '1.5px',
          background:
            'linear-gradient(90deg, rgba(74, 222, 128, 0) 0%, rgba(74, 222, 128, 0.3) 5%, rgba(74, 222, 128, 0.5) 15%, rgba(255, 255, 255, 0.15) 50%, rgba(74, 222, 128, 0.5) 85%, rgba(74, 222, 128, 0.3) 95%, rgba(74, 222, 128, 0) 100%)',
          filter: 'blur(0.3px)',
        }}
      />

      {/* Top hemisphere light catch */}
      <div
        className="absolute inset-x-0 top-0 rounded-full pointer-events-none"
        style={{
          height: '55%',
          background:
            'linear-gradient(180deg, rgba(255, 255, 255, 0.06) 0%, rgba(255, 255, 255, 0.03) 30%, rgba(255, 255, 255, 0.01) 60%, rgba(255, 255, 255, 0) 100%)',
        }}
      />

      {/* Directional light - top left */}
      <div
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{
          background:
            'linear-gradient(135deg, rgba(255, 255, 255, 0.06) 0%, rgba(255, 255, 255, 0.03) 20%, rgba(255, 255, 255, 0.01) 40%, rgba(255, 255, 255, 0) 65%)',
        }}
      />

      {/* Premium gloss reflection */}
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          left: expanded ? '18%' : '15%',
          top: '16%',
          width: expanded ? '140px' : '60px',
          height: '14px',
          background:
            'radial-gradient(ellipse at center, rgba(74, 222, 128, 0.12) 0%, rgba(74, 222, 128, 0.05) 40%, rgba(74, 222, 128, 0.02) 70%, rgba(74, 222, 128, 0) 100%)',
          filter: 'blur(4px)',
          transform: 'rotate(-12deg)',
          transition: 'all 0.3s ease',
        }}
      />

      {/* Secondary gloss accent - only show when expanded */}
      {expanded && (
        <div
          className="absolute rounded-full pointer-events-none"
          style={{
            right: '22%',
            top: '20%',
            width: '80px',
            height: '10px',
            background:
              'radial-gradient(ellipse at center, rgba(74, 222, 128, 0.08) 0%, rgba(74, 222, 128, 0.02) 60%, rgba(74, 222, 128, 0) 100%)',
            filter: 'blur(3px)',
            transform: 'rotate(8deg)',
          }}
        />
      )}

      {/* Left edge illumination - expanded only */}
      {expanded && (
        <div
          className="absolute inset-y-0 left-0 rounded-l-full pointer-events-none"
          style={{
            width: '35%',
            background:
              'linear-gradient(90deg, rgba(255, 255, 255, 0.04) 0%, rgba(255, 255, 255, 0.02) 40%, rgba(255, 255, 255, 0.005) 70%, rgba(255, 255, 255, 0) 100%)',
          }}
        />
      )}

      {/* Right edge shadow - expanded only */}
      {expanded && (
        <div
          className="absolute inset-y-0 right-0 rounded-r-full pointer-events-none"
          style={{
            width: '35%',
            background:
              'linear-gradient(270deg, rgba(0, 0, 0, 0.25) 0%, rgba(0, 0, 0, 0.12) 40%, rgba(0, 0, 0, 0.04) 70%, rgba(0, 0, 0, 0) 100%)',
          }}
        />
      )}

      {/* Bottom curvature shadow */}
      <div
        className="absolute inset-x-0 bottom-0 rounded-b-full pointer-events-none"
        style={{
          height: '50%',
          background:
            'linear-gradient(0deg, rgba(0, 0, 0, 0.30) 0%, rgba(0, 0, 0, 0.15) 25%, rgba(0, 0, 0, 0.06) 50%, rgba(0, 0, 0, 0) 100%)',
        }}
      />

      {/* Bottom edge contact shadow */}
      <div
        className="absolute inset-x-0 bottom-0 rounded-b-full pointer-events-none"
        style={{
          height: '20%',
          background: 'linear-gradient(0deg, rgba(0, 0, 0, 0.40) 0%, rgba(0, 0, 0, 0) 100%)',
          filter: 'blur(2px)',
        }}
      />

      {/* Inner diffuse glow */}
      <div
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{
          boxShadow: 'inset 0 0 40px rgba(74, 222, 128, 0.03)',
          opacity: 0.7,
        }}
      />

      {/* Micro edge definition */}
      <div
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{
          boxShadow: 'inset 0 0 0 0.5px rgba(255, 255, 255, 0.06)',
        }}
      />

      {/* Navigation items container */}
      <div
        ref={containerRef}
        className="relative z-10 h-full flex items-center justify-center px-6"
        style={{
          fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "SF Pro", Poppins, sans-serif',
        }}
      >
        {/* Collapsed — show active section name */}
        {!expanded && (
          <div className="flex items-center relative">
            <AnimatePresence mode="wait">
              {activeItem && (
                <motion.span
                  key={activeItem.id}
                  initial={{ opacity: 0, y: 8, filter: 'blur(4px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, y: -8, filter: 'blur(4px)' }}
                  transition={{
                    duration: 0.35,
                    ease: [0.4, 0.0, 0.2, 1],
                  }}
                  style={{
                    fontSize: '15.5px',
                    fontWeight: 680,
                    color: '#e4e4e7',
                    letterSpacing: '0.45px',
                    whiteSpace: 'nowrap',
                    WebkitFontSmoothing: 'antialiased',
                    MozOsxFontSmoothing: 'grayscale',
                    textShadow: `
                      0 1px 2px rgba(0, 0, 0, 0.6),
                      0 0 10px rgba(74, 222, 128, 0.15)
                    `,
                  }}
                >
                  {activeItem.id === 'home' ? (
                    <>
                      Fit<span style={{ color: 'hsl(142, 76%, 48%)' }}>AI</span>
                    </>
                  ) : (
                    activeItem.label
                  )}
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Expanded — show all nav items */}
        {expanded && (
          <div className="flex items-center justify-evenly w-full">
            {navItems.map((item, index) => {
              const isActive = item.id === activeSection
              const isSpecial = item.id === 'signup'

              // For page navigation (non-hash links), use Link
              const isPageLink = !item.href.startsWith('#')

              const buttonContent = (
                <motion.button
                  key={item.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{
                    delay: index * 0.06,
                    duration: 0.25,
                    ease: 'easeOut',
                  }}
                  onClick={() => handleSectionClick(item)}
                  className="relative cursor-pointer transition-all duration-200"
                  style={{
                    fontSize: isActive ? '14.5px' : '14px',
                    fontWeight: isActive ? 680 : isSpecial ? 600 : 510,
                    color: isSpecial
                      ? 'hsl(142, 76%, 48%)'
                      : isActive
                        ? '#e4e4e7'
                        : '#71717a',
                    textDecoration: 'none',
                    letterSpacing: '0.45px',
                    background: 'transparent',
                    border: 'none',
                    padding: '10px 12px',
                    outline: 'none',
                    whiteSpace: 'nowrap',
                    WebkitFontSmoothing: 'antialiased',
                    MozOsxFontSmoothing: 'grayscale',
                    transform: isActive ? 'translateY(-1.5px)' : 'translateY(0)',
                    textShadow: isSpecial
                      ? '0 0 12px rgba(74, 222, 128, 0.3)'
                      : isActive
                        ? `
                        0 1px 2px rgba(0, 0, 0, 0.5),
                        0 0 8px rgba(74, 222, 128, 0.12)
                      `
                        : `
                        0 1px 2px rgba(0, 0, 0, 0.4)
                      `,
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.color = isSpecial
                        ? 'hsl(142, 76%, 58%)'
                        : '#a1a1aa'
                      e.currentTarget.style.transform = 'translateY(-0.5px)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.color = isSpecial
                        ? 'hsl(142, 76%, 48%)'
                        : '#71717a'
                      e.currentTarget.style.transform = 'translateY(0)'
                    }
                  }}
                >
                  {item.label}
                </motion.button>
              )

              if (isPageLink) {
                return (
                  <Link key={item.id} href={item.href} style={{ textDecoration: 'none' }}>
                    {buttonContent}
                  </Link>
                )
              }

              return buttonContent
            })}
          </div>
        )}
      </div>
    </motion.nav>
  )
}

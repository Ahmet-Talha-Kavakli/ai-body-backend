'use client'

import { motion } from 'framer-motion'
import React from 'react'

interface SectionTransitionProps {
  children: React.ReactNode
  /** Optional divider style between sections */
  divider?: 'gradient' | 'glow' | 'fade' | 'none'
  /** Delay before the animation starts (in seconds) */
  delay?: number
  /** Custom className for the wrapper */
  className?: string
}

const sectionVariants = {
  hidden: {
    opacity: 0,
    y: 40,
    filter: 'blur(6px)',
  },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: {
      duration: 0.8,
    },
  },
}

/**
 * SectionTransition — wraps a landing page section and provides
 * a soft fade + slide + blur-resolve animation on scroll-enter,
 * with an optional decorative divider between sections.
 */
export function SectionTransition({
  children,
  divider = 'gradient',
  delay = 0,
  className = '',
}: SectionTransitionProps) {
  return (
    <>
      {/* Decorative section divider */}
      {divider !== 'none' && <SectionDivider variant={divider} />}

      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-60px' }}
        variants={{
          hidden: sectionVariants.hidden,
          visible: {
            ...sectionVariants.visible,
            transition: {
              ...sectionVariants.visible.transition,
              delay,
            },
          },
        }}
        className={className}
      >
        {children}
      </motion.div>
    </>
  )
}

/**
 * Decorative divider between sections
 */
function SectionDivider({ variant }: { variant: 'gradient' | 'glow' | 'fade' }) {
  if (variant === 'gradient') {
    return (
      <div className="relative w-full h-px overflow-visible">
        {/* Main subtle gradient line */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-zinc-800/60 to-transparent" />
        {/* Centered glow accent */}
        <div className="absolute left-1/2 -translate-x-1/2 top-0 w-32 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
      </div>
    )
  }

  if (variant === 'glow') {
    return (
      <div className="relative w-full h-8 overflow-visible">
        {/* Ambient glow orb */}
        <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 w-64 h-1 bg-primary/10 rounded-full blur-xl" />
        {/* Thin line */}
        <div className="absolute inset-x-0 top-1/2 h-px bg-gradient-to-r from-transparent via-zinc-800/40 to-transparent" />
      </div>
    )
  }

  // fade variant
  return (
    <div className="relative w-full">
      {/* Top fade-out of previous section */}
      <div className="h-16 bg-gradient-to-b from-transparent to-[#080808] pointer-events-none" />
      {/* Bottom fade-in to next section */}
      <div className="h-16 bg-gradient-to-t from-transparent to-[#080808] pointer-events-none" />
    </div>
  )
}

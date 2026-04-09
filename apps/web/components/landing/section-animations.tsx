'use client'

import React, { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

interface SectionAnimationsProps {
  children: React.ReactNode
  enableParallax?: boolean
  enableScale?: boolean
  staggerChildren?: boolean
  className?: string
}

export const SectionAnimations: React.FC<SectionAnimationsProps> = ({
  children,
  enableParallax = true,
  enableScale = true,
  staggerChildren = true,
  className = '',
}) => {
  const sectionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!sectionRef.current) return

    // Parallax animation for section
    if (enableParallax) {
      gsap.to(sectionRef.current, {
        y: window.innerHeight * 0.3,
        ease: 'none',
        scrollTrigger: {
          trigger: sectionRef.current,
          scrub: 0.5,
          markers: false,
        },
      })
    }

    // Scale animation
    if (enableScale) {
      gsap.set(sectionRef.current, { scale: 0.95, opacity: 0 })

      gsap.to(sectionRef.current, {
        scale: 1,
        opacity: 1,
        duration: 0.8,
        ease: 'back.out',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 80%',
          toggleActions: 'play none none none',
        },
      })
    }

    // Stagger children
    if (staggerChildren) {
      const children = sectionRef.current.querySelectorAll(
        '[data-animate="true"]'
      )
      if (children.length > 0) {
        gsap.set(children, { opacity: 0, y: 20 })

        gsap.to(children, {
          opacity: 1,
          y: 0,
          duration: 0.6,
          stagger: 0.05,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 75%',
            toggleActions: 'play none none none',
          },
        })
      }
    }

    return () => {
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill())
    }
  }, [enableParallax, enableScale, staggerChildren])

  return (
    <div ref={sectionRef} className={className}>
      {children}
    </div>
  )
}

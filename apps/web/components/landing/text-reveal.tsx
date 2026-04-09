'use client'

import React, { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

interface TextRevealProps {
  text: string
  variant?: 'h1' | 'h2' | 'h3' | 'body'
  accentWords?: string[]
  className?: string
}

gsap.registerPlugin(ScrollTrigger)

export const TextReveal: React.FC<TextRevealProps> = ({
  text,
  variant = 'h1',
  accentWords = [],
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const words = text.split(' ')
    const wordElements: HTMLSpanElement[] = []

    // Clear and rebuild with word spans
    containerRef.current.innerHTML = ''

    words.forEach((word) => {
      const span = document.createElement('span')
      span.textContent = word
      span.className = 'inline-block'
      span.style.opacity = '0'
      span.style.display = 'inline-block'
      span.style.marginRight = '0.25em'

      // Check if word should be accented
      if (
        accentWords.some((accent) =>
          word.toLowerCase().includes(accent.toLowerCase())
        )
      ) {
        span.className += ' text-indigo-500'
      }

      containerRef.current!.appendChild(span)
      wordElements.push(span)
    })

    // Create timeline for word-by-word reveal
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: containerRef.current,
        start: 'top 80%',
        toggleActions: 'play none none none',
      },
    })

    wordElements.forEach((word, index) => {
      tl.to(
        word,
        {
          opacity: 1,
          y: 0,
          duration: 0.3,
          ease: 'power2.out',
        },
        index * 0.08 // 80ms between words
      )
    })

    return () => {
      tl.kill()
    }
  }, [text, accentWords])

  const baseClasses = {
    h1: 'text-5xl md:text-6xl font-bold tracking-tight',
    h2: 'text-4xl md:text-5xl font-bold tracking-tight',
    h3: 'text-3xl md:text-4xl font-bold tracking-tight',
    body: 'text-lg leading-relaxed',
  }

  return (
    <div
      ref={containerRef}
      className={`${baseClasses[variant]} ${className}`}
      style={{ perspective: '1000px' }}
    />
  )
}

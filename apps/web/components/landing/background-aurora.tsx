'use client'

import React, { useEffect, useRef } from 'react'
import gsap from 'gsap'

interface BackgroundAuroraProps {
  children: React.ReactNode
}

export const BackgroundAurora: React.FC<BackgroundAuroraProps> = ({
  children,
}) => {
  const canvasRef = useRef<HTMLDivElement>(null)
  const blobsRef = useRef<HTMLDivElement[]>([])

  useEffect(() => {
    if (!canvasRef.current) return

    // Initialize animated blobs
    const blobs = canvasRef.current.querySelectorAll('.blob')
    blobsRef.current = Array.from(blobs) as HTMLDivElement[]

    // Animate each blob at different speeds
    blobsRef.current.forEach((blob, index) => {
      const duration = 15 + index * 5 // 15s, 20s, 25s, etc.
      const speed = 0.3 - index * 0.1 // 0.3, 0.2, 0.1

      gsap.to(blob, {
        x: `${Math.sin(index) * 100}px`,
        y: `${Math.cos(index) * 100}px`,
        duration,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      })

      // Parallax effect
      gsap.to(
        blob,
        {
          y: window.innerHeight * speed,
          ease: 'none',
          scrollTrigger: {
            trigger: document.body,
            scrub: 1,
            markers: false,
          },
        }
      )
    })

    return () => {
      blobsRef.current.forEach((blob) => {
        gsap.killTweensOf(blob)
      })
    }
  }, [])

  return (
    <div ref={canvasRef} className="relative min-h-screen bg-[#080808]">
      {/* Aurora gradient background */}
      <div className="fixed inset-0 -z-20 bg-gradient-to-b from-indigo-950 via-slate-900 to-blue-950 animate-aurora-shift" />

      {/* Animated blobs */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        {/* Blob 1 */}
        <div
          className="blob absolute w-96 h-96 rounded-full opacity-20"
          style={{
            background:
              'radial-gradient(circle at 30% 30%, rgba(99, 102, 241, 0.4), transparent)',
            filter: 'blur(60px)',
            top: '10%',
            left: '5%',
          }}
        />

        {/* Blob 2 */}
        <div
          className="blob absolute w-80 h-80 rounded-full opacity-15"
          style={{
            background:
              'radial-gradient(circle at 70% 70%, rgba(26, 26, 46, 0.3), transparent)',
            filter: 'blur(50px)',
            top: '50%',
            right: '10%',
          }}
        />

        {/* Blob 3 */}
        <div
          className="blob absolute w-72 h-72 rounded-full opacity-10"
          style={{
            background:
              'radial-gradient(circle at 50% 50%, rgba(15, 52, 96, 0.2), transparent)',
            filter: 'blur(70px)',
            bottom: '10%',
            left: '30%',
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-0">{children}</div>
    </div>
  )
}

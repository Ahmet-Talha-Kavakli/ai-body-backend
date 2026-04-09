'use client'

import React, { useRef } from 'react'
import { createWaveEffect } from '@/lib/animations/wave-effect'

interface WaveContainerProps {
  children: React.ReactNode
  className?: string
  waveColor?: string
}

export const WaveContainer: React.FC<WaveContainerProps> = ({
  children,
  className = '',
  waveColor = 'rgba(99, 102, 241, 0.3)',
}) => {
  const containerRef = useRef<HTMLDivElement>(null)

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (containerRef.current) {
      createWaveEffect(e as any, {
        color: waveColor,
        maxRadius: 150,
        duration: 600,
      })
    }
  }

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      className={`relative ${className}`}
      style={{
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {children}
    </div>
  )
}

'use client'

import React from 'react'
import Link from 'next/link'

interface GradientHoverButtonProps {
  children: React.ReactNode
  href?: string
  onClick?: () => void
  className?: string
  hoverText?: string
}

export function GradientHoverButton({
  children,
  href,
  onClick,
  className = '',
  hoverText,
}: GradientHoverButtonProps) {
  const display = hoverText ?? children

  const inner = (
    <button
      onClick={onClick}
      className={`relative inline-flex h-14 items-center rounded-full px-8 font-semibold text-lg text-gray-800 transition-all duration-300 ${className}`}
      style={{ backgroundColor: 'rgba(255, 208, 116)' }}
    >
      <div
        className="absolute inset-0 overflow-hidden rounded-full"
        style={{ transform: 'scale(1)', transition: 'transform 1.8s cubic-bezier(0.19, 1, 0.22, 1)' }}
      >
        <div className="absolute top-[-60%] left-1/2 aspect-square w-[max(200%,10rem)]" style={{ transform: 'translate(-50%)' }}>
          <div className="absolute inset-0 rounded-full" style={{ backgroundColor: 'rgba(163, 116, 255)', transform: 'scale(0)', transition: 'transform 1.3s cubic-bezier(0.19, 1, 0.22, 1)' }} />
          <div className="absolute inset-0 rounded-full" style={{ backgroundColor: 'rgba(23, 241, 209)', transform: 'scale(0)', transition: 'transform 1.3s cubic-bezier(0.19, 1, 0.22, 1)', transitionDelay: '0.1s' }} />
          <div className="absolute inset-0 rounded-full" style={{ backgroundColor: 'rgba(255, 208, 116)', transform: 'scale(0)', transition: 'transform 1.3s cubic-bezier(0.19, 1, 0.22, 1)', transitionDelay: '0.2s' }} />
        </div>
      </div>
      <div className="relative pointer-events-none">
        <span className="block transition-all duration-300" style={{ transform: 'translateY(0)', opacity: 1 }}>{children}</span>
        <span className="absolute top-0 left-0 block transition-all duration-300" style={{ transform: 'translateY(70%)', opacity: 0 }}>{display}</span>
      </div>
      <style>{`
        button:hover > div:first-child { transform: scale(1.1); }
        button:hover > div:first-child > div:nth-child(1) { transform: scale(1) !important; }
        button:hover > div:first-child > div:nth-child(2) { transform: scale(1) !important; }
        button:hover > div:first-child > div:nth-child(3) { transform: scale(1) !important; }
        button:hover > div:last-child > span:first-child { opacity: 0; transform: translateY(-70%); }
        button:hover > div:last-child > span:last-child { opacity: 1; transform: translateY(0); }
      `}</style>
    </button>
  )

  if (href) return <Link href={href}>{inner}</Link>
  return inner
}

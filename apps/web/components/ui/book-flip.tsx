'use client'

import React from 'react'

export function BookFlip() {
  return (
    <div
      className="relative w-56 h-80 bg-gray-100 rounded-lg shadow-2xl flex items-center justify-center cursor-pointer"
      style={{ perspective: '2000px', transformStyle: 'preserve-3d' }}
    >
      <p className="text-2xl font-bold text-black z-10">Hello</p>

      <div
        className="absolute top-0 left-0 w-full h-full bg-gray-400 rounded-lg shadow-2xl flex items-center justify-center cursor-pointer transition-transform duration-500 hover:shadow-2xl"
        style={{
          transformOrigin: '0 0',
          transform: 'rotateY(0deg)',
        }}
        onMouseEnter={(e) => {
          const el = e.currentTarget as HTMLElement
          el.style.transform = 'rotateY(-80deg)'
        }}
        onMouseLeave={(e) => {
          const el = e.currentTarget as HTMLElement
          el.style.transform = 'rotateY(0deg)'
        }}
      >
        <p className="text-2xl font-bold text-black">Hover Me</p>
      </div>

      <style>{`
        div[style*="transformOrigin"] {
          transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        }
      `}</style>
    </div>
  )
}

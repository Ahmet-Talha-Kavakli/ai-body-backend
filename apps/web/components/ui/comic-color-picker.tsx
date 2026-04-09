'use client'

import React, { useState } from 'react'

interface ColorOption {
  hex: string
  name: string
}

const COLORS: ColorOption[] = [
  { hex: '#e11d48', name: 'Rose' },
  { hex: '#f472b6', name: 'Pink' },
  { hex: '#fb923c', name: 'Orange' },
  { hex: '#facc15', name: 'Yellow' },
  { hex: '#84cc16', name: 'Lime' },
  { hex: '#10b981', name: 'Emerald' },
  { hex: '#0ea5e9', name: 'Cyan' },
  { hex: '#3b82f6', name: 'Blue' },
  { hex: '#8b5cf6', name: 'Violet' },
  { hex: '#a78bfa', name: 'Purple' },
]

export function ComicColorPicker() {
  const [copied, setCopied] = useState(false)

  const handleColorClick = (hex: string) => {
    navigator.clipboard.writeText(hex)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex h-full w-full items-center justify-center overflow-hidden bg-amber-100">
      <div className="relative w-full max-w-4xl px-4">
        {/* Comic Panel */}
        <div className="rounded-lg border-4 border-black bg-white p-5 shadow-lg" style={{ boxShadow: '4px 4px 0px rgba(0, 0, 0, 1)' }}>
          {/* Color Container */}
          <div className="flex items-center justify-center" style={{ perspective: '1000px' }}>
            {COLORS.map((color) => (
              <button
                key={color.hex}
                onClick={() => handleColorClick(color.hex)}
                className="group relative -mx-1 flex-shrink-0 w-10 h-12 border-none bg-transparent outline-none transition-all duration-300 ease-out cursor-pointer hover:scale-150 hover:-translate-y-1.5 hover:z-[99999] active:z-40"
              >
                {/* Color Box */}
                <div
                  className="absolute inset-0 w-10 h-10 rounded-md border-4 border-black transition-all duration-300 cubic-bezier(0.175, 0.885, 0.32, 1.275) pointer-events-none group-active:translate-x-0.5 group-active:translate-y-0.5"
                  style={{
                    backgroundColor: color.hex,
                    boxShadow: '4px 4px 0 0 #000',
                  }}
                />

                {/* Tooltip Label */}
                <div
                  className="absolute left-1/2 bottom-16 -translate-x-1/2 px-2.5 py-1.5 bg-amber-100 border-3 border-black rounded-md text-sm font-bold leading-tight whitespace-nowrap pointer-events-none opacity-0 invisible transition-all duration-300 cubic-bezier(0.175, 0.885, 0.32, 1.275) group-hover:opacity-100 group-hover:visible group-hover:scale-100 group-hover:translate-y-0 scale-50 translate-y-2.5"
                  style={{
                    transformOrigin: 'bottom center',
                  }}
                >
                  {color.hex}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Copied Notification */}
        {copied && (
          <div className="fixed top-4 right-4 px-4 py-2 bg-green-100 border-2 border-black rounded-md font-bold text-sm animate-bounce" style={{ boxShadow: '2px 2px 0 0 #000' }}>
            Copied to clipboard!
          </div>
        )}
      </div>
    </div>
  )
}

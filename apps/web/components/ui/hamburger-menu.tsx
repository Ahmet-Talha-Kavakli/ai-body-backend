'use client'

import React, { useState } from 'react'

export function HamburgerMenu() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <label className="cursor-pointer block">
      <input
        type="checkbox"
        checked={isOpen}
        onChange={(e) => setIsOpen(e.target.checked)}
        className="hidden"
      />

      <svg
        viewBox="0 0 32 32"
        className={`h-12 transition-transform duration-600 ease-in-out ${
          isOpen ? '-rotate-45' : 'rotate-0'
        }`}
      >
        <path
          className={`transition-all duration-600 ease-in-out ${
            isOpen ? '[stroke-dasharray:20_300] [stroke-dashoffset:-32.42]' : '[stroke-dasharray:12_63] [stroke-dashoffset:0]'
          }`}
          d="M27 10 13 10C10.8 10 9 8.2 9 6 9 3.5 10.8 2 13 2 15.2 2 17 3.8 17 6L17 26C17 28.2 18.8 30 21 30 23.2 30 25 28.2 25 26 25 23.8 23.2 22 21 22L7 22"
          fill="none"
          stroke="white"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="3"
        />
        <path
          d="M7 16 27 16"
          fill="none"
          stroke="white"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="3"
          className="transition-all duration-600 ease-in-out"
        />
      </svg>

      <style>{`
        path {
          transition: stroke-dasharray 600ms cubic-bezier(0.4, 0, 0.2, 1),
                      stroke-dashoffset 600ms cubic-bezier(0.4, 0, 0.2, 1);
        }
      `}</style>
    </label>
  )
}

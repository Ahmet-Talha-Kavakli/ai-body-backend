'use client'

import React, { useState } from 'react'

export function CreditCardFlip() {
  const [isFlipped, setIsFlipped] = useState(false)

  return (
    <div
      className="relative w-60 h-40 perspective cursor-pointer"
      onMouseEnter={() => setIsFlipped(true)}
      onMouseLeave={() => setIsFlipped(false)}
      style={{ perspective: '1000px' }}
    >
      <div
        className="relative w-full h-full transition-transform duration-700"
        style={{
          transformStyle: 'preserve-3d',
          transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
        }}
      >
        {/* Front */}
        <div
          className="absolute w-full h-full bg-gray-900 rounded-2xl shadow-2xl text-white p-6 flex flex-col justify-between"
          style={{ backfaceVisibility: 'hidden' }}
        >
          {/* Top Section */}
          <div>
            <p className="text-xs font-bold tracking-widest">MASTERCARD</p>
          </div>

          {/* Logos & Chip */}
          <div className="flex justify-between items-center">
            <div className="flex gap-1">
              <svg className="w-6 h-6" viewBox="0 0 48 48">
                <path fill="#ff9800" d="M32 10A14 14 0 1 0 32 38A14 14 0 1 0 32 10Z" />
                <path fill="#d50000" d="M16 10A14 14 0 1 0 16 38A14 14 0 1 0 16 10Z" />
                <path
                  fill="#ff3d00"
                  d="M18,24c0,4.755,2.376,8.95,6,11.48c3.624-2.53,6-6.725,6-11.48s-2.376-8.95-6-11.48 C20.376,15.05,18,19.245,18,24z"
                />
              </svg>
            </div>

            {/* Chip */}
            <div className="w-8 h-8 bg-yellow-600 rounded flex items-center justify-center">
              <div className="w-6 h-6 bg-yellow-500 rounded-sm grid grid-cols-2 gap-1 p-1">
                <div className="bg-yellow-700 rounded-sm" />
                <div className="bg-yellow-700 rounded-sm" />
                <div className="bg-yellow-700 rounded-sm" />
                <div className="bg-yellow-700 rounded-sm" />
              </div>
            </div>

            {/* Contactless */}
            <svg className="w-5 h-5" viewBox="0 0 50 50" fill="currentColor">
              <circle cx="25" cy="25" r="3" />
              <circle cx="25" cy="25" r="8" fill="none" stroke="currentColor" strokeWidth="1.5" />
              <circle cx="25" cy="25" r="13" fill="none" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </div>

          {/* Card Details */}
          <div>
            <p className="text-xs text-gray-400 mb-1">CARD NUMBER</p>
            <p className="text-lg font-mono font-bold tracking-widest mb-4">9759 2484 5269 6576</p>

            <div className="flex justify-between">
              <div>
                <p className="text-xs text-gray-400">CARDHOLDER</p>
                <p className="text-xs font-bold tracking-wide">BRUCE WAYNE</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">VALID THRU</p>
                <p className="text-xs font-bold">12 / 24</p>
              </div>
            </div>
          </div>
        </div>

        {/* Back */}
        <div
          className="absolute w-full h-full bg-gray-900 rounded-2xl shadow-2xl text-white p-6 flex flex-col justify-between"
          style={{
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
          }}
        >
          {/* Magnetic Stripe */}
          <div className="w-full h-8 bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 rounded" />

          {/* CVV Section */}
          <div className="flex flex-col items-end gap-2">
            <p className="text-xs text-gray-400">CVV</p>
            <div className="bg-white text-black px-3 py-1 rounded font-mono font-bold text-sm tracking-wider">
              ***
            </div>
          </div>

          <p className="text-xs text-gray-500 text-center">Authorized user only</p>
        </div>
      </div>
    </div>
  )
}

'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'

interface CreditCardProps {
  cardNumber?: string
  cardholderName?: string
  expiryDate?: string
  cvv?: string
}

export function CreditCard({
  cardNumber = '9759 2484 5269 6576',
  cardholderName = 'BRUCE WAYNE',
  expiryDate = '12 / 24',
  cvv = '***',
}: CreditCardProps) {
  const [isFlipped, setIsFlipped] = useState(false)

  return (
    <motion.div
      className="w-64 h-40 cursor-pointer"
      onClick={() => setIsFlipped(!isFlipped)}
      whileHover={{ scale: 1.02 }}
      style={{
        perspective: '1000px',
      }}
    >
      <motion.div
        className="relative w-full h-full"
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.8 }}
        style={{
          transformStyle: 'preserve-3d' as any,
        }}
      >
        {/* Front */}
        <div
          className="absolute inset-0 bg-gradient-to-br from-gray-800 to-black rounded-2xl p-6 text-white shadow-2xl flex flex-col justify-between"
          style={{
            backfaceVisibility: 'hidden' as any,
          }}
        >
          {/* Header */}
          <div>
            <p className="text-sm font-bold tracking-widest uppercase">MASTERCARD</p>
          </div>

          {/* Logo & Chip */}
          <div className="flex justify-between items-center">
            <div className="flex gap-1">
              <div className="w-6 h-6 rounded-full bg-yellow-500 opacity-80" />
              <div className="w-6 h-6 rounded-full bg-red-500 opacity-80" />
            </div>
            <div className="w-8 h-8 bg-yellow-600 rounded flex items-center justify-center">
              <div className="w-6 h-6 bg-yellow-500 rounded-sm" />
            </div>
          </div>

          {/* Card details */}
          <div>
            <p className="text-xs text-gray-400 mb-1">CARD NUMBER</p>
            <p className="text-lg font-mono tracking-widest font-bold mb-4">{cardNumber}</p>

            <div className="flex justify-between">
              <div>
                <p className="text-xs text-gray-400">CARDHOLDER</p>
                <p className="text-xs font-bold tracking-wide">{cardholderName}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">VALID THRU</p>
                <p className="text-xs font-bold">{expiryDate}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Back */}
        <div
          className="absolute inset-0 bg-gradient-to-br from-gray-800 to-black rounded-2xl p-6 text-white shadow-2xl flex flex-col justify-between"
          style={{
            backfaceVisibility: 'hidden' as any,
            transform: 'rotateY(180deg)',
          }}
        >
          {/* Magnetic stripe */}
          <div className="w-full h-10 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 rounded" />

          {/* CVV */}
          <div className="flex flex-col items-end gap-2">
            <p className="text-xs text-gray-400">CVV</p>
            <div className="bg-white text-black px-3 py-1 rounded font-mono font-bold text-sm tracking-wider">
              {cvv}
            </div>
          </div>

          <p className="text-xs text-gray-500 text-center">Authorized user only</p>
        </div>
      </motion.div>
    </motion.div>
  )
}

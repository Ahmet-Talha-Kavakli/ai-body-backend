'use client'

import { useEffect } from 'react'
import { motion } from 'framer-motion'
import type { StepProps } from '../page'

// CSS-based confetti pieces
const CONFETTI_COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6']

function ConfettiPiece({ index }: { index: number }) {
  const color = CONFETTI_COLORS[index % CONFETTI_COLORS.length]
  const left = `${(index * 37) % 100}%`
  const delay = `${(index * 0.15) % 2}s`
  const duration = `${2.5 + (index % 3) * 0.5}s`
  const size = index % 2 === 0 ? '8px' : '12px'

  return (
    <div
      style={{
        position: 'absolute',
        left,
        top: '-20px',
        width: size,
        height: size,
        backgroundColor: color,
        borderRadius: index % 3 === 0 ? '50%' : '2px',
        animation: `confettiFall ${duration} ${delay} linear infinite`,
        transform: `rotate(${index * 45}deg)`,
        opacity: 0.9,
      }}
    />
  )
}

interface Step10Props extends StepProps {
  isSubmitting: boolean
}

export function Step10Ready({ isSubmitting }: Step10Props) {
  return (
    <div className="relative flex min-h-[60vh] flex-col items-center justify-center overflow-hidden px-4 text-center">
      {/* Confetti */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {Array.from({ length: 24 }, (_, i) => (
          <ConfettiPiece key={i} index={i} />
        ))}
      </div>

      <style>{`
        @keyframes confettiFall {
          0% { transform: translateY(-20px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
      `}</style>

      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 12 }}
        className="mb-6 text-8xl"
      >
        🚀
      </motion.div>

      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mb-4 text-4xl font-bold text-white"
      >
        Yolculuğun Başlıyor!
      </motion.h2>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
        className="mb-10 max-w-sm text-lg text-white/70"
      >
        Verdiğin bilgiler üzerinden kişisel planın hazırlanıyor...
      </motion.p>

      {/* Loading spinner */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="flex flex-col items-center gap-4"
      >
        {isSubmitting && (
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-white/20 border-t-indigo-500" />
        )}
        <p className="text-sm text-white/40">
          {isSubmitting ? 'Kaydediliyor...' : "Dashboard'a yönlendiriliyorsunuz..."}
        </p>
      </motion.div>
    </div>
  )
}

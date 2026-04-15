'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Lock, Sparkles, X } from 'lucide-react'
import Link from 'next/link'

interface PremiumGateProps {
  feature: string
  children: React.ReactNode
  userTier?: string
}

export function PremiumGate({ feature: _feature, children, userTier = 'free' }: PremiumGateProps) {
  const [showModal, setShowModal] = useState(false)

  const isPremium = userTier !== 'free'

  if (isPremium) return <>{children}</>

  return (
    <>
      <div className="relative cursor-pointer" onClick={() => setShowModal(true)}>
        <div className="pointer-events-none select-none opacity-40 blur-sm">{children}</div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-indigo-500/30 bg-black/60 p-4 backdrop-blur-sm">
            <Lock size={24} className="text-indigo-400" />
            <p className="text-sm font-bold text-white">Premium Özellik</p>
            <p className="text-center text-xs text-white/60">Bu özelliğe erişmek için yükseltin</p>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-sm rounded-3xl border border-indigo-500/30 bg-gradient-to-br from-indigo-900 to-purple-900 p-6"
            >
              <button onClick={() => setShowModal(false)} className="absolute right-4 top-4">
                <X size={20} className="text-white/40" />
              </button>
              <div className="space-y-4 text-center">
                <div className="text-4xl">✨</div>
                <h2 className="text-xl font-black text-white">Premium Gerekli</h2>
                <p className="text-sm text-white/60">
                  Bu özelliği kullanmak için Premium&apos;a geçin.
                </p>
                <Link href="/dashboard/settings/premium" onClick={() => setShowModal(false)}>
                  <div className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 py-3 font-bold text-white">
                    <Sparkles size={18} />
                    Premium&apos;a Geç
                  </div>
                </Link>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

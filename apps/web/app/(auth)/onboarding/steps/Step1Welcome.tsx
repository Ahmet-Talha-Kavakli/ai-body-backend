'use client'

import { motion } from 'framer-motion'
import type { StepProps } from '../page'

export function Step1Welcome({ onNext }: StepProps) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
        className="mb-6 text-8xl"
      >
        🎉
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mb-4 text-4xl font-bold text-white"
      >
        FitAI&apos;ya Hoş Geldin!
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
        className="mb-10 max-w-md text-lg text-white/70"
      >
        Sana özel bir yolculuk başlıyor. Birkaç soru sormamıza izin ver ve kişisel fitness planını
        oluşturalım.
      </motion.p>

      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.97 }}
        onClick={onNext}
        className="rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 px-10 py-4 text-lg font-semibold text-white shadow-lg shadow-indigo-500/30 transition-shadow hover:shadow-indigo-500/50"
      >
        Başla →
      </motion.button>
    </div>
  )
}

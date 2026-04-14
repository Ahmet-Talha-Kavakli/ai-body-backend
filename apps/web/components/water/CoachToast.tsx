'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Bot } from 'lucide-react'

interface CoachToastProps {
  message: string | null
}

export function CoachToast({ message }: CoachToastProps) {
  return (
    <AnimatePresence>
      {message && (
        <motion.div
          key={message}
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="flex items-start gap-3 rounded-2xl border border-[#3B82F6]/20 bg-[#3B82F6]/10 p-4"
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#3B82F6]/20">
            <Bot size={16} className="text-[#3B82F6]" />
          </div>
          <p className="text-sm leading-relaxed text-white/90">{message}</p>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

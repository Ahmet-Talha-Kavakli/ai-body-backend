'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { Zap, Check } from 'lucide-react'
import { OnboardingForm } from '@/components/profile/OnboardingForm'

export default function OnboardingPage() {
  const router = useRouter()
  const [completed, setCompleted] = useState(false)

  const handleComplete = () => {
    setCompleted(true)
    setTimeout(() => router.push('/dashboard'), 1800)
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-12">
      {/* Logo */}
      <div className="fixed top-6 left-6 flex items-center gap-2 z-10">
        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
          <Zap size={16} className="text-primary-foreground" />
        </div>
        <span className="font-bold text-lg">FitAI</span>
      </div>

      <div className="w-full max-w-xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-4">
            <Zap size={12} className="text-primary" />
            <span className="text-xs font-semibold text-primary">Profil Kurulumu</span>
          </div>
          <h1 className="text-3xl font-black mb-2">Seni tanıyalım</h1>
          <p className="text-muted-foreground text-sm">
            AI koçun sana en iyi programı oluşturabilmesi için birkaç bilgiye ihtiyacı var.
          </p>
        </motion.div>

        {/* Form */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card/50 border border-border/30 rounded-2xl p-6 backdrop-blur-sm shadow-xl"
        >
          <OnboardingForm onComplete={handleComplete} />
        </motion.div>

        <p className="text-center mt-4">
          <button
            onClick={() => router.push('/dashboard')}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Şimdilik atla, daha sonra tamamla
          </button>
        </p>
      </div>

      {/* Success overlay */}
      <AnimatePresence>
        {completed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-background/95 backdrop-blur-sm flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
              className="text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: 'spring', stiffness: 220 }}
                className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mx-auto mb-6"
              >
                <Check size={36} className="text-primary-foreground" />
              </motion.div>
              <h2 className="text-3xl font-black mb-2">Harika! 🎉</h2>
              <p className="text-muted-foreground">Profilin oluşturuldu. Dashboard'a yönlendiriliyorsun...</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

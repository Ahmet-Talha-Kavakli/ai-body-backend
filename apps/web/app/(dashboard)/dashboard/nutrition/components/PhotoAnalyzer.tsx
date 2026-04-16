'use client'

import { useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Camera, Loader2, CheckCircle, AlertCircle } from 'lucide-react'

interface AnalyzedFood {
  name: string
  calories: number
  protein: number
  carbs: number
  fat: number
  amount: number
  unit: string
}

interface PhotoAnalyzerProps {
  mealType: string
  onAnalyzed: (foods: AnalyzedFood[]) => void
}

export function PhotoAnalyzer({ mealType, onAnalyzed }: PhotoAnalyzerProps) {
  const [status, setStatus] = useState<'idle' | 'analyzing' | 'done' | 'error'>('idle')
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = async (file: File) => {
    setStatus('analyzing')
    try {
      const reader = new FileReader()
      reader.onload = async (e) => {
        const base64 = (e.target?.result as string).split(',')[1]
        const res = await fetch('/api/nutrition/analyze-photo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: base64, mealType }),
        })
        if (res.ok) {
          const data = await res.json()
          onAnalyzed(data.foods ?? [])
          setStatus('done')
          setTimeout(() => setStatus('idle'), 3000)
        } else {
          setStatus('error')
          setTimeout(() => setStatus('idle'), 3000)
        }
      }
      reader.readAsDataURL(file)
    } catch {
      setStatus('error')
      setTimeout(() => setStatus('idle'), 3000)
    }
  }

  const Icon =
    status === 'analyzing'
      ? Loader2
      : status === 'done'
        ? CheckCircle
        : status === 'error'
          ? AlertCircle
          : Camera

  const label =
    status === 'analyzing'
      ? 'Analiz ediliyor...'
      : status === 'done'
        ? 'Tamamlandı!'
        : status === 'error'
          ? 'Hata oluştu'
          : 'Fotoğraf ile Analiz'

  const colorClass =
    status === 'done'
      ? 'text-green-400 border-green-500/20 bg-green-500/10'
      : status === 'error'
        ? 'text-red-400 border-red-500/20 bg-red-500/10'
        : 'text-indigo-300 border-indigo-500/20 bg-indigo-500/10'

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
      />
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={() => inputRef.current?.click()}
        disabled={status === 'analyzing'}
        className={`flex w-full items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm font-medium transition-colors ${colorClass} disabled:opacity-60`}
      >
        <Icon size={16} className={status === 'analyzing' ? 'animate-spin' : ''} />
        {label}
      </motion.button>
    </>
  )
}

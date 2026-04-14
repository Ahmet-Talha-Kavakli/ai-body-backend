'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Upload, Loader2, Check, AlertCircle } from 'lucide-react'
import type { MealType } from '@/lib/nutrition/types'

const MEAL_LABELS: Record<MealType, string> = {
  breakfast: 'Kahvaltı',
  lunch: 'Öğle Yemeği',
  dinner: 'Akşam Yemeği',
  snack: 'Ara Öğün',
  pre_workout: 'Antrenman Öncesi',
  post_workout: 'Antrenman Sonrası',
}

interface AnalysisResult {
  name: string
  calories: number
  protein: number
  carbs: number
  fat: number
}

interface Props {
  onClose: () => void
  onSaved: () => void
}

export function MealPhotoAnalyzer({ onClose, onSaved }: Props) {
  const [phase, setPhase] = useState<'upload' | 'analyzing' | 'result' | 'error'>('upload')
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [mealType, setMealType] = useState<MealType>('snack')
  const [saving, setSaving] = useState(false)
  const [dragging, setDragging] = useState(false)

  const analyze = useCallback(async (file: File) => {
    setPhase('analyzing')
    try {
      const formData = new FormData()
      formData.append('photo', file)
      const res = await fetch('/api/ai/analyze-meal-photo', { method: 'POST', body: formData })
      if (!res.ok) throw new Error('Analysis failed')
      const data = await res.json()
      setResult(data)
      setPhase('result')
    } catch {
      setPhase('error')
    }
  }, [])

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) return
    analyze(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const handleSave = async () => {
    if (!result) return
    setSaving(true)
    await fetch('/api/nutrition', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mealType,
        aiAnalyzed: true,
        items: [{ name: result.name, calories: result.calories }],
        totalCalories: result.calories,
        totalProteinG: result.protein,
        totalCarbsG: result.carbs,
        totalFatG: result.fat,
      }),
    })
    await fetch('/api/nutrition/streak', { method: 'POST' })
    setSaving(false)
    onSaved()
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 60, opacity: 0 }}
        transition={{ type: 'spring', bounce: 0.34 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-[1.5rem] border border-white/[0.06] p-[1px]"
      >
        <div className="rounded-[calc(1.5rem-1px)] bg-[#12121E] p-6">
          <div className="mb-5 flex items-center justify-between">
            <h3 className="font-semibold text-white">Fotoğrafla Analiz</h3>
            <button onClick={onClose} className="cursor-pointer rounded-lg p-1.5 transition-colors hover:bg-white/[0.08]">
              <X size={16} className="text-[#64748B]" />
            </button>
          </div>

          {phase === 'upload' && (
            <div
              onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              className={`rounded-xl border-2 border-dashed p-8 text-center transition-colors ${dragging ? 'border-[#6366F1] bg-[#6366F1]/5' : 'border-white/[0.10]'}`}
            >
              <Upload size={32} className="mx-auto mb-3 text-[#64748B]" />
              <p className="mb-3 text-sm text-[#64748B]">Fotoğrafı sürükle bırak</p>
              <label className="cursor-pointer rounded-xl bg-[#6366F1] px-4 py-2 text-sm text-white transition-colors hover:bg-[#4F46E5]">
                Dosya Seç
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
                />
              </label>
            </div>
          )}

          {phase === 'analyzing' && (
            <div className="flex flex-col items-center justify-center gap-4 py-12">
              <div className="w-full animate-pulse space-y-3">
                <div className="h-5 w-3/4 rounded bg-white/[0.06]" />
                <div className="h-4 w-1/2 rounded bg-white/[0.06]" />
                <div className="mt-4 grid grid-cols-4 gap-2">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-12 rounded-lg bg-white/[0.06]" />
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-[#64748B]">
                <Loader2 size={16} className="animate-spin" />
                AI analiz ediyor...
              </div>
            </div>
          )}

          {phase === 'result' && result && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Check size={16} className="text-[#22C55E]" />
                <p className="font-medium text-white">{result.name}</p>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: 'Kcal', value: result.calories },
                  { label: 'Protein', value: `${result.protein}g` },
                  { label: 'Karbo', value: `${result.carbs}g` },
                  { label: 'Yağ', value: `${result.fat}g` },
                ].map((m) => (
                  <div key={m.label} className="rounded-lg bg-white/[0.04] p-2 text-center">
                    <p className="font-['Barlow_Condensed'] text-base font-bold text-white">{m.value}</p>
                    <p className="text-[10px] text-[#64748B]">{m.label}</p>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {(Object.entries(MEAL_LABELS) as [MealType, string][]).map(([type, label]) => (
                  <button
                    key={type}
                    onClick={() => setMealType(type)}
                    className={`cursor-pointer rounded-full px-3 py-1 text-xs transition-colors ${mealType === type ? 'bg-[#6366F1] text-white' : 'bg-white/[0.04] text-[#64748B]'}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#6366F1] py-3 text-sm font-semibold text-white transition-colors hover:bg-[#4F46E5] disabled:opacity-50"
              >
                {saving && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />}
                Günlüğe Ekle
              </button>
            </div>
          )}

          {phase === 'error' && (
            <div className="flex flex-col items-center gap-3 py-8">
              <AlertCircle size={32} className="text-red-400" />
              <p className="text-sm text-[#64748B]">Analiz başarısız. Tekrar dene.</p>
              <button
                onClick={() => setPhase('upload')}
                className="cursor-pointer rounded-xl bg-[#6366F1] px-4 py-2 text-sm text-white"
              >
                Tekrar Dene
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}

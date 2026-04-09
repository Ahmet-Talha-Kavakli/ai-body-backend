'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Camera, X, Loader2, CheckCircle, AlertCircle } from 'lucide-react'

interface AnalysisResult {
  foodItems: { name: string; portion: string; calories: number; proteinG: number; carbsG: number; fatG: number }[]
  totalCalories: number
  totalProteinG: number
  totalCarbsG: number
  totalFatG: number
  confidence: string
  notes?: string
}

interface Props {
  onClose: () => void
  onSaved: () => void
}

export function MealPhotoAnalyzer({ onClose, onSaved }: Props) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [base64, setBase64] = useState<string | null>(null)
  const [mealType, setMealType] = useState('snack')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  const handleFile = (file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string
      setPreview(dataUrl)
      // Base64 kısmını al (data:image/jpeg;base64, kısmını çıkar)
      setBase64(dataUrl.split(',')[1] ?? null)
    }
    reader.readAsDataURL(file)
  }

  const analyze = async () => {
    if (!base64) return
    setIsAnalyzing(true)
    setError('')
    try {
      const res = await fetch('/api/ai/analyze-meal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64, mealType }),
      })
      if (!res.ok) throw new Error('Analiz başarısız')
      const data = await res.json()
      setResult(data.analysis)
      setSaved(true)
      setTimeout(() => onSaved(), 1500)
    } catch {
      setError('Analiz yapılamadı. Tekrar dene.')
    } finally {
      setIsAnalyzing(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 80, opacity: 0 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-md bg-background border border-border/50 rounded-2xl p-5"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <Camera size={18} className="text-blue-400" />
            Fotoğrafla Analiz
          </h3>
          <button onClick={onClose} className="p-1.5 hover:bg-muted rounded-lg">
            <X size={16} />
          </button>
        </div>

        {!result ? (
          <div className="space-y-4">
            {/* Fotoğraf alanı */}
            <div
              onClick={() => fileRef.current?.click()}
              className={`relative border-2 border-dashed rounded-xl overflow-hidden cursor-pointer transition-colors ${
                preview ? 'border-blue-500/50' : 'border-border/40 hover:border-blue-500/40'
              }`}
              style={{ height: 200 }}
            >
              {preview ? (
                <img src={preview} alt="Yemek" className="w-full h-full object-cover" />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground">
                  <Camera size={32} />
                  <p className="text-sm">Fotoğraf seç veya çek</p>
                  <p className="text-xs opacity-60">JPG, PNG desteklenir</p>
                </div>
              )}
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
              />
            </div>

            {/* Öğün tipi */}
            <select
              value={mealType}
              onChange={e => setMealType(e.target.value)}
              className="w-full px-3 py-2.5 bg-muted/30 border border-border/30 rounded-xl text-sm focus:outline-none focus:border-blue-500"
            >
              <option value="breakfast">Kahvaltı</option>
              <option value="lunch">Öğle Yemeği</option>
              <option value="dinner">Akşam Yemeği</option>
              <option value="snack">Ara Öğün</option>
              <option value="pre_workout">Antrenman Öncesi</option>
              <option value="post_workout">Antrenman Sonrası</option>
            </select>

            {error && (
              <div className="flex items-center gap-2 text-red-400 text-sm">
                <AlertCircle size={14} />
                {error}
              </div>
            )}

            <button
              onClick={analyze}
              disabled={!base64 || isAnalyzing}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-muted disabled:text-muted-foreground text-white rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-2"
            >
              {isAnalyzing ? (
                <><Loader2 size={16} className="animate-spin" /> Analiz ediliyor...</>
              ) : (
                <><Camera size={16} /> Analiz Et</>
              )}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-green-400 mb-2">
              <CheckCircle size={18} />
              <span className="font-semibold">Analiz tamamlandı!</span>
            </div>

            {/* Toplam */}
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: 'Kalori', value: result.totalCalories, unit: 'kcal' },
                { label: 'Protein', value: result.totalProteinG, unit: 'g' },
                { label: 'Karbo', value: result.totalCarbsG, unit: 'g' },
                { label: 'Yağ', value: result.totalFatG, unit: 'g' },
              ].map(m => (
                <div key={m.label} className="bg-muted/30 rounded-xl p-3 text-center">
                  <p className="text-base font-black">{Math.round(m.value)}</p>
                  <p className="text-xs text-muted-foreground">{m.unit}</p>
                  <p className="text-xs text-muted-foreground">{m.label}</p>
                </div>
              ))}
            </div>

            {/* Yemekler */}
            <div className="space-y-2">
              {result.foodItems.map((item, i) => (
                <div key={i} className="flex items-center justify-between text-sm py-1.5 border-b border-border/20 last:border-0">
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-xs text-muted-foreground">{item.portion}</p>
                  </div>
                  <span className="text-orange-400 font-semibold">{item.calories} kcal</span>
                </div>
              ))}
            </div>

            {result.notes && (
              <p className="text-xs text-muted-foreground bg-muted/20 rounded-lg p-2">{result.notes}</p>
            )}

            <div className="flex items-center gap-2 text-green-400 text-xs">
              <CheckCircle size={12} />
              Beslenme günlüğüne kaydedildi
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}

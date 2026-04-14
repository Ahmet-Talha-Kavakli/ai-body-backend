'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Target, Save } from 'lucide-react'

interface Goals {
  dailySteps: number
  sleepHours: number
  waterMl: number
  targetWeightKg: number | null
}

interface GoalsModalProps {
  open: boolean
  onClose: () => void
  goals: Goals
  onSave: (goals: Goals) => Promise<void>
}

export function GoalsModal({ open, onClose, goals, onSave }: GoalsModalProps) {
  const [form, setForm] = useState<Goals>(goals)
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)
    await onSave(form)
    setSaving(false)
    onClose()
  }

  const fields = [
    {
      key: 'dailySteps' as const,
      label: 'Günlük Adım Hedefi',
      unit: 'adım',
      min: 1000,
      max: 50000,
      step: 500,
    },
    {
      key: 'sleepHours' as const,
      label: 'Günlük Uyku Hedefi',
      unit: 'saat',
      min: 4,
      max: 12,
      step: 0.5,
    },
    {
      key: 'waterMl' as const,
      label: 'Günlük Su Hedefi',
      unit: 'ml',
      min: 500,
      max: 5000,
      step: 250,
    },
    {
      key: 'targetWeightKg' as const,
      label: 'Hedef Kilo',
      unit: 'kg',
      min: 30,
      max: 250,
      step: 0.5,
    },
  ]

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 backdrop-blur-sm sm:items-center"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-card border-border/50 w-full max-w-sm rounded-3xl border p-6 shadow-2xl"
          >
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target size={16} className="text-purple-400" />
                <h3 className="text-lg font-bold">Hedeflerimi Düzenle</h3>
              </div>
              <button
                onClick={onClose}
                className="hover:bg-muted/50 cursor-pointer rounded-xl p-2 transition-colors"
                aria-label="Kapat"
              >
                <X size={16} />
              </button>
            </div>

            <div className="mb-6 space-y-4">
              {fields.map((f) => (
                <div key={f.key}>
                  <label className="text-muted-foreground mb-1.5 block text-xs font-semibold uppercase tracking-wider">
                    {f.label}
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step={f.step}
                      min={f.min}
                      max={f.max}
                      value={form[f.key] ?? ''}
                      onChange={(e) => {
                        const val = e.target.value === '' ? null : parseFloat(e.target.value)
                        setForm((prev) => ({ ...prev, [f.key]: val }))
                      }}
                      placeholder={f.key === 'targetWeightKg' ? 'İsteğe bağlı' : ''}
                      className="bg-muted/30 border-border/50 flex-1 rounded-xl border px-4 py-2.5 font-bold transition-colors focus:border-purple-500/50 focus:outline-none"
                    />
                    <span className="text-muted-foreground w-8 text-sm font-semibold">
                      {f.unit}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl border border-purple-500/30 bg-purple-500/20 py-3 text-sm font-bold text-purple-300 transition-all hover:bg-purple-500/30 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Save size={15} />
              {saving ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

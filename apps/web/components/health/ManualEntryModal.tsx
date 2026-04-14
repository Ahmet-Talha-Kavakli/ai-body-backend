'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Plus } from 'lucide-react'

const ENTRY_TYPES = [
  { value: 'steps', label: 'Adım', unit: 'adım', min: 0, max: 100000 },
  { value: 'heart_rate', label: 'Nabız', unit: 'bpm', min: 30, max: 220 },
  { value: 'sleep_minutes', label: 'Uyku', unit: 'dk', min: 0, max: 1440 },
  { value: 'spo2', label: 'SpO2', unit: '%', min: 50, max: 100 },
  { value: 'hrv', label: 'HRV', unit: 'ms', min: 0, max: 300 },
  { value: 'calories_burned', label: 'Kalori', unit: 'kcal', min: 0, max: 10000 },
]

interface ManualEntryModalProps {
  open: boolean
  onClose: () => void
  onSave: (type: string, value: number) => Promise<void>
}

export function ManualEntryModal({ open, onClose, onSave }: ManualEntryModalProps) {
  const [type, setType] = useState(ENTRY_TYPES[0].value)
  const [value, setValue] = useState('')
  const [saving, setSaving] = useState(false)

  const selected = ENTRY_TYPES.find((t) => t.value === type)!

  async function handleSave() {
    const num = parseFloat(value)
    if (isNaN(num) || num < selected.min || num > selected.max) return
    setSaving(true)
    await onSave(type, num)
    setSaving(false)
    setValue('')
    onClose()
  }

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
              <h3 className="text-lg font-bold">Manuel Veri Gir</h3>
              <button
                onClick={onClose}
                className="hover:bg-muted/50 cursor-pointer rounded-xl p-2 transition-colors"
                aria-label="Kapat"
              >
                <X size={16} />
              </button>
            </div>

            <div className="mb-5 grid grid-cols-3 gap-2">
              {ENTRY_TYPES.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setType(t.value)}
                  className={`cursor-pointer rounded-xl px-3 py-2 text-xs font-bold transition-all ${
                    type === t.value
                      ? 'border border-purple-500/40 bg-purple-500/20 text-purple-300'
                      : 'bg-muted/30 border-border/30 text-muted-foreground hover:border-border/60 border'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="mb-5">
              <label className="text-muted-foreground mb-2 block text-xs font-semibold uppercase tracking-wider">
                {selected.label} ({selected.unit})
              </label>
              <input
                type="number"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={`${selected.min} – ${selected.max}`}
                className="bg-muted/30 border-border/50 w-full rounded-xl border px-4 py-3 text-lg font-bold transition-colors focus:border-purple-500/50 focus:outline-none"
              />
            </div>

            <button
              onClick={handleSave}
              disabled={saving || !value}
              className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl border border-purple-500/30 bg-purple-500/20 py-3 text-sm font-bold text-purple-300 transition-all hover:bg-purple-500/30 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus size={16} />
              {saving ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

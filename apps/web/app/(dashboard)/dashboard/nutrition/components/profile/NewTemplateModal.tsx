'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Loader2 } from 'lucide-react'
import type { MealTemplate } from '../../hooks/useMealTemplates'

type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'pre_workout' | 'post_workout'

const MEAL_TYPES: Array<{ value: MealType; label: string }> = [
  { value: 'breakfast', label: 'Kahvaltı' },
  { value: 'lunch', label: 'Öğle' },
  { value: 'dinner', label: 'Akşam' },
  { value: 'snack', label: 'Atıştırma' },
  { value: 'pre_workout', label: 'Antrenman Öncesi' },
  { value: 'post_workout', label: 'Antrenman Sonrası' },
]

interface Props {
  open: boolean
  onClose: () => void
  onSave: (data: Omit<MealTemplate, 'id' | 'createdAt'>) => Promise<void>
}

export function NewTemplateModal({ open, onClose, onSave }: Props) {
  const [name, setName] = useState('')
  const [mealType, setMealType] = useState<MealType>('breakfast')
  const [calories, setCalories] = useState('')
  const [protein, setProtein] = useState('')
  const [carbs, setCarbs] = useState('')
  const [fat, setFat] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!name || !calories) return
    setSaving(true)
    try {
      await onSave({
        name,
        mealType,
        items: [],
        totalCalories: parseInt(calories),
        totalProteinG: parseFloat(protein) || 0,
        totalCarbsG: parseFloat(carbs) || 0,
        totalFatG: parseFloat(fat) || 0,
      })
      onClose()
      setName('')
      setCalories('')
      setProtein('')
      setCarbs('')
      setFat('')
    } finally {
      setSaving(false)
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="w-full max-w-md rounded-t-2xl border border-white/[0.06] bg-[#12121E] p-6 sm:rounded-2xl"
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 100, damping: 20 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-white">Yeni Şablon</h2>
              <button onClick={onClose} className="text-[#64748B] hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3">
              <input
                type="text"
                placeholder="Şablon adı"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-white/[0.06] bg-white/[0.04] px-3 py-2 text-sm text-white outline-none placeholder:text-[#64748B] focus:border-[#6366F1]/50"
              />

              <div className="flex flex-wrap gap-1.5">
                {MEAL_TYPES.map((t) => (
                  <button
                    key={t.value}
                    onClick={() => setMealType(t.value)}
                    className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                      mealType === t.value
                        ? 'bg-[#6366F1] text-white'
                        : 'bg-white/[0.04] text-[#64748B] hover:bg-white/[0.08]'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'Kalori (kcal)', value: calories, set: setCalories },
                  { label: 'Protein (g)', value: protein, set: setProtein },
                  { label: 'Karb (g)', value: carbs, set: setCarbs },
                  { label: 'Yağ (g)', value: fat, set: setFat },
                ].map(({ label, value, set }) => (
                  <input
                    key={label}
                    type="number"
                    placeholder={label}
                    value={value}
                    onChange={(e) => set(e.target.value)}
                    className="rounded-xl border border-white/[0.06] bg-white/[0.04] px-3 py-2 text-sm text-white outline-none placeholder:text-[#64748B] focus:border-[#6366F1]/50"
                    min={0}
                  />
                ))}
              </div>

              <button
                onClick={handleSave}
                disabled={!name || !calories || saving}
                className="w-full rounded-xl bg-[#6366F1] py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#4F46E5] disabled:opacity-50"
              >
                {saving ? <Loader2 size={16} className="mx-auto animate-spin" /> : 'Kaydet'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

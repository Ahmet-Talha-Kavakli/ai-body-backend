'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import type { MealType } from '@/lib/nutrition/types'

const MEAL_LABELS: Record<MealType, string> = {
  breakfast: 'Kahvaltı',
  lunch: 'Öğle Yemeği',
  dinner: 'Akşam Yemeği',
  snack: 'Ara Öğün',
  pre_workout: 'Antrenman Öncesi',
  post_workout: 'Antrenman Sonrası',
}

interface Props {
  open: boolean
  onClose: () => void
  onSave: (data: {
    name: string
    calories: number
    protein: number
    carbs: number
    fat: number
    mealType: MealType
  }) => Promise<void>
}

export function AddMealModal({ open, onClose, onSave }: Props) {
  const [form, setForm] = useState({
    name: '',
    calories: '',
    protein: '',
    carbs: '',
    fat: '',
    mealType: 'snack' as MealType,
  })
  const [saving, setSaving] = useState(false)

  const handle = async () => {
    if (!form.name || !form.calories) return
    setSaving(true)
    await onSave({
      name: form.name,
      calories: Number(form.calories),
      protein: Number(form.protein || 0),
      carbs: Number(form.carbs || 0),
      fat: Number(form.fat || 0),
      mealType: form.mealType,
    })
    setSaving(false)
    setForm({ name: '', calories: '', protein: '', carbs: '', fat: '', mealType: 'snack' })
    onClose()
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 backdrop-blur-sm sm:items-center"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: 'spring', bounce: 0.34 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-[1.5rem] border border-white/[0.06] p-[1px]"
          >
            <div className="space-y-4 rounded-[calc(1.5rem-1px)] bg-[#12121E] p-6">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-white">Öğün Ekle</h3>
                <button
                  onClick={onClose}
                  className="cursor-pointer rounded-lg p-1.5 transition-colors hover:bg-white/[0.08]"
                >
                  <X size={16} className="text-[#64748B]" />
                </button>
              </div>

              <input
                type="text"
                placeholder="Yemek adı"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                className="w-full rounded-xl border border-white/[0.06] bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition-colors placeholder:text-[#64748B] focus:border-[#6366F1]/50"
              />

              <div className="flex flex-wrap gap-1.5">
                {(Object.entries(MEAL_LABELS) as [MealType, string][]).map(([type, label]) => (
                  <button
                    key={type}
                    onClick={() => setForm((p) => ({ ...p, mealType: type }))}
                    className={`cursor-pointer rounded-full px-3 py-1 text-xs transition-colors ${form.mealType === type ? 'bg-[#6366F1] text-white' : 'bg-white/[0.04] text-[#64748B]'}`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs text-[#64748B]">Kalori (kcal) *</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={form.calories}
                    onChange={(e) => setForm((p) => ({ ...p, calories: e.target.value }))}
                    className="w-full rounded-xl border border-white/[0.06] bg-white/[0.04] px-3 py-2.5 text-sm text-white outline-none transition-colors focus:border-[#6366F1]/50"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-[#64748B]">Protein (g)</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={form.protein}
                    onChange={(e) => setForm((p) => ({ ...p, protein: e.target.value }))}
                    className="w-full rounded-xl border border-white/[0.06] bg-white/[0.04] px-3 py-2.5 text-sm text-white outline-none transition-colors focus:border-[#6366F1]/50"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-[#64748B]">Karbonhidrat (g)</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={form.carbs}
                    onChange={(e) => setForm((p) => ({ ...p, carbs: e.target.value }))}
                    className="w-full rounded-xl border border-white/[0.06] bg-white/[0.04] px-3 py-2.5 text-sm text-white outline-none transition-colors focus:border-[#6366F1]/50"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-[#64748B]">Yağ (g)</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={form.fat}
                    onChange={(e) => setForm((p) => ({ ...p, fat: e.target.value }))}
                    className="w-full rounded-xl border border-white/[0.06] bg-white/[0.04] px-3 py-2.5 text-sm text-white outline-none transition-colors focus:border-[#6366F1]/50"
                  />
                </div>
              </div>

              <button
                onClick={handle}
                disabled={saving || !form.name || !form.calories}
                className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#6366F1] py-3 text-sm font-semibold text-white transition-colors hover:bg-[#4F46E5] disabled:opacity-50"
              >
                {saving && (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                )}
                Ekle
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

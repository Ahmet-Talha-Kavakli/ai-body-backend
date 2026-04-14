'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { X, AlertTriangle, Plus } from 'lucide-react'
import type { SearchResult, MealType } from '@/lib/nutrition/types'

const MEAL_LABELS: Record<MealType, string> = {
  breakfast: 'Kahvaltı',
  lunch: 'Öğle Yemeği',
  dinner: 'Akşam Yemeği',
  snack: 'Ara Öğün',
  pre_workout: 'Antrenman Öncesi',
  post_workout: 'Antrenman Sonrası',
}

const PORTION_UNITS = ['g', 'adet', 'bardak', 'dilim', 'kaşık', 'paket']

interface Props {
  food: SearchResult
  onClose: () => void
  onAdd: (data: {
    food: SearchResult
    portionG: number
    portionUnit: string
    mealType: MealType
  }) => Promise<void>
}

export function FoodDetailModal({ food, onClose, onAdd }: Props) {
  const [portion, setPortion] = useState(100)
  const [unit, setUnit] = useState('g')
  const [mealType, setMealType] = useState<MealType>('snack')
  const [saving, setSaving] = useState(false)

  const factor = portion / 100
  const calc = {
    calories: Math.round(food.caloriesPer100g * factor),
    protein: Math.round(food.proteinPer100g * factor * 10) / 10,
    carbs: Math.round(food.carbsPer100g * factor * 10) / 10,
    fat: Math.round(food.fatPer100g * factor * 10) / 10,
    fiber: Math.round((food.fiberPer100g ?? 0) * factor * 10) / 10,
  }

  const handle = async () => {
    setSaving(true)
    await onAdd({ food, portionG: portion, portionUnit: unit, mealType })
    setSaving(false)
    onClose()
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
          <div className="mb-4 flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-white">{food.name}</h3>
              {food.brand && <p className="text-xs text-[#64748B]">{food.brand}</p>}
            </div>
            <button onClick={onClose} className="cursor-pointer rounded-lg p-1.5 transition-colors hover:bg-white/[0.08]">
              <X size={16} className="text-[#64748B]" />
            </button>
          </div>

          <div className="mb-4 flex gap-2">
            <input
              type="number"
              value={portion}
              onChange={(e) => setPortion(Number(e.target.value) || 0)}
              className="flex-1 rounded-xl border border-white/[0.06] bg-white/[0.04] px-3 py-2.5 text-sm text-white outline-none transition-colors focus:border-[#6366F1]/50"
              min={1}
            />
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="cursor-pointer rounded-xl border border-white/[0.06] bg-white/[0.04] px-3 py-2.5 text-sm text-white outline-none"
            >
              {PORTION_UNITS.map((u) => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </div>

          <div className="mb-4 grid grid-cols-5 gap-2">
            {[
              { label: 'Kcal', value: calc.calories },
              { label: 'Protein', value: `${calc.protein}g` },
              { label: 'Karbo', value: `${calc.carbs}g` },
              { label: 'Yağ', value: `${calc.fat}g` },
              { label: 'Lif', value: `${calc.fiber}g` },
            ].map((m) => (
              <div key={m.label} className="rounded-lg bg-white/[0.04] p-2 text-center">
                <p className="font-['Barlow_Condensed'] text-base font-bold text-white">{m.value}</p>
                <p className="text-[10px] text-[#64748B]">{m.label}</p>
              </div>
            ))}
          </div>

          {food.glycemicIndex !== undefined && (
            <div className="mb-3 flex items-center gap-2 text-xs text-[#64748B]">
              <span>Glisemik İndeks:</span>
              <span className={`font-semibold ${food.glycemicIndex < 55 ? 'text-[#22C55E]' : food.glycemicIndex < 70 ? 'text-[#F59E0B]' : 'text-[#F97316]'}`}>
                {food.glycemicIndex} ({food.glycemicIndex < 55 ? 'Düşük' : food.glycemicIndex < 70 ? 'Orta' : 'Yüksek'})
              </span>
            </div>
          )}

          {food.allergens.length > 0 && (
            <div className="mb-4 flex items-start gap-2 rounded-xl border border-[#F59E0B]/20 bg-[#F59E0B]/10 p-2.5">
              <AlertTriangle size={14} className="mt-0.5 shrink-0 text-[#F59E0B]" />
              <p className="text-xs text-[#F59E0B]">Alerjen: {food.allergens.join(', ')}</p>
            </div>
          )}

          <div className="mb-5 flex flex-wrap gap-1.5">
            {(Object.entries(MEAL_LABELS) as [MealType, string][]).map(([type, label]) => (
              <button
                key={type}
                onClick={() => setMealType(type)}
                className={`cursor-pointer rounded-full px-3 py-1 text-xs transition-colors ${mealType === type ? 'bg-[#6366F1] text-white' : 'bg-white/[0.04] text-[#64748B] hover:bg-white/[0.08]'}`}
              >
                {label}
              </button>
            ))}
          </div>

          <button
            onClick={handle}
            disabled={saving || portion <= 0}
            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#6366F1] py-3 text-sm font-semibold text-white transition-colors hover:bg-[#4F46E5] disabled:opacity-50"
          >
            {saving ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            ) : (
              <Plus size={16} />
            )}
            Günlüğe Ekle
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

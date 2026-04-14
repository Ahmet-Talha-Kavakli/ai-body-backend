'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Loader2 } from 'lucide-react'
import type { MealType } from '@/lib/nutrition/types'

const MEAL_LABELS: Record<MealType, string> = {
  breakfast: 'Kahvaltı',
  lunch: 'Öğle Yemeği',
  dinner: 'Akşam Yemeği',
  snack: 'Ara Öğün',
  pre_workout: 'Antrenman Öncesi',
  post_workout: 'Antrenman Sonrası',
}

interface MealTemplate {
  id: string
  name: string
  mealType: string
  totalCalories: number
  totalProteinG: number
  totalCarbsG: number
  totalFatG: number
  items: unknown[]
  createdAt: string
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
  const [tab, setTab] = useState<'manual' | 'templates'>('manual')
  const [form, setForm] = useState({
    name: '',
    calories: '',
    protein: '',
    carbs: '',
    fat: '',
    mealType: 'snack' as MealType,
  })
  const [saving, setSaving] = useState(false)
  const [templates, setTemplates] = useState<MealTemplate[]>([])
  const [templatesLoading, setTemplatesLoading] = useState(false)

  useEffect(() => {
    if (!open) return
    setTemplatesLoading(true)
    fetch('/api/nutrition/templates')
      .then((r) => r.json())
      .then((data) => setTemplates(data.templates ?? []))
      .catch(() => {})
      .finally(() => setTemplatesLoading(false))
  }, [open])

  const handleManualSave = async () => {
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

  const handleTemplateSave = async (tpl: MealTemplate) => {
    setSaving(true)
    await onSave({
      name: tpl.name,
      calories: tpl.totalCalories,
      protein: tpl.totalProteinG,
      carbs: tpl.totalCarbsG,
      fat: tpl.totalFatG,
      mealType: tpl.mealType as MealType,
    })
    setSaving(false)
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
              {/* Header */}
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-white">Öğün Ekle</h3>
                <button
                  onClick={onClose}
                  className="cursor-pointer rounded-lg p-1.5 transition-colors hover:bg-white/[0.08]"
                >
                  <X size={16} className="text-[#64748B]" />
                </button>
              </div>

              {/* Tab switcher */}
              <div className="flex rounded-xl bg-white/[0.04] p-1">
                {(['manual', 'templates'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className={`flex-1 rounded-lg py-1.5 text-xs font-medium transition-colors ${
                      tab === t ? 'bg-[#6366F1] text-white' : 'text-[#64748B] hover:text-white'
                    }`}
                  >
                    {t === 'manual' ? 'Manuel' : 'Şablonlar'}
                  </button>
                ))}
              </div>

              {/* Manual tab */}
              {tab === 'manual' && (
                <>
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
                    {[
                      { label: 'Kalori (kcal) *', key: 'calories' as const },
                      { label: 'Protein (g)', key: 'protein' as const },
                      { label: 'Karbonhidrat (g)', key: 'carbs' as const },
                      { label: 'Yağ (g)', key: 'fat' as const },
                    ].map(({ label, key }) => (
                      <div key={key}>
                        <label className="mb-1 block text-xs text-[#64748B]">{label}</label>
                        <input
                          type="number"
                          placeholder="0"
                          value={form[key]}
                          onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))}
                          className="w-full rounded-xl border border-white/[0.06] bg-white/[0.04] px-3 py-2.5 text-sm text-white outline-none transition-colors focus:border-[#6366F1]/50"
                        />
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={handleManualSave}
                    disabled={saving || !form.name || !form.calories}
                    className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#6366F1] py-3 text-sm font-semibold text-white transition-colors hover:bg-[#4F46E5] disabled:opacity-50"
                  >
                    {saving && (
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    )}
                    Ekle
                  </button>
                </>
              )}

              {/* Templates tab */}
              {tab === 'templates' && (
                <div className="min-h-[200px]">
                  {templatesLoading ? (
                    <div className="flex h-[200px] items-center justify-center">
                      <Loader2 size={20} className="animate-spin text-[#64748B]" />
                    </div>
                  ) : templates.length === 0 ? (
                    <div className="flex h-[200px] flex-col items-center justify-center gap-2">
                      <p className="text-sm text-[#64748B]">Henüz şablon yok</p>
                      <p className="text-xs text-[#475569]">
                        Profil sekmesinden şablon ekleyebilirsin
                      </p>
                    </div>
                  ) : (
                    <ul className="max-h-[300px] space-y-2 overflow-y-auto">
                      {templates.map((tpl) => (
                        <li key={tpl.id}>
                          <button
                            onClick={() => handleTemplateSave(tpl)}
                            disabled={saving}
                            className="w-full rounded-xl border border-white/[0.04] bg-white/[0.02] px-4 py-3 text-left transition-colors hover:bg-white/[0.06] disabled:opacity-50"
                          >
                            <p className="text-sm font-medium text-white">{tpl.name}</p>
                            <p className="mt-0.5 text-xs text-[#64748B]">
                              {tpl.totalCalories} kcal · P:{tpl.totalProteinG}g · K:
                              {tpl.totalCarbsG}g · Y:{tpl.totalFatG}g
                            </p>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

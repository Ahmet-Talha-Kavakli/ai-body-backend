'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Utensils, X, Plus } from 'lucide-react'
import { MacroBar } from './components/MacroBar'
import { MealSection } from './components/MealSection'
import { PhotoAnalyzer } from './components/PhotoAnalyzer'

const MEALS = [
  {
    id: 'breakfast',
    label: 'Kahvaltı',
    icon: '🌅',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
  },
  {
    id: 'lunch',
    label: 'Öğle',
    icon: '☀️',
    color: 'text-orange-400',
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/20',
  },
  {
    id: 'dinner',
    label: 'Akşam',
    icon: '🌙',
    color: 'text-indigo-400',
    bg: 'bg-indigo-500/10',
    border: 'border-indigo-500/20',
  },
  {
    id: 'snack',
    label: 'Atıştırma',
    icon: '🍎',
    color: 'text-green-400',
    bg: 'bg-green-500/10',
    border: 'border-green-500/20',
  },
]

interface FoodItem {
  id: string
  name: string
  calories: number
  protein: number
  carbs: number
  fat: number
  amount: number
  unit: string
}

interface MealLog {
  id: string
  mealType: string
  totalCalories: number
  totalProteinG: number
  totalCarbsG: number
  totalFatG: number
  items: FoodItem[]
}

interface Totals {
  calories: number
  protein: number
  carbs: number
  fat: number
}

interface Goal {
  calories: number
  protein: number
  carbs: number
  fat: number
}

interface TodayData {
  totals: Totals
  goal: Goal
  meals: Record<string, MealLog[]>
}

interface ManualForm {
  name: string
  calories: string
  protein: string
  carbs: string
  fat: string
  amount: string
  unit: string
  mealType: string
}

const DEFAULT_GOAL: Goal = { calories: 2200, protein: 150, carbs: 220, fat: 70 }

export default function NutritionPage() {
  const [data, setData] = useState<TodayData>({
    totals: { calories: 0, protein: 0, carbs: 0, fat: 0 },
    goal: DEFAULT_GOAL,
    meals: { breakfast: [], lunch: [], dinner: [], snack: [] },
  })
  const [loading, setLoading] = useState(true)
  const [addMealType, setAddMealType] = useState<string | null>(null)
  const [form, setForm] = useState<ManualForm>({
    name: '',
    calories: '',
    protein: '',
    carbs: '',
    fat: '',
    amount: '100',
    unit: 'g',
    mealType: 'snack',
  })
  const [saving, setSaving] = useState(false)

  const fetchToday = useCallback(async () => {
    try {
      const res = await fetch('/api/nutrition/today')
      if (res.ok) {
        const json = await res.json()
        setData(json)
      }
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchToday()
  }, [fetchToday])

  const openAdd = (mealType: string) => {
    setForm((f) => ({ ...f, mealType }))
    setAddMealType(mealType)
  }

  const handleDelete = async (id: string) => {
    // Optimistic update
    setData((d) => {
      const updated = { ...d.meals }
      for (const key of Object.keys(updated)) {
        updated[key] = updated[key].filter((m) => m.id !== id)
      }
      const totalCalories = Object.values(updated)
        .flat()
        .reduce((s, m) => s + m.totalCalories, 0)
      const totalProtein = Object.values(updated)
        .flat()
        .reduce((s, m) => s + m.totalProteinG, 0)
      const totalCarbs = Object.values(updated)
        .flat()
        .reduce((s, m) => s + m.totalCarbsG, 0)
      const totalFat = Object.values(updated)
        .flat()
        .reduce((s, m) => s + m.totalFatG, 0)
      return {
        ...d,
        meals: updated,
        totals: {
          calories: totalCalories,
          protein: totalProtein,
          carbs: totalCarbs,
          fat: totalFat,
        },
      }
    })
    await fetch(`/api/nutrition/log/${id}`, { method: 'DELETE' })
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await fetch('/api/nutrition/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mealType: form.mealType,
          name: form.name,
          calories: Number(form.calories),
          protein: Number(form.protein),
          carbs: Number(form.carbs),
          fat: Number(form.fat),
          amount: Number(form.amount),
          unit: form.unit,
        }),
      })
      setAddMealType(null)
      await fetchToday()
    } finally {
      setSaving(false)
    }
  }

  const handlePhotoAnalyzed = async (
    foods: Array<{
      name: string
      calories: number
      protein: number
      carbs: number
      fat: number
      amount: number
      unit: string
    }>
  ) => {
    for (const food of foods) {
      await fetch('/api/nutrition/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mealType: 'snack', ...food }),
      })
    }
    await fetchToday()
  }

  const remaining = Math.max(data.goal.calories - data.totals.calories, 0)
  const calPct = Math.min(data.totals.calories / Math.max(data.goal.calories, 1), 1)

  // Convert meal logs to FoodItem[] for MealSection
  const getMealItems = (logs: MealLog[]): FoodItem[] =>
    logs.flatMap((log) => {
      if (Array.isArray(log.items) && log.items.length > 0) {
        return log.items.map((item, i) => ({
          id: `${log.id}-${i}`,
          name: item.name ?? 'Öğün',
          calories: item.calories ?? log.totalCalories,
          protein: item.protein ?? log.totalProteinG,
          carbs: item.carbs ?? log.totalCarbsG,
          fat: item.fat ?? log.totalFatG,
          amount: item.amount ?? 100,
          unit: item.unit ?? 'g',
        }))
      }
      return [
        {
          id: log.id,
          name: 'Öğün',
          calories: log.totalCalories,
          protein: log.totalProteinG,
          carbs: log.totalCarbsG,
          fat: log.totalFatG,
          amount: 100,
          unit: 'g',
        },
      ]
    })

  if (loading) {
    return (
      <div className="max-w-2xl animate-pulse space-y-4">
        <div className="h-10 w-48 rounded-xl bg-white/[0.04]" />
        <div className="h-40 rounded-2xl bg-white/[0.04]" />
        <div className="h-32 rounded-2xl bg-white/[0.04]" />
        <div className="h-48 rounded-2xl bg-white/[0.04]" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-['Barlow_Condensed'] text-4xl font-bold tracking-tight text-white">
          Beslenme
        </h1>
        <p className="mt-0.5 text-sm text-white/40">Günlük kalori ve makro takibi</p>
      </div>

      {/* Calorie summary card */}
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-white/40">Günlük Kalori</p>
            <p className="text-3xl font-bold text-white">
              {Math.round(data.totals.calories)}
              <span className="ml-1 text-base font-normal text-white/30">
                / {data.goal.calories} kcal
              </span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-white/40">Kalan</p>
            <p
              className={`text-xl font-bold ${remaining === 0 ? 'text-red-400' : 'text-teal-400'}`}
            >
              {remaining} kcal
            </p>
          </div>
        </div>

        {/* Calorie progress bar */}
        <div className="mb-5 h-2 w-full overflow-hidden rounded-full bg-white/5">
          <motion.div
            className={`h-full rounded-full ${calPct >= 1 ? 'bg-red-500' : 'bg-teal-500'}`}
            initial={{ width: 0 }}
            animate={{ width: `${calPct * 100}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </div>

        {/* Macro bars */}
        <div className="space-y-3">
          <MacroBar
            label="Protein"
            current={data.totals.protein}
            goal={data.goal.protein}
            color="bg-blue-500"
          />
          <MacroBar
            label="Karbonhidrat"
            current={data.totals.carbs}
            goal={data.goal.carbs}
            color="bg-orange-500"
          />
          <MacroBar
            label="Yağ"
            current={data.totals.fat}
            goal={data.goal.fat}
            color="bg-yellow-500"
          />
        </div>
      </div>

      {/* Photo analyzer */}
      <PhotoAnalyzer mealType="snack" onAnalyzed={handlePhotoAnalyzed} />

      {/* Meal sections */}
      <div className="space-y-3">
        {MEALS.map((meal) => (
          <MealSection
            key={meal.id}
            meal={meal}
            items={getMealItems(data.meals[meal.id] ?? [])}
            onAdd={openAdd}
            onDelete={handleDelete}
          />
        ))}
      </div>

      {/* Add food bottom sheet */}
      <AnimatePresence>
        {addMealType && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-black/60"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setAddMealType(null)}
            />
            <motion.div
              className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl border border-white/[0.08] bg-[#0E0E1A] p-6 pb-8"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              <div className="mb-5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Utensils size={18} className="text-indigo-400" />
                  <h3 className="font-semibold text-white">Besin Ekle</h3>
                </div>
                <button onClick={() => setAddMealType(null)}>
                  <X size={20} className="text-white/40" />
                </button>
              </div>

              <div className="space-y-3">
                {/* Meal type selector */}
                <div className="flex gap-2">
                  {MEALS.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setForm((f) => ({ ...f, mealType: m.id }))}
                      className={`flex-1 rounded-xl py-1.5 text-xs font-medium transition-colors ${
                        form.mealType === m.id
                          ? 'bg-indigo-600 text-white'
                          : 'bg-white/[0.04] text-white/40 hover:text-white'
                      }`}
                    >
                      {m.icon}
                    </button>
                  ))}
                </div>

                <input
                  placeholder="Besin adı"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full rounded-xl border border-white/[0.06] bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder-white/20 outline-none focus:border-indigo-500/50"
                />

                <div className="grid grid-cols-2 gap-3">
                  {[
                    { key: 'calories', label: 'Kalori (kcal)' },
                    { key: 'protein', label: 'Protein (g)' },
                    { key: 'carbs', label: 'Karbonhidrat (g)' },
                    { key: 'fat', label: 'Yağ (g)' },
                  ].map(({ key, label }) => (
                    <input
                      key={key}
                      type="number"
                      placeholder={label}
                      value={form[key as keyof ManualForm]}
                      onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                      className="w-full rounded-xl border border-white/[0.06] bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder-white/20 outline-none focus:border-indigo-500/50"
                    />
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="number"
                    placeholder="Miktar"
                    value={form.amount}
                    onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                    className="w-full rounded-xl border border-white/[0.06] bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder-white/20 outline-none focus:border-indigo-500/50"
                  />
                  <select
                    value={form.unit}
                    onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
                    className="w-full rounded-xl border border-white/[0.06] bg-white/[0.04] px-4 py-2.5 text-sm text-white outline-none focus:border-indigo-500/50"
                  >
                    <option value="g">gram</option>
                    <option value="ml">ml</option>
                    <option value="adet">adet</option>
                  </select>
                </div>

                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleSave}
                  disabled={!form.name || !form.calories || saving}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-indigo-500 disabled:opacity-50"
                >
                  <Plus size={16} />
                  {saving ? 'Kaydediliyor...' : 'Ekle'}
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

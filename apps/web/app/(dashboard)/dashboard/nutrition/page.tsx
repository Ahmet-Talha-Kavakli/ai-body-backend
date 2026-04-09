'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Camera, X, ChevronRight, Loader2, Apple } from 'lucide-react'
import { MealPhotoAnalyzer } from '@/components/dashboard/MealPhotoAnalyzer'
import Image from 'next/image'
import { THIINGS } from '@/lib/thiings'
import { NeonIcon } from '@/components/ui/neon-icon'

interface MealLog {
  id: string
  mealType: string
  items: { name: string; calories: number }[]
  totalCalories: number
  totalProteinG: number
  totalCarbsG: number
  totalFatG: number
  loggedAt: string
  aiAnalyzed: boolean
}

interface NutritionGoal {
  dailyCalories: number
  proteinG: number
  carbsG: number
  fatG: number
  waterMl: number
}

const MEAL_LABELS: Record<string, string> = {
  breakfast: 'Kahvaltı', lunch: 'Öğle Yemeği',
  dinner: 'Akşam Yemeği', snack: 'Ara Öğün',
  pre_workout: 'Antrenman Öncesi', post_workout: 'Antrenman Sonrası',
}
const MEAL_IMGS: Record<string, string> = {
  breakfast: THIINGS.sunrise,
  lunch: THIINGS.sun,
  dinner: THIINGS.moon,
  snack: THIINGS.apple,
  pre_workout: THIINGS.lightningBolt,
  post_workout: THIINGS.proteinPowder,
}

const QUICK_ADD = [
  { name: 'Su (250ml)', cals: 0, img: THIINGS.waterBottle, type: 'snack', protein: 0, carbs: 0, fat: 0 },
  { name: 'Muz', cals: 89, img: THIINGS.banana, type: 'snack', protein: 1, carbs: 23, fat: 0 },
  { name: 'Yumurta', cals: 78, img: THIINGS.egg, type: 'breakfast', protein: 6, carbs: 0, fat: 5 },
  { name: 'Avokado', cals: 160, img: THIINGS.avocado, type: 'snack', protein: 2, carbs: 9, fat: 15 },
  { name: 'Elma', cals: 95, img: THIINGS.apple, type: 'snack', protein: 0, carbs: 25, fat: 0 },
  { name: 'Portakal', cals: 62, img: THIINGS.orange, type: 'snack', protein: 1, carbs: 15, fat: 0 },
]

export default function NutritionPage() {
  const [meals, setMeals] = useState<MealLog[]>([])
  const [goal, setGoal] = useState<NutritionGoal>({ dailyCalories: 2200, proteinG: 150, carbsG: 250, fatG: 70, waterMl: 2500 })
  const [loading, setLoading] = useState(true)
  const [showAddMeal, setShowAddMeal] = useState(false)
  const [showPhotoAnalyzer, setShowPhotoAnalyzer] = useState(false)
  const [addingQuick, setAddingQuick] = useState<string | null>(null)
  const [newMeal, setNewMeal] = useState({ name: '', calories: '', mealType: 'snack', protein: '', carbs: '', fat: '' })

  const fetchData = async () => {
    try {
      const res = await fetch('/api/nutrition')
      const data = await res.json()
      setMeals(data.meals ?? [])
      if (data.nutritionGoal) setGoal(data.nutritionGoal)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const totals = {
    calories: meals.reduce((s, m) => s + m.totalCalories, 0),
    protein: meals.reduce((s, m) => s + m.totalProteinG, 0),
    carbs: meals.reduce((s, m) => s + m.totalCarbsG, 0),
    fat: meals.reduce((s, m) => s + m.totalFatG, 0),
  }

  const addMeal = async () => {
    if (!newMeal.name || !newMeal.calories) return
    await fetch('/api/nutrition', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mealType: newMeal.mealType,
        items: [{ name: newMeal.name, calories: Number(newMeal.calories) }],
        totalCalories: Number(newMeal.calories),
        totalProteinG: Number(newMeal.protein || 0),
        totalCarbsG: Number(newMeal.carbs || 0),
        totalFatG: Number(newMeal.fat || 0),
      }),
    })
    setShowAddMeal(false)
    setNewMeal({ name: '', calories: '', mealType: 'snack', protein: '', carbs: '', fat: '' })
    await fetchData()
  }

  const addQuick = async (item: typeof QUICK_ADD[0]) => {
    setAddingQuick(item.name)
    await fetch('/api/nutrition', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mealType: item.type,
        items: [{ name: item.name, calories: item.cals }],
        totalCalories: item.cals,
        totalProteinG: item.protein,
        totalCarbsG: item.carbs,
        totalFatG: item.fat,
      }),
    })
    setAddingQuick(null)
    await fetchData()
  }

  const MACROS = [
    { name: 'Kalori', neonType: 'flame' as const, neonColor: 'orange' as const, current: Math.round(totals.calories), goal: goal.dailyCalories, unit: 'kcal', color: 'from-orange-500 to-red-500', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
    { name: 'Protein', neonType: 'lightning' as const, neonColor: 'blue' as const, current: Math.round(totals.protein), goal: goal.proteinG, unit: 'g', color: 'from-blue-500 to-cyan-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
    { name: 'Karbonhidrat', neonType: 'star' as const, neonColor: 'yellow' as const, current: Math.round(totals.carbs), goal: goal.carbsG, unit: 'g', color: 'from-yellow-500 to-orange-500', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' },
    { name: 'Yağ', neonType: 'droplet' as const, neonColor: 'red' as const, current: Math.round(totals.fat), goal: goal.fatG, unit: 'g', color: 'from-pink-500 to-rose-500', bg: 'bg-pink-500/10', border: 'border-pink-500/20' },
  ]

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Başlık */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-black mb-1">Beslenme</h1>
          <p className="text-muted-foreground">Günlük besin takibi</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowAddMeal(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors">
            <Plus size={16} /> Öğün Ekle
          </button>
          <button onClick={() => setShowPhotoAnalyzer(true)} className="flex items-center gap-2 px-4 py-2 bg-card/50 border border-border/30 hover:bg-card rounded-xl text-sm font-semibold transition-colors">
            <Camera size={16} /> Fotoğrafla
          </button>
        </div>
      </motion.div>

      {/* Kalori özeti */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-orange-500/20 rounded-2xl p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <NeonIcon type="flame" color="orange" size={32} />
            <div>
              <p className="text-sm text-muted-foreground mb-1">Bugün tüketilen</p>
            <div className="flex items-end gap-2">
              <span className="text-4xl font-black">{loading ? '—' : Math.round(totals.calories)}</span>
              <span className="text-muted-foreground mb-1">/ {goal.dailyCalories} kcal</span>
            </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Kalan</p>
            <p className={`text-2xl font-black ${Math.max(goal.dailyCalories - totals.calories, 0) > 0 ? 'text-green-400' : 'text-red-400'}`}>
              {loading ? '—' : Math.max(Math.round(goal.dailyCalories - totals.calories), 0)} kcal
            </p>
          </div>
        </div>
        <div className="h-3 bg-muted/30 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min((totals.calories / goal.dailyCalories) * 100, 100)}%` }}
            transition={{ delay: 0.3, duration: 0.9 }}
            className="h-full bg-gradient-to-r from-orange-500 to-red-500 rounded-full"
          />
        </div>
      </motion.div>

      {/* Makro kartlar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {MACROS.map((macro, i) => {
          const pct = Math.min(Math.round((macro.current / macro.goal) * 100), 100)
          return (
            <motion.div key={macro.name} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.07 }}
              className={`${macro.bg} border ${macro.border} rounded-2xl p-4`}
            >
              <div className="flex items-center justify-between mb-3">
                <NeonIcon type={macro.neonType} color={macro.neonColor} size={20} />
                <span className="text-xs font-bold">{loading ? '—' : pct}%</span>
              </div>
              <p className="text-xs text-muted-foreground mb-1">{macro.name}</p>
              <p className="text-lg font-black">{loading ? '—' : macro.current}<span className="text-xs font-normal text-muted-foreground ml-1">{macro.unit}</span></p>
              <div className="mt-2 h-1.5 bg-muted/30 rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ delay: 0.4 + i * 0.1, duration: 0.7 }}
                  className={`h-full bg-gradient-to-r ${macro.color} rounded-full`}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">/ {macro.goal} {macro.unit}</p>
            </motion.div>
          )
        })}
      </div>

      {/* Öğün listesi */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
        className="bg-card/50 border border-border/30 rounded-2xl p-5"
      >
        <h3 className="font-bold mb-4">Bugünkü Öğünler</h3>
        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => <div key={i} className="h-16 bg-muted/30 rounded-xl animate-pulse" />)}
          </div>
        ) : meals.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">
            <Apple size={32} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">Henüz öğün eklenmedi</p>
            <button onClick={() => setShowAddMeal(true)} className="mt-3 text-xs text-blue-400 hover:text-blue-300">
              + İlk öğünü ekle
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {meals.map((meal, i) => (
              <motion.div key={meal.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
                className="flex items-center gap-4 p-4 bg-muted/20 border border-border/20 rounded-xl"
              >
                <Image src={MEAL_IMGS[meal.mealType] ?? THIINGS.salad} alt={meal.mealType} width={36} height={36} unoptimized className="shrink-0 drop-shadow-sm" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm">{MEAL_LABELS[meal.mealType] ?? meal.mealType}</p>
                    {meal.aiAnalyzed && <span className="text-xs bg-purple-500/15 text-purple-400 px-1.5 py-0.5 rounded-full border border-purple-500/20">AI</span>}
                    <span className="text-xs text-muted-foreground">{new Date(meal.loggedAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {(meal.items as any[]).slice(0, 3).map((item: any, j: number) => (
                      <span key={j} className="text-xs bg-background/60 px-2 py-0.5 rounded-full text-muted-foreground">{item.name}</span>
                    ))}
                  </div>
                  <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                    <span>P: {Math.round(meal.totalProteinG)}g</span>
                    <span>K: {Math.round(meal.totalCarbsG)}g</span>
                    <span>Y: {Math.round(meal.totalFatG)}g</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-lg font-black">{Math.round(meal.totalCalories)}</p>
                  <p className="text-xs text-muted-foreground">kcal</p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Hızlı ekle */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="bg-card/50 border border-border/30 rounded-2xl p-5"
      >
        <h3 className="font-bold mb-4">Hızlı Ekle</h3>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {QUICK_ADD.map(item => (
            <motion.button key={item.name} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
              onClick={() => addQuick(item)}
              disabled={addingQuick === item.name}
              className="flex flex-col items-center gap-1.5 p-3 bg-muted/20 hover:bg-blue-500/10 border border-border/20 hover:border-blue-500/30 rounded-xl transition-all disabled:opacity-50"
            >
              {addingQuick === item.name
                ? <Loader2 size={20} className="animate-spin text-blue-400" />
                : <Image src={item.img} alt={item.name} width={40} height={40} unoptimized className="drop-shadow-md" />
              }
              <p className="text-xs font-medium text-center leading-tight">{item.name}</p>
              <p className="text-xs text-muted-foreground">{item.cals > 0 ? `${item.cals} kcal` : '—'}</p>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* AI fotoğraf banner */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
        className="flex items-center gap-4 p-5 bg-blue-500/5 border border-blue-500/20 rounded-2xl"
      >
        <Image src={THIINGS.salad} alt="salad" width={48} height={48} unoptimized className="shrink-0 drop-shadow-md" />
        <div className="flex-1">
          <p className="font-semibold text-sm">Fotoğraflı Kalori Analizi</p>
          <p className="text-xs text-muted-foreground mt-0.5">Yemeğini fotoğrafla, AI besin değerlerini otomatik hesaplasın</p>
        </div>
        <button onClick={() => setShowPhotoAnalyzer(true)} className="shrink-0 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition-colors">
          Fotoğraf Çek
        </button>
      </motion.div>

      {/* Öğün ekleme modal */}
      <AnimatePresence>
        {showAddMeal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
            onClick={() => setShowAddMeal(false)}
          >
            <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-md bg-background border border-border/50 rounded-2xl p-6"
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-bold text-lg">Öğün Ekle</h3>
                <button onClick={() => setShowAddMeal(false)} className="p-1.5 hover:bg-muted rounded-lg"><X size={18} /></button>
              </div>
              <div className="space-y-3">
                <input type="text" placeholder="Yemek adı" value={newMeal.name}
                  onChange={e => setNewMeal(p => ({ ...p, name: e.target.value }))}
                  className="w-full px-4 py-3 bg-muted/30 border border-border/30 rounded-xl text-sm focus:outline-none focus:border-blue-500"
                />
                <div className="grid grid-cols-2 gap-3">
                  <input type="number" placeholder="Kalori (kcal)" value={newMeal.calories}
                    onChange={e => setNewMeal(p => ({ ...p, calories: e.target.value }))}
                    className="px-4 py-3 bg-muted/30 border border-border/30 rounded-xl text-sm focus:outline-none focus:border-blue-500"
                  />
                  <select value={newMeal.mealType} onChange={e => setNewMeal(p => ({ ...p, mealType: e.target.value }))}
                    className="px-4 py-3 bg-muted/30 border border-border/30 rounded-xl text-sm focus:outline-none focus:border-blue-500"
                  >
                    {Object.entries(MEAL_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {[['protein', 'Protein (g)'], ['carbs', 'Karbo (g)'], ['fat', 'Yağ (g)']].map(([k, ph]) => (
                    <input key={k} type="number" placeholder={ph}
                      value={(newMeal as any)[k]}
                      onChange={e => setNewMeal(p => ({ ...p, [k]: e.target.value }))}
                      className="px-3 py-3 bg-muted/30 border border-border/30 rounded-xl text-sm focus:outline-none focus:border-blue-500"
                    />
                  ))}
                </div>
                <button onClick={addMeal}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm transition-colors"
                >
                  Ekle
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fotoğraf Analiz Modalı */}
      <AnimatePresence>
        {showPhotoAnalyzer && (
          <MealPhotoAnalyzer
            onClose={() => setShowPhotoAnalyzer(false)}
            onSaved={() => { setShowPhotoAnalyzer(false); fetchData() }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

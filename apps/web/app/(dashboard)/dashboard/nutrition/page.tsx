'use client'

import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { Plus, Camera } from 'lucide-react'
import { NutritionTabs } from './components/NutritionTabs'
import { TodayTab } from './components/tabs/TodayTab'
import { ExploreTab } from './components/tabs/ExploreTab'
import { AddMealModal } from './components/modals/AddMealModal'
import { FoodDetailModal } from './components/modals/FoodDetailModal'
import { BarcodeModal } from './components/modals/BarcodeModal'
import { MealPhotoAnalyzer } from './components/modals/MealPhotoAnalyzer'
import dynamic from 'next/dynamic'
import type { SearchResult, MealType } from '@/lib/nutrition/types'

const HistoryTab = dynamic(() => import('./components/tabs/HistoryTab').then((m) => m.HistoryTab), {
  ssr: false,
  loading: () => <div className="py-20 text-center text-sm text-[#64748B]">Yükleniyor...</div>,
})

const ProfileTab = dynamic(() => import('./components/tabs/ProfileTab').then((m) => m.ProfileTab), {
  ssr: false,
  loading: () => <div className="py-20 text-center text-sm text-[#64748B]">Yükleniyor...</div>,
})

function NutritionPageInner() {
  const searchParams = useSearchParams()
  const tab = searchParams.get('tab') ?? 'today'

  const [showAddMeal, setShowAddMeal] = useState(false)
  const [showBarcode, setShowBarcode] = useState(false)
  const [showPhoto, setShowPhoto] = useState(false)
  const [selectedFood, setSelectedFood] = useState<SearchResult | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const refresh = () => setRefreshKey((k) => k + 1)

  const handleManualAdd = async (data: {
    name: string
    calories: number
    protein: number
    carbs: number
    fat: number
    mealType: MealType
  }) => {
    await fetch('/api/nutrition', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mealType: data.mealType,
        items: [{ name: data.name, calories: data.calories }],
        totalCalories: data.calories,
        totalProteinG: data.protein,
        totalCarbsG: data.carbs,
        totalFatG: data.fat,
      }),
    })
    await fetch('/api/nutrition/streak', { method: 'POST' })
    refresh()
  }

  const handleFoodAdd = async (data: {
    food: SearchResult
    portionG: number
    portionUnit: string
    mealType: MealType
  }) => {
    const totalCalories = Math.round((data.food.caloriesPer100g * data.portionG) / 100)
    await fetch('/api/nutrition', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mealType: data.mealType,
        items: [{ name: data.food.name, calories: totalCalories }],
        totalCalories,
        totalProteinG: Math.round(((data.food.proteinPer100g * data.portionG) / 100) * 10) / 10,
        totalCarbsG: Math.round(((data.food.carbsPer100g * data.portionG) / 100) * 10) / 10,
        totalFatG: Math.round(((data.food.fatPer100g * data.portionG) / 100) * 10) / 10,
      }),
    })
    await fetch('/api/nutrition/streak', { method: 'POST' })
    setSelectedFood(null)
    refresh()
  }

  return (
    <div className="max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-['Barlow_Condensed'] text-4xl font-bold tracking-tight text-white">
            Beslenme
          </h1>
          <p className="mt-0.5 text-sm text-[#64748B]">Günlük besin takibi</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAddMeal(true)}
            className="flex cursor-pointer items-center gap-2 rounded-xl bg-[#6366F1] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#4F46E5]"
          >
            <Plus size={16} /> Öğün Ekle
          </button>
          <button
            onClick={() => setShowPhoto(true)}
            className="flex cursor-pointer items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.04] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/[0.08]"
          >
            <Camera size={16} /> Fotoğrafla
          </button>
        </div>
      </div>

      {/* Tabs */}
      <NutritionTabs />

      {/* Tab content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
        >
          {tab === 'today' && <TodayTab key={refreshKey} onAddMeal={() => setShowAddMeal(true)} />}
          {tab === 'explore' && (
            <ExploreTab
              onSelectFood={setSelectedFood}
              onPhoto={() => setShowPhoto(true)}
              onBarcode={() => setShowBarcode(true)}
            />
          )}
          {tab === 'history' && <HistoryTab />}
          {tab === 'profile' && <ProfileTab />}
        </motion.div>
      </AnimatePresence>

      {/* Modals */}
      <AddMealModal
        open={showAddMeal}
        onClose={() => setShowAddMeal(false)}
        onSave={handleManualAdd}
      />
      <BarcodeModal
        open={showBarcode}
        onClose={() => setShowBarcode(false)}
        onFound={setSelectedFood}
      />
      <AnimatePresence>
        {showPhoto && (
          <MealPhotoAnalyzer
            onClose={() => setShowPhoto(false)}
            onSaved={() => {
              setShowPhoto(false)
              refresh()
            }}
          />
        )}
        {selectedFood && (
          <FoodDetailModal
            food={selectedFood}
            onClose={() => setSelectedFood(null)}
            onAdd={handleFoodAdd}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

export default function NutritionPage() {
  return (
    <Suspense>
      <NutritionPageInner />
    </Suspense>
  )
}

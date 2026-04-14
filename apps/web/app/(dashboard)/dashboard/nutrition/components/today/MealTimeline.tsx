'use client'

import { UtensilsCrossed } from 'lucide-react'
import { MealTimelineItem } from './MealTimelineItem'
import type { MealLog } from '@/lib/nutrition/types'

interface Props {
  meals: MealLog[]
  onDelete: (id: string) => void
  onCopy: (meal: MealLog) => void
  onAddMeal: () => void
}

export function MealTimeline({ meals, onDelete, onCopy, onAddMeal }: Props) {
  if (meals.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <UtensilsCrossed size={36} className="mb-3 text-white/20" />
        <p className="text-sm text-[#64748B]">Henüz öğün eklenmedi</p>
        <button
          onClick={onAddMeal}
          className="mt-3 cursor-pointer text-xs text-[#6366F1] transition-colors hover:text-[#818CF8]"
        >
          + İlk öğünü ekle
        </button>
      </div>
    )
  }

  return (
    <div>
      {meals.map((meal, i) => (
        <MealTimelineItem key={meal.id} meal={meal} index={i} onDelete={onDelete} onCopy={onCopy} />
      ))}
    </div>
  )
}

'use client'

import { CalorieRing } from '../today/CalorieRing'
import { MacroBars } from '../today/MacroBars'
import { WaterTracker } from '../today/WaterTracker'
import { MealTimeline } from '../today/MealTimeline'
import { QuickAddBar } from '../today/QuickAddBar'
import { useNutritionToday } from '../../hooks/useNutritionToday'

interface Props {
  onAddMeal: () => void
}

export function TodayTab({ onAddMeal }: Props) {
  const {
    meals,
    goal,
    totals,
    waterGlasses,
    streak,
    score,
    loading,
    deleteMeal,
    copyMeal,
    updateWater,
    addQuickItem,
  } = useNutritionToday()

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-64 rounded-2xl bg-white/[0.04]" />
        <div className="h-32 rounded-2xl bg-white/[0.04]" />
        <div className="h-48 rounded-2xl bg-white/[0.04]" />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="rounded-[1.5rem] border border-white/[0.06] p-[1px]">
        <div className="rounded-[calc(1.5rem-1px)] bg-[#12121E] p-5">
          <div className="flex flex-col items-center gap-6 lg:flex-row">
            <div className="shrink-0">
              <CalorieRing
                consumed={Math.round(totals.calories)}
                goal={goal.dailyCalories}
                score={score.score}
                streak={streak.currentStreak}
              />
            </div>
            <div className="w-full flex-1 space-y-4">
              <MacroBars
                protein={{ current: totals.protein, goal: goal.proteinG }}
                carbs={{ current: totals.carbs, goal: goal.carbsG }}
                fat={{ current: totals.fat, goal: goal.fatG }}
                fiber={{ current: totals.fiber, goal: goal.fiberG }}
              />
              <WaterTracker
                glasses={waterGlasses}
                goal={Math.round(goal.waterGoalMl / 250)}
                onUpdate={updateWater}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-[1.5rem] border border-white/[0.06] p-[1px]">
        <div className="rounded-[calc(1.5rem-1px)] bg-[#12121E] p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-white">Bugünkü Öğünler</h3>
            <button
              onClick={onAddMeal}
              className="cursor-pointer rounded-lg bg-[#6366F1] px-3 py-1.5 text-xs text-white transition-colors hover:bg-[#4F46E5]"
            >
              + Ekle
            </button>
          </div>
          <MealTimeline meals={meals} onDelete={deleteMeal} onCopy={copyMeal} onAddMeal={onAddMeal} />
        </div>
      </div>

      <div className="rounded-[1.5rem] border border-white/[0.06] p-[1px]">
        <div className="rounded-[calc(1.5rem-1px)] bg-[#12121E] p-5">
          <h3 className="mb-3 font-semibold text-white">Hızlı Ekle</h3>
          <QuickAddBar onAdd={addQuickItem} />
        </div>
      </div>
    </div>
  )
}

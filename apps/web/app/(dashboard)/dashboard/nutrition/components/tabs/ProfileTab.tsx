'use client'

import { GoalEditor } from '../profile/GoalEditor'
import { MealTemplates } from '../profile/MealTemplates'
import { AiNutritionTip } from '../profile/AiNutritionTip'

const DEFAULT_GOAL = {
  dailyCalories: 2000,
  proteinG: 150,
  carbsG: 250,
  fatG: 65,
  waterGoalMl: 2500,
  fiberG: 25,
}

export function ProfileTab() {
  return (
    <div className="space-y-4">
      <AiNutritionTip />
      <GoalEditor initialGoal={DEFAULT_GOAL} />
      <MealTemplates />
    </div>
  )
}

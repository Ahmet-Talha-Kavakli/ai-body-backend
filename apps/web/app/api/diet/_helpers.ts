import { db } from '@/lib/db/client'

export type PresetMealItem = {
  name: string
  servingSize: number
  servingUnit: string
  quantity: number
  calories: number
  proteinG: number
  carbsG: number
  fatG: number
  fiberG?: number
  sugarG?: number
}

export type PresetMeal = {
  name: string
  items: PresetMealItem[]
}

export type MealPool = {
  breakfast: PresetMeal[]
  lunch: PresetMeal[]
  dinner: PresetMeal[]
  snack: PresetMeal[]
}

export type Rules = {
  allowed: string[]
  avoid: string[]
  tips: string[]
}

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'] as const
export type MealType = (typeof MEAL_TYPES)[number]

/**
 * Calorie formula resolver — "fixed:1800" | "perKg:25" | "tdee:0.9"
 * Returns daily calorie target for the user.
 */
export async function resolveCalorieTarget(formula: string, userId: string): Promise<number> {
  const [type, valStr] = formula.split(':')
  const val = Number(valStr)

  if (type === 'fixed') return Math.round(val)

  const profile = await db.userBasicProfile.findUnique({ where: { userId } }).catch(() => null)
  const weight = profile?.weight ?? 75
  const height = profile?.height ?? 170
  const age = profile?.age ?? 28
  const sex = (profile?.gender ?? 'Male').toLowerCase().includes('female') ? 'female' : 'male'

  if (type === 'perKg') return Math.round(weight * val)

  // tdee: BMR × 1.55 × val
  const bmr =
    sex === 'female'
      ? 10 * weight + 6.25 * height - 5 * age - 161
      : 10 * weight + 6.25 * height - 5 * age + 5
  const tdee = bmr * 1.55
  return Math.round(tdee * val)
}

/**
 * Calculate macros (g) from daily calories + percentage split.
 */
export function calcMacros(
  dailyCalories: number,
  proteinPct: number,
  carbsPct: number,
  fatPct: number
) {
  return {
    proteinG: Math.round((dailyCalories * proteinPct) / 100 / 4),
    carbsG: Math.round((dailyCalories * carbsPct) / 100 / 4),
    fatG: Math.round((dailyCalories * fatPct) / 100 / 9),
  }
}

/**
 * Compute totals for a PresetMeal (calories, protein, carbs, fat).
 */
export function mealTotals(meal: PresetMeal) {
  return meal.items.reduce(
    (acc, it) => ({
      cal: acc.cal + it.calories * it.quantity,
      p: acc.p + it.proteinG * it.quantity,
      c: acc.c + it.carbsG * it.quantity,
      f: acc.f + it.fatG * it.quantity,
    }),
    { cal: 0, p: 0, c: 0, f: 0 }
  )
}

/**
 * Pick a meal from the pool deterministically (date-based rotation).
 * Same user gets same meal for same date — but different across days.
 */
export function pickMealForDate(
  pool: PresetMeal[],
  dateStr: string,
  mealType: MealType
): PresetMeal {
  if (pool.length === 0) return { name: 'Boş', items: [] }
  // Hash: date + mealType → index
  const key = `${dateStr}-${mealType}`
  let hash = 0
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) & 0xffffffff
  const idx = Math.abs(hash) % pool.length
  return pool[idx]
}

/**
 * Generate DietDayMenu rows for a date range from a mealPool.
 * Used when starting a plan or extending it.
 */
export function buildDayMenus(
  planId: string,
  startDate: Date,
  durationDays: number,
  mealPool: MealPool
): Array<{
  planId: string
  date: string
  mealType: MealType
  items: any
  totalCalories: number
  totalProteinG: number
  totalCarbsG: number
  totalFatG: number
}> {
  const rows: any[] = []
  for (let i = 0; i < durationDays; i++) {
    const d = new Date(startDate)
    d.setDate(d.getDate() + i)
    d.setHours(0, 0, 0, 0)
    const dateStr = d.toISOString().slice(0, 10)

    for (const mealType of MEAL_TYPES) {
      const meal = pickMealForDate(mealPool[mealType] ?? [], dateStr, mealType)
      const t = mealTotals(meal)
      rows.push({
        planId,
        date: dateStr,
        mealType,
        items: meal.items,
        totalCalories: t.cal,
        totalProteinG: t.p,
        totalCarbsG: t.c,
        totalFatG: t.f,
      })
    }
  }
  return rows
}

/**
 * Today date as YYYY-MM-DD (server-side)
 */
export function todayStr(): string {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d.toISOString().slice(0, 10)
}

import type { DailyEntry, WeeklyStats, MealTimingStats, TopFood } from './types'

export function computeGoalHitPercent(daily: DailyEntry[], goalCalories: number): number {
  if (daily.length === 0) return 0
  const tolerance = goalCalories * 0.1
  const hits = daily.filter(
    (d) => d.calories >= goalCalories - tolerance && d.calories <= goalCalories + tolerance
  )
  return (hits.length / daily.length) * 100
}

export function getBadge(goalHitPercent: number): 'excellent' | 'good' | 'needs_work' {
  if (goalHitPercent >= 80) return 'excellent'
  if (goalHitPercent >= 50) return 'good'
  return 'needs_work'
}

export function computeWeeklyStats(daily: DailyEntry[], goalCalories: number): WeeklyStats[] {
  const weeks: WeeklyStats[] = []
  for (let i = 0; i < daily.length; i += 7) {
    const chunk = daily.slice(i, i + 7)
    const avg = (key: keyof DailyEntry) =>
      Math.round(chunk.reduce((s, d) => s + (d[key] as number), 0) / chunk.length)
    const goalHitPercent = computeGoalHitPercent(chunk, goalCalories)
    weeks.push({
      weekLabel: `${chunk[0].date} - ${chunk[chunk.length - 1].date}`,
      avgCalories: avg('calories'),
      avgProtein: avg('protein'),
      avgCarbs: avg('carbs'),
      avgFat: avg('fat'),
      daysLogged: chunk.length,
      goalHitDays: Math.round((goalHitPercent / 100) * chunk.length),
      badge: getBadge(goalHitPercent),
    })
  }
  return weeks
}

export function computeMealTiming(
  meals: Array<{ mealType: string; totalCalories: number }>
): MealTimingStats {
  const groups: Record<string, number[]> = { breakfast: [], lunch: [], dinner: [], snack: [] }
  for (const m of meals) {
    const key = ['breakfast', 'lunch', 'dinner', 'snack'].includes(m.mealType)
      ? m.mealType
      : 'snack'
    groups[key].push(m.totalCalories)
  }
  const avg = (arr: number[]) =>
    arr.length ? Math.round(arr.reduce((s, v) => s + v, 0) / arr.length) : 0
  return {
    breakfast: avg(groups.breakfast),
    lunch: avg(groups.lunch),
    dinner: avg(groups.dinner),
    snack: avg(groups.snack),
  }
}

export function computeTopFoods(
  meals: Array<{ items: Array<{ name: string; calories: number }> | null | undefined }>
): TopFood[] {
  const map = new Map<string, { count: number; totalCalories: number }>()
  for (const m of meals) {
    const items = Array.isArray(m.items) ? m.items : []
    for (const item of items) {
      if (!item?.name) continue
      const existing = map.get(item.name) ?? { count: 0, totalCalories: 0 }
      map.set(item.name, {
        count: existing.count + 1,
        totalCalories: existing.totalCalories + (item.calories ?? 0),
      })
    }
  }
  return Array.from(map.entries())
    .map(([name, { count, totalCalories }]) => ({
      name,
      count,
      avgCalories: Math.round(totalCalories / count),
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
}

export function computeStreakCalendar(daily: DailyEntry[]): Record<string, boolean> {
  const loggedDates = new Set(daily.map((d) => d.date))
  const calendar: Record<string, boolean> = {}
  const today = new Date()
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    calendar[key] = loggedDates.has(key)
  }
  return calendar
}

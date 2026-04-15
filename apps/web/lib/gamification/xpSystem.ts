export type XPAction =
  | 'workout_complete'
  | 'water_goal'
  | 'meal_logged'
  | 'medication_taken'
  | 'sleep_logged'
  | 'supplement_taken'
  | 'session_complete'
  | 'roadmap_task'
  | 'streak_milestone'

export const XP_VALUES: Record<XPAction, number> = {
  workout_complete: 50,
  water_goal: 10,
  meal_logged: 10,
  medication_taken: 15,
  sleep_logged: 20,
  supplement_taken: 5,
  session_complete: 30,
  roadmap_task: 25,
  streak_milestone: 100,
}

export function levelFromXP(xp: number): number {
  return Math.floor(Math.sqrt(xp / 50)) + 1
}

export function xpForLevel(level: number): number {
  return (level - 1) * (level - 1) * 50
}

export function levelProgress(xp: number): {
  level: number
  progress: number
  currentLevelXp: number
  nextLevelXp: number
} {
  const level = levelFromXP(xp)
  const currentLevelXp = xpForLevel(level)
  const nextLevelXp = xpForLevel(level + 1)
  const progress = Math.round(((xp - currentLevelXp) / (nextLevelXp - currentLevelXp)) * 100)
  return { level, progress, currentLevelXp, nextLevelXp }
}

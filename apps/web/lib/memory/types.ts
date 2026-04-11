// apps/web/lib/memory/types.ts

// Tüm memory tipleri — DB'de String olarak saklanır (enum değil)
export const MEMORY_TYPES = {
  SESSION_SUMMARY: 'SESSION_SUMMARY',
  WEEKLY_SUMMARY: 'WEEKLY_SUMMARY',
  EXERCISE_PATTERN: 'EXERCISE_PATTERN',
  NUTRITION_PATTERN: 'NUTRITION_PATTERN',
  RECOVERY_PATTERN: 'RECOVERY_PATTERN',
  MILESTONE: 'MILESTONE',
  WEAKNESS: 'WEAKNESS',
  PREFERENCE: 'PREFERENCE',
} as const

export type MemoryType = keyof typeof MEMORY_TYPES

export interface SessionMemoryInput {
  userId: string
  sessionId: string
  // Egzersizler route'tan gruplandırılarak gelir
  exercises: Array<{
    name: string
    sets: Array<{
      setNumber: number
      reps: number | null
      weightKg: number | null
      formScore: number
    }>
    avgFormScore: number
  }>
  durationSeconds: number
  overallFormScore: number | null
  caloriesBurned: number | null
  notes: string | null
}

export interface WeeklyMemoryInput {
  userId: string
  weekStartDate: Date
  weekEndDate: Date
  totalWorkouts: number
  totalVolume: number
  avgFormScore: number
  avgReadiness: number
  topExercises: string[]
  dailyMetrics: Array<{
    sleepHours: number
    stressLevel: number
    proteinIntake: number
    energyLevel: number
    mood: string
  }>
}

export interface MemoryContext {
  memories: string[]
  totalRetrieved: number
  types: MemoryType[]
}

// buildSessionMemoryText'in tag modunda döndürdüğü tip
export interface SessionMemoryTextResult {
  text: string
  tags: string[]
}

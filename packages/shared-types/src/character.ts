export type { FitnessLevel, Gender } from './common'

export interface CharacterMorphParams {
  bmi: number
  muscleLevel: number // 0–1
  heightNorm: number // heightCm / 175
  gender: import('./common').Gender
  fitnessLevel: import('./common').FitnessLevel
  updatedAt: string // ISO timestamp
}

export interface MorphCalculatorInput {
  weightKg: number
  heightCm: number
  fitnessLevel: string
  gender: string
  totalWorkoutCount: number
}

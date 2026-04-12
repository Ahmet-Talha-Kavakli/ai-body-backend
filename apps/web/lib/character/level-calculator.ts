import type { FitnessLevel } from '@fitai/shared-types'

export function workoutCountToFitnessLevel(count: number): FitnessLevel {
  if (count >= 100) return 'elite'
  if (count >= 50) return 'advanced'
  if (count >= 10) return 'intermediate'
  return 'beginner'
}

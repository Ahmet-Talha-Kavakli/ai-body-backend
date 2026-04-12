import type {
  CharacterMorphParams,
  MorphCalculatorInput,
  FitnessLevel,
  Gender,
} from '@fitai/shared-types'

const FITNESS_LEVELS: FitnessLevel[] = ['beginner', 'intermediate', 'advanced', 'elite']
const GENDERS: Gender[] = ['male', 'female', 'other', 'prefer_not_to_say']

export function computeMorphParams(input: MorphCalculatorInput): CharacterMorphParams {
  const heightM = input.heightCm / 100
  const bmi = input.weightKg / (heightM * heightM)
  const muscleLevel = Math.min(input.totalWorkoutCount / 100, 1.0)
  const heightNorm = input.heightCm / 175

  const fitnessLevel: FitnessLevel = FITNESS_LEVELS.includes(input.fitnessLevel as FitnessLevel)
    ? (input.fitnessLevel as FitnessLevel)
    : 'beginner'

  const gender: Gender = GENDERS.includes(input.gender as Gender)
    ? (input.gender as Gender)
    : 'other'

  return {
    bmi: Math.round(bmi * 100) / 100,
    muscleLevel: Math.round(muscleLevel * 1000) / 1000,
    heightNorm: Math.round(heightNorm * 1000) / 1000,
    gender,
    fitnessLevel,
    updatedAt: new Date().toISOString(),
  }
}

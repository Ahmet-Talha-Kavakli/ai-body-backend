import { describe, it, expect } from 'vitest'
import {
  profileUpdateSchema,
  sessionCompleteSchema,
  mealAnalyzeSchema,
  coachMessageSchema,
} from '@/lib/validation/schemas'

describe('profileUpdateSchema', () => {
  it('accepts valid profile data', () => {
    const result = profileUpdateSchema.safeParse({
      name: 'John',
      fitnessLevel: 'intermediate',
    })
    expect(result.success).toBe(true)
  })

  it('rejects invalid fitnessLevel', () => {
    const result = profileUpdateSchema.safeParse({ fitnessLevel: 'superhuman' })
    expect(result.success).toBe(false)
  })

  it('rejects name longer than 100 chars', () => {
    const result = profileUpdateSchema.safeParse({ name: 'a'.repeat(101) })
    expect(result.success).toBe(false)
  })

  it('accepts empty object (all fields optional)', () => {
    const result = profileUpdateSchema.safeParse({})
    expect(result.success).toBe(true)
  })
})

describe('sessionCompleteSchema', () => {
  it('accepts valid session data', () => {
    const result = sessionCompleteSchema.safeParse({
      durationSeconds: 3600,
      caloriesBurned: 400,
    })
    expect(result.success).toBe(true)
  })

  it('rejects missing durationSeconds', () => {
    const result = sessionCompleteSchema.safeParse({})
    expect(result.success).toBe(false)
  })

  it('rejects negative durationSeconds', () => {
    const result = sessionCompleteSchema.safeParse({ durationSeconds: -10 })
    expect(result.success).toBe(false)
  })

  it('accepts completed sets', () => {
    const result = sessionCompleteSchema.safeParse({
      durationSeconds: 1800,
      completedSets: [
        { exerciseSlug: 'bench-press', exerciseName: 'Bench Press', setNumber: 1, reps: 10 },
      ],
    })
    expect(result.success).toBe(true)
  })
})

describe('mealAnalyzeSchema', () => {
  it('accepts valid image data', () => {
    const result = mealAnalyzeSchema.safeParse({
      imageBase64: 'base64encodedstring',
      mealType: 'breakfast',
    })
    expect(result.success).toBe(true)
  })

  it('rejects empty imageBase64', () => {
    const result = mealAnalyzeSchema.safeParse({ imageBase64: '', mealType: 'lunch' })
    expect(result.success).toBe(false)
  })

  it('rejects invalid mealType', () => {
    const result = mealAnalyzeSchema.safeParse({ imageBase64: 'data', mealType: 'brunch' })
    expect(result.success).toBe(false)
  })
})

describe('coachMessageSchema', () => {
  it('accepts valid coach message', () => {
    const result = coachMessageSchema.safeParse({
      exercise: 'squat',
      repCount: 5,
      targetReps: 10,
      setNumber: 1,
      totalSets: 3,
    })
    expect(result.success).toBe(true)
  })

  it('rejects missing required fields', () => {
    const result = coachMessageSchema.safeParse({ exercise: 'squat' })
    expect(result.success).toBe(false)
  })

  it('rejects negative repCount', () => {
    const result = coachMessageSchema.safeParse({
      exercise: 'squat',
      repCount: -1,
      targetReps: 10,
      setNumber: 1,
      totalSets: 3,
    })
    expect(result.success).toBe(false)
  })
})

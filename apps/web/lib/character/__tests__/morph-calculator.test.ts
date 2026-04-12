import { describe, it, expect } from 'vitest'
import { computeMorphParams } from '../morph-calculator'

describe('computeMorphParams', () => {
  const base = {
    weightKg: 70,
    heightCm: 175,
    fitnessLevel: 'beginner',
    gender: 'male',
    totalWorkoutCount: 0,
  }

  it('normal BMI → bmi ~22.9', () => {
    const p = computeMorphParams(base)
    expect(p.bmi).toBeCloseTo(22.86, 1)
  })

  it('heightNorm = heightCm / 175', () => {
    const p = computeMorphParams({ ...base, heightCm: 175 })
    expect(p.heightNorm).toBe(1.0)
  })

  it('muscleLevel = 0 when 0 workouts', () => {
    const p = computeMorphParams(base)
    expect(p.muscleLevel).toBe(0)
  })

  it('muscleLevel = 1 at 100+ workouts', () => {
    const p = computeMorphParams({ ...base, totalWorkoutCount: 150 })
    expect(p.muscleLevel).toBe(1.0)
  })

  it('muscleLevel clamps at 1.0', () => {
    const p = computeMorphParams({ ...base, totalWorkoutCount: 200 })
    expect(p.muscleLevel).toBe(1.0)
  })

  it('unknown fitnessLevel defaults to beginner', () => {
    const p = computeMorphParams({ ...base, fitnessLevel: 'unknown' })
    expect(p.fitnessLevel).toBe('beginner')
  })

  it('unknown gender defaults to other', () => {
    const p = computeMorphParams({ ...base, gender: 'alien' })
    expect(p.gender).toBe('other')
  })
})

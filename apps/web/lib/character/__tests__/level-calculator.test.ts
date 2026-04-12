import { describe, it, expect } from 'vitest'
import { workoutCountToFitnessLevel } from '../level-calculator'

describe('workoutCountToFitnessLevel', () => {
  it('0 workouts → beginner', () => expect(workoutCountToFitnessLevel(0)).toBe('beginner'))
  it('9 workouts → beginner', () => expect(workoutCountToFitnessLevel(9)).toBe('beginner'))
  it('10 workouts → intermediate', () =>
    expect(workoutCountToFitnessLevel(10)).toBe('intermediate'))
  it('49 workouts → intermediate', () =>
    expect(workoutCountToFitnessLevel(49)).toBe('intermediate'))
  it('50 workouts → advanced', () => expect(workoutCountToFitnessLevel(50)).toBe('advanced'))
  it('99 workouts → advanced', () => expect(workoutCountToFitnessLevel(99)).toBe('advanced'))
  it('100 workouts → elite', () => expect(workoutCountToFitnessLevel(100)).toBe('elite'))
  it('500 workouts → elite', () => expect(workoutCountToFitnessLevel(500)).toBe('elite'))
})

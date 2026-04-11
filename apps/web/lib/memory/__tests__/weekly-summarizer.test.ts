import { describe, it, expect } from 'vitest'
import { buildWeeklyMemoryText } from '../weekly-summarizer'
import type { WeeklyMemoryInput } from '../types'

const mockWeek: WeeklyMemoryInput = {
  userId: 'user_123',
  weekStartDate: new Date('2026-04-07'),
  weekEndDate: new Date('2026-04-13'),
  totalWorkouts: 4,
  totalVolume: 18500,
  avgFormScore: 83,
  avgReadiness: 72,
  topExercises: ['Barbell Squat', 'Bench Press', 'Deadlift'],
  dailyMetrics: [
    { sleepHours: 7.5, stressLevel: 4, proteinIntake: 165, energyLevel: 8, mood: 'Good' },
    { sleepHours: 6.0, stressLevel: 7, proteinIntake: 120, energyLevel: 5, mood: 'Neutral' },
    { sleepHours: 8.0, stressLevel: 3, proteinIntake: 180, energyLevel: 9, mood: 'Excellent' },
    { sleepHours: 7.0, stressLevel: 5, proteinIntake: 155, energyLevel: 7, mood: 'Good' },
  ],
}

describe('buildWeeklyMemoryText', () => {
  it('includes workout count and volume', () => {
    const text = buildWeeklyMemoryText(mockWeek)
    expect(text).toContain('4')
    expect(text).toContain('18500')
  })

  it('includes top exercises', () => {
    const text = buildWeeklyMemoryText(mockWeek)
    expect(text).toContain('Barbell Squat')
    expect(text).toContain('Bench Press')
  })

  it('calculates and shows average sleep', () => {
    const text = buildWeeklyMemoryText(mockWeek)
    // (7.5+6+8+7)/4 = 7.1
    expect(text).toContain('7.1')
  })

  it('includes form and readiness scores', () => {
    const text = buildWeeklyMemoryText(mockWeek)
    expect(text).toContain('83')
    expect(text).toContain('72')
  })

  it('contains a consistency label for 4 workouts', () => {
    const text = buildWeeklyMemoryText(mockWeek)
    expect(text).toMatch(/4 antrenman/i)
  })

  it('handles empty dailyMetrics array', () => {
    const input = { ...mockWeek, dailyMetrics: [] }
    expect(() => buildWeeklyMemoryText(input)).not.toThrow()
  })
})

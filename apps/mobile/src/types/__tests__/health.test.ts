import { describe, it, expect } from 'vitest'
import type {
  HeartRateReading,
  SleepSession,
  StepData,
  EnergyBurned,
  DailyHealthSummary,
} from '../health'

describe('Health Types', () => {
  it('should define HeartRateReading with required fields', () => {
    const reading: HeartRateReading = {
      id: '1',
      userId: 'u1',
      bpm: 72,
      timestamp: new Date().toISOString(),
      sourceDevice: 'Apple Watch',
    }
    expect(reading.bpm).toBe(72)
  })

  it('should support optional context field', () => {
    const reading: HeartRateReading = {
      id: '1',
      userId: 'u1',
      bpm: 145,
      timestamp: new Date().toISOString(),
      sourceDevice: 'Apple Watch',
      context: 'workout',
    }
    expect(reading.context).toBe('workout')
  })

  it('should define SleepSession with stages', () => {
    const sleep: SleepSession = {
      id: '1',
      userId: 'u1',
      startTime: '2026-04-18T22:00:00Z',
      endTime: '2026-04-19T06:00:00Z',
      durationMinutes: 480,
      stages: {
        remMinutes: 90,
        deepMinutes: 120,
        lightMinutes: 240,
        awakeMinutes: 30,
      },
    }
    expect(sleep.stages.remMinutes).toBe(90)
  })

  it('should define StepData with goal', () => {
    const steps: StepData = {
      date: '2026-04-19',
      count: 8500,
      goalCount: 10000,
    }
    expect(steps.count).toBeLessThan(steps.goalCount)
  })

  it('should define EnergyBurned with active and basal', () => {
    const energy: EnergyBurned = {
      date: '2026-04-19',
      activeCalories: 450,
      basalCalories: 1650,
      totalCalories: 2100,
    }
    expect(energy.totalCalories).toBe(energy.activeCalories + energy.basalCalories)
  })

  it('should define DailyHealthSummary', () => {
    const summary: DailyHealthSummary = {
      date: '2026-04-19',
      heartRateAvg: 75,
      heartRateResting: 62,
      sleepDurationMinutes: 480,
      stepCount: 8500,
      activeCalories: 450,
    }
    expect(summary.date).toBe('2026-04-19')
  })
})

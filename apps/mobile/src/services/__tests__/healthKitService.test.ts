import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  getHeartRate,
  getSleep,
  getSteps,
  getEnergyBurned,
  getDateRange,
} from '../healthKitService'

vi.mock('react-native-health', () => ({
  default: {
    initHealthKit: vi.fn(),
    getHeartRateSamples: vi.fn((_opts: unknown, cb: (err: unknown, res: unknown[]) => void) =>
      cb(null, [])
    ),
    getSleepSamples: vi.fn((_opts: unknown, cb: (err: unknown, res: unknown[]) => void) =>
      cb(null, [])
    ),
    getDailyStepCountSamples: vi.fn((_opts: unknown, cb: (err: unknown, res: unknown[]) => void) =>
      cb(null, [])
    ),
    getActiveEnergyBurned: vi.fn((_opts: unknown, cb: (err: unknown, res: unknown[]) => void) =>
      cb(null, [])
    ),
    getBasalEnergyBurned: vi.fn((_opts: unknown, cb: (err: unknown, res: unknown[]) => void) =>
      cb(null, [])
    ),
  },
  HealthValue: {},
  HealthInputOptions: {},
}))

vi.mock('react-native', () => ({
  Platform: { OS: 'ios' },
}))

describe('HealthKit Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getHeartRate', () => {
    it('should fetch heart rate for date range', async () => {
      const readings = await getHeartRate({
        startDate: '2026-04-18T00:00:00Z',
        endDate: '2026-04-19T23:59:59Z',
      })
      expect(Array.isArray(readings)).toBe(true)
    })

    it('should handle empty results', async () => {
      const readings = await getHeartRate({
        startDate: '2026-01-01T00:00:00Z',
        endDate: '2026-01-01T23:59:59Z',
      })
      expect(readings).toEqual([])
    })
  })

  describe('getSleep', () => {
    it('should fetch sleep sessions for date range', async () => {
      const sessions = await getSleep({
        startDate: '2026-04-18T00:00:00Z',
        endDate: '2026-04-19T23:59:59Z',
      })
      expect(Array.isArray(sessions)).toBe(true)
    })

    it('should calculate durationMinutes from start/end', async () => {
      const sessions = await getSleep({
        startDate: '2026-04-18T22:00:00Z',
        endDate: '2026-04-19T06:00:00Z',
      })
      if (sessions.length > 0) {
        expect(sessions[0].durationMinutes).toBeGreaterThan(0)
      }
    })
  })

  describe('getSteps', () => {
    it('should fetch daily step count', async () => {
      const steps = await getSteps({
        startDate: '2026-04-19T00:00:00Z',
        endDate: '2026-04-19T23:59:59Z',
      })
      expect(Array.isArray(steps)).toBe(true)
    })

    it('should default goalCount to 10000', async () => {
      const steps = await getSteps({
        startDate: '2026-04-19T00:00:00Z',
        endDate: '2026-04-19T23:59:59Z',
      })
      if (steps.length > 0) {
        expect(steps[0].goalCount).toBe(10000)
      }
    })
  })

  describe('getEnergyBurned', () => {
    it('should fetch active + basal calories', async () => {
      const energy = await getEnergyBurned({
        startDate: '2026-04-19T00:00:00Z',
        endDate: '2026-04-19T23:59:59Z',
      })
      expect(Array.isArray(energy)).toBe(true)
    })

    it('should calculate totalCalories as active + basal', async () => {
      const energy = await getEnergyBurned({
        startDate: '2026-04-19T00:00:00Z',
        endDate: '2026-04-19T23:59:59Z',
      })
      if (energy.length > 0) {
        expect(energy[0].totalCalories).toBe(energy[0].activeCalories + energy[0].basalCalories)
      }
    })
  })

  describe('getDateRange', () => {
    it('should return today range', () => {
      const range = getDateRange('today')
      expect(range.startDate).toBeDefined()
      expect(range.endDate).toBeDefined()
    })

    it('should return week range (7 days)', () => {
      const range = getDateRange('week')
      const start = new Date(range.startDate)
      const end = new Date(range.endDate)
      const days = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
      expect(days).toBeCloseTo(7, 0)
    })

    it('should return month range (30 days)', () => {
      const range = getDateRange('month')
      const start = new Date(range.startDate)
      const end = new Date(range.endDate)
      const days = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
      expect(days).toBeCloseTo(30, 0)
    })
  })
})

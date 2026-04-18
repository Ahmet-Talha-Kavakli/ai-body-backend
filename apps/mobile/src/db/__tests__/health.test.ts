import { describe, it, expect, beforeEach } from 'vitest'
import {
  createHealthTables,
  saveHeartRateReading,
  getHeartRateReadingsForDate,
  saveSleepSession,
  getSleepSessionsForDate,
  saveStepData,
  getStepsForDate,
  saveEnergyBurned,
  getEnergyForDate,
  saveDailySummary,
  getDailySummary,
} from '../health'
import type {
  HeartRateReading,
  SleepSession,
  StepData,
  EnergyBurned,
  DailyHealthSummary,
} from '../../types/health'

describe('health database', () => {
  beforeEach(async () => {
    await createHealthTables()
  })

  describe('createHealthTables', () => {
    it('should create all health tables', async () => {
      await expect(createHealthTables()).resolves.not.toThrow()
    })

    it('should be idempotent', async () => {
      await createHealthTables()
      await expect(createHealthTables()).resolves.not.toThrow()
    })
  })

  describe('saveHeartRateReading', () => {
    it('should save a heart rate reading', async () => {
      const reading: HeartRateReading = {
        id: '1',
        userId: 'u1',
        bpm: 72,
        timestamp: '2026-04-19T10:00:00Z',
        sourceDevice: 'Apple Watch',
      }
      await expect(saveHeartRateReading(reading)).resolves.not.toThrow()
    })

    it('should save reading without optional fields', async () => {
      const reading: HeartRateReading = {
        id: '2',
        userId: 'u1',
        bpm: 80,
        timestamp: '2026-04-19T11:00:00Z',
      }
      await expect(saveHeartRateReading(reading)).resolves.not.toThrow()
    })
  })

  describe('getHeartRateReadingsForDate', () => {
    it('should save and retrieve heart rate reading', async () => {
      const reading: HeartRateReading = {
        id: '1',
        userId: 'u1',
        bpm: 72,
        timestamp: '2026-04-19T10:00:00Z',
        sourceDevice: 'Apple Watch',
      }
      await saveHeartRateReading(reading)
      const readings = await getHeartRateReadingsForDate('u1', '2026-04-19')
      expect(readings).toHaveLength(1)
      expect(readings[0].bpm).toBe(72)
    })

    it('should return empty array for date with no readings', async () => {
      const readings = await getHeartRateReadingsForDate('u1', '2020-01-01')
      expect(Array.isArray(readings)).toBe(true)
      expect(readings).toHaveLength(0)
    })
  })

  describe('saveSleepSession', () => {
    it('should save and retrieve sleep session', async () => {
      const session: SleepSession = {
        id: '1',
        userId: 'u1',
        startTime: '2026-04-18T22:00:00Z',
        endTime: '2026-04-19T06:00:00Z',
        durationMinutes: 480,
        stages: { remMinutes: 90, deepMinutes: 120, lightMinutes: 240, awakeMinutes: 30 },
      }
      await saveSleepSession(session)
      const sessions = await getSleepSessionsForDate('u1', '2026-04-19')
      expect(sessions.length).toBeGreaterThan(0)
    })

    it('should save session without stages', async () => {
      const session: SleepSession = {
        id: '2',
        userId: 'u1',
        startTime: '2026-04-18T22:00:00Z',
        endTime: '2026-04-19T06:00:00Z',
        durationMinutes: 480,
      }
      await expect(saveSleepSession(session)).resolves.not.toThrow()
    })
  })

  describe('saveStepData', () => {
    it('should save and retrieve step data', async () => {
      const data: StepData = { date: '2026-04-19', count: 8500, goalCount: 10000 }
      await saveStepData('u1', data)
      const steps = await getStepsForDate('u1', '2026-04-19')
      expect(steps?.count).toBe(8500)
    })

    it('should return null for date with no data', async () => {
      const steps = await getStepsForDate('u1', '2020-01-01')
      expect(steps).toBeNull()
    })

    it('should overwrite existing data (upsert)', async () => {
      await saveStepData('u1', { date: '2026-04-19', count: 1000, goalCount: 10000 })
      await saveStepData('u1', { date: '2026-04-19', count: 8500, goalCount: 10000 })
      const steps = await getStepsForDate('u1', '2026-04-19')
      expect(steps?.count).toBe(8500)
    })
  })

  describe('saveEnergyBurned', () => {
    it('should save and retrieve energy data', async () => {
      const data: EnergyBurned = {
        date: '2026-04-19',
        activeCalories: 450,
        basalCalories: 1650,
        totalCalories: 2100,
      }
      await saveEnergyBurned('u1', data)
      const energy = await getEnergyForDate('u1', '2026-04-19')
      expect(energy?.activeCalories).toBe(450)
      expect(energy?.totalCalories).toBe(2100)
    })

    it('should return null for date with no data', async () => {
      const energy = await getEnergyForDate('u1', '2020-01-01')
      expect(energy).toBeNull()
    })
  })

  describe('saveDailySummary', () => {
    it('should save and retrieve daily summary', async () => {
      const summary: DailyHealthSummary = {
        date: '2026-04-19',
        heartRateAvg: 75,
        heartRateResting: 62,
        sleepDurationMinutes: 480,
        stepCount: 8500,
        activeCalories: 450,
      }
      await saveDailySummary('u1', summary)
      const retrieved = await getDailySummary('u1', '2026-04-19')
      expect(retrieved?.heartRateAvg).toBe(75)
      expect(retrieved?.heartRateResting).toBe(62)
      expect(retrieved?.stepCount).toBe(8500)
    })

    it('should return null for date with no summary', async () => {
      const retrieved = await getDailySummary('u1', '2020-01-01')
      expect(retrieved).toBeNull()
    })
  })
})

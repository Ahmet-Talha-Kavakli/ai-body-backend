import { describe, it, expect, beforeEach } from 'vitest'
import { useHealthStore } from '../healthStore'
import type {
  HeartRateReading,
  SleepSession,
  StepData,
  EnergyBurned,
} from '../../types/health'

describe('healthStore', () => {
  beforeEach(() => {
    useHealthStore.getState().clear()
  })

  describe('initial state', () => {
    it('should have initial state', () => {
      const state = useHealthStore.getState()
      expect(state.heartRateReadings).toEqual([])
      expect(state.sleepSessions).toEqual([])
      expect(state.stepData).toEqual([])
      expect(state.energyData).toEqual([])
      expect(state.loading).toBe(false)
      expect(state.error).toBeNull()
    })
  })

  describe('setHeartRateReadings', () => {
    it('should set heart rate readings', () => {
      const reading: HeartRateReading = {
        id: '1',
        userId: 'u1',
        bpm: 72,
        timestamp: new Date().toISOString(),
        sourceDevice: 'Apple Watch',
      }
      useHealthStore.getState().setHeartRateReadings([reading])
      expect(useHealthStore.getState().heartRateReadings).toHaveLength(1)
      expect(useHealthStore.getState().heartRateReadings[0].bpm).toBe(72)
    })

    it('should replace existing readings', () => {
      const reading1: HeartRateReading = {
        id: '1',
        userId: 'u1',
        bpm: 70,
        timestamp: new Date().toISOString(),
      }
      const reading2: HeartRateReading = {
        id: '2',
        userId: 'u1',
        bpm: 80,
        timestamp: new Date().toISOString(),
      }
      useHealthStore.getState().setHeartRateReadings([reading1])
      useHealthStore.getState().setHeartRateReadings([reading2])
      expect(useHealthStore.getState().heartRateReadings).toHaveLength(1)
      expect(useHealthStore.getState().heartRateReadings[0].id).toBe('2')
    })
  })

  describe('setSleepSessions', () => {
    it('should set sleep sessions', () => {
      const session: SleepSession = {
        id: '1',
        userId: 'u1',
        startTime: '2026-04-18T22:00:00Z',
        endTime: '2026-04-19T06:00:00Z',
        durationMinutes: 480,
        stages: { remMinutes: 90, deepMinutes: 120, lightMinutes: 240, awakeMinutes: 30 },
      }
      useHealthStore.getState().setSleepSessions([session])
      expect(useHealthStore.getState().sleepSessions).toHaveLength(1)
    })
  })

  describe('setStepData', () => {
    it('should set step data', () => {
      const data: StepData = { date: '2026-04-19', count: 8500, goalCount: 10000 }
      useHealthStore.getState().setStepData([data])
      expect(useHealthStore.getState().stepData).toHaveLength(1)
      expect(useHealthStore.getState().stepData[0].count).toBe(8500)
    })
  })

  describe('setEnergyData', () => {
    it('should set energy data', () => {
      const data: EnergyBurned = {
        date: '2026-04-19',
        activeCalories: 450,
        basalCalories: 1650,
        totalCalories: 2100,
      }
      useHealthStore.getState().setEnergyData([data])
      expect(useHealthStore.getState().energyData).toHaveLength(1)
    })
  })

  describe('setLoading', () => {
    it('should set loading state', () => {
      useHealthStore.getState().setLoading(true)
      expect(useHealthStore.getState().loading).toBe(true)
      useHealthStore.getState().setLoading(false)
      expect(useHealthStore.getState().loading).toBe(false)
    })
  })

  describe('setError', () => {
    it('should set error', () => {
      useHealthStore.getState().setError('HealthKit denied')
      expect(useHealthStore.getState().error).toBe('HealthKit denied')
    })

    it('should clear error when set to null', () => {
      useHealthStore.getState().setError('something')
      useHealthStore.getState().setError(null)
      expect(useHealthStore.getState().error).toBeNull()
    })
  })

  describe('getAverageHeartRate', () => {
    it('should calculate average heart rate from readings for a date', () => {
      const readings: HeartRateReading[] = [
        { id: '1', userId: 'u1', bpm: 70, timestamp: '2026-04-19T10:00:00Z', sourceDevice: 'Watch' },
        { id: '2', userId: 'u1', bpm: 75, timestamp: '2026-04-19T12:00:00Z', sourceDevice: 'Watch' },
        { id: '3', userId: 'u1', bpm: 80, timestamp: '2026-04-19T14:00:00Z', sourceDevice: 'Watch' },
      ]
      useHealthStore.getState().setHeartRateReadings(readings)
      const avg = useHealthStore.getState().getAverageHeartRate('2026-04-19')
      expect(avg).toBe(75)
    })

    it('should return 0 when no readings for date', () => {
      const avg = useHealthStore.getState().getAverageHeartRate('2026-04-19')
      expect(avg).toBe(0)
    })

    it('should filter readings by date', () => {
      const readings: HeartRateReading[] = [
        { id: '1', userId: 'u1', bpm: 70, timestamp: '2026-04-18T10:00:00Z' },
        { id: '2', userId: 'u1', bpm: 80, timestamp: '2026-04-19T12:00:00Z' },
      ]
      useHealthStore.getState().setHeartRateReadings(readings)
      expect(useHealthStore.getState().getAverageHeartRate('2026-04-18')).toBe(70)
      expect(useHealthStore.getState().getAverageHeartRate('2026-04-19')).toBe(80)
    })
  })

  describe('getTotalSteps', () => {
    it('should return total steps for a date', () => {
      const data: StepData = { date: '2026-04-19', count: 8500, goalCount: 10000 }
      useHealthStore.getState().setStepData([data])
      expect(useHealthStore.getState().getTotalSteps('2026-04-19')).toBe(8500)
    })

    it('should return 0 when no data for date', () => {
      expect(useHealthStore.getState().getTotalSteps('2026-04-19')).toBe(0)
    })
  })

  describe('getSleepDuration', () => {
    it('should return total sleep duration for a date', () => {
      const session: SleepSession = {
        id: '1',
        userId: 'u1',
        startTime: '2026-04-18T22:00:00Z',
        endTime: '2026-04-19T06:00:00Z',
        durationMinutes: 480,
      }
      useHealthStore.getState().setSleepSessions([session])
      expect(useHealthStore.getState().getSleepDuration('2026-04-19')).toBe(480)
    })

    it('should return 0 when no sessions for date', () => {
      expect(useHealthStore.getState().getSleepDuration('2026-04-19')).toBe(0)
    })
  })

  describe('getTotalEnergy', () => {
    it('should return total energy burned for a date', () => {
      const data: EnergyBurned = {
        date: '2026-04-19',
        activeCalories: 450,
        basalCalories: 1650,
        totalCalories: 2100,
      }
      useHealthStore.getState().setEnergyData([data])
      expect(useHealthStore.getState().getTotalEnergy('2026-04-19')).toBe(2100)
    })

    it('should return 0 when no data for date', () => {
      expect(useHealthStore.getState().getTotalEnergy('2026-04-19')).toBe(0)
    })
  })

  describe('clear', () => {
    it('should clear all state', () => {
      useHealthStore.getState().setHeartRateReadings([
        { id: '1', userId: 'u1', bpm: 72, timestamp: new Date().toISOString() },
      ])
      useHealthStore.getState().setLoading(true)
      useHealthStore.getState().setError('err')

      useHealthStore.getState().clear()
      const state = useHealthStore.getState()
      expect(state.heartRateReadings).toEqual([])
      expect(state.sleepSessions).toEqual([])
      expect(state.stepData).toEqual([])
      expect(state.energyData).toEqual([])
      expect(state.loading).toBe(false)
      expect(state.error).toBeNull()
    })
  })
})

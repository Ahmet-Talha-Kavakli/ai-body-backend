import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('react-native-health', () => ({
  default: {
    initHealthKit: vi.fn((_opts: unknown, cb: (err: unknown) => void) => cb(null)),
    getAuthStatus: vi.fn((_opts: unknown, cb: (err: unknown, res: unknown) => void) =>
      cb(null, { permissions: { read: [1, 1, 1, 1], write: [] } })
    ),
    Constants: {
      Permissions: {
        HeartRate: 'HeartRate',
        SleepAnalysis: 'SleepAnalysis',
        StepCount: 'StepCount',
        ActiveEnergyBurned: 'ActiveEnergyBurned',
        BasalEnergyBurned: 'BasalEnergyBurned',
      },
    },
  },
  HealthValue: {},
  HealthInputOptions: {},
  HealthKitPermissions: {},
}))

vi.mock('react-native', () => ({
  Platform: { OS: 'ios' },
}))

import {
  requestHealthPermissions,
  checkHealthPermissions,
  isHealthKitAvailable,
} from '../healthPermission'

describe('Health Permission Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('isHealthKitAvailable', () => {
    it('should return a boolean', async () => {
      const result = await isHealthKitAvailable()
      expect(typeof result).toBe('boolean')
    })

    it('should return true on iOS', async () => {
      const result = await isHealthKitAvailable()
      expect(result).toBe(true)
    })
  })

  describe('requestHealthPermissions', () => {
    it('should return status with all 4 permissions', async () => {
      const status = await requestHealthPermissions()
      expect(status).toHaveProperty('heartRate')
      expect(status).toHaveProperty('sleep')
      expect(status).toHaveProperty('steps')
      expect(status).toHaveProperty('energy')
      expect(status).toHaveProperty('granted')
    })

    it('should have boolean values for each permission key', async () => {
      const status = await requestHealthPermissions()
      expect(typeof status.heartRate).toBe('boolean')
      expect(typeof status.sleep).toBe('boolean')
      expect(typeof status.steps).toBe('boolean')
      expect(typeof status.energy).toBe('boolean')
      expect(typeof status.granted).toBe('boolean')
    })

    it('should set granted=true when all permissions are authorized', async () => {
      const status = await requestHealthPermissions()
      expect(status.granted).toBe(true)
    })
  })

  describe('checkHealthPermissions', () => {
    it('should return current permission status', async () => {
      const status = await checkHealthPermissions()
      expect(status).toHaveProperty('granted')
      expect(status).toHaveProperty('heartRate')
      expect(status).toHaveProperty('sleep')
      expect(status).toHaveProperty('steps')
      expect(status).toHaveProperty('energy')
    })
  })
})

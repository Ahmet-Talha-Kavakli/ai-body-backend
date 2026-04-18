import { describe, it, expect, beforeEach } from 'vitest'
import {
  createWaterTable,
  addWaterLog,
  getWaterForToday,
  getWaterForDate,
  getWaterStats,
} from '../waterIntake'

describe('water intake database', () => {
  beforeEach(async () => {
    await createWaterTable()
  })

  describe('createWaterTable', () => {
    it('should create water_intake table', async () => {
      await expect(createWaterTable()).resolves.not.toThrow()
    })
  })

  describe('addWaterLog', () => {
    it('should add 250ml water to today', async () => {
      const today = new Date().toISOString().split('T')[0]
      await addWaterLog(today, 250)
      const result = await getWaterForToday()
      expect(result.totalMl).toBe(250)
    })

    it('should accumulate water intake', async () => {
      const today = new Date().toISOString().split('T')[0]
      await addWaterLog(today, 250)
      await addWaterLog(today, 500)
      const result = await getWaterForToday()
      expect(result.totalMl).toBe(750)
    })
  })

  describe('getWaterForToday', () => {
    it('should return today total with goal', async () => {
      const today = new Date().toISOString().split('T')[0]
      await addWaterLog(today, 1500)
      const result = await getWaterForToday()
      expect(result.date).toBe(today)
      expect(result.totalMl).toBe(1500)
      expect(result.goalMl).toBe(2000) // default goal
    })

    it('should return 0 if no logs', async () => {
      const result = await getWaterForToday()
      expect(result.totalMl).toBe(0)
    })
  })

  describe('getWaterForDate', () => {
    it('should return water for specific date', async () => {
      const date = '2026-04-18'
      await addWaterLog(date, 1200)
      const result = await getWaterForDate(date)
      expect(result.date).toBe(date)
      expect(result.totalMl).toBe(1200)
    })
  })

  describe('getWaterStats', () => {
    it('should return water stats for date range', async () => {
      const today = new Date().toISOString().split('T')[0]
      await addWaterLog(today, 2000)
      const stats = await getWaterStats(today, today)
      expect(stats).toBeDefined()
      expect(stats.length).toBeGreaterThan(0)
    })
  })
})

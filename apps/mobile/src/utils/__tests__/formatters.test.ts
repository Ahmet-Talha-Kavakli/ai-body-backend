import { describe, it, expect } from 'vitest'
import { formatDate, formatCalories, formatWater, formatProgress, getGreeting } from '../formatters'

describe('formatters', () => {
  describe('formatDate', () => {
    it('should format date string to locale format', () => {
      const result = formatDate('2026-04-18')
      expect(result).toBeTruthy()
      expect(result).toMatch(/\d/)
    })
  })

  describe('formatCalories', () => {
    it('should format calorie numbers with kcal suffix', () => {
      const result = formatCalories(1500)
      expect(result).toMatch(/\d/)
      expect(result).toContain('kcal')
    })

    it('should format large numbers with kcal suffix', () => {
      const result = formatCalories(2000)
      expect(result).toMatch(/\d/)
      expect(result).toContain('kcal')
    })
  })

  describe('formatWater', () => {
    it('should format water in ml', () => {
      const result = formatWater(500)
      expect(result).toBe('500ml')
    })

    it('should format water in liters for >= 1000ml', () => {
      const result = formatWater(2500)
      expect(result).toBe('2.5L')
    })
  })

  describe('formatProgress', () => {
    it('should format progress percentage', () => {
      const result = formatProgress(1500, 2000)
      expect(result).toBe('75%')
    })

    it('should round percentage correctly', () => {
      const result = formatProgress(1, 3)
      expect(result).toBe('33%')
    })
  })

  describe('getGreeting', () => {
    it('should return appropriate greeting based on time of day', () => {
      const greeting = getGreeting()
      expect(['Good morning', 'Good afternoon', 'Good evening']).toContain(greeting)
    })
  })
})

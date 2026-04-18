import { describe, it, expect, beforeEach, vi } from 'vitest'
import { parseFoodFromTranscript } from '../../src/ml/food-parser'
import type { FoodItem } from '@fitai/shared-types'

// Mock Anthropic SDK
const mockCreate = vi.fn()
vi.mock('@anthropic-ai/sdk', () => ({
  default: vi.fn(() => ({
    messages: {
      create: mockCreate,
    },
  })),
}))

describe('FoodParser', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('parseFoodFromTranscript', () => {
    it('should parse simple food items from transcript', async () => {
      mockCreate.mockResolvedValueOnce({
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              foods: [
                {
                  name: 'egg',
                  servingSize: 2,
                  servingUnit: 'piece',
                  calories: 150,
                  proteinG: 12,
                  carbsG: 1,
                  fatG: 11,
                },
                {
                  name: 'toast',
                  servingSize: 1,
                  servingUnit: 'slice',
                  calories: 80,
                  proteinG: 2,
                  carbsG: 14,
                  fatG: 1,
                  fiberG: 2,
                },
              ],
            }),
          },
        ],
      })

      const result = await parseFoodFromTranscript('2 eggs and toast')

      expect(result).toHaveLength(2)
      expect(result[0]).toMatchObject({
        name: expect.stringMatching(/egg/i),
        servingSize: 2,
        servingUnit: expect.stringMatching(/piece|unit/i),
        calories: expect.any(Number),
        proteinG: expect.any(Number),
        carbsG: expect.any(Number),
        fatG: expect.any(Number),
      })
      expect(result[1]).toMatchObject({
        name: expect.stringMatching(/toast/i),
        calories: expect.any(Number),
      })
    })

    it('should handle single food item', async () => {
      const result = await parseFoodFromTranscript('chicken breast')

      expect(result).toBeDefined()
      expect(result.length).toBeGreaterThan(0)
      expect(result[0].name).toMatch(/chicken/i)
    })

    it('should estimate reasonable macros for 2 eggs', async () => {
      const result = await parseFoodFromTranscript('2 eggs')
      const eggs = result.find((item) => /egg/i.test(item.name))

      expect(eggs).toBeDefined()
      if (eggs) {
        // Standard 2 eggs: ~150-160 cal, ~12g protein, ~1g carbs, ~11g fat
        expect(eggs.calories).toBeGreaterThan(140)
        expect(eggs.calories).toBeLessThan(170)
        expect(eggs.proteinG).toBeGreaterThan(10)
        expect(eggs.proteinG).toBeLessThan(14)
      }
    })

    it('should estimate reasonable macros for toast', async () => {
      const result = await parseFoodFromTranscript('toast')
      const toast = result.find((item) => /toast/i.test(item.name))

      expect(toast).toBeDefined()
      if (toast) {
        // Standard slice of toast: ~80-100 cal, ~2g protein, ~14g carbs, ~1g fat
        expect(toast.calories).toBeGreaterThan(70)
        expect(toast.calories).toBeLessThan(110)
        expect(toast.carbsG).toBeGreaterThan(12)
        expect(toast.carbsG).toBeLessThan(16)
      }
    })

    it('should include fiber information when available', async () => {
      const result = await parseFoodFromTranscript('whole wheat bread')

      expect(result).toBeDefined()
      const bread = result[0]
      expect(bread).toMatchObject({
        name: expect.stringMatching(/bread/i),
        fiberG: expect.any(Number),
      })
    })

    it('should handle complex meal descriptions', async () => {
      const result = await parseFoodFromTranscript('grilled chicken with rice and broccoli')

      expect(result.length).toBeGreaterThanOrEqual(3)
      const names = result.map((r) => r.name.toLowerCase())
      expect(names.some((n) => n.includes('chicken'))).toBe(true)
      expect(names.some((n) => n.includes('rice'))).toBe(true)
      expect(names.some((n) => n.includes('broccoli'))).toBe(true)
    })

    it('should return FoodItem with all required fields', async () => {
      const result = await parseFoodFromTranscript('apple')

      expect(result).toBeDefined()
      expect(result.length).toBeGreaterThan(0)
      const item = result[0]
      expect(item).toHaveProperty('name')
      expect(item).toHaveProperty('servingSize')
      expect(item).toHaveProperty('servingUnit')
      expect(item).toHaveProperty('calories')
      expect(item).toHaveProperty('proteinG')
      expect(item).toHaveProperty('carbsG')
      expect(item).toHaveProperty('fatG')
    })

    it('should handle empty transcript gracefully', async () => {
      const result = await parseFoodFromTranscript('')

      expect(result).toBeDefined()
      expect(Array.isArray(result)).toBe(true)
    })
  })
})

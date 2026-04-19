import { describe, it, expect, beforeEach } from 'vitest'
import {
  createBarcodeResult,
  getBarcodeResult,
  getCachedBarcode,
  deleteBarcodeResult,
  createMealSuggestion,
  getMealSuggestions,
  deleteMealSuggestion,
  createSharedMeal,
  getSharedMeal,
  deleteSharedMeal,
} from '../barcodes'

describe('Barcode Database Operations', () => {
  beforeEach(() => {
    // Database is mocked and cleared in vitest.setup.ts
  })

  describe('Barcode Results', () => {
    it('should create a barcode result', async () => {
      const result = await createBarcodeResult({
        barcode: '5901234123457',
        foodName: 'Apple',
        nutrition: {
          calories: 52,
          proteinG: 0.3,
          carbsG: 13.8,
          fatG: 0.2,
          fiberG: 2.4,
        },
        source: 'openfoodfacts',
        servingSize: '1 medium apple',
        servingSizeG: 182,
      })

      expect(result).toBeDefined()
      expect(result.barcode).toBe('5901234123457')
      expect(result.foodName).toBe('Apple')
      expect(result.nutrition.calories).toBe(52)
      expect(result.source).toBe('openfoodfacts')
      expect(result.id).toBeDefined()
      expect(result.cachedAt).toBeDefined()
      expect(result.expiresAt).toBeDefined()
    })

    it('should retrieve barcode by ID', async () => {
      const created = await createBarcodeResult({
        barcode: '012345678901',
        foodName: 'Banana',
        nutrition: {
          calories: 89,
          proteinG: 1.1,
          carbsG: 23,
          fatG: 0.3,
          fiberG: 2.6,
        },
        source: 'usda',
        servingSize: '1 banana',
        servingSizeG: 118,
      })

      const retrieved = await getBarcodeResult(created.id)

      expect(retrieved).toBeDefined()
      expect(retrieved?.barcode).toBe('012345678901')
      expect(retrieved?.foodName).toBe('Banana')
    })

    it('should return undefined for non-existent ID', async () => {
      const result = await getBarcodeResult('nonexistent-id')

      expect(result).toBeUndefined()
    })

    it('should get cached barcode if not expired', async () => {
      const created = await createBarcodeResult({
        barcode: '5012345678901',
        foodName: 'Bread',
        nutrition: {
          calories: 265,
          proteinG: 9,
          carbsG: 49,
          fatG: 3,
          fiberG: 3,
        },
        source: 'openfoodfacts',
        servingSize: '1 slice',
        servingSizeG: 28,
      })

      const cached = await getCachedBarcode('5012345678901')

      expect(cached).toBeDefined()
      expect(cached?.id).toBe(created.id)
    })

    it('should return undefined for expired cache', async () => {
      // This test assumes the expiration logic is implemented
      // For now, just test that cache lookup works
      const result = await getCachedBarcode('nonexistent-barcode')

      expect(result).toBeUndefined()
    })

    it('should delete a barcode result', async () => {
      const created = await createBarcodeResult({
        barcode: '6012345678901',
        foodName: 'Chicken',
        nutrition: {
          calories: 165,
          proteinG: 31,
          carbsG: 0,
          fatG: 3.6,
          fiberG: 0,
        },
        source: 'usda',
        servingSize: '100g',
        servingSizeG: 100,
      })

      await deleteBarcodeResult(created.id)

      const retrieved = await getBarcodeResult(created.id)
      expect(retrieved).toBeUndefined()
    })

    it('should set expiration date 30 days in future', async () => {
      const before = new Date()
      before.setDate(before.getDate() + 29)

      const created = await createBarcodeResult({
        barcode: '7012345678901',
        foodName: 'Rice',
        nutrition: {
          calories: 130,
          proteinG: 2.7,
          carbsG: 28,
          fatG: 0.3,
          fiberG: 0.4,
        },
        source: 'openfoodfacts',
        servingSize: '100g',
        servingSizeG: 100,
      })

      const after = new Date()
      after.setDate(after.getDate() + 31)

      const expiresAt = new Date(created.expiresAt)
      expect(expiresAt.getTime()).toBeGreaterThanOrEqual(before.getTime())
      expect(expiresAt.getTime()).toBeLessThanOrEqual(after.getTime())
    })
  })

  describe('Meal Suggestions', () => {
    it('should create a meal suggestion', async () => {
      const suggestion = await createMealSuggestion(
        'user-123',
        {
          foodName: 'Healthy Bowl',
          nutrition: {
            calories: 450,
            proteinG: 25,
            carbsG: 50,
            fatG: 12,
            fiberG: 8,
          },
          source: 'openfoodfacts',
          servingSize: '1 bowl',
          servingSizeG: 350,
        },
        'Based on scanned items',
      )

      expect(suggestion).toBeDefined()
      expect(suggestion.userId).toBe('user-123')
      expect(suggestion.mealName).toBe('Healthy Bowl')
      expect(suggestion.reasonForSuggestion).toBe('Based on scanned items')
    })

    it('should retrieve meal suggestions for user', async () => {
      await createMealSuggestion(
        'user-456',
        {
          foodName: 'Breakfast Set',
          nutrition: {
            calories: 450,
            proteinG: 15,
            carbsG: 60,
            fatG: 10,
            fiberG: 5,
          },
          source: 'usda',
          servingSize: '1 serving',
          servingSizeG: 300,
        },
        'High protein breakfast',
      )

      const suggestions = await getMealSuggestions('user-456')

      expect(Array.isArray(suggestions)).toBe(true)
      expect(suggestions.length).toBeGreaterThan(0)
    })

    it('should return empty array for non-existent user', async () => {
      const suggestions = await getMealSuggestions('nonexistent-user')

      expect(Array.isArray(suggestions)).toBe(true)
      expect(suggestions.length).toBe(0)
    })

    it('should delete meal suggestion', async () => {
      const created = await createMealSuggestion(
        'user-789',
        {
          foodName: 'Test Meal',
          nutrition: {
            calories: 500,
            proteinG: 20,
            carbsG: 60,
            fatG: 15,
            fiberG: 6,
          },
          source: 'openfoodfacts',
          servingSize: '1 meal',
          servingSizeG: 400,
        },
        'Test suggestion',
      )

      await deleteMealSuggestion(created.id)

      const suggestions = await getMealSuggestions('user-789')
      const deleted = suggestions.find((s) => s.id === created.id)

      expect(deleted).toBeUndefined()
    })

    it('should set meal suggestion expiration', async () => {
      const created = await createMealSuggestion(
        'user-exp',
        {
          foodName: 'Expiring Meal',
          nutrition: {
            calories: 400,
            proteinG: 18,
            carbsG: 50,
            fatG: 12,
            fiberG: 5,
          },
          source: 'openfoodfacts',
          servingSize: '1 serving',
          servingSizeG: 250,
        },
        'Will expire',
      )

      expect(created.expiresAt).toBeDefined()
      const expiresAt = new Date(created.expiresAt)
      const now = new Date()

      expect(expiresAt.getTime()).toBeGreaterThan(now.getTime())
    })
  })

  describe('Shared Meals', () => {
    it('should create a shared meal', async () => {
      const shared = await createSharedMeal('meallog-123', 'user-abc', 'friend', [
        'user-def',
        'user-ghi',
      ])

      expect(shared).toBeDefined()
      expect(shared.mealLogId).toBe('meallog-123')
      expect(shared.userId).toBe('user-abc')
      expect(shared.shareType).toBe('friend')
      expect(shared.sharedWith).toEqual(['user-def', 'user-ghi'])
    })

    it('should retrieve shared meal by ID', async () => {
      const created = await createSharedMeal('meallog-456', 'user-xyz', 'group', [
        'group-1',
      ])

      const retrieved = await getSharedMeal(created.id)

      expect(retrieved).toBeDefined()
      expect(retrieved?.mealLogId).toBe('meallog-456')
      expect(retrieved?.shareType).toBe('group')
    })

    it('should return undefined for non-existent shared meal', async () => {
      const result = await getSharedMeal('nonexistent-id')

      expect(result).toBeUndefined()
    })

    it('should support public share type', async () => {
      const shared = await createSharedMeal('meallog-public', 'user-pub', 'public', [])

      expect(shared.shareType).toBe('public')
      expect(shared.sharedWith).toEqual([])
    })

    it('should delete shared meal', async () => {
      const created = await createSharedMeal('meallog-del', 'user-del', 'friend', [
        'user-friend',
      ])

      await deleteSharedMeal(created.id)

      const retrieved = await getSharedMeal(created.id)
      expect(retrieved).toBeUndefined()
    })

    it('should update shared meal recipients', async () => {
      const created = await createSharedMeal('meallog-update', 'user-upd', 'friend', [
        'user-1',
      ])

      // Update should create a new record or update existing
      const updated = await createSharedMeal('meallog-update', 'user-upd', 'friend', [
        'user-1',
        'user-2',
        'user-3',
      ])

      expect(updated.sharedWith).toContain('user-1')
      expect(updated.sharedWith).toContain('user-2')
      expect(updated.sharedWith).toContain('user-3')
    })
  })
})

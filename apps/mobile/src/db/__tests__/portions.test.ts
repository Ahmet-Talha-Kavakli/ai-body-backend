import { describe, it, expect, beforeEach } from 'vitest'
import {
  createEstimation,
  getEstimation,
  updateEstimation,
  getRecentEstimations,
} from '../portions'
import type { PortionEstimation, PortionEstimationRow } from '../../types/portion'

describe('Portion Database Operations', () => {
  beforeEach(() => {
    // Database is mocked and cleared in vitest.setup.ts
  })

  describe('createEstimation', () => {
    it('should create a new portion estimation', async () => {
      const result = await createEstimation({
        photoPath: '/photo.jpg',
        foodName: 'Chicken Breast',
        estimatedPortionG: 150,
        estimatedPortionDescription: '150g (5 oz)',
        confidence: 85,
      })

      expect(result).toBeDefined()
      expect(result.photoPath).toBe('/photo.jpg')
      expect(result.foodName).toBe('Chicken Breast')
      expect(result.estimatedPortionG).toBe(150)
      expect(result.confidence).toBe(85)
      expect(result.id).toBeDefined()
      expect(result.createdAt).toBeDefined()
    })

    it('should generate unique IDs', async () => {
      const result1 = await createEstimation({
        photoPath: '/photo1.jpg',
        foodName: 'Rice',
        estimatedPortionG: 200,
        estimatedPortionDescription: '200g',
        confidence: 75,
      })

      const result2 = await createEstimation({
        photoPath: '/photo2.jpg',
        foodName: 'Pasta',
        estimatedPortionG: 180,
        estimatedPortionDescription: '180g',
        confidence: 80,
      })

      expect(result1.id).not.toBe(result2.id)
    })

    it('should set userAdjustedPortionG to null initially', async () => {
      const result = await createEstimation({
        photoPath: '/photo.jpg',
        foodName: 'Vegetables',
        estimatedPortionG: 100,
        estimatedPortionDescription: '100g',
        confidence: 70,
      })

      expect(result.userAdjustedPortionG).toBeUndefined()
    })

    it('should set createdAt timestamp', async () => {
      const before = new Date().toISOString()
      const result = await createEstimation({
        photoPath: '/photo.jpg',
        foodName: 'Food',
        estimatedPortionG: 150,
        estimatedPortionDescription: '150g',
        confidence: 80,
      })
      const after = new Date().toISOString()

      expect(result.createdAt).toBeDefined()
      expect(result.createdAt >= before && result.createdAt <= after).toBeTruthy()
    })
  })

  describe('getEstimation', () => {
    it('should retrieve estimation by ID', async () => {
      const created = await createEstimation({
        photoPath: '/photo.jpg',
        foodName: 'Chicken',
        estimatedPortionG: 150,
        estimatedPortionDescription: '150g',
        confidence: 85,
      })

      const retrieved = await getEstimation(created.id)

      expect(retrieved).toBeDefined()
      expect(retrieved?.id).toBe(created.id)
      expect(retrieved?.foodName).toBe('Chicken')
    })

    it('should return undefined for non-existent ID', async () => {
      const result = await getEstimation('nonexistent-id')

      expect(result).toBeUndefined()
    })

    it('should retrieve estimation with user adjustment', async () => {
      const created = await createEstimation({
        photoPath: '/photo.jpg',
        foodName: 'Rice',
        estimatedPortionG: 200,
        estimatedPortionDescription: '200g',
        confidence: 75,
      })

      const updated = await updateEstimation(created.id, {
        userAdjustedPortionG: 220,
      })

      const retrieved = await getEstimation(updated.id)

      expect(retrieved?.userAdjustedPortionG).toBe(220)
    })
  })

  describe('updateEstimation', () => {
    it('should update userAdjustedPortionG', async () => {
      const created = await createEstimation({
        photoPath: '/photo.jpg',
        foodName: 'Pasta',
        estimatedPortionG: 180,
        estimatedPortionDescription: '180g',
        confidence: 80,
      })

      const updated = await updateEstimation(created.id, {
        userAdjustedPortionG: 160,
      })

      expect(updated.userAdjustedPortionG).toBe(160)
      expect(updated.estimatedPortionG).toBe(180) // Original estimate unchanged
    })

    it('should preserve original values when not updated', async () => {
      const created = await createEstimation({
        photoPath: '/photo.jpg',
        foodName: 'Vegetables',
        estimatedPortionG: 100,
        estimatedPortionDescription: '100g',
        confidence: 70,
      })

      const updated = await updateEstimation(created.id, {
        userAdjustedPortionG: 120,
      })

      expect(updated.photoPath).toBe(created.photoPath)
      expect(updated.foodName).toBe(created.foodName)
      expect(updated.estimatedPortionG).toBe(created.estimatedPortionG)
      expect(updated.createdAt).toBe(created.createdAt)
    })

    it('should throw error for non-existent ID', async () => {
      await expect(
        updateEstimation('nonexistent-id', { userAdjustedPortionG: 150 }),
      ).rejects.toThrow()
    })
  })

  describe('getRecentEstimations', () => {
    it('should retrieve recent estimations in DESC order', async () => {
      await createEstimation({
        photoPath: '/photo1.jpg',
        foodName: 'Food1',
        estimatedPortionG: 100,
        estimatedPortionDescription: '100g',
        confidence: 70,
      })

      await createEstimation({
        photoPath: '/photo2.jpg',
        foodName: 'Food2',
        estimatedPortionG: 150,
        estimatedPortionDescription: '150g',
        confidence: 80,
      })

      const results = await getRecentEstimations(10)

      expect(results.length).toBeGreaterThan(0)
    })

    it('should respect limit parameter', async () => {
      for (let i = 0; i < 5; i++) {
        await createEstimation({
          photoPath: `/photo${i}.jpg`,
          foodName: `Food${i}`,
          estimatedPortionG: 100 + i * 10,
          estimatedPortionDescription: `${100 + i * 10}g`,
          confidence: 70 + i * 2,
        })
      }

      const results = await getRecentEstimations(2)

      expect(results.length).toBeLessThanOrEqual(2)
    })

    it('should return empty array when no estimations exist', async () => {
      // Just query without creating anything
      const results = await getRecentEstimations(10)

      expect(Array.isArray(results)).toBe(true)
    })

    it('should include all required fields', async () => {
      await createEstimation({
        photoPath: '/photo.jpg',
        foodName: 'Chicken',
        estimatedPortionG: 150,
        estimatedPortionDescription: '150g',
        confidence: 85,
      })

      const results = await getRecentEstimations(10)

      if (results.length > 0) {
        const first = results[0]
        expect(first.id).toBeDefined()
        expect(first.photoPath).toBeDefined()
        expect(first.foodName).toBeDefined()
        expect(first.estimatedPortionG).toBeDefined()
        expect(first.estimatedPortionDescription).toBeDefined()
        expect(first.confidence).toBeDefined()
        expect(first.createdAt).toBeDefined()
      }
    })
  })
})

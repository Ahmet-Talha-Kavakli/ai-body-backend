import { describe, it, expect, beforeEach, vi } from 'vitest'
import { portionEstimationService } from '../portionEstimationService'
import * as portionDb from '../../db/portions'
import { portionClient } from '../../api/portionClient'

// Mock the database
vi.mock('../../db/portions')

// Mock the portionClient
vi.mock('../../api/portionClient')

describe('portionEstimationService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('estimateFromPhoto', () => {
    it('should estimate portion from photo and create record', async () => {
      const mockApiResponse = {
        estimatedPortionG: 150,
        estimatedPortionDescription: '150g (5 oz)',
        confidence: 85,
      }

      const mockEstimation = {
        id: 'est-1',
        photoPath: '/photo.jpg',
        foodName: 'Chicken Breast',
        estimatedPortionG: 150,
        estimatedPortionDescription: '150g (5 oz)',
        confidence: 85,
        createdAt: '2024-01-01T10:00:00Z',
      }

      vi.mocked(portionClient.estimatePortion).mockResolvedValueOnce(mockApiResponse)
      vi.mocked(portionDb.createEstimation).mockResolvedValueOnce(mockEstimation)

      const result = await portionEstimationService.estimateFromPhoto('/photo.jpg', 'Chicken Breast')

      expect(result).toEqual(mockEstimation)
      expect(result.foodName).toBe('Chicken Breast')
      expect(result.estimatedPortionG).toBe(150)
    })

    it('should create estimation record with correct data', async () => {
      const mockApiResponse = {
        estimatedPortionG: 200,
        estimatedPortionDescription: '200g (1 cup)',
        confidence: 75,
      }

      const mockEstimation = {
        id: 'est-2',
        photoPath: '/path/to/photo.jpg',
        foodName: 'Rice',
        estimatedPortionG: 200,
        estimatedPortionDescription: '200g (1 cup)',
        confidence: 75,
        createdAt: '2024-01-01T11:00:00Z',
      }

      vi.mocked(portionClient.estimatePortion).mockResolvedValueOnce(mockApiResponse)
      vi.mocked(portionDb.createEstimation).mockResolvedValueOnce(mockEstimation)

      await portionEstimationService.estimateFromPhoto('/path/to/photo.jpg', 'Rice')

      expect(portionDb.createEstimation).toHaveBeenCalled()
      const callArgs = vi.mocked(portionDb.createEstimation).mock.calls[0][0]
      expect(callArgs.photoPath).toBe('/path/to/photo.jpg')
      expect(callArgs.foodName).toBe('Rice')
    })

    it('should handle API errors gracefully', async () => {
      vi.mocked(portionClient.estimatePortion).mockRejectedValueOnce(
        new Error('API Error'),
      )

      await expect(
        portionEstimationService.estimateFromPhoto('/photo.jpg', 'Food'),
      ).rejects.toThrow('API Error')
    })

    it('should handle database errors gracefully', async () => {
      const mockApiResponse = {
        estimatedPortionG: 150,
        estimatedPortionDescription: '150g',
        confidence: 80,
      }

      vi.mocked(portionClient.estimatePortion).mockResolvedValueOnce(mockApiResponse)
      vi.mocked(portionDb.createEstimation).mockRejectedValueOnce(
        new Error('Database Error'),
      )

      await expect(
        portionEstimationService.estimateFromPhoto('/photo.jpg', 'Food'),
      ).rejects.toThrow('Database Error')
    })

    it('should cache estimation result', async () => {
      const mockApiResponse = {
        estimatedPortionG: 180,
        estimatedPortionDescription: '180g (1.5 cups)',
        confidence: 80,
      }

      const mockEstimation = {
        id: 'est-3',
        photoPath: '/photo.jpg',
        foodName: 'Pasta',
        estimatedPortionG: 180,
        estimatedPortionDescription: '180g (1.5 cups)',
        confidence: 80,
        createdAt: '2024-01-01T12:00:00Z',
      }

      vi.mocked(portionClient.estimatePortion).mockResolvedValue(mockApiResponse)
      vi.mocked(portionDb.createEstimation).mockResolvedValue(mockEstimation)

      const result1 = await portionEstimationService.estimateFromPhoto('/photo.jpg', 'Pasta')
      const result2 = await portionEstimationService.estimateFromPhoto('/photo.jpg', 'Pasta')

      expect(result1).toEqual(result2)
      // Should only call API once due to caching
      expect(vi.mocked(portionClient.estimatePortion).mock.calls.length).toBe(1)
    })
  })

  describe('adjustPortion', () => {
    it('should update portion with user adjustment', async () => {
      const mockEstimation = {
        id: 'est-4',
        photoPath: '/photo.jpg',
        foodName: 'Chicken',
        estimatedPortionG: 150,
        estimatedPortionDescription: '150g',
        confidence: 85,
        userAdjustedPortionG: 180,
        createdAt: '2024-01-01T13:00:00Z',
      }

      vi.mocked(portionDb.updateEstimation).mockResolvedValueOnce(mockEstimation)

      const result = await portionEstimationService.adjustPortion('est-4', 180)

      expect(result.userAdjustedPortionG).toBe(180)
      expect(portionDb.updateEstimation).toHaveBeenCalled()
    })

    it('should call database update with correct parameters', async () => {
      const mockEstimation = {
        id: 'est-5',
        photoPath: '/photo.jpg',
        foodName: 'Rice',
        estimatedPortionG: 200,
        estimatedPortionDescription: '200g',
        confidence: 75,
        userAdjustedPortionG: 220,
        createdAt: '2024-01-01T14:00:00Z',
      }

      vi.mocked(portionDb.updateEstimation).mockResolvedValueOnce(mockEstimation)

      await portionEstimationService.adjustPortion('est-5', 220)

      expect(portionDb.updateEstimation).toHaveBeenCalledWith('est-5', {
        userAdjustedPortionG: 220,
      })
    })

    it('should handle invalid portion adjustments', async () => {
      vi.mocked(portionDb.updateEstimation).mockRejectedValueOnce(
        new Error('Invalid portion'),
      )

      await expect(
        portionEstimationService.adjustPortion('est-6', 0),
      ).rejects.toThrow('Invalid portion')
    })

    it('should handle record not found', async () => {
      vi.mocked(portionDb.updateEstimation).mockRejectedValueOnce(
        new Error('Record not found'),
      )

      await expect(
        portionEstimationService.adjustPortion('nonexistent', 150),
      ).rejects.toThrow()
    })
  })

  describe('getEstimation', () => {
    it('should retrieve estimation by ID', async () => {
      const mockEstimation = {
        id: 'est-7',
        photoPath: '/photo.jpg',
        foodName: 'Vegetables',
        estimatedPortionG: 100,
        estimatedPortionDescription: '100g',
        confidence: 70,
        createdAt: '2024-01-01T15:00:00Z',
      }

      vi.mocked(portionDb.getEstimation).mockResolvedValueOnce(mockEstimation)

      const result = await portionEstimationService.getEstimation('est-7')

      expect(result).toEqual(mockEstimation)
      expect(portionDb.getEstimation).toHaveBeenCalledWith('est-7')
    })

    it('should return undefined for non-existent record', async () => {
      vi.mocked(portionDb.getEstimation).mockResolvedValueOnce(undefined)

      const result = await portionEstimationService.getEstimation('nonexistent')

      expect(result).toBeUndefined()
    })

    it('should handle database errors', async () => {
      vi.mocked(portionDb.getEstimation).mockRejectedValueOnce(
        new Error('Database Error'),
      )

      await expect(
        portionEstimationService.getEstimation('est-8'),
      ).rejects.toThrow('Database Error')
    })
  })

  describe('getRecentEstimations', () => {
    it('should retrieve recent estimations', async () => {
      const mockEstimations = [
        {
          id: 'est-9',
          photoPath: '/photo1.jpg',
          foodName: 'Chicken',
          estimatedPortionG: 150,
          estimatedPortionDescription: '150g',
          confidence: 85,
          createdAt: '2024-01-01T16:00:00Z',
        },
        {
          id: 'est-10',
          photoPath: '/photo2.jpg',
          foodName: 'Rice',
          estimatedPortionG: 200,
          estimatedPortionDescription: '200g',
          confidence: 75,
          createdAt: '2024-01-01T15:00:00Z',
        },
      ]

      vi.mocked(portionDb.getRecentEstimations).mockResolvedValueOnce(mockEstimations)

      const result = await portionEstimationService.getRecentEstimations(10)

      expect(result).toEqual(mockEstimations)
      expect(result.length).toBe(2)
      expect(portionDb.getRecentEstimations).toHaveBeenCalledWith(10)
    })

    it('should return empty array when no estimations exist', async () => {
      vi.mocked(portionDb.getRecentEstimations).mockResolvedValueOnce([])

      const result = await portionEstimationService.getRecentEstimations(10)

      expect(result).toEqual([])
      expect(result.length).toBe(0)
    })

    it('should handle database errors', async () => {
      vi.mocked(portionDb.getRecentEstimations).mockRejectedValueOnce(
        new Error('Database Error'),
      )

      await expect(
        portionEstimationService.getRecentEstimations(10),
      ).rejects.toThrow('Database Error')
    })

    it('should respect limit parameter', async () => {
      const mockEstimations = Array.from({ length: 5 }, (_, i) => ({
        id: `est-${i}`,
        photoPath: `/photo${i}.jpg`,
        foodName: 'Food',
        estimatedPortionG: 150,
        estimatedPortionDescription: '150g',
        confidence: 80,
        createdAt: '2024-01-01T00:00:00Z',
      }))

      vi.mocked(portionDb.getRecentEstimations).mockResolvedValueOnce(mockEstimations)

      await portionEstimationService.getRecentEstimations(5)

      expect(portionDb.getRecentEstimations).toHaveBeenCalledWith(5)
    })
  })
})

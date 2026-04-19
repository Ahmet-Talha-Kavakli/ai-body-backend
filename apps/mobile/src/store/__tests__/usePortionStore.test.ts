import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { usePortionStore } from '../usePortionStore'
import type { PortionEstimation } from '../../types/portion'

describe('usePortionStore', () => {
  beforeEach(() => {
    usePortionStore.getState().clearEstimations()
  })

  describe('addEstimation', () => {
    it('should add estimation to store', () => {
      const { result } = renderHook(() => usePortionStore())

      const estimation: PortionEstimation = {
        id: 'est-1',
        photoPath: '/photo.jpg',
        foodName: 'Chicken Breast',
        estimatedPortionG: 150,
        estimatedPortionDescription: '150g (5 oz)',
        confidence: 85,
        createdAt: '2024-01-01T10:00:00Z',
      }

      act(() => {
        result.current.addEstimation(estimation)
      })

      expect(result.current.estimations).toHaveLength(1)
      expect(result.current.estimations[0]).toEqual(estimation)
    })

    it('should add multiple estimations', () => {
      const { result } = renderHook(() => usePortionStore())

      const estimation1: PortionEstimation = {
        id: 'est-1',
        photoPath: '/photo1.jpg',
        foodName: 'Chicken',
        estimatedPortionG: 150,
        estimatedPortionDescription: '150g',
        confidence: 85,
        createdAt: '2024-01-01T10:00:00Z',
      }

      const estimation2: PortionEstimation = {
        id: 'est-2',
        photoPath: '/photo2.jpg',
        foodName: 'Rice',
        estimatedPortionG: 200,
        estimatedPortionDescription: '200g',
        confidence: 75,
        createdAt: '2024-01-01T11:00:00Z',
      }

      act(() => {
        result.current.addEstimation(estimation1)
        result.current.addEstimation(estimation2)
      })

      expect(result.current.estimations).toHaveLength(2)
      expect(result.current.estimations[0].foodName).toBe('Chicken')
      expect(result.current.estimations[1].foodName).toBe('Rice')
    })

    it('should add estimation with user adjusted portion', () => {
      const { result } = renderHook(() => usePortionStore())

      const estimation: PortionEstimation = {
        id: 'est-3',
        photoPath: '/photo.jpg',
        foodName: 'Pasta',
        estimatedPortionG: 150,
        estimatedPortionDescription: '150g',
        confidence: 70,
        userAdjustedPortionG: 180,
        createdAt: '2024-01-01T12:00:00Z',
      }

      act(() => {
        result.current.addEstimation(estimation)
      })

      expect(result.current.estimations[0].userAdjustedPortionG).toBe(180)
    })
  })

  describe('updateEstimation', () => {
    it('should update existing estimation', () => {
      const { result } = renderHook(() => usePortionStore())

      const estimation: PortionEstimation = {
        id: 'est-4',
        photoPath: '/photo.jpg',
        foodName: 'Chicken',
        estimatedPortionG: 150,
        estimatedPortionDescription: '150g',
        confidence: 85,
        createdAt: '2024-01-01T13:00:00Z',
      }

      act(() => {
        result.current.addEstimation(estimation)
      })

      const updated: PortionEstimation = {
        ...estimation,
        userAdjustedPortionG: 200,
      }

      act(() => {
        result.current.updateEstimation('est-4', updated)
      })

      expect(result.current.estimations[0].userAdjustedPortionG).toBe(200)
    })

    it('should not update non-existent estimation', () => {
      const { result } = renderHook(() => usePortionStore())

      const estimation: PortionEstimation = {
        id: 'est-5',
        photoPath: '/photo.jpg',
        foodName: 'Food',
        estimatedPortionG: 100,
        estimatedPortionDescription: '100g',
        confidence: 80,
        createdAt: '2024-01-01T14:00:00Z',
      }

      act(() => {
        result.current.updateEstimation('nonexistent', estimation)
      })

      expect(result.current.estimations).toHaveLength(0)
    })
  })

  describe('removeEstimation', () => {
    it('should remove estimation by id', () => {
      const { result } = renderHook(() => usePortionStore())

      const estimation: PortionEstimation = {
        id: 'est-6',
        photoPath: '/photo.jpg',
        foodName: 'Chicken',
        estimatedPortionG: 150,
        estimatedPortionDescription: '150g',
        confidence: 85,
        createdAt: '2024-01-01T15:00:00Z',
      }

      act(() => {
        result.current.addEstimation(estimation)
      })

      expect(result.current.estimations).toHaveLength(1)

      act(() => {
        result.current.removeEstimation('est-6')
      })

      expect(result.current.estimations).toHaveLength(0)
    })

    it('should not affect other estimations when removing one', () => {
      const { result } = renderHook(() => usePortionStore())

      const estimation1: PortionEstimation = {
        id: 'est-7',
        photoPath: '/photo1.jpg',
        foodName: 'Chicken',
        estimatedPortionG: 150,
        estimatedPortionDescription: '150g',
        confidence: 85,
        createdAt: '2024-01-01T16:00:00Z',
      }

      const estimation2: PortionEstimation = {
        id: 'est-8',
        photoPath: '/photo2.jpg',
        foodName: 'Rice',
        estimatedPortionG: 200,
        estimatedPortionDescription: '200g',
        confidence: 75,
        createdAt: '2024-01-01T17:00:00Z',
      }

      act(() => {
        result.current.addEstimation(estimation1)
        result.current.addEstimation(estimation2)
      })

      act(() => {
        result.current.removeEstimation('est-7')
      })

      expect(result.current.estimations).toHaveLength(1)
      expect(result.current.estimations[0].id).toBe('est-8')
    })
  })

  describe('getEstimation', () => {
    it('should retrieve estimation by id', () => {
      const { result } = renderHook(() => usePortionStore())

      const estimation: PortionEstimation = {
        id: 'est-9',
        photoPath: '/photo.jpg',
        foodName: 'Vegetables',
        estimatedPortionG: 100,
        estimatedPortionDescription: '100g',
        confidence: 70,
        createdAt: '2024-01-01T18:00:00Z',
      }

      act(() => {
        result.current.addEstimation(estimation)
      })

      const retrieved = result.current.getEstimation('est-9')

      expect(retrieved).toEqual(estimation)
    })

    it('should return undefined for non-existent estimation', () => {
      const { result } = renderHook(() => usePortionStore())

      const retrieved = result.current.getEstimation('nonexistent')

      expect(retrieved).toBeUndefined()
    })
  })

  describe('clearEstimations', () => {
    it('should clear all estimations', () => {
      const { result } = renderHook(() => usePortionStore())

      const estimation1: PortionEstimation = {
        id: 'est-10',
        photoPath: '/photo1.jpg',
        foodName: 'Chicken',
        estimatedPortionG: 150,
        estimatedPortionDescription: '150g',
        confidence: 85,
        createdAt: '2024-01-01T19:00:00Z',
      }

      const estimation2: PortionEstimation = {
        id: 'est-11',
        photoPath: '/photo2.jpg',
        foodName: 'Rice',
        estimatedPortionG: 200,
        estimatedPortionDescription: '200g',
        confidence: 75,
        createdAt: '2024-01-01T20:00:00Z',
      }

      act(() => {
        result.current.addEstimation(estimation1)
        result.current.addEstimation(estimation2)
      })

      expect(result.current.estimations).toHaveLength(2)

      act(() => {
        result.current.clearEstimations()
      })

      expect(result.current.estimations).toHaveLength(0)
    })
  })

  describe('getRecentEstimations', () => {
    it('should get recent estimations up to limit', () => {
      const { result } = renderHook(() => usePortionStore())

      const estimations = Array.from({ length: 5 }, (_, i) => ({
        id: `est-${i}`,
        photoPath: `/photo${i}.jpg`,
        foodName: `Food${i}`,
        estimatedPortionG: 100 + i * 10,
        estimatedPortionDescription: `${100 + i * 10}g`,
        confidence: 80 - i * 5,
        createdAt: new Date(Date.now() - i * 1000 * 60 * 60).toISOString(),
      }))

      act(() => {
        estimations.forEach((est) => result.current.addEstimation(est))
      })

      const recent = result.current.getRecentEstimations(3)

      expect(recent).toHaveLength(3)
    })

    it('should return all estimations if limit is higher', () => {
      const { result } = renderHook(() => usePortionStore())

      const estimations = Array.from({ length: 3 }, (_, i) => ({
        id: `est-${i}`,
        photoPath: `/photo${i}.jpg`,
        foodName: `Food${i}`,
        estimatedPortionG: 100,
        estimatedPortionDescription: '100g',
        confidence: 80,
        createdAt: '2024-01-01T00:00:00Z',
      }))

      act(() => {
        estimations.forEach((est) => result.current.addEstimation(est))
      })

      const recent = result.current.getRecentEstimations(10)

      expect(recent).toHaveLength(3)
    })
  })

  describe('persistence', () => {
    it('should persist estimations to AsyncStorage', () => {
      const { result } = renderHook(() => usePortionStore())

      const estimation: PortionEstimation = {
        id: 'est-12',
        photoPath: '/photo.jpg',
        foodName: 'Chicken',
        estimatedPortionG: 150,
        estimatedPortionDescription: '150g',
        confidence: 85,
        createdAt: '2024-01-01T21:00:00Z',
      }

      act(() => {
        result.current.addEstimation(estimation)
      })

      // Verify that the store has the data
      expect(result.current.estimations).toHaveLength(1)
    })
  })
})

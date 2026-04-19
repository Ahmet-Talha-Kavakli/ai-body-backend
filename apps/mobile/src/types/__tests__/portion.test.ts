import { describe, it, expect } from 'vitest'
import type { PortionEstimation } from '../portion'

describe('PortionEstimation Type', () => {
  it('should create a valid portion estimation', () => {
    const estimation: PortionEstimation = {
      id: 'test-1',
      photoPath: '/path/to/photo.jpg',
      foodName: 'Chicken Breast',
      estimatedPortionG: 150,
      estimatedPortionDescription: '150g (5 oz)',
      confidence: 85,
      createdAt: '2024-01-01T10:00:00Z',
    }

    expect(estimation.id).toBe('test-1')
    expect(estimation.foodName).toBe('Chicken Breast')
    expect(estimation.estimatedPortionG).toBe(150)
    expect(estimation.confidence).toBe(85)
  })

  it('should allow optional userAdjustedPortionG', () => {
    const estimation: PortionEstimation = {
      id: 'test-2',
      photoPath: '/path/to/photo.jpg',
      foodName: 'Rice',
      estimatedPortionG: 200,
      estimatedPortionDescription: '200g',
      confidence: 75,
      userAdjustedPortionG: 180,
      createdAt: '2024-01-01T10:00:00Z',
    }

    expect(estimation.userAdjustedPortionG).toBe(180)
  })
})

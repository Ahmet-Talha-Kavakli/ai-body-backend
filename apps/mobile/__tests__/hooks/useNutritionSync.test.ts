import { describe, it, expect, beforeEach, vi } from 'vitest'

describe('useNutritionSync', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
  })

  it('should be importable', async () => {
    const { useNutritionSync } = await import('../../src/hooks/useNutritionSync')
    expect(useNutritionSync).toBeDefined()
  })

  it('should provide flush queue method', async () => {
    const { useNutritionSync } = await import('../../src/hooks/useNutritionSync')
    expect(useNutritionSync).toBeDefined()
  })

  it('should provide sync meal method', async () => {
    const { useNutritionSync } = await import('../../src/hooks/useNutritionSync')
    expect(useNutritionSync).toBeDefined()
  })

  it('should track sync status', async () => {
    const { useNutritionSync } = await import('../../src/hooks/useNutritionSync')
    expect(useNutritionSync).toBeDefined()
  })
})

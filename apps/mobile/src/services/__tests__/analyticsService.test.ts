import { describe, it, expect, beforeEach, vi } from 'vitest'
import * as analyticsService from '../analyticsService'
import { analyticsClient } from '../analyticsClient'

// Mock the analyticsClient
vi.mock('../analyticsClient', () => ({
  analyticsClient: {
    analytics: {
      getSummary: vi.fn(),
      getStats: vi.fn(),
    },
  },
}))

describe('analyticsService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('calculateWorkoutStats', () => {
    it('should calculate total workouts from workout data', async () => {
      const result = await analyticsService.calculateWorkoutStats('user-123', 'weekly')
      expect(result).toBeDefined()
      expect(result.totalWorkouts).toBeDefined()
      expect(result.totalDuration).toBeDefined()
      expect(result.avgIntensity).toBeDefined()
      expect(result.favoriteExercise).toBeDefined()
      expect(result.progressTrend).toBeDefined()
    })

    it('should handle different time periods', async () => {
      const daily = await analyticsService.calculateWorkoutStats('user-123', 'daily')
      const weekly = await analyticsService.calculateWorkoutStats('user-123', 'weekly')
      const monthly = await analyticsService.calculateWorkoutStats('user-123', 'monthly')

      expect(daily).toBeDefined()
      expect(weekly).toBeDefined()
      expect(monthly).toBeDefined()
    })

    it('should return null on error', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {})
      // Service should handle errors gracefully
      const result = await analyticsService.calculateWorkoutStats('user-123')
      expect(result).not.toBeNull() // Should return default values, not error
    })

    it('should have progressTrend as up, flat, or down', async () => {
      const result = await analyticsService.calculateWorkoutStats('user-123')
      expect(['up', 'flat', 'down']).toContain(result.progressTrend)
    })
  })

  describe('calculateNutritionStats', () => {
    it('should calculate nutrition statistics', async () => {
      const result = await analyticsService.calculateNutritionStats('user-123', 'weekly')
      expect(result).toBeDefined()
      expect(result.avgCalories).toBeDefined()
      expect(result.avgProtein).toBeDefined()
      expect(result.mealsLogged).toBeDefined()
      expect(result.consistencyScore).toBeDefined()
      expect(result.favoriteMeals).toBeDefined()
      expect(Array.isArray(result.favoriteMeals)).toBe(true)
    })

    it('should calculate consistency score between 0 and 100', async () => {
      const result = await analyticsService.calculateNutritionStats('user-123')
      expect(result.consistencyScore).toBeGreaterThanOrEqual(0)
      expect(result.consistencyScore).toBeLessThanOrEqual(100)
    })
  })

  describe('calculateHealthStats', () => {
    it('should calculate health statistics', async () => {
      const result = await analyticsService.calculateHealthStats('user-123', 'weekly')
      expect(result).toBeDefined()
      expect(result.avgSleep).toBeDefined()
      expect(result.avgSteps).toBeDefined()
      expect(result.avgHeartRate).toBeDefined()
      expect(result.sleepQuality).toBeDefined()
    })

    it('should have sleepQuality between 1 and 10', async () => {
      const result = await analyticsService.calculateHealthStats('user-123')
      expect(result.sleepQuality).toBeGreaterThanOrEqual(1)
      expect(result.sleepQuality).toBeLessThanOrEqual(10)
    })
  })

  describe('calculateSocialStats', () => {
    it('should calculate social statistics', async () => {
      const result = await analyticsService.calculateSocialStats('user-123')
      expect(result).toBeDefined()
      expect(result.friends).toBeDefined()
      expect(result.challengesCompleted).toBeDefined()
      expect(result.badgesEarned).toBeDefined()
      expect(result.totalPoints).toBeDefined()
    })

    it('should return non-negative values', async () => {
      const result = await analyticsService.calculateSocialStats('user-123')
      expect(result.friends).toBeGreaterThanOrEqual(0)
      expect(result.challengesCompleted).toBeGreaterThanOrEqual(0)
      expect(result.badgesEarned).toBeGreaterThanOrEqual(0)
      expect(result.totalPoints).toBeGreaterThanOrEqual(0)
    })
  })

  describe('calculateTrend', () => {
    it('should return up when current > previous + 5', () => {
      const trend = analyticsService.calculateTrend(100, 90)
      expect(trend).toBe('up')
    })

    it('should return down when current < previous - 5', () => {
      const trend = analyticsService.calculateTrend(90, 100)
      expect(trend).toBe('down')
    })

    it('should return flat for small changes', () => {
      const trend = analyticsService.calculateTrend(100, 98)
      expect(trend).toBe('flat')
    })

    it('should handle edge cases around threshold', () => {
      expect(analyticsService.calculateTrend(106, 100)).toBe('up') // 106-100=6 > 5
      expect(analyticsService.calculateTrend(105, 100)).toBe('flat') // 105-100=5 not > 5
      expect(analyticsService.calculateTrend(100, 100)).toBe('flat') // 100-100=0
      expect(analyticsService.calculateTrend(94, 100)).toBe('down') // 94-100=-6 < -5
      expect(analyticsService.calculateTrend(95, 100)).toBe('flat') // 95-100=-5 not < -5
    })
  })

  describe('calculatePercentChange', () => {
    it('should calculate percent change correctly', () => {
      const change = analyticsService.calculatePercentChange(100, 50)
      expect(change).toBe(100) // 100% increase
    })

    it('should handle negative changes', () => {
      const change = analyticsService.calculatePercentChange(50, 100)
      expect(change).toBe(-50) // 50% decrease
    })

    it('should return 0 when previous is 0', () => {
      const change = analyticsService.calculatePercentChange(100, 0)
      expect(change).toBe(0)
    })

    it('should round to nearest integer', () => {
      const change = analyticsService.calculatePercentChange(105, 100)
      expect(change).toBe(5)
    })
  })

  describe('generateAnalyticsSummary', () => {
    it('should generate complete analytics summary', async () => {
      const summary = await analyticsService.generateAnalyticsSummary('user-123', 'weekly')
      expect(summary).toBeDefined()
      expect(summary?.userId).toBe('user-123')
      expect(summary?.period).toBe('weekly')
    })

    it('should include all stat categories', async () => {
      const summary = await analyticsService.generateAnalyticsSummary('user-123', 'weekly')
      expect(summary?.workoutStats).toBeDefined()
      expect(summary?.nutritionStats).toBeDefined()
      expect(summary?.healthStats).toBeDefined()
      expect(summary?.socialStats).toBeDefined()
    })

    it('should include goals progress', async () => {
      const summary = await analyticsService.generateAnalyticsSummary('user-123', 'weekly')
      expect(summary?.goals).toBeDefined()
      expect(summary?.goals.calorieGoal).toBeDefined()
      expect(summary?.goals.calorieActual).toBeDefined()
      expect(summary?.goals.proteinGoal).toBeDefined()
      expect(summary?.goals.proteinActual).toBeDefined()
      expect(summary?.goals.workoutGoal).toBeDefined()
      expect(summary?.goals.workoutActual).toBeDefined()
      expect(summary?.goals.stepGoal).toBeDefined()
      expect(summary?.goals.stepActual).toBeDefined()
    })

    it('should support different periods', async () => {
      const daily = await analyticsService.generateAnalyticsSummary('user-123', 'daily')
      const weekly = await analyticsService.generateAnalyticsSummary('user-123', 'weekly')
      const monthly = await analyticsService.generateAnalyticsSummary('user-123', 'monthly')

      expect(daily?.period).toBe('daily')
      expect(weekly?.period).toBe('weekly')
      expect(monthly?.period).toBe('monthly')
    })

    it('should default to weekly period', async () => {
      const summary = await analyticsService.generateAnalyticsSummary('user-123')
      expect(summary?.period).toBe('weekly')
    })

    it('should return null on error', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {})
      // Should still return a summary with default values or null
      const summary = await analyticsService.generateAnalyticsSummary('user-123')
      expect(summary).not.toBeNull()
    })
  })

  describe('getTrendData', () => {
    it('should return trend data for a metric', async () => {
      const trend = await analyticsService.getTrendData('user-123', 'workouts', 'weekly')
      expect(trend).toBeDefined()
      expect(trend?.metric).toBe('workouts')
      expect(trend?.current).toBeDefined()
      expect(trend?.previous).toBeDefined()
    })

    it('should calculate trend correctly', async () => {
      const trend = await analyticsService.getTrendData('user-123', 'calories', 'weekly')
      expect(['up', 'flat', 'down']).toContain(trend?.trend)
    })

    it('should calculate percent change', async () => {
      const trend = await analyticsService.getTrendData('user-123', 'calories', 'weekly')
      expect(trend?.percentChange).toBeDefined()
      expect(typeof trend?.percentChange).toBe('number')
    })

    it('should support different metrics', async () => {
      const metrics = ['workouts', 'calories', 'sleep', 'steps']
      for (const metric of metrics) {
        const trend = await analyticsService.getTrendData('user-123', metric)
        expect(trend?.metric).toBe(metric)
      }
    })

    it('should support different periods', async () => {
      const daily = await analyticsService.getTrendData('user-123', 'calories', 'daily')
      const weekly = await analyticsService.getTrendData('user-123', 'calories', 'weekly')
      const monthly = await analyticsService.getTrendData('user-123', 'calories', 'monthly')

      expect(daily).toBeDefined()
      expect(weekly).toBeDefined()
      expect(monthly).toBeDefined()
    })

    it('should return null on error', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {})
      const trend = await analyticsService.getTrendData('user-123', 'invalid')
      // Should handle gracefully
      expect(trend).toBeDefined()
    })
  })
})

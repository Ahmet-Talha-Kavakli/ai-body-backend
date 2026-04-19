import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useAnalyticsStore } from '../analyticsStore.new'
import { AnalyticsSummary, TrendData } from '../../types/analytics'
import * as analyticsService from '../../services/analyticsService'

// Mock the analytics service
vi.mock('../../services/analyticsService', () => ({
  generateAnalyticsSummary: vi.fn(),
  getTrendData: vi.fn(),
}))

describe('useAnalyticsStore (new)', () => {
  beforeEach(() => {
    useAnalyticsStore.getState().clearAnalytics()
    vi.clearAllMocks()
  })

  describe('state initialization', () => {
    it('should initialize with null summary', () => {
      const state = useAnalyticsStore.getState()
      expect(state.summary).toBeNull()
    })

    it('should initialize with empty trends', () => {
      const state = useAnalyticsStore.getState()
      expect(state.trends).toEqual({})
    })

    it('should initialize with weekly period', () => {
      const state = useAnalyticsStore.getState()
      expect(state.period).toBe('weekly')
    })

    it('should initialize with loading false', () => {
      const state = useAnalyticsStore.getState()
      expect(state.loading).toBe(false)
    })

    it('should initialize with no error', () => {
      const state = useAnalyticsStore.getState()
      expect(state.error).toBeNull()
    })
  })

  describe('setSummary', () => {
    it('should set summary', () => {
      const summary: AnalyticsSummary = {
        userId: 'user-123',
        period: 'weekly',
        workoutStats: {
          totalWorkouts: 4,
          totalDuration: 200,
          avgIntensity: 7,
          favoriteExercise: 'Squats',
          progressTrend: 'up',
        },
        nutritionStats: {
          avgCalories: 2000,
          avgProtein: 150,
          mealsLogged: 21,
          consistencyScore: 85,
          favoriteMeals: ['Chicken', 'Rice'],
        },
        healthStats: {
          avgSleep: 7.5,
          avgSteps: 9000,
          avgHeartRate: 72,
          sleepQuality: 8,
        },
        socialStats: {
          friends: 25,
          challengesCompleted: 3,
          badgesEarned: 5,
          totalPoints: 2500,
        },
        goals: {
          calorieGoal: 2200,
          calorieActual: 2000,
          proteinGoal: 150,
          proteinActual: 150,
          workoutGoal: 4,
          workoutActual: 4,
          stepGoal: 10000,
          stepActual: 9000,
        },
      }

      useAnalyticsStore.getState().setSummary(summary)
      expect(useAnalyticsStore.getState().summary).toEqual(summary)
    })

    it('should clear summary when set to null', () => {
      const summary: AnalyticsSummary = {
        userId: 'user-123',
        period: 'weekly',
        workoutStats: {
          totalWorkouts: 4,
          totalDuration: 200,
          avgIntensity: 7,
          favoriteExercise: 'Squats',
          progressTrend: 'up',
        },
        nutritionStats: {
          avgCalories: 2000,
          avgProtein: 150,
          mealsLogged: 21,
          consistencyScore: 85,
          favoriteMeals: ['Chicken', 'Rice'],
        },
        healthStats: {
          avgSleep: 7.5,
          avgSteps: 9000,
          avgHeartRate: 72,
          sleepQuality: 8,
        },
        socialStats: {
          friends: 25,
          challengesCompleted: 3,
          badgesEarned: 5,
          totalPoints: 2500,
        },
        goals: {
          calorieGoal: 2200,
          calorieActual: 2000,
          proteinGoal: 150,
          proteinActual: 150,
          workoutGoal: 4,
          workoutActual: 4,
          stepGoal: 10000,
          stepActual: 9000,
        },
      }

      useAnalyticsStore.getState().setSummary(summary)
      useAnalyticsStore.getState().setSummary(null)
      expect(useAnalyticsStore.getState().summary).toBeNull()
    })
  })

  describe('setTrends', () => {
    it('should set trends', () => {
      const trends: Record<string, TrendData> = {
        calories: {
          metric: 'calories',
          current: 2000,
          previous: 1900,
          trend: 'up',
          percentChange: 5,
        },
      }

      useAnalyticsStore.getState().setTrends(trends)
      expect(useAnalyticsStore.getState().trends).toEqual(trends)
    })
  })

  describe('setPeriod', () => {
    it('should set period', () => {
      useAnalyticsStore.getState().setPeriod('monthly')
      expect(useAnalyticsStore.getState().period).toBe('monthly')
    })

    it('should support all periods', () => {
      const periods: Array<'daily' | 'weekly' | 'monthly'> = ['daily', 'weekly', 'monthly']
      for (const period of periods) {
        useAnalyticsStore.getState().setPeriod(period)
        expect(useAnalyticsStore.getState().period).toBe(period)
      }
    })
  })

  describe('setLoading', () => {
    it('should set loading state', () => {
      useAnalyticsStore.getState().setLoading(true)
      expect(useAnalyticsStore.getState().loading).toBe(true)

      useAnalyticsStore.getState().setLoading(false)
      expect(useAnalyticsStore.getState().loading).toBe(false)
    })
  })

  describe('setError', () => {
    it('should set error message', () => {
      const error = 'Failed to load analytics'
      useAnalyticsStore.getState().setError(error)
      expect(useAnalyticsStore.getState().error).toBe(error)
    })

    it('should clear error when set to null', () => {
      useAnalyticsStore.getState().setError('Some error')
      useAnalyticsStore.getState().setError(null)
      expect(useAnalyticsStore.getState().error).toBeNull()
    })
  })

  describe('generateSummary', () => {
    it('should generate summary and update state', async () => {
      const mockSummary: AnalyticsSummary = {
        userId: 'user-123',
        period: 'weekly',
        workoutStats: {
          totalWorkouts: 4,
          totalDuration: 200,
          avgIntensity: 7,
          favoriteExercise: 'Squats',
          progressTrend: 'up',
        },
        nutritionStats: {
          avgCalories: 2000,
          avgProtein: 150,
          mealsLogged: 21,
          consistencyScore: 85,
          favoriteMeals: ['Chicken', 'Rice'],
        },
        healthStats: {
          avgSleep: 7.5,
          avgSteps: 9000,
          avgHeartRate: 72,
          sleepQuality: 8,
        },
        socialStats: {
          friends: 25,
          challengesCompleted: 3,
          badgesEarned: 5,
          totalPoints: 2500,
        },
        goals: {
          calorieGoal: 2200,
          calorieActual: 2000,
          proteinGoal: 150,
          proteinActual: 150,
          workoutGoal: 4,
          workoutActual: 4,
          stepGoal: 10000,
          stepActual: 9000,
        },
      }

      vi.mocked(analyticsService.generateAnalyticsSummary).mockResolvedValueOnce(
        mockSummary
      )

      await useAnalyticsStore.getState().generateSummary('user-123', 'weekly')

      expect(useAnalyticsStore.getState().summary).toEqual(mockSummary)
      expect(useAnalyticsStore.getState().period).toBe('weekly')
      expect(useAnalyticsStore.getState().loading).toBe(false)
    })

    it('should set loading state during generation', async () => {
      vi.mocked(analyticsService.generateAnalyticsSummary).mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            // Check loading state during execution
            expect(useAnalyticsStore.getState().loading).toBe(true)
            resolve(null)
          })
      )

      await useAnalyticsStore.getState().generateSummary('user-123')

      expect(useAnalyticsStore.getState().loading).toBe(false)
    })

    it('should set error on failure', async () => {
      const error = new Error('API Error')
      vi.mocked(analyticsService.generateAnalyticsSummary).mockRejectedValueOnce(error)

      await useAnalyticsStore.getState().generateSummary('user-123')

      expect(useAnalyticsStore.getState().error).toBe(error.message)
      expect(useAnalyticsStore.getState().loading).toBe(false)
    })

    it('should default to weekly period', async () => {
      vi.mocked(analyticsService.generateAnalyticsSummary).mockResolvedValueOnce(null)

      await useAnalyticsStore.getState().generateSummary('user-123')

      expect(analyticsService.generateAnalyticsSummary).toHaveBeenCalledWith('user-123', 'weekly')
    })
  })

  describe('getTrendData', () => {
    it('should get trend data for a metric', async () => {
      const mockTrend: TrendData = {
        metric: 'calories',
        current: 2000,
        previous: 1900,
        trend: 'up',
        percentChange: 5,
      }

      vi.mocked(analyticsService.getTrendData).mockResolvedValueOnce(mockTrend)

      const result = await useAnalyticsStore.getState().getTrendData('user-123', 'calories')

      expect(result).toEqual(mockTrend)
      expect(useAnalyticsStore.getState().trends['calories']).toEqual(mockTrend)
    })

    it('should update trends in state', async () => {
      const mockTrend: TrendData = {
        metric: 'workouts',
        current: 4,
        previous: 3,
        trend: 'up',
        percentChange: 33,
      }

      vi.mocked(analyticsService.getTrendData).mockResolvedValueOnce(mockTrend)

      await useAnalyticsStore.getState().getTrendData('user-123', 'workouts')

      expect(useAnalyticsStore.getState().trends['workouts']).toEqual(mockTrend)
    })

    it('should handle null trend result', async () => {
      vi.mocked(analyticsService.getTrendData).mockResolvedValueOnce(null)

      const result = await useAnalyticsStore.getState().getTrendData('user-123', 'invalid')

      expect(result).toBeNull()
    })

    it('should return null on error', async () => {
      vi.mocked(analyticsService.getTrendData).mockRejectedValueOnce(new Error('API Error'))

      const result = await useAnalyticsStore.getState().getTrendData('user-123', 'calories')

      expect(result).toBeNull()
    })
  })

  describe('getGoalProgress', () => {
    it('should calculate goal progress percentage', () => {
      const summary: AnalyticsSummary = {
        userId: 'user-123',
        period: 'weekly',
        workoutStats: {
          totalWorkouts: 4,
          totalDuration: 200,
          avgIntensity: 7,
          favoriteExercise: 'Squats',
          progressTrend: 'up',
        },
        nutritionStats: {
          avgCalories: 2000,
          avgProtein: 150,
          mealsLogged: 21,
          consistencyScore: 85,
          favoriteMeals: ['Chicken', 'Rice'],
        },
        healthStats: {
          avgSleep: 7.5,
          avgSteps: 9000,
          avgHeartRate: 72,
          sleepQuality: 8,
        },
        socialStats: {
          friends: 25,
          challengesCompleted: 3,
          badgesEarned: 5,
          totalPoints: 2500,
        },
        goals: {
          calorieGoal: 2200,
          calorieActual: 2000,
          proteinGoal: 150,
          proteinActual: 150,
          workoutGoal: 4,
          workoutActual: 4,
          stepGoal: 10000,
          stepActual: 9000,
        },
      }

      useAnalyticsStore.getState().setSummary(summary)

      const calorieProgress = useAnalyticsStore.getState().getGoalProgress('calorie')
      expect(calorieProgress).toBeCloseTo(91, 0) // 2000/2200 * 100

      const proteinProgress = useAnalyticsStore.getState().getGoalProgress('protein')
      expect(proteinProgress).toBe(100) // 150/150 * 100

      const workoutProgress = useAnalyticsStore.getState().getGoalProgress('workout')
      expect(workoutProgress).toBe(100) // 4/4 * 100

      const stepProgress = useAnalyticsStore.getState().getGoalProgress('step')
      expect(stepProgress).toBe(90) // 9000/10000 * 100
    })

    it('should return 0 when no summary', () => {
      const progress = useAnalyticsStore.getState().getGoalProgress('calorie')
      expect(progress).toBe(0)
    })

    it('should cap progress at 100', () => {
      const summary: AnalyticsSummary = {
        userId: 'user-123',
        period: 'weekly',
        workoutStats: {
          totalWorkouts: 4,
          totalDuration: 200,
          avgIntensity: 7,
          favoriteExercise: 'Squats',
          progressTrend: 'up',
        },
        nutritionStats: {
          avgCalories: 2000,
          avgProtein: 150,
          mealsLogged: 21,
          consistencyScore: 85,
          favoriteMeals: ['Chicken', 'Rice'],
        },
        healthStats: {
          avgSleep: 7.5,
          avgSteps: 9000,
          avgHeartRate: 72,
          sleepQuality: 8,
        },
        socialStats: {
          friends: 25,
          challengesCompleted: 3,
          badgesEarned: 5,
          totalPoints: 2500,
        },
        goals: {
          calorieGoal: 2200,
          calorieActual: 2500, // Over goal
          proteinGoal: 150,
          proteinActual: 150,
          workoutGoal: 4,
          workoutActual: 4,
          stepGoal: 10000,
          stepActual: 9000,
        },
      }

      useAnalyticsStore.getState().setSummary(summary)
      const progress = useAnalyticsStore.getState().getGoalProgress('calorie')
      expect(progress).toBeLessThanOrEqual(100)
    })
  })

  describe('clearAnalytics', () => {
    it('should clear summary and trends', () => {
      const summary: AnalyticsSummary = {
        userId: 'user-123',
        period: 'weekly',
        workoutStats: {
          totalWorkouts: 4,
          totalDuration: 200,
          avgIntensity: 7,
          favoriteExercise: 'Squats',
          progressTrend: 'up',
        },
        nutritionStats: {
          avgCalories: 2000,
          avgProtein: 150,
          mealsLogged: 21,
          consistencyScore: 85,
          favoriteMeals: ['Chicken', 'Rice'],
        },
        healthStats: {
          avgSleep: 7.5,
          avgSteps: 9000,
          avgHeartRate: 72,
          sleepQuality: 8,
        },
        socialStats: {
          friends: 25,
          challengesCompleted: 3,
          badgesEarned: 5,
          totalPoints: 2500,
        },
        goals: {
          calorieGoal: 2200,
          calorieActual: 2000,
          proteinGoal: 150,
          proteinActual: 150,
          workoutGoal: 4,
          workoutActual: 4,
          stepGoal: 10000,
          stepActual: 9000,
        },
      }

      useAnalyticsStore.getState().setSummary(summary)
      useAnalyticsStore.getState().setTrends({
        calories: {
          metric: 'calories',
          current: 2000,
          previous: 1900,
          trend: 'up',
          percentChange: 5,
        },
      })

      useAnalyticsStore.getState().clearAnalytics()

      expect(useAnalyticsStore.getState().summary).toBeNull()
      expect(useAnalyticsStore.getState().trends).toEqual({})
    })
  })
})

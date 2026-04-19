import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useCoachingStore } from '../coachingStore'
import { CoachingInsight } from '@/types/analytics'

// Mock the coaching service
vi.mock('../../services/coachingService', () => ({
  generatePerformanceInsights: vi.fn(),
  generateNutritionInsights: vi.fn(),
  generateRecoveryInsights: vi.fn(),
  generateBehavioralInsights: vi.fn(),
}))

import * as coachingService from '../../services/coachingService'

describe('useCoachingStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    const { clearInsights } = useCoachingStore.getState()
    clearInsights()
    vi.clearAllMocks()
  })

  describe('state management', () => {
    it('should initialize with empty state', () => {
      const state = useCoachingStore.getState()

      expect(state.insights).toEqual([])
      expect(state.performanceInsights).toEqual([])
      expect(state.nutritionInsights).toEqual([])
      expect(state.recoveryInsights).toEqual([])
      expect(state.behavioralInsights).toEqual([])
      expect(state.loading).toBe(false)
      expect(state.error).toBeNull()
    })

    it('should set insights', () => {
      const mockInsights: CoachingInsight[] = [
        {
          id: 'insight-1',
          userId: 'user-123',
          domain: 'performance',
          title: 'Performance Tip',
          insight: 'Keep it up',
          data: {},
          actionable: true,
          suggestedAction: 'Continue training',
          createdAt: new Date().toISOString(),
        },
      ]

      const { setInsights } = useCoachingStore.getState()
      setInsights(mockInsights)

      const state = useCoachingStore.getState()
      expect(state.insights).toEqual(mockInsights)
    })

    it('should set loading state', () => {
      const { setLoading } = useCoachingStore.getState()
      setLoading(true)

      let state = useCoachingStore.getState()
      expect(state.loading).toBe(true)

      setLoading(false)
      state = useCoachingStore.getState()
      expect(state.loading).toBe(false)
    })

    it('should set error state', () => {
      const { setError } = useCoachingStore.getState()
      setError('Test error')

      let state = useCoachingStore.getState()
      expect(state.error).toBe('Test error')

      setError(null)
      state = useCoachingStore.getState()
      expect(state.error).toBeNull()
    })

    it('should set performance insights', () => {
      const mockInsights: CoachingInsight[] = [
        {
          id: 'perf-1',
          userId: 'user-123',
          domain: 'performance',
          title: 'Performance Tip',
          insight: 'Increase volume',
          data: { totalWorkouts: 10 },
          actionable: true,
          suggestedAction: 'Add more reps',
          createdAt: new Date().toISOString(),
        },
      ]

      const { setPerformanceInsights } = useCoachingStore.getState()
      setPerformanceInsights(mockInsights)

      const state = useCoachingStore.getState()
      expect(state.performanceInsights).toEqual(mockInsights)
    })

    it('should set nutrition insights', () => {
      const mockInsights: CoachingInsight[] = [
        {
          id: 'nutr-1',
          userId: 'user-123',
          domain: 'nutrition',
          title: 'Nutrition Tip',
          insight: 'Increase protein',
          data: { avgProtein: 100 },
          actionable: true,
          suggestedAction: 'Eat more chicken',
          createdAt: new Date().toISOString(),
        },
      ]

      const { setNutritionInsights } = useCoachingStore.getState()
      setNutritionInsights(mockInsights)

      const state = useCoachingStore.getState()
      expect(state.nutritionInsights).toEqual(mockInsights)
    })

    it('should set recovery insights', () => {
      const mockInsights: CoachingInsight[] = [
        {
          id: 'recov-1',
          userId: 'user-123',
          domain: 'recovery',
          title: 'Recovery Tip',
          insight: 'Sleep more',
          data: { avgSleep: 6 },
          actionable: true,
          suggestedAction: 'Sleep 8 hours',
          createdAt: new Date().toISOString(),
        },
      ]

      const { setRecoveryInsights } = useCoachingStore.getState()
      setRecoveryInsights(mockInsights)

      const state = useCoachingStore.getState()
      expect(state.recoveryInsights).toEqual(mockInsights)
    })

    it('should set behavioral insights', () => {
      const mockInsights: CoachingInsight[] = [
        {
          id: 'behav-1',
          userId: 'user-123',
          domain: 'behavioral',
          title: 'Motivation Tip',
          insight: 'Keep the streak',
          data: { currentStreak: 10 },
          actionable: true,
          suggestedAction: 'Push for 30 days',
          createdAt: new Date().toISOString(),
        },
      ]

      const { setBehavioralInsights } = useCoachingStore.getState()
      setBehavioralInsights(mockInsights)

      const state = useCoachingStore.getState()
      expect(state.behavioralInsights).toEqual(mockInsights)
    })
  })

  describe('generatePerformanceInsights', () => {
    it('should generate performance insights and update state', async () => {
      const mockInsights: CoachingInsight[] = [
        {
          id: 'perf-1',
          userId: 'user-123',
          domain: 'performance',
          title: 'Performance Tip',
          insight: 'Good progress',
          data: { totalWorkouts: 10 },
          actionable: true,
          suggestedAction: 'Continue',
          createdAt: new Date().toISOString(),
        },
      ]

      vi.mocked(coachingService.generatePerformanceInsights).mockResolvedValueOnce(
        mockInsights
      )

      const { generatePerformanceInsights } = useCoachingStore.getState()
      await generatePerformanceInsights('user-123', { totalWorkouts: 10 })

      const state = useCoachingStore.getState()
      expect(state.performanceInsights).toEqual(mockInsights)
      expect(state.loading).toBe(false)
      expect(state.error).toBeNull()
    })

    it('should handle errors during generation', async () => {
      vi.mocked(coachingService.generatePerformanceInsights).mockRejectedValueOnce(
        new Error('API Error')
      )

      const { generatePerformanceInsights } = useCoachingStore.getState()
      await generatePerformanceInsights('user-123', {})

      const state = useCoachingStore.getState()
      expect(state.error).toBe('API Error')
      expect(state.loading).toBe(false)
    })

    it('should set loading state during generation', async () => {
      vi.mocked(coachingService.generatePerformanceInsights).mockImplementationOnce(
        async () => {
          const state = useCoachingStore.getState()
          expect(state.loading).toBe(true)
          return []
        }
      )

      const { generatePerformanceInsights } = useCoachingStore.getState()
      await generatePerformanceInsights('user-123', {})
    })
  })

  describe('generateNutritionInsights', () => {
    it('should generate nutrition insights and update state', async () => {
      const mockInsights: CoachingInsight[] = [
        {
          id: 'nutr-1',
          userId: 'user-123',
          domain: 'nutrition',
          title: 'Nutrition Tip',
          insight: 'Eat more protein',
          data: { avgProtein: 100 },
          actionable: true,
          suggestedAction: 'Increase protein',
          createdAt: new Date().toISOString(),
        },
      ]

      vi.mocked(coachingService.generateNutritionInsights).mockResolvedValueOnce(
        mockInsights
      )

      const { generateNutritionInsights } = useCoachingStore.getState()
      await generateNutritionInsights('user-123', { avgProtein: 100 })

      const state = useCoachingStore.getState()
      expect(state.nutritionInsights).toEqual(mockInsights)
      expect(state.loading).toBe(false)
    })

    it('should handle nutrition generation errors', async () => {
      vi.mocked(coachingService.generateNutritionInsights).mockRejectedValueOnce(
        new Error('Network error')
      )

      const { generateNutritionInsights } = useCoachingStore.getState()
      await generateNutritionInsights('user-123', {})

      const state = useCoachingStore.getState()
      expect(state.error).toBe('Network error')
    })
  })

  describe('generateRecoveryInsights', () => {
    it('should generate recovery insights and update state', async () => {
      const mockInsights: CoachingInsight[] = [
        {
          id: 'recov-1',
          userId: 'user-123',
          domain: 'recovery',
          title: 'Recovery Tip',
          insight: 'Sleep more',
          data: { avgSleep: 6 },
          actionable: true,
          suggestedAction: 'Sleep 8 hours',
          createdAt: new Date().toISOString(),
        },
      ]

      vi.mocked(coachingService.generateRecoveryInsights).mockResolvedValueOnce(
        mockInsights
      )

      const { generateRecoveryInsights } = useCoachingStore.getState()
      await generateRecoveryInsights('user-123', { avgSleep: 6 })

      const state = useCoachingStore.getState()
      expect(state.recoveryInsights).toEqual(mockInsights)
      expect(state.loading).toBe(false)
    })
  })

  describe('generateBehavioralInsights', () => {
    it('should generate behavioral insights and update state', async () => {
      const mockInsights: CoachingInsight[] = [
        {
          id: 'behav-1',
          userId: 'user-123',
          domain: 'behavioral',
          title: 'Motivation Tip',
          insight: 'Great streak',
          data: { currentStreak: 14 },
          actionable: true,
          suggestedAction: 'Keep it up',
          createdAt: new Date().toISOString(),
        },
      ]

      vi.mocked(coachingService.generateBehavioralInsights).mockResolvedValueOnce(
        mockInsights
      )

      const { generateBehavioralInsights } = useCoachingStore.getState()
      await generateBehavioralInsights('user-123', { currentStreak: 14 })

      const state = useCoachingStore.getState()
      expect(state.behavioralInsights).toEqual(mockInsights)
      expect(state.loading).toBe(false)
    })
  })

  describe('generateAllInsights', () => {
    it('should generate all types of insights in parallel', async () => {
      const perfInsights: CoachingInsight[] = [
        {
          id: 'perf-1',
          userId: 'user-123',
          domain: 'performance',
          title: 'Performance Tip',
          insight: 'Good',
          data: {},
          actionable: true,
          createdAt: new Date().toISOString(),
        },
      ]
      const nutrInsights: CoachingInsight[] = [
        {
          id: 'nutr-1',
          userId: 'user-123',
          domain: 'nutrition',
          title: 'Nutrition Tip',
          insight: 'Good',
          data: {},
          actionable: true,
          createdAt: new Date().toISOString(),
        },
      ]
      const recInsights: CoachingInsight[] = [
        {
          id: 'rec-1',
          userId: 'user-123',
          domain: 'recovery',
          title: 'Recovery Tip',
          insight: 'Good',
          data: {},
          actionable: true,
          createdAt: new Date().toISOString(),
        },
      ]
      const behavInsights: CoachingInsight[] = [
        {
          id: 'behav-1',
          userId: 'user-123',
          domain: 'behavioral',
          title: 'Motivation Tip',
          insight: 'Good',
          data: {},
          actionable: true,
          createdAt: new Date().toISOString(),
        },
      ]

      vi.mocked(coachingService.generatePerformanceInsights).mockResolvedValueOnce(
        perfInsights
      )
      vi.mocked(coachingService.generateNutritionInsights).mockResolvedValueOnce(
        nutrInsights
      )
      vi.mocked(coachingService.generateRecoveryInsights).mockResolvedValueOnce(
        recInsights
      )
      vi.mocked(coachingService.generateBehavioralInsights).mockResolvedValueOnce(
        behavInsights
      )

      const { generateAllInsights } = useCoachingStore.getState()
      await generateAllInsights('user-123', {
        workout: {},
        nutrition: {},
        recovery: {},
        behavioral: {},
      })

      const state = useCoachingStore.getState()
      expect(state.insights).toHaveLength(4)
      expect(state.performanceInsights).toEqual(perfInsights)
      expect(state.nutritionInsights).toEqual(nutrInsights)
      expect(state.recoveryInsights).toEqual(recInsights)
      expect(state.behavioralInsights).toEqual(behavInsights)
      expect(state.loading).toBe(false)
    })

    it('should combine all insights in order: performance, nutrition, recovery, behavioral', async () => {
      const perfInsight = {
        id: 'perf-1',
        userId: 'user-123',
        domain: 'performance' as const,
        title: 'Performance Tip',
        insight: 'Good',
        data: {},
        actionable: true,
        createdAt: new Date().toISOString(),
      }
      const nutrInsight = {
        id: 'nutr-1',
        userId: 'user-123',
        domain: 'nutrition' as const,
        title: 'Nutrition Tip',
        insight: 'Good',
        data: {},
        actionable: true,
        createdAt: new Date().toISOString(),
      }
      const recInsight = {
        id: 'rec-1',
        userId: 'user-123',
        domain: 'recovery' as const,
        title: 'Recovery Tip',
        insight: 'Good',
        data: {},
        actionable: true,
        createdAt: new Date().toISOString(),
      }
      const behavInsight = {
        id: 'behav-1',
        userId: 'user-123',
        domain: 'behavioral' as const,
        title: 'Motivation Tip',
        insight: 'Good',
        data: {},
        actionable: true,
        createdAt: new Date().toISOString(),
      }

      vi.mocked(coachingService.generatePerformanceInsights).mockResolvedValueOnce([
        perfInsight,
      ])
      vi.mocked(coachingService.generateNutritionInsights).mockResolvedValueOnce([
        nutrInsight,
      ])
      vi.mocked(coachingService.generateRecoveryInsights).mockResolvedValueOnce([
        recInsight,
      ])
      vi.mocked(coachingService.generateBehavioralInsights).mockResolvedValueOnce([
        behavInsight,
      ])

      const { generateAllInsights } = useCoachingStore.getState()
      await generateAllInsights('user-123', {
        workout: {},
        nutrition: {},
        recovery: {},
        behavioral: {},
      })

      const state = useCoachingStore.getState()
      expect(state.insights[0].domain).toBe('performance')
      expect(state.insights[1].domain).toBe('nutrition')
      expect(state.insights[2].domain).toBe('recovery')
      expect(state.insights[3].domain).toBe('behavioral')
    })

    it('should handle errors in all insights generation', async () => {
      vi.mocked(coachingService.generatePerformanceInsights).mockRejectedValueOnce(
        new Error('API Error')
      )

      const { generateAllInsights } = useCoachingStore.getState()
      await generateAllInsights('user-123', {
        workout: {},
        nutrition: {},
        recovery: {},
        behavioral: {},
      })

      const state = useCoachingStore.getState()
      expect(state.error).toBe('API Error')
      expect(state.loading).toBe(false)
    })
  })

  describe('getInsightsByDomain', () => {
    it('should return insights for a specific domain', () => {
      const mockInsights: CoachingInsight[] = [
        {
          id: 'perf-1',
          userId: 'user-123',
          domain: 'performance',
          title: 'Performance Tip',
          insight: 'Good',
          data: {},
          actionable: true,
          createdAt: new Date().toISOString(),
        },
        {
          id: 'perf-2',
          userId: 'user-123',
          domain: 'performance',
          title: 'Performance Tip',
          insight: 'Better',
          data: {},
          actionable: true,
          createdAt: new Date().toISOString(),
        },
        {
          id: 'nutr-1',
          userId: 'user-123',
          domain: 'nutrition',
          title: 'Nutrition Tip',
          insight: 'Good',
          data: {},
          actionable: true,
          createdAt: new Date().toISOString(),
        },
      ]

      const { setInsights, getInsightsByDomain } = useCoachingStore.getState()
      setInsights(mockInsights)

      const perfInsights = getInsightsByDomain('performance')
      expect(perfInsights).toHaveLength(2)
      expect(perfInsights[0].domain).toBe('performance')
      expect(perfInsights[1].domain).toBe('performance')
    })

    it('should return empty array for domain with no insights', () => {
      const mockInsights: CoachingInsight[] = [
        {
          id: 'perf-1',
          userId: 'user-123',
          domain: 'performance',
          title: 'Performance Tip',
          insight: 'Good',
          data: {},
          actionable: true,
          createdAt: new Date().toISOString(),
        },
      ]

      const { setInsights, getInsightsByDomain } = useCoachingStore.getState()
      setInsights(mockInsights)

      const nutrInsights = getInsightsByDomain('nutrition')
      expect(nutrInsights).toEqual([])
    })

    it('should filter insights by all domain types', () => {
      const mockInsights: CoachingInsight[] = [
        {
          id: 'perf-1',
          userId: 'user-123',
          domain: 'performance',
          title: 'Performance Tip',
          insight: 'Good',
          data: {},
          actionable: true,
          createdAt: new Date().toISOString(),
        },
        {
          id: 'nutr-1',
          userId: 'user-123',
          domain: 'nutrition',
          title: 'Nutrition Tip',
          insight: 'Good',
          data: {},
          actionable: true,
          createdAt: new Date().toISOString(),
        },
        {
          id: 'rec-1',
          userId: 'user-123',
          domain: 'recovery',
          title: 'Recovery Tip',
          insight: 'Good',
          data: {},
          actionable: true,
          createdAt: new Date().toISOString(),
        },
        {
          id: 'behav-1',
          userId: 'user-123',
          domain: 'behavioral',
          title: 'Motivation Tip',
          insight: 'Good',
          data: {},
          actionable: true,
          createdAt: new Date().toISOString(),
        },
      ]

      const { setInsights, getInsightsByDomain } = useCoachingStore.getState()
      setInsights(mockInsights)

      expect(getInsightsByDomain('performance')).toHaveLength(1)
      expect(getInsightsByDomain('nutrition')).toHaveLength(1)
      expect(getInsightsByDomain('recovery')).toHaveLength(1)
      expect(getInsightsByDomain('behavioral')).toHaveLength(1)
    })
  })

  describe('getActionableInsights', () => {
    it('should return only actionable insights', () => {
      const mockInsights: CoachingInsight[] = [
        {
          id: 'perf-1',
          userId: 'user-123',
          domain: 'performance',
          title: 'Performance Tip',
          insight: 'Good',
          data: {},
          actionable: true,
          createdAt: new Date().toISOString(),
        },
        {
          id: 'perf-2',
          userId: 'user-123',
          domain: 'performance',
          title: 'Performance Tip',
          insight: 'Info only',
          data: {},
          actionable: false,
          createdAt: new Date().toISOString(),
        },
        {
          id: 'nutr-1',
          userId: 'user-123',
          domain: 'nutrition',
          title: 'Nutrition Tip',
          insight: 'Good',
          data: {},
          actionable: true,
          createdAt: new Date().toISOString(),
        },
      ]

      const { setInsights, getActionableInsights } = useCoachingStore.getState()
      setInsights(mockInsights)

      const actionable = getActionableInsights()
      expect(actionable).toHaveLength(2)
      expect(actionable.every((i) => i.actionable)).toBe(true)
    })

    it('should return empty array when no actionable insights exist', () => {
      const mockInsights: CoachingInsight[] = [
        {
          id: 'perf-1',
          userId: 'user-123',
          domain: 'performance',
          title: 'Performance Tip',
          insight: 'Info',
          data: {},
          actionable: false,
          createdAt: new Date().toISOString(),
        },
      ]

      const { setInsights, getActionableInsights } = useCoachingStore.getState()
      setInsights(mockInsights)

      const actionable = getActionableInsights()
      expect(actionable).toEqual([])
    })
  })

  describe('clearInsights', () => {
    it('should clear all insights from state', () => {
      const mockInsights: CoachingInsight[] = [
        {
          id: 'perf-1',
          userId: 'user-123',
          domain: 'performance',
          title: 'Performance Tip',
          insight: 'Good',
          data: {},
          actionable: true,
          createdAt: new Date().toISOString(),
        },
      ]

      const { setInsights, clearInsights } = useCoachingStore.getState()
      setInsights(mockInsights)

      let state = useCoachingStore.getState()
      expect(state.insights).toHaveLength(1)

      clearInsights()

      state = useCoachingStore.getState()
      expect(state.insights).toEqual([])
      expect(state.performanceInsights).toEqual([])
      expect(state.nutritionInsights).toEqual([])
      expect(state.recoveryInsights).toEqual([])
      expect(state.behavioralInsights).toEqual([])
    })
  })
})

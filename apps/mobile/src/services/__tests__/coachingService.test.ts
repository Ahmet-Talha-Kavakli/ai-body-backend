import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { CoachingInsight } from '@/types/analytics'

// Mock Anthropic SDK - create a shared mock object
const anthropicMocks = {
  createFn: vi.fn(),
}

vi.mock('@anthropic-ai/sdk', () => {
  return {
    default: vi.fn(() => ({
      messages: {
        create: anthropicMocks.createFn,
      },
    })),
  }
})

import * as coachingService from '../coachingService'

describe('coachingService', () => {
  beforeEach(() => {
    // Reset the Anthropic singleton for each test
    coachingService.__resetAnthropic()
    // Clear and reset all mocks
    vi.clearAllMocks()
    anthropicMocks.createFn.mockClear()
    anthropicMocks.createFn.mockReset()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('generatePerformanceInsights', () => {
    it('should generate performance insights from Claude API', async () => {
      const userId = 'user-123'
      const mockData = {
        totalWorkouts: 12,
        avgIntensity: 7,
        favoriteExercise: 'Squats',
        progressTrend: 'up',
        last7Days: [8, 7, 8, 6, 7, 8, 7],
      }

      anthropicMocks.createFn.mockResolvedValueOnce({
        content: [
          {
            type: 'text',
            text: JSON.stringify([
              {
                insight: 'Your workout consistency is excellent this week',
                actionable: true,
                suggestedAction: 'Maintain current frequency',
              },
              {
                insight: 'Consider increasing intensity for better results',
                actionable: true,
                suggestedAction: 'Add 1-2 more intensity points per session',
              },
            ]),
          },
        ],
      })

      const insights = await coachingService.generatePerformanceInsights(userId, mockData)

      expect(insights).toHaveLength(2)
      expect(insights[0].domain).toBe('performance')
      expect(insights[0].userId).toBe(userId)
      expect(insights[0].actionable).toBe(true)
      expect(insights[0].insight).toBe('Your workout consistency is excellent this week')
      expect(insights[1].suggestedAction).toBe('Add 1-2 more intensity points per session')
    })

    it('should include all required fields in insights', async () => {
      const userId = 'user-456'
      const mockData = { totalWorkouts: 5, avgIntensity: 5 }

      anthropicMocks.createFn.mockResolvedValueOnce({
        content: [
          {
            type: 'text',
            text: JSON.stringify([
              {
                insight: 'Test insight',
                actionable: false,
                suggestedAction: 'Test action',
              },
            ]),
          },
        ],
      })

      const insights = await coachingService.generatePerformanceInsights(userId, mockData)

      expect(insights[0]).toHaveProperty('id')
      expect(insights[0]).toHaveProperty('userId')
      expect(insights[0]).toHaveProperty('domain')
      expect(insights[0]).toHaveProperty('title')
      expect(insights[0]).toHaveProperty('insight')
      expect(insights[0]).toHaveProperty('data')
      expect(insights[0]).toHaveProperty('actionable')
      expect(insights[0]).toHaveProperty('suggestedAction')
      expect(insights[0]).toHaveProperty('createdAt')
    })

    it('should handle API errors gracefully', async () => {
      const userId = 'user-789'
      const mockData = { totalWorkouts: 3 }

      anthropicMocks.createFn.mockRejectedValueOnce(new Error('API Error'))

      const insights = await coachingService.generatePerformanceInsights(userId, mockData)

      expect(insights).toEqual([])
    })

    it('should handle malformed JSON response', async () => {
      const userId = 'user-999'
      const mockData = { totalWorkouts: 5 }

      anthropicMocks.createFn.mockResolvedValueOnce({
        content: [
          {
            type: 'text',
            text: 'Invalid JSON',
          },
        ],
      })

      const insights = await coachingService.generatePerformanceInsights(userId, mockData)

      expect(insights).toEqual([])
    })

    it('should call Claude API with correct model and max_tokens', async () => {
      const userId = 'user-model-check'
      const mockData = { totalWorkouts: 10 }

      anthropicMocks.createFn.mockResolvedValueOnce({
        content: [
          {
            type: 'text',
            text: JSON.stringify([
              {
                insight: 'Test',
                actionable: true,
                suggestedAction: 'Test',
              },
            ]),
          },
        ],
      })

      await coachingService.generatePerformanceInsights(userId, mockData)

      expect(anthropicMocks.createFn).toHaveBeenCalledWith({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1024,
        messages: expect.any(Array),
      })
    })
  })

  describe('generateNutritionInsights', () => {
    it('should generate nutrition insights from Claude API', async () => {
      const userId = 'user-nutrition'
      const mockData = {
        avgCalories: 2000,
        avgProtein: 150,
        mealsLogged: 18,
        consistencyScore: 85,
        favoriteMeals: ['Chicken Bowl', 'Salmon Salad'],
      }

      anthropicMocks.createFn.mockResolvedValueOnce({
        content: [
          {
            type: 'text',
            text: JSON.stringify([
              {
                insight: 'Your protein intake is excellent',
                actionable: true,
                suggestedAction: 'Continue current meal plan',
              },
            ]),
          },
        ],
      })

      const insights = await coachingService.generateNutritionInsights(userId, mockData)

      expect(insights).toHaveLength(1)
      expect(insights[0].domain).toBe('nutrition')
      expect(insights[0].insight).toBe('Your protein intake is excellent')
    })

    it('should handle nutrition API errors', async () => {
      const userId = 'user-nutrition-error'
      const mockData = { avgCalories: 2000 }

      anthropicMocks.createFn.mockRejectedValueOnce(new Error('Network error'))

      const insights = await coachingService.generateNutritionInsights(userId, mockData)

      expect(insights).toEqual([])
    })

    it('should include nutrition domain in insights', async () => {
      const userId = 'user-nutrition-domain'
      const mockData = {
        avgCalories: 1800,
        avgProtein: 120,
        mealsLogged: 15,
        consistencyScore: 80,
        favoriteMeals: ['Salad', 'Grilled Chicken'],
      }

      anthropicMocks.createFn.mockResolvedValueOnce({
        content: [
          {
            type: 'text',
            text: JSON.stringify([
              {
                insight: 'Reduce calorie intake',
                actionable: true,
                suggestedAction: 'Cut 200 calories daily',
              },
            ]),
          },
        ],
      })

      const insights = await coachingService.generateNutritionInsights(userId, mockData)

      expect(insights[0].domain).toBe('nutrition')
      expect(insights[0].title).toBe('Nutrition Tip')
    })
  })

  describe('generateRecoveryInsights', () => {
    it('should generate recovery insights from Claude API', async () => {
      const userId = 'user-recovery'
      const mockData = {
        avgSleep: 7,
        sleepQuality: 8,
        hrvTrend: 'stable',
        overtrainingRisk: 'low',
      }

      anthropicMocks.createFn.mockResolvedValueOnce({
        content: [
          {
            type: 'text',
            text: JSON.stringify([
              {
                insight: 'Sleep quality is optimal',
                actionable: false,
                suggestedAction: 'Maintain current sleep schedule',
              },
            ]),
          },
        ],
      })

      const insights = await coachingService.generateRecoveryInsights(userId, mockData)

      expect(insights).toHaveLength(1)
      expect(insights[0].domain).toBe('recovery')
      expect(insights[0].actionable).toBe(false)
    })

    it('should include recovery domain in insights', async () => {
      const userId = 'user-recovery-domain'
      const mockData = { avgSleep: 6 }

      anthropicMocks.createFn.mockResolvedValueOnce({
        content: [
          {
            type: 'text',
            text: JSON.stringify([
              {
                insight: 'Increase sleep duration',
                actionable: true,
                suggestedAction: 'Sleep 1 hour more',
              },
            ]),
          },
        ],
      })

      const insights = await coachingService.generateRecoveryInsights(userId, mockData)

      expect(insights[0].domain).toBe('recovery')
      expect(insights[0].title).toBe('Recovery Tip')
    })
  })

  describe('generateBehavioralInsights', () => {
    it('should generate behavioral insights from Claude API', async () => {
      const userId = 'user-behavioral'
      const mockData = {
        currentStreak: 14,
        motivationLevel: 8,
        goalAdherence: 92,
        recentWins: ['Completed week-long workout', 'Hit protein goal 5/7 days'],
      }

      anthropicMocks.createFn.mockResolvedValueOnce({
        content: [
          {
            type: 'text',
            text: JSON.stringify([
              {
                insight: 'Your consistency is building strong habits',
                actionable: true,
                suggestedAction: 'Push for 30-day streak',
              },
            ]),
          },
        ],
      })

      const insights = await coachingService.generateBehavioralInsights(userId, mockData)

      expect(insights).toHaveLength(1)
      expect(insights[0].domain).toBe('behavioral')
      expect(insights[0].insight).toContain('habits')
    })

    it('should include behavioral domain in insights', async () => {
      const userId = 'user-behavioral-domain'
      const mockData = {
        currentStreak: 5,
        motivationLevel: 7,
        goalAdherence: 75,
        recentWins: ['Completed workout', 'Hit goal'],
      }

      anthropicMocks.createFn.mockResolvedValueOnce({
        content: [
          {
            type: 'text',
            text: JSON.stringify([
              {
                insight: 'Build momentum',
                actionable: true,
                suggestedAction: 'Keep streak going',
              },
            ]),
          },
        ],
      })

      const insights = await coachingService.generateBehavioralInsights(userId, mockData)

      expect(insights[0].domain).toBe('behavioral')
      expect(insights[0].title).toBe('Motivation Tip')
    })
  })

  describe('edge cases', () => {
    it('should handle empty arrays from Claude', async () => {
      const userId = 'user-empty'
      const mockData = { totalWorkouts: 0 }

      anthropicMocks.createFn.mockResolvedValueOnce({
        content: [
          {
            type: 'text',
            text: JSON.stringify([]),
          },
        ],
      })

      const insights = await coachingService.generatePerformanceInsights(userId, mockData)

      expect(insights).toHaveLength(0)
    })

    it('should handle non-text content from Claude', async () => {
      const userId = 'user-non-text'
      const mockData = { totalWorkouts: 5 }

      anthropicMocks.createFn.mockResolvedValueOnce({
        content: [
          {
            type: 'image',
            source: { url: 'https://example.com/image.jpg' },
          },
        ],
      })

      const insights = await coachingService.generatePerformanceInsights(userId, mockData)

      expect(insights).toHaveLength(0)
    })

    it('should generate unique IDs for multiple insights', async () => {
      const userId = 'user-unique-ids'
      const mockData = { totalWorkouts: 10 }

      anthropicMocks.createFn.mockResolvedValueOnce({
        content: [
          {
            type: 'text',
            text: JSON.stringify([
              {
                insight: 'First insight',
                actionable: true,
                suggestedAction: 'Action 1',
              },
              {
                insight: 'Second insight',
                actionable: true,
                suggestedAction: 'Action 2',
              },
              {
                insight: 'Third insight',
                actionable: true,
                suggestedAction: 'Action 3',
              },
            ]),
          },
        ],
      })

      const insights = await coachingService.generatePerformanceInsights(userId, mockData)

      const ids = insights.map((i) => i.id)
      const uniqueIds = new Set(ids)

      expect(uniqueIds.size).toBe(3)
    })

    it('should include original data in insight', async () => {
      const userId = 'user-data-check'
      const mockData = {
        totalWorkouts: 15,
        avgIntensity: 8,
        favoriteExercise: 'Deadlift',
      }

      anthropicMocks.createFn.mockResolvedValueOnce({
        content: [
          {
            type: 'text',
            text: JSON.stringify([
              {
                insight: 'Great form',
                actionable: true,
                suggestedAction: 'Keep it up',
              },
            ]),
          },
        ],
      })

      const insights = await coachingService.generatePerformanceInsights(userId, mockData)

      expect(insights[0].data).toEqual(mockData)
    })
  })
})

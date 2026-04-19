import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import * as recommendationService from '../recommendationService'
import { analyticsClient } from '../analyticsClient'
import type { Recommendation } from '@/types/analytics'

// Mock the analytics client
vi.mock('../analyticsClient', () => ({
  analyticsClient: {
    recommendations: {
      getMeals: vi.fn(),
      getWorkouts: vi.fn(),
      getHealth: vi.fn(),
      getFriends: vi.fn(),
      getChallenges: vi.fn(),
    },
  },
}))

const mockRecommendations: Recommendation[] = [
  {
    id: 'meal-1',
    userId: 'user-1',
    type: 'meal',
    title: 'Grilled Chicken Bowl',
    description: 'High protein meal matching your preferences',
    confidence: 85,
    reasoning: 'Based on your meal history and macro goals',
    actionUrl: 'app://meal/bowl-1',
    createdAt: '2024-01-01T10:00:00Z',
    expiresAt: '2024-01-08T10:00:00Z',
  },
  {
    id: 'meal-2',
    userId: 'user-1',
    type: 'meal',
    title: 'Salmon Salad',
    description: 'Rich in omega-3s',
    confidence: 78,
    reasoning: 'Complements your workout routine',
    createdAt: '2024-01-01T10:00:00Z',
    expiresAt: '2024-01-08T10:00:00Z',
  },
]

const mockWorkoutRecs: Recommendation[] = [
  {
    id: 'workout-1',
    userId: 'user-1',
    type: 'workout',
    title: 'Upper Body Strength',
    description: 'Advanced strength training session',
    confidence: 88,
    reasoning: 'Based on your fitness level progression',
    actionUrl: 'app://workout/upper-1',
    createdAt: '2024-01-01T10:00:00Z',
    expiresAt: '2024-01-08T10:00:00Z',
  },
]

const mockHealthRecs: Recommendation[] = [
  {
    id: 'health-1',
    userId: 'user-1',
    type: 'health',
    title: 'Increase Sleep Duration',
    description: 'Your sleep is below optimal levels',
    confidence: 92,
    reasoning: 'Detected low sleep quality trend',
    createdAt: '2024-01-01T10:00:00Z',
    expiresAt: '2024-01-08T10:00:00Z',
  },
]

const mockFriendRecs: Recommendation[] = [
  {
    id: 'friend-1',
    userId: 'user-1',
    type: 'friend',
    title: 'Connect with Sarah',
    description: 'Similar fitness goals and interests',
    confidence: 75,
    reasoning: 'Shared workout preferences',
    actionUrl: 'app://profile/sarah',
    createdAt: '2024-01-01T10:00:00Z',
    expiresAt: '2024-01-08T10:00:00Z',
  },
]

const mockChallengeRecs: Recommendation[] = [
  {
    id: 'challenge-1',
    userId: 'user-1',
    type: 'challenge',
    title: '30-Day Push Challenge',
    description: 'Perfect for your current fitness level',
    confidence: 81,
    reasoning: 'Aligns with your strength goals',
    actionUrl: 'app://challenge/push-30',
    createdAt: '2024-01-01T10:00:00Z',
    expiresAt: '2024-01-30T10:00:00Z',
  },
]

describe('recommendationService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getMealRecommendations', () => {
    it('should fetch and return meal recommendations', async () => {
      vi.mocked(analyticsClient.recommendations.getMeals).mockResolvedValue({
        data: mockRecommendations,
      } as any)

      const result = await recommendationService.getMealRecommendations('user-1')

      expect(result).toHaveLength(2)
      expect(result[0].type).toBe('meal')
      expect(analyticsClient.recommendations.getMeals).toHaveBeenCalledWith('user-1')
    })

    it('should respect limit parameter', async () => {
      vi.mocked(analyticsClient.recommendations.getMeals).mockResolvedValue({
        data: mockRecommendations,
      } as any)

      const result = await recommendationService.getMealRecommendations('user-1', 1)

      expect(result).toHaveLength(1)
    })

    it('should return empty array on error', async () => {
      vi.mocked(analyticsClient.recommendations.getMeals).mockRejectedValue(
        new Error('Network error'),
      )

      const result = await recommendationService.getMealRecommendations('user-1')

      expect(result).toEqual([])
    })
  })

  describe('getWorkoutRecommendations', () => {
    it('should fetch and return workout recommendations', async () => {
      vi.mocked(analyticsClient.recommendations.getWorkouts).mockResolvedValue({
        data: mockWorkoutRecs,
      } as any)

      const result = await recommendationService.getWorkoutRecommendations('user-1')

      expect(result).toHaveLength(1)
      expect(result[0].type).toBe('workout')
      expect(analyticsClient.recommendations.getWorkouts).toHaveBeenCalledWith('user-1')
    })

    it('should handle errors gracefully', async () => {
      vi.mocked(analyticsClient.recommendations.getWorkouts).mockRejectedValue(
        new Error('API error'),
      )

      const result = await recommendationService.getWorkoutRecommendations('user-1')

      expect(result).toEqual([])
    })
  })

  describe('getHealthRecommendations', () => {
    it('should fetch and return health recommendations with default limit 3', async () => {
      vi.mocked(analyticsClient.recommendations.getHealth).mockResolvedValue({
        data: mockHealthRecs,
      } as any)

      const result = await recommendationService.getHealthRecommendations('user-1')

      expect(result).toBeDefined()
      expect(result[0]?.type).toBe('health')
    })

    it('should apply limit correctly', async () => {
      const manyRecs = Array.from({ length: 10 }, (_, i) => ({
        ...mockHealthRecs[0],
        id: `health-${i}`,
      }))

      vi.mocked(analyticsClient.recommendations.getHealth).mockResolvedValue({
        data: manyRecs,
      } as any)

      const result = await recommendationService.getHealthRecommendations('user-1', 2)

      expect(result).toHaveLength(2)
    })
  })

  describe('getFriendRecommendations', () => {
    it('should fetch and return friend recommendations', async () => {
      vi.mocked(analyticsClient.recommendations.getFriends).mockResolvedValue({
        data: mockFriendRecs,
      } as any)

      const result = await recommendationService.getFriendRecommendations('user-1')

      expect(result).toHaveLength(1)
      expect(result[0].type).toBe('friend')
    })
  })

  describe('getChallengeRecommendations', () => {
    it('should fetch and return challenge recommendations', async () => {
      vi.mocked(analyticsClient.recommendations.getChallenges).mockResolvedValue({
        data: mockChallengeRecs,
      } as any)

      const result = await recommendationService.getChallengeRecommendations('user-1')

      expect(result).toHaveLength(1)
      expect(result[0].type).toBe('challenge')
    })
  })

  describe('getAllRecommendations', () => {
    it('should fetch all recommendation types and combine them', async () => {
      vi.mocked(analyticsClient.recommendations.getMeals).mockResolvedValue({
        data: mockRecommendations,
      } as any)
      vi.mocked(analyticsClient.recommendations.getWorkouts).mockResolvedValue({
        data: mockWorkoutRecs,
      } as any)
      vi.mocked(analyticsClient.recommendations.getHealth).mockResolvedValue({
        data: mockHealthRecs,
      } as any)
      vi.mocked(analyticsClient.recommendations.getFriends).mockResolvedValue({
        data: mockFriendRecs,
      } as any)
      vi.mocked(analyticsClient.recommendations.getChallenges).mockResolvedValue({
        data: mockChallengeRecs,
      } as any)

      const result = await recommendationService.getAllRecommendations('user-1')

      expect(result.length).toBeGreaterThan(0)
      expect(result.length).toBeLessThanOrEqual(10) // Should respect 10 limit
    })

    it('should sort by confidence descending', async () => {
      vi.mocked(analyticsClient.recommendations.getMeals).mockResolvedValue({
        data: [
          { ...mockRecommendations[0], confidence: 70 },
          { ...mockRecommendations[1], confidence: 90 },
        ],
      } as any)
      vi.mocked(analyticsClient.recommendations.getWorkouts).mockResolvedValue({ data: [] } as any)
      vi.mocked(analyticsClient.recommendations.getHealth).mockResolvedValue({ data: [] } as any)
      vi.mocked(analyticsClient.recommendations.getFriends).mockResolvedValue({ data: [] } as any)
      vi.mocked(analyticsClient.recommendations.getChallenges).mockResolvedValue({
        data: [],
      } as any)

      const result = await recommendationService.getAllRecommendations('user-1')

      expect(result[0].confidence).toBeGreaterThanOrEqual(result[1]?.confidence ?? 0)
    })

    it('should handle partial failures', async () => {
      vi.mocked(analyticsClient.recommendations.getMeals).mockResolvedValue({
        data: mockRecommendations,
      } as any)
      vi.mocked(analyticsClient.recommendations.getWorkouts).mockRejectedValue(
        new Error('Failed'),
      )
      vi.mocked(analyticsClient.recommendations.getHealth).mockResolvedValue({ data: [] } as any)
      vi.mocked(analyticsClient.recommendations.getFriends).mockResolvedValue({ data: [] } as any)
      vi.mocked(analyticsClient.recommendations.getChallenges).mockResolvedValue({
        data: [],
      } as any)

      const result = await recommendationService.getAllRecommendations('user-1')

      expect(result).toBeDefined()
      expect(result.length).toBeGreaterThan(0)
    })
  })

  describe('filterByType', () => {
    it('should filter recommendations by type', () => {
      const mixed = [...mockRecommendations, ...mockWorkoutRecs, ...mockHealthRecs]

      const mealOnly = recommendationService.filterByType(mixed, 'meal')

      expect(mealOnly).toHaveLength(2)
      expect(mealOnly.every((r) => r.type === 'meal')).toBe(true)
    })

    it('should return empty array if no matches', () => {
      const result = recommendationService.filterByType(mockRecommendations, 'workout')

      expect(result).toEqual([])
    })
  })

  describe('filterExpired', () => {
    it('should remove expired recommendations', () => {
      const now = new Date()
      const future = new Date(now.getTime() + 1000 * 60 * 60 * 24) // Tomorrow
      const past = new Date(now.getTime() - 1000 * 60 * 60 * 24) // Yesterday

      const recs = [
        { ...mockRecommendations[0], expiresAt: future.toISOString() },
        { ...mockRecommendations[1], expiresAt: past.toISOString() },
      ]

      const result = recommendationService.filterExpired(recs)

      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('meal-1')
    })

    it('should keep all non-expired recommendations', () => {
      const future = new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString()

      const recs = mockRecommendations.map((r) => ({
        ...r,
        expiresAt: future,
      }))

      const result = recommendationService.filterExpired(recs)

      expect(result).toHaveLength(recs.length)
    })
  })
})

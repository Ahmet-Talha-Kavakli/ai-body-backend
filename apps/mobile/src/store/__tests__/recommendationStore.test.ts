import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useRecommendationStore } from '../recommendationStore'
import * as recommendationService from '../../services/recommendationService'
import type { Recommendation } from '@/types/analytics'

// Mock the recommendation service
vi.mock('../../services/recommendationService', () => ({
  getMealRecommendations: vi.fn(),
  getWorkoutRecommendations: vi.fn(),
  getAllRecommendations: vi.fn(),
}))

const mockRecommendations: Recommendation[] = [
  {
    id: 'meal-1',
    userId: 'user-1',
    type: 'meal',
    title: 'Grilled Chicken Bowl',
    description: 'High protein meal',
    confidence: 85,
    reasoning: 'Based on your meal history',
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
    reasoning: 'Complements your workout',
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
    description: 'Advanced strength training',
    confidence: 88,
    reasoning: 'Based on your progression',
    createdAt: '2024-01-01T10:00:00Z',
    expiresAt: '2024-01-08T10:00:00Z',
  },
]

describe('recommendationStore', () => {
  beforeEach(() => {
    // Clear store state between tests
    useRecommendationStore.setState({
      meals: [],
      workouts: [],
      health: [],
      friends: [],
      challenges: [],
      allRecommendations: [],
      loading: false,
      error: null,
    })
    vi.clearAllMocks()
  })

  describe('initial state', () => {
    it('should have empty initial state', () => {
      const state = useRecommendationStore.getState()

      expect(state.meals).toEqual([])
      expect(state.workouts).toEqual([])
      expect(state.health).toEqual([])
      expect(state.friends).toEqual([])
      expect(state.challenges).toEqual([])
      expect(state.allRecommendations).toEqual([])
      expect(state.loading).toBe(false)
      expect(state.error).toBeNull()
    })
  })

  describe('setters', () => {
    it('should set meal recommendations', () => {
      const { setMeals } = useRecommendationStore.getState()

      setMeals(mockRecommendations)

      const state = useRecommendationStore.getState()
      expect(state.meals).toEqual(mockRecommendations)
    })

    it('should set workout recommendations', () => {
      const { setWorkouts } = useRecommendationStore.getState()

      setWorkouts(mockWorkoutRecs)

      const state = useRecommendationStore.getState()
      expect(state.workouts).toEqual(mockWorkoutRecs)
    })

    it('should set loading state', () => {
      const { setLoading } = useRecommendationStore.getState()

      setLoading(true)

      expect(useRecommendationStore.getState().loading).toBe(true)
    })

    it('should set error message', () => {
      const { setError } = useRecommendationStore.getState()
      const errorMsg = 'Failed to fetch'

      setError(errorMsg)

      expect(useRecommendationStore.getState().error).toBe(errorMsg)
    })

    it('should set all recommendations', () => {
      const { setAllRecommendations } = useRecommendationStore.getState()
      const all = [...mockRecommendations, ...mockWorkoutRecs]

      setAllRecommendations(all)

      expect(useRecommendationStore.getState().allRecommendations).toEqual(all)
    })
  })

  describe('loadMealRecommendations', () => {
    it('should load and set meal recommendations', async () => {
      vi.mocked(recommendationService.getMealRecommendations).mockResolvedValue(
        mockRecommendations,
      )

      const { loadMealRecommendations } = useRecommendationStore.getState()
      await loadMealRecommendations('user-1')

      const state = useRecommendationStore.getState()
      expect(state.meals).toEqual(mockRecommendations)
      expect(state.loading).toBe(false)
      expect(state.error).toBeNull()
    })

    it('should set loading state during fetch', async () => {
      let capturedLoading = false

      vi.mocked(recommendationService.getMealRecommendations).mockImplementation(
        async () => {
          capturedLoading = useRecommendationStore.getState().loading
          return mockRecommendations
        },
      )

      const { loadMealRecommendations } = useRecommendationStore.getState()
      await loadMealRecommendations('user-1')

      expect(capturedLoading).toBe(true)
    })

    it('should handle errors', async () => {
      const error = new Error('Network error')
      vi.mocked(recommendationService.getMealRecommendations).mockRejectedValue(error)

      const { loadMealRecommendations } = useRecommendationStore.getState()
      await loadMealRecommendations('user-1')

      const state = useRecommendationStore.getState()
      expect(state.error).toBe(error.message)
      expect(state.loading).toBe(false)
    })
  })

  describe('loadWorkoutRecommendations', () => {
    it('should load and set workout recommendations', async () => {
      vi.mocked(recommendationService.getWorkoutRecommendations).mockResolvedValue(
        mockWorkoutRecs,
      )

      const { loadWorkoutRecommendations } = useRecommendationStore.getState()
      await loadWorkoutRecommendations('user-1')

      const state = useRecommendationStore.getState()
      expect(state.workouts).toEqual(mockWorkoutRecs)
      expect(state.loading).toBe(false)
    })

    it('should handle errors', async () => {
      const error = new Error('API error')
      vi.mocked(recommendationService.getWorkoutRecommendations).mockRejectedValue(error)

      const { loadWorkoutRecommendations } = useRecommendationStore.getState()
      await loadWorkoutRecommendations('user-1')

      const state = useRecommendationStore.getState()
      expect(state.error).toBe(error.message)
    })
  })

  describe('loadAllRecommendations', () => {
    it('should load and set all recommendations', async () => {
      const allRecs = [...mockRecommendations, ...mockWorkoutRecs]
      vi.mocked(recommendationService.getAllRecommendations).mockResolvedValue(allRecs)

      const { loadAllRecommendations } = useRecommendationStore.getState()
      await loadAllRecommendations('user-1')

      const state = useRecommendationStore.getState()
      expect(state.allRecommendations).toEqual(allRecs)
      expect(state.loading).toBe(false)
    })

    it('should handle errors gracefully', async () => {
      vi.mocked(recommendationService.getAllRecommendations).mockRejectedValue(
        new Error('Failed to fetch all'),
      )

      const { loadAllRecommendations } = useRecommendationStore.getState()
      await loadAllRecommendations('user-1')

      const state = useRecommendationStore.getState()
      expect(state.error).toBeTruthy()
    })
  })

  describe('getTopRecommendations', () => {
    it('should return top N recommendations', () => {
      const allRecs = [...mockRecommendations, ...mockWorkoutRecs]
      useRecommendationStore.setState({ allRecommendations: allRecs })

      const { getTopRecommendations } = useRecommendationStore.getState()
      const top = getTopRecommendations(2)

      expect(top).toHaveLength(2)
      expect(top).toEqual(allRecs.slice(0, 2))
    })

    it('should return all if count exceeds available', () => {
      const allRecs = mockRecommendations
      useRecommendationStore.setState({ allRecommendations: allRecs })

      const { getTopRecommendations } = useRecommendationStore.getState()
      const top = getTopRecommendations(100)

      expect(top).toEqual(allRecs)
    })

    it('should return empty array if no recommendations', () => {
      const { getTopRecommendations } = useRecommendationStore.getState()
      const top = getTopRecommendations(5)

      expect(top).toEqual([])
    })
  })

  describe('clearRecommendations', () => {
    it('should clear all recommendation data', () => {
      const allRecs = [...mockRecommendations, ...mockWorkoutRecs]
      useRecommendationStore.setState({
        meals: mockRecommendations,
        workouts: mockWorkoutRecs,
        health: [mockRecommendations[0]],
        friends: [mockWorkoutRecs[0]],
        challenges: [mockRecommendations[1]],
        allRecommendations: allRecs,
      })

      const { clearRecommendations } = useRecommendationStore.getState()
      clearRecommendations()

      const state = useRecommendationStore.getState()
      expect(state.meals).toEqual([])
      expect(state.workouts).toEqual([])
      expect(state.health).toEqual([])
      expect(state.friends).toEqual([])
      expect(state.challenges).toEqual([])
      expect(state.allRecommendations).toEqual([])
    })
  })
})

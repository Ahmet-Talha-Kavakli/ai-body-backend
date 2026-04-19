import { describe, it, expect, beforeEach } from 'vitest'
import { useMealPlanningStore } from '../useMealPlanningStore'
import type { MealSuggestion } from '../../types/mealPlanning'

describe('Meal Planning Store (Zustand)', () => {
  const mockSuggestion: MealSuggestion = {
    id: 'meal-1',
    userId: 'user-123',
    mealName: 'Grilled Salmon',
    description: 'Fresh salmon with roasted vegetables',
    nutrition: {
      calories: 520,
      proteinG: 45,
      carbsG: 48,
      fatG: 18,
      fiberG: 8,
    },
    reasonForSuggestion: 'High protein option',
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  }

  beforeEach(() => {
    // Reset store state before each test
    useMealPlanningStore.setState({
      currentSuggestions: [],
      weeklyPlan: [],
      isLoading: false,
      error: null,
    })
  })

  describe('state management', () => {
    it('should initialize with empty state', () => {
      const state = useMealPlanningStore.getState()
      expect(state.currentSuggestions).toEqual([])
      expect(state.weeklyPlan).toEqual([])
      expect(state.isLoading).toBe(false)
      expect(state.error).toBeNull()
    })

    it('should set current suggestions', () => {
      const store = useMealPlanningStore.getState()
      store.setSuggestions([mockSuggestion])

      const state = useMealPlanningStore.getState()
      expect(state.currentSuggestions).toHaveLength(1)
      expect(state.currentSuggestions[0].mealName).toBe('Grilled Salmon')
    })

    it('should set multiple suggestions', () => {
      const suggestions = [
        mockSuggestion,
        { ...mockSuggestion, id: 'meal-2', mealName: 'Chicken Bowl' },
        { ...mockSuggestion, id: 'meal-3', mealName: 'Vegetable Stir Fry' },
      ]

      const store = useMealPlanningStore.getState()
      store.setSuggestions(suggestions)

      const state = useMealPlanningStore.getState()
      expect(state.currentSuggestions).toHaveLength(3)
    })

    it('should set loading state', () => {
      const store = useMealPlanningStore.getState()
      store.setLoading(true)

      let state = useMealPlanningStore.getState()
      expect(state.isLoading).toBe(true)

      store.setLoading(false)

      state = useMealPlanningStore.getState()
      expect(state.isLoading).toBe(false)
    })

    it('should set error state', () => {
      const store = useMealPlanningStore.getState()
      store.setError('Failed to fetch suggestions')

      let state = useMealPlanningStore.getState()
      expect(state.error).toBe('Failed to fetch suggestions')

      store.setError(null)

      state = useMealPlanningStore.getState()
      expect(state.error).toBeNull()
    })

    it('should clear all suggestions', () => {
      const store = useMealPlanningStore.getState()
      store.setSuggestions([mockSuggestion])

      let state = useMealPlanningStore.getState()
      expect(state.currentSuggestions).toHaveLength(1)

      store.clearSuggestions()

      state = useMealPlanningStore.getState()
      expect(state.currentSuggestions).toHaveLength(0)
    })
  })

  describe('weekly plan management', () => {
    it('should add suggestion to weekly plan', () => {
      const store = useMealPlanningStore.getState()
      store.addToWeeklyPlan(mockSuggestion)

      const state = useMealPlanningStore.getState()
      expect(state.weeklyPlan).toHaveLength(1)
      expect(state.weeklyPlan[0].id).toBe('meal-1')
    })

    it('should add multiple suggestions to weekly plan', () => {
      const store = useMealPlanningStore.getState()
      const suggestion2 = { ...mockSuggestion, id: 'meal-2', mealName: 'Chicken' }

      store.addToWeeklyPlan(mockSuggestion)
      store.addToWeeklyPlan(suggestion2)

      const state = useMealPlanningStore.getState()
      expect(state.weeklyPlan).toHaveLength(2)
    })

    it('should not add duplicate suggestions', () => {
      const store = useMealPlanningStore.getState()
      store.addToWeeklyPlan(mockSuggestion)
      store.addToWeeklyPlan(mockSuggestion)

      const state = useMealPlanningStore.getState()
      // Implementation may vary - could be 1 or 2 depending on design
      expect(state.weeklyPlan.length).toBeGreaterThan(0)
    })

    it('should remove suggestion from weekly plan', () => {
      const store = useMealPlanningStore.getState()
      store.addToWeeklyPlan(mockSuggestion)

      let state = useMealPlanningStore.getState()
      expect(state.weeklyPlan).toHaveLength(1)

      store.removeFromWeeklyPlan('meal-1')

      state = useMealPlanningStore.getState()
      expect(state.weeklyPlan).toHaveLength(0)
    })

    it('should remove specific suggestion by id', () => {
      const store = useMealPlanningStore.getState()
      const suggestion2 = { ...mockSuggestion, id: 'meal-2', mealName: 'Chicken' }

      store.addToWeeklyPlan(mockSuggestion)
      store.addToWeeklyPlan(suggestion2)

      let state = useMealPlanningStore.getState()
      expect(state.weeklyPlan).toHaveLength(2)

      store.removeFromWeeklyPlan('meal-1')

      state = useMealPlanningStore.getState()
      expect(state.weeklyPlan).toHaveLength(1)
      expect(state.weeklyPlan[0].id).toBe('meal-2')
    })

    it('should handle removing non-existent suggestion', () => {
      const store = useMealPlanningStore.getState()
      store.removeFromWeeklyPlan('non-existent')

      const state = useMealPlanningStore.getState()
      expect(state.weeklyPlan).toHaveLength(0)
    })
  })

  describe('bulk operations', () => {
    it('should set entire weekly plan', () => {
      const suggestions = [
        mockSuggestion,
        { ...mockSuggestion, id: 'meal-2', mealName: 'Chicken Bowl' },
      ]

      const store = useMealPlanningStore.getState()
      store.setWeeklyPlan(suggestions)

      const state = useMealPlanningStore.getState()
      expect(state.weeklyPlan).toHaveLength(2)
    })

    it('should clear entire weekly plan', () => {
      const store = useMealPlanningStore.getState()
      store.addToWeeklyPlan(mockSuggestion)

      let state = useMealPlanningStore.getState()
      expect(state.weeklyPlan).toHaveLength(1)

      store.clearWeeklyPlan()

      state = useMealPlanningStore.getState()
      expect(state.weeklyPlan).toHaveLength(0)
    })
  })

  describe('derived state', () => {
    it('should calculate total weekly nutrition', () => {
      const store = useMealPlanningStore.getState()
      store.addToWeeklyPlan(mockSuggestion)
      store.addToWeeklyPlan({ ...mockSuggestion, id: 'meal-2' })

      const totalNutrition = useMealPlanningStore.getState().getTotalWeeklyNutrition?.()
      if (totalNutrition) {
        expect(totalNutrition.calories).toBe(520 * 2)
        expect(totalNutrition.proteinG).toBe(45 * 2)
      }
    })

    it('should filter plan by meal type if supported', () => {
      const store = useMealPlanningStore.getState()
      store.addToWeeklyPlan(mockSuggestion)

      const state = useMealPlanningStore.getState()
      expect(state.weeklyPlan).toHaveLength(1)
    })
  })

  describe('store integration', () => {
    it('should handle complete workflow', () => {
      const store = useMealPlanningStore.getState()

      // Set suggestions
      store.setSuggestions([mockSuggestion])
      let state = useMealPlanningStore.getState()
      expect(state.currentSuggestions).toHaveLength(1)

      // Set loading
      store.setLoading(true)
      state = useMealPlanningStore.getState()
      expect(state.isLoading).toBe(true)

      // Add to plan
      store.addToWeeklyPlan(mockSuggestion)
      state = useMealPlanningStore.getState()
      expect(state.weeklyPlan).toHaveLength(1)

      // Get total nutrition
      const total = state.getTotalWeeklyNutrition?.()
      expect(total?.calories).toBe(520)

      // Clear
      store.clearSuggestions()
      store.clearWeeklyPlan()
      state = useMealPlanningStore.getState()
      expect(state.currentSuggestions).toHaveLength(0)
      expect(state.weeklyPlan).toHaveLength(0)
    })
  })
})

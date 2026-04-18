import { describe, it, expect } from 'vitest'
import type { CoachQuestion, CoachResponse, CoachContext } from '../nutrition-coach'
import type { MacroTotals, NutritionGoal } from '../nutrition'

describe('nutrition-coach types', () => {
  describe('CoachQuestion', () => {
    it('should create a valid CoachQuestion with text input', () => {
      const question: CoachQuestion = {
        id: 'q-1',
        userId: 'user-1',
        question: 'How much protein should I eat?',
        inputType: 'text',
        createdAt: new Date().toISOString(),
        synced: false,
      }

      expect(question.id).toBe('q-1')
      expect(question.inputType).toBe('text')
      expect(question.question).toBe('How much protein should I eat?')
    })

    it('should create a valid CoachQuestion with voice input', () => {
      const question: CoachQuestion = {
        id: 'q-2',
        userId: 'user-1',
        question: 'Voice transcribed question',
        inputType: 'voice',
        createdAt: new Date().toISOString(),
        synced: false,
      }

      expect(question.inputType).toBe('voice')
      expect(question.synced).toBe(false)
    })

    it('should support synced state', () => {
      const question: CoachQuestion = {
        id: 'q-3',
        userId: 'user-1',
        question: 'Question',
        inputType: 'text',
        createdAt: new Date().toISOString(),
        synced: true,
      }

      expect(question.synced).toBe(true)
    })
  })

  describe('CoachContext', () => {
    it('should create valid CoachContext with recent meals', () => {
      const context: CoachContext = {
        recentMeals: ['Oatmeal with berries', 'Chicken salad'],
        todayIntake: {
          calories: 1500,
          proteinG: 100,
          carbsG: 180,
          fatG: 45,
          fiberG: 25,
        } as MacroTotals,
        goals: null,
        streakData: { current: 5, longest: 20 },
      }

      expect(context.recentMeals).toHaveLength(2)
      expect(context.todayIntake.calories).toBe(1500)
    })

    it('should support null goals', () => {
      const context: CoachContext = {
        recentMeals: [],
        todayIntake: {
          calories: 0,
          proteinG: 0,
          carbsG: 0,
          fatG: 0,
          fiberG: 0,
        } as MacroTotals,
        goals: null,
        streakData: { current: 0, longest: 0 },
      }

      expect(context.goals).toBeNull()
    })

    it('should support NutritionGoal in context', () => {
      const goal: NutritionGoal = {
        id: 'goal-1',
        userId: 'user-1',
        dailyCalories: 2000,
        proteinG: 150,
        carbsG: 200,
        fatG: 65,
        fiberG: 30,
        waterGoalMl: 2000,
        generatedByAi: true,
        dietType: 'balanced',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      const context: CoachContext = {
        recentMeals: ['Breakfast', 'Lunch'],
        todayIntake: {
          calories: 1200,
          proteinG: 80,
          carbsG: 150,
          fatG: 40,
          fiberG: 20,
        } as MacroTotals,
        goals: goal,
        streakData: { current: 10, longest: 45 },
      }

      expect(context.goals?.dietType).toBe('balanced')
      expect(context.goals?.dailyCalories).toBe(2000)
    })
  })

  describe('CoachResponse', () => {
    it('should create a valid CoachResponse', () => {
      const response: CoachResponse = {
        id: 'resp-1',
        questionId: 'q-1',
        response: 'You should aim for 1.6-2.2g per kg of body weight.',
        context: {
          recentMeals: [],
          todayIntake: {
            calories: 0,
            proteinG: 0,
            carbsG: 0,
            fatG: 0,
            fiberG: 0,
          } as MacroTotals,
          goals: null,
          streakData: { current: 0, longest: 0 },
        },
      }

      expect(response.id).toBe('resp-1')
      expect(response.questionId).toBe('q-1')
      expect(response.response).toContain('1.6-2.2g')
    })

    it('should include context with all data', () => {
      const goal: NutritionGoal = {
        id: 'goal-1',
        userId: 'user-1',
        dailyCalories: 2500,
        proteinG: 180,
        carbsG: 300,
        fatG: 75,
        fiberG: 40,
        waterGoalMl: 3000,
        generatedByAi: true,
        dietType: 'keto',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      const response: CoachResponse = {
        id: 'resp-2',
        questionId: 'q-2',
        response: 'Keto diet recommendation...',
        context: {
          recentMeals: ['Eggs', 'Salmon', 'Avocado'],
          todayIntake: {
            calories: 1800,
            proteinG: 120,
            carbsG: 50,
            fatG: 110,
            fiberG: 15,
          } as MacroTotals,
          goals: goal,
          streakData: { current: 30, longest: 60 },
        },
      }

      expect(response.context.recentMeals).toHaveLength(3)
      expect(response.context.goals?.dietType).toBe('keto')
    })
  })
})

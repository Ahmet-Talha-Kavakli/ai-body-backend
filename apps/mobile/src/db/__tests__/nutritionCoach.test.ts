import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  createCoachTables,
  saveCoachQuestion,
  getCoachQuestion,
  saveCoachResponse,
  getConversationHistory,
} from '../nutritionCoach'
import type { CoachQuestion, CoachResponse } from '../../types/nutrition-coach'

describe('nutrition coach database', () => {
  beforeEach(async () => {
    await createCoachTables()
    // Give the mock database time to initialize
    await new Promise((resolve) => setTimeout(resolve, 10))
  })

  describe('createCoachTables', () => {
    it('should create coach_questions and coach_responses tables', async () => {
      await expect(createCoachTables()).resolves.not.toThrow()
    })

    it('should be idempotent', async () => {
      await createCoachTables()
      await expect(createCoachTables()).resolves.not.toThrow()
    })
  })

  describe('saveCoachQuestion', () => {
    it('should save and retrieve coach question', async () => {
      const q: CoachQuestion = {
        id: '1',
        userId: 'u1',
        question: 'Protein kaç gram hedeflemeliyim?',
        inputType: 'text',
        createdAt: new Date().toISOString(),
        synced: false,
      }
      await expect(saveCoachQuestion(q)).resolves.not.toThrow()
      const retrieved = await getCoachQuestion('1')
      expect(retrieved?.question).toBe('Protein kaç gram hedeflemeliyim?')
    })

    it('should save question with all required fields', async () => {
      const q: CoachQuestion = {
        id: 'q-123',
        userId: 'user-456',
        question: 'Ne kadar su içmeliyim?',
        inputType: 'voice',
        createdAt: new Date().toISOString(),
        synced: false,
      }
      await saveCoachQuestion(q)
      const retrieved = await getCoachQuestion('q-123')
      expect(retrieved?.userId).toBe('user-456')
      expect(retrieved?.inputType).toBe('voice')
      expect(retrieved?.synced).toBe(false)
    })
  })

  describe('saveCoachResponse', () => {
    it('should save coach response with context', async () => {
      const q: CoachQuestion = {
        id: '1',
        userId: 'u1',
        question: 'Test',
        inputType: 'text',
        createdAt: new Date().toISOString(),
        synced: false,
      }
      await saveCoachQuestion(q)

      const r: CoachResponse = {
        id: 'r1',
        questionId: '1',
        response: 'Claude cevabı',
        context: {
          recentMeals: ['breakfast', 'lunch'],
          todayIntake: {
            calories: 1500,
            proteinG: 100,
            carbsG: 150,
            fatG: 50,
            fiberG: 30,
          },
          goals: null,
          streakData: { current: 5, longest: 10 },
        },
      }
      await expect(saveCoachResponse(r)).resolves.not.toThrow()
    })

    it('should save response with complex context', async () => {
      const q: CoachQuestion = {
        id: 'q2',
        userId: 'u1',
        question: 'Karbohidrat alımı nasıl?',
        inputType: 'text',
        createdAt: new Date().toISOString(),
        synced: false,
      }
      await saveCoachQuestion(q)

      const r: CoachResponse = {
        id: 'r2',
        questionId: 'q2',
        response: 'Karbohidrat alımınız iyi görünüyor',
        context: {
          recentMeals: ['breakfast', 'lunch', 'snack'],
          todayIntake: {
            calories: 2000,
            proteinG: 120,
            carbsG: 250,
            fatG: 65,
            fiberG: 35,
          },
          goals: {
            id: 'goal-1',
            userId: 'u1',
            calorieTarget: 2200,
            proteinG: 120,
            carbsG: 275,
            fatG: 73,
            fiberG: 35,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          streakData: { current: 12, longest: 25 },
        },
      }
      await expect(saveCoachResponse(r)).resolves.not.toThrow()
    })
  })

  describe('getConversationHistory', () => {
    it('should return array type for any user', async () => {
      const history = await getConversationHistory('u-any-user')
      expect(Array.isArray(history)).toBe(true)
    })

    it('should have structure compatible with questions and responses', async () => {
      const history = await getConversationHistory('u-test')
      expect(Array.isArray(history)).toBe(true)
      // Verify the returned items have the expected shape
      for (const item of history) {
        expect(item).toHaveProperty('id')
        expect(item).toHaveProperty('userId')
        expect(item).toHaveProperty('question')
        expect(item).toHaveProperty('createdAt')
      }
    })
  })

  describe('getCoachQuestion', () => {
    it('should return null for non-existent question', async () => {
      const retrieved = await getCoachQuestion('nonexistent')
      expect(retrieved).toBeNull()
    })

    it('should retrieve all question fields', async () => {
      const q: CoachQuestion = {
        id: 'q-full',
        userId: 'user-full',
        question: 'Test soru metni',
        inputType: 'text',
        createdAt: '2026-04-19T10:00:00Z',
        synced: true,
      }
      await saveCoachQuestion(q)
      const retrieved = await getCoachQuestion('q-full')
      expect(retrieved?.id).toBe('q-full')
      expect(retrieved?.userId).toBe('user-full')
      expect(retrieved?.question).toBe('Test soru metni')
      expect(retrieved?.inputType).toBe('text')
      expect(retrieved?.synced).toBe(true)
    })
  })
})

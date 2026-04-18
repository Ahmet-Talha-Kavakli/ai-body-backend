import { describe, it, expect } from 'vitest'
import type { NutritionSyncQueue } from '../nutrition-sync'

describe('nutrition-sync types', () => {
  describe('NutritionSyncQueue', () => {
    it('should create a valid pending sync queue item', () => {
      const syncItem: NutritionSyncQueue = {
        id: 'sync-1',
        type: 'meal',
        payload: {
          id: 'meal-1',
          totalCalories: 500,
          items: [],
        },
        status: 'pending',
        attempts: 0,
        createdAt: new Date().toISOString(),
      }

      expect(syncItem.id).toBe('sync-1')
      expect(syncItem.type).toBe('meal')
      expect(syncItem.status).toBe('pending')
      expect(syncItem.attempts).toBe(0)
    })

    it('should support all sync types', () => {
      const types = ['meal', 'photo', 'goal', 'water', 'coach_log'] as const
      types.forEach((type) => {
        const syncItem: NutritionSyncQueue = {
          id: 'sync-1',
          type,
          payload: {},
          status: 'pending',
          attempts: 0,
          createdAt: new Date().toISOString(),
        }
        expect(syncItem.type).toBe(type)
      })
    })

    it('should support all status values', () => {
      const statuses = ['pending', 'syncing', 'synced', 'failed'] as const
      statuses.forEach((status) => {
        const syncItem: NutritionSyncQueue = {
          id: 'sync-1',
          type: 'meal',
          payload: {},
          status,
          attempts: 0,
          createdAt: new Date().toISOString(),
        }
        expect(syncItem.status).toBe(status)
      })
    })

    it('should track sync attempts', () => {
      const syncItem: NutritionSyncQueue = {
        id: 'sync-1',
        type: 'meal',
        payload: {},
        status: 'syncing',
        attempts: 2,
        lastAttempt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      }

      expect(syncItem.attempts).toBe(2)
      expect(syncItem.lastAttempt).toBeDefined()
    })

    it('should track errors on failed sync', () => {
      const syncItem: NutritionSyncQueue = {
        id: 'sync-1',
        type: 'meal',
        payload: {},
        status: 'failed',
        attempts: 3,
        error: 'Network timeout',
        lastAttempt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      }

      expect(syncItem.error).toBe('Network timeout')
      expect(syncItem.status).toBe('failed')
    })

    it('should support complex payloads', () => {
      const syncItem: NutritionSyncQueue = {
        id: 'sync-2',
        type: 'meal',
        payload: {
          id: 'meal-1',
          userId: 'user-1',
          mealType: 'breakfast',
          items: [
            { name: 'Oatmeal', calories: 150, proteinG: 5 },
            { name: 'Banana', calories: 105, proteinG: 1 },
          ],
          totalCalories: 255,
          totalProteinG: 6,
          loggedAt: new Date().toISOString(),
        },
        status: 'pending',
        attempts: 0,
        createdAt: new Date().toISOString(),
      }

      expect(syncItem.payload.items).toHaveLength(2)
      expect(syncItem.payload.totalCalories).toBe(255)
    })

    it('should support photo sync items', () => {
      const syncItem: NutritionSyncQueue = {
        id: 'sync-3',
        type: 'photo',
        payload: {
          mealLogId: 'meal-1',
          filePath: '/photos/meal-1.jpg',
          fileSize: 2048576,
        },
        status: 'uploading',
        attempts: 1,
        lastAttempt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      }

      expect(syncItem.type).toBe('photo')
      expect(syncItem.status).toBe('uploading')
    })

    it('should support goal sync items', () => {
      const syncItem: NutritionSyncQueue = {
        id: 'sync-4',
        type: 'goal',
        payload: {
          userId: 'user-1',
          dailyCalories: 2000,
          proteinG: 150,
          dietType: 'balanced',
        },
        status: 'synced',
        attempts: 1,
        createdAt: new Date().toISOString(),
      }

      expect(syncItem.type).toBe('goal')
      expect(syncItem.status).toBe('synced')
    })

    it('should support water intake sync items', () => {
      const syncItem: NutritionSyncQueue = {
        id: 'sync-5',
        type: 'water',
        payload: {
          date: '2024-04-18',
          totalMl: 2000,
          timestamp: new Date().toISOString(),
        },
        status: 'pending',
        attempts: 0,
        createdAt: new Date().toISOString(),
      }

      expect(syncItem.type).toBe('water')
    })

    it('should support coach log sync items', () => {
      const syncItem: NutritionSyncQueue = {
        id: 'sync-6',
        type: 'coach_log',
        payload: {
          questionId: 'q-1',
          question: 'How much water should I drink?',
          response: '...',
        },
        status: 'pending',
        attempts: 0,
        createdAt: new Date().toISOString(),
      }

      expect(syncItem.type).toBe('coach_log')
    })
  })
})

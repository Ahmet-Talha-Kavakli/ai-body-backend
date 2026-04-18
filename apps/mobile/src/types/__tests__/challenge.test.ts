import { describe, it, expect } from 'vitest'
import type {
  Challenge,
  ChallengeProgress,
  ChallengeWithProgress,
} from '../challenge'

describe('challenge types', () => {
  describe('Challenge', () => {
    it('should create a valid Challenge', () => {
      const challenge: Challenge = {
        id: 'challenge-1',
        createdBy: 'user-1',
        title: '10k Steps Daily',
        description: 'Walk 10k steps every day',
        type: 'steps',
        target: 10000,
        duration: 'daily',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        participants: ['user-1', 'user-2'],
        status: 'active',
        createdAt: new Date().toISOString(),
      }

      expect(challenge.id).toBe('challenge-1')
      expect(challenge.type).toBe('steps')
      expect(challenge.status).toBe('active')
      expect(challenge.participants).toHaveLength(2)
    })

    it('should support all challenge types', () => {
      const types = ['steps', 'calories', 'workout', 'nutrition', 'custom'] as const
      types.forEach((type) => {
        const challenge: Challenge = {
          id: 'challenge-1',
          createdBy: 'user-1',
          title: 'Test Challenge',
          description: 'Test',
          type,
          target: 100,
          duration: 'daily',
          startDate: new Date().toISOString(),
          endDate: new Date().toISOString(),
          participants: [],
          status: 'active',
          createdAt: new Date().toISOString(),
        }
        expect(challenge.type).toBe(type)
      })
    })

    it('should support all challenge durations', () => {
      const durations = ['daily', 'weekly', '30day', 'custom'] as const
      durations.forEach((duration) => {
        const challenge: Challenge = {
          id: 'challenge-1',
          createdBy: 'user-1',
          title: 'Test Challenge',
          description: 'Test',
          type: 'steps',
          target: 100,
          duration,
          startDate: new Date().toISOString(),
          endDate: new Date().toISOString(),
          participants: [],
          status: 'active',
          createdAt: new Date().toISOString(),
        }
        expect(challenge.duration).toBe(duration)
      })
    })

    it('should support all challenge statuses', () => {
      const statuses = ['active', 'completed', 'cancelled'] as const
      statuses.forEach((status) => {
        const challenge: Challenge = {
          id: 'challenge-1',
          createdBy: 'user-1',
          title: 'Test Challenge',
          description: 'Test',
          type: 'steps',
          target: 100,
          duration: 'daily',
          startDate: new Date().toISOString(),
          endDate: new Date().toISOString(),
          participants: [],
          status,
          createdAt: new Date().toISOString(),
        }
        expect(challenge.status).toBe(status)
      })
    })
  })

  describe('ChallengeProgress', () => {
    it('should create a valid ChallengeProgress', () => {
      const progress: ChallengeProgress = {
        challengeId: 'challenge-1',
        userId: 'user-1',
        currentValue: 5000,
        completed: false,
      }

      expect(progress.challengeId).toBe('challenge-1')
      expect(progress.currentValue).toBe(5000)
      expect(progress.completed).toBe(false)
    })

    it('should support optional completedAt field', () => {
      const progress: ChallengeProgress = {
        challengeId: 'challenge-1',
        userId: 'user-1',
        currentValue: 10000,
        completed: true,
        completedAt: new Date().toISOString(),
      }

      expect(progress.completedAt).toBeDefined()
      expect(progress.completed).toBe(true)
    })
  })

  describe('ChallengeWithProgress', () => {
    it('should create a valid ChallengeWithProgress', () => {
      const challenge: Challenge = {
        id: 'challenge-1',
        createdBy: 'user-1',
        title: 'Test Challenge',
        description: 'Test',
        type: 'steps',
        target: 10000,
        duration: 'daily',
        startDate: new Date().toISOString(),
        endDate: new Date().toISOString(),
        participants: ['user-1', 'user-2', 'user-3'],
        status: 'active',
        createdAt: new Date().toISOString(),
      }

      const progress: ChallengeProgress = {
        challengeId: 'challenge-1',
        userId: 'user-1',
        currentValue: 7000,
        completed: false,
      }

      const withProgress: ChallengeWithProgress = {
        challenge,
        progress,
        participantCount: 3,
      }

      expect(withProgress.challenge.id).toBe('challenge-1')
      expect(withProgress.progress.currentValue).toBe(7000)
      expect(withProgress.participantCount).toBe(3)
    })

    it('should support optional yourRank field', () => {
      const challenge: Challenge = {
        id: 'challenge-1',
        createdBy: 'user-1',
        title: 'Test Challenge',
        description: 'Test',
        type: 'steps',
        target: 10000,
        duration: 'daily',
        startDate: new Date().toISOString(),
        endDate: new Date().toISOString(),
        participants: [],
        status: 'active',
        createdAt: new Date().toISOString(),
      }

      const progress: ChallengeProgress = {
        challengeId: 'challenge-1',
        userId: 'user-1',
        currentValue: 10000,
        completed: true,
      }

      const withProgress: ChallengeWithProgress = {
        challenge,
        progress,
        participantCount: 100,
        yourRank: 1,
      }

      expect(withProgress.yourRank).toBe(1)
    })
  })
})

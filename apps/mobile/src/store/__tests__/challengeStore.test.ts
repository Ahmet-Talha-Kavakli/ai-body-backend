import { describe, it, expect, beforeEach } from 'vitest'
import { useChallengeStore } from '../challengeStore'
import type { Challenge, ChallengeWithProgress } from '@/types/challenge'

describe('ChallengeStore', () => {
  beforeEach(() => {
    // Reset store state using the store's API directly
    useChallengeStore.setState({
      challenges: [],
      myChallenges: [],
      loading: false,
      error: null,
    })
  })

  function getState() {
    return useChallengeStore.getState()
  }

  describe('State Initialization', () => {
    it('initializes with empty challenges', () => {
      const state = getState()
      expect(state.challenges).toEqual([])
    })

    it('initializes with empty myChallenges', () => {
      const state = getState()
      expect(state.myChallenges).toEqual([])
    })

    it('initializes with loading false', () => {
      const state = getState()
      expect(state.loading).toBe(false)
    })

    it('initializes with error null', () => {
      const state = getState()
      expect(state.error).toBe(null)
    })
  })

  describe('setChallenges', () => {
    it('sets available challenges', () => {
      const mockChallenge = createMockChallenge()
      const challenges = [{ challenge: mockChallenge, progress: { challengeId: mockChallenge.id, userId: 'user1', currentValue: 0, completed: false }, participantCount: 5 }]

      getState().setChallenges(challenges)

      expect(getState().challenges).toEqual(challenges)
    })

    it('replaces existing challenges', () => {
      const challenge1 = createMockChallenge('c1')
      const challenge2 = createMockChallenge('c2')

      getState().setChallenges([{ challenge: challenge1, progress: { challengeId: challenge1.id, userId: 'user1', currentValue: 0, completed: false }, participantCount: 5 }])
      getState().setChallenges([{ challenge: challenge2, progress: { challengeId: challenge2.id, userId: 'user1', currentValue: 0, completed: false }, participantCount: 3 }])

      expect(getState().challenges).toHaveLength(1)
      expect(getState().challenges[0].challenge.id).toBe('c2')
    })
  })

  describe('setMyChallenges', () => {
    it('sets user challenges', () => {
      const mockChallenge = createMockChallenge()
      const challenges = [{ challenge: mockChallenge, progress: { challengeId: mockChallenge.id, userId: 'user1', currentValue: 50, completed: false }, participantCount: 5 }]

      getState().setMyChallenges(challenges)

      expect(getState().myChallenges).toEqual(challenges)
    })

    it('maintains separate from available challenges', () => {
      const challenge1 = createMockChallenge('c1')
      const challenge2 = createMockChallenge('c2')

      const availableChallenges = [{ challenge: challenge1, progress: { challengeId: challenge1.id, userId: 'user1', currentValue: 0, completed: false }, participantCount: 5 }]
      const myChallenges = [{ challenge: challenge2, progress: { challengeId: challenge2.id, userId: 'user1', currentValue: 50, completed: false }, participantCount: 3 }]

      getState().setChallenges(availableChallenges)
      getState().setMyChallenges(myChallenges)

      expect(getState().challenges).toHaveLength(1)
      expect(getState().challenges[0].challenge.id).toBe('c1')
      expect(getState().myChallenges).toHaveLength(1)
      expect(getState().myChallenges[0].challenge.id).toBe('c2')
    })
  })

  describe('setLoading', () => {
    it('sets loading to true', () => {
      getState().setLoading(true)
      expect(getState().loading).toBe(true)
    })

    it('sets loading to false', () => {
      getState().setLoading(true)
      getState().setLoading(false)
      expect(getState().loading).toBe(false)
    })
  })

  describe('setError', () => {
    it('sets error message', () => {
      const error = 'Failed to load challenges'
      getState().setError(error)
      expect(getState().error).toBe(error)
    })

    it('clears error with null', () => {
      getState().setError('Some error')
      getState().setError(null)
      expect(getState().error).toBeNull()
    })
  })

  describe('addChallenge', () => {
    it('adds challenge to available challenges', () => {
      const mockChallenge = createMockChallenge()
      const challengeWithProgress = {
        challenge: mockChallenge,
        progress: { challengeId: mockChallenge.id, userId: 'user1', currentValue: 0, completed: false },
        participantCount: 5
      }

      getState().addChallenge(challengeWithProgress)

      expect(getState().challenges).toHaveLength(1)
      expect(getState().challenges[0].challenge.id).toBe(mockChallenge.id)
    })

    it('preserves existing challenges', () => {
      const challenge1 = createMockChallenge('c1')
      const challenge2 = createMockChallenge('c2')

      getState().addChallenge({
        challenge: challenge1,
        progress: { challengeId: challenge1.id, userId: 'user1', currentValue: 0, completed: false },
        participantCount: 5
      })
      getState().addChallenge({
        challenge: challenge2,
        progress: { challengeId: challenge2.id, userId: 'user1', currentValue: 0, completed: false },
        participantCount: 3
      })

      expect(getState().challenges).toHaveLength(2)
    })
  })

  describe('updateChallengeProgress', () => {
    it('updates progress value for a challenge', () => {
      const mockChallenge = createMockChallenge('c1')
      const challengeWithProgress = {
        challenge: mockChallenge,
        progress: { challengeId: mockChallenge.id, userId: 'user1', currentValue: 0, completed: false },
        participantCount: 5
      }

      getState().setMyChallenges([challengeWithProgress])
      getState().updateChallengeProgress('c1', 50)

      expect(getState().myChallenges[0].progress.currentValue).toBe(50)
    })

    it('ignores update for non-existent challenge', () => {
      const mockChallenge = createMockChallenge('c1')
      const challengeWithProgress = {
        challenge: mockChallenge,
        progress: { challengeId: mockChallenge.id, userId: 'user1', currentValue: 0, completed: false },
        participantCount: 5
      }

      getState().setMyChallenges([challengeWithProgress])
      getState().updateChallengeProgress('c2', 50)

      expect(getState().myChallenges[0].progress.currentValue).toBe(0)
    })

    it('preserves other challenge properties during update', () => {
      const mockChallenge = createMockChallenge('c1')
      const challengeWithProgress = {
        challenge: mockChallenge,
        progress: { challengeId: mockChallenge.id, userId: 'user1', currentValue: 0, completed: false },
        participantCount: 5
      }

      getState().setMyChallenges([challengeWithProgress])
      getState().updateChallengeProgress('c1', 50)

      expect(getState().myChallenges[0].progress.completed).toBe(false)
      expect(getState().myChallenges[0].challenge.id).toBe('c1')
    })
  })

  describe('joinChallenge', () => {
    it('adds challenge to myChallenges', () => {
      const mockChallenge = createMockChallenge()
      const challengeWithProgress = {
        challenge: mockChallenge,
        progress: { challengeId: mockChallenge.id, userId: 'user1', currentValue: 0, completed: false },
        participantCount: 5
      }

      getState().joinChallenge(challengeWithProgress)

      expect(getState().myChallenges).toHaveLength(1)
      expect(getState().myChallenges[0].challenge.id).toBe(mockChallenge.id)
    })

    it('preserves existing joined challenges', () => {
      const challenge1 = createMockChallenge('c1')
      const challenge2 = createMockChallenge('c2')

      getState().joinChallenge({
        challenge: challenge1,
        progress: { challengeId: challenge1.id, userId: 'user1', currentValue: 0, completed: false },
        participantCount: 5
      })
      getState().joinChallenge({
        challenge: challenge2,
        progress: { challengeId: challenge2.id, userId: 'user1', currentValue: 0, completed: false },
        participantCount: 3
      })

      expect(getState().myChallenges).toHaveLength(2)
    })
  })

  describe('leaveChallenge', () => {
    it('removes challenge from myChallenges', () => {
      const mockChallenge = createMockChallenge('c1')
      const challengeWithProgress = {
        challenge: mockChallenge,
        progress: { challengeId: mockChallenge.id, userId: 'user1', currentValue: 0, completed: false },
        participantCount: 5
      }

      getState().joinChallenge(challengeWithProgress)
      getState().leaveChallenge('c1')

      expect(getState().myChallenges).toHaveLength(0)
    })

    it('only removes specified challenge', () => {
      const challenge1 = createMockChallenge('c1')
      const challenge2 = createMockChallenge('c2')

      getState().joinChallenge({
        challenge: challenge1,
        progress: { challengeId: challenge1.id, userId: 'user1', currentValue: 0, completed: false },
        participantCount: 5
      })
      getState().joinChallenge({
        challenge: challenge2,
        progress: { challengeId: challenge2.id, userId: 'user1', currentValue: 0, completed: false },
        participantCount: 3
      })

      getState().leaveChallenge('c1')

      expect(getState().myChallenges).toHaveLength(1)
      expect(getState().myChallenges[0].challenge.id).toBe('c2')
    })
  })

  describe('getActiveChallenges', () => {
    it('returns only active challenges', () => {
      const activeChallenge = createMockChallenge('c1', { status: 'active' })
      const completedChallenge = createMockChallenge('c2', { status: 'completed' })

      getState().setMyChallenges([
        {
          challenge: activeChallenge,
          progress: { challengeId: activeChallenge.id, userId: 'user1', currentValue: 0, completed: false },
          participantCount: 5
        },
        {
          challenge: completedChallenge,
          progress: { challengeId: completedChallenge.id, userId: 'user1', currentValue: 100, completed: true },
          participantCount: 5
        }
      ])

      const active = getState().getActiveChallenges()

      expect(active).toHaveLength(1)
      expect(active[0].challenge.status).toBe('active')
    })

    it('returns empty array when no active challenges', () => {
      const completedChallenge = createMockChallenge('c1', { status: 'completed' })

      getState().setMyChallenges([
        {
          challenge: completedChallenge,
          progress: { challengeId: completedChallenge.id, userId: 'user1', currentValue: 100, completed: true },
          participantCount: 5
        }
      ])

      const active = getState().getActiveChallenges()

      expect(active).toHaveLength(0)
    })
  })

  describe('getCompletedChallenges', () => {
    it('returns only completed challenges', () => {
      const activeChallenge = createMockChallenge('c1', { status: 'active' })
      const completedChallenge = createMockChallenge('c2', { status: 'completed' })

      getState().setMyChallenges([
        {
          challenge: activeChallenge,
          progress: { challengeId: activeChallenge.id, userId: 'user1', currentValue: 0, completed: false },
          participantCount: 5
        },
        {
          challenge: completedChallenge,
          progress: { challengeId: completedChallenge.id, userId: 'user1', currentValue: 100, completed: true },
          participantCount: 5
        }
      ])

      const completed = getState().getCompletedChallenges()

      expect(completed).toHaveLength(1)
      expect(completed[0].challenge.status).toBe('completed')
    })

    it('returns empty array when no completed challenges', () => {
      const activeChallenge = createMockChallenge('c1', { status: 'active' })

      getState().setMyChallenges([
        {
          challenge: activeChallenge,
          progress: { challengeId: activeChallenge.id, userId: 'user1', currentValue: 0, completed: false },
          participantCount: 5
        }
      ])

      const completed = getState().getCompletedChallenges()

      expect(completed).toHaveLength(0)
    })
  })
})

// Helper functions
function createMockChallenge(id: string = 'c1', overrides: Partial<Challenge> = {}): Challenge {
  return {
    id,
    createdBy: 'user1',
    title: 'Test Challenge',
    description: 'A test challenge',
    type: 'steps',
    target: 10000,
    duration: 'weekly',
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    participants: ['user1'],
    status: 'active',
    createdAt: new Date().toISOString(),
    ...overrides
  }
}

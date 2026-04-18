import { describe, it, expect, beforeEach } from 'vitest'
import { initChallengesTable, saveChallenge, getChallenges, getChallengeDetail, saveChallengeProgress, getChallengeProgress, getParticipants, clearChallengesTables } from '../challenges'
import type { Challenge } from '@/types/challenge'

describe('Challenges Database', () => {
  beforeEach(async () => {
    await initChallengesTable()
    await clearChallengesTables()
  })

  describe('initChallengesTable', () => {
    it('creates challenges table without error', async () => {
      expect(async () => {
        await initChallengesTable()
      }).not.toThrow()
    })
  })

  describe('saveChallenge', () => {
    it('saves a challenge and returns an id', async () => {
      const challenge = createMockChallenge()
      const id = await saveChallenge(challenge)

      expect(id).toBeDefined()
      expect(typeof id).toBe('string')
    })

    it('generates id if not provided', async () => {
      const challenge = createMockChallenge()
      delete (challenge as any).id
      const id = await saveChallenge(challenge)

      expect(id).toMatch(/challenge-/)
    })

    it('preserves provided id', async () => {
      const challenge = createMockChallenge('custom-id')
      const id = await saveChallenge(challenge)

      expect(id).toBe('custom-id')
    })

    it('saves all challenge properties', async () => {
      const challenge = createMockChallenge('c1')
      await saveChallenge(challenge)

      const saved = await getChallengeDetail('c1')
      expect(saved).toBeDefined()
      expect(saved?.title).toBe(challenge.title)
      expect(saved?.description).toBe(challenge.description)
      expect(saved?.type).toBe(challenge.type)
      expect(saved?.target).toBe(challenge.target)
    })
  })

  describe('getChallenges', () => {
    it('returns empty array initially', async () => {
      const challenges = await getChallenges()
      expect(challenges).toEqual([])
    })

    it('returns only active challenges', async () => {
      const activeChallenge = createMockChallenge('c1', { status: 'active' })
      const completedChallenge = createMockChallenge('c2', { status: 'completed' })

      await saveChallenge(activeChallenge)
      await saveChallenge(completedChallenge)

      const challenges = await getChallenges()

      expect(challenges.length).toBeGreaterThan(0)
      expect(challenges.every((c: any) => c.status === 'active')).toBe(true)
    })

    it('returns multiple active challenges', async () => {
      const challenge1 = createMockChallenge('c1')
      const challenge2 = createMockChallenge('c2')

      await saveChallenge(challenge1)
      await saveChallenge(challenge2)

      const challenges = await getChallenges()

      expect(challenges.length).toBeGreaterThanOrEqual(2)
    })
  })

  describe('getChallengeDetail', () => {
    it('returns challenge by id', async () => {
      const challenge = createMockChallenge('c1')
      await saveChallenge(challenge)

      const detail = await getChallengeDetail('c1')

      expect(detail).toBeDefined()
      expect(detail?.id).toBe('c1')
    })

    it('returns undefined for non-existent challenge', async () => {
      const detail = await getChallengeDetail('nonexistent')
      expect(detail).toBeUndefined()
    })

    it('includes all challenge fields', async () => {
      const challenge = createMockChallenge('c1', { title: 'Custom Title' })
      await saveChallenge(challenge)

      const detail = await getChallengeDetail('c1')

      expect(detail?.title).toBe('Custom Title')
      expect(detail?.created_by).toBeDefined()
      expect(detail?.status).toBe('active')
    })
  })

  describe('saveChallengeProgress', () => {
    it('saves progress for a challenge', async () => {
      const challenge = createMockChallenge('c1', { target: 10000 })
      await saveChallenge(challenge)

      await saveChallengeProgress('c1', 'user1', 5000)

      const progress = await getChallengeProgress('c1', 'user1')
      expect(progress).toBeDefined()
      expect(progress?.current_value).toBe(5000)
    })

    it('marks progress as completed when target reached', async () => {
      const challenge = createMockChallenge('c1', { target: 10000 })
      await saveChallenge(challenge)

      await saveChallengeProgress('c1', 'user1', 10000)

      const progress = await getChallengeProgress('c1', 'user1')
      expect(progress?.completed).toBe(1)
      expect(progress?.completed_at).toBeDefined()
    })

    it('marks progress as incomplete when target not reached', async () => {
      const challenge = createMockChallenge('c1', { target: 10000 })
      await saveChallenge(challenge)

      await saveChallengeProgress('c1', 'user1', 5000)

      const progress = await getChallengeProgress('c1', 'user1')
      expect(progress?.completed).toBe(0)
    })

    it('updates progress on repeated calls', async () => {
      const challenge = createMockChallenge('c1', { target: 10000 })
      await saveChallenge(challenge)

      await saveChallengeProgress('c1', 'user1', 5000)
      await saveChallengeProgress('c1', 'user1', 7000)

      const progress = await getChallengeProgress('c1', 'user1')
      expect(progress?.current_value).toBe(7000)
    })
  })

  describe('getChallengeProgress', () => {
    it('returns progress for user and challenge', async () => {
      const challenge = createMockChallenge('c1')
      await saveChallenge(challenge)
      await saveChallengeProgress('c1', 'user1', 5000)

      const progress = await getChallengeProgress('c1', 'user1')

      expect(progress).toBeDefined()
      expect(progress?.challenge_id).toBe('c1')
      expect(progress?.user_id).toBe('user1')
    })

    it('returns undefined for non-existent progress', async () => {
      const progress = await getChallengeProgress('nonexistent', 'user1')
      expect(progress).toBeUndefined()
    })

    it('returns progress for different users separately', async () => {
      const challenge = createMockChallenge('c1')
      await saveChallenge(challenge)
      await saveChallengeProgress('c1', 'user1', 5000)
      await saveChallengeProgress('c1', 'user2', 7000)

      const progress1 = await getChallengeProgress('c1', 'user1')
      const progress2 = await getChallengeProgress('c1', 'user2')

      expect(progress1?.current_value).toBe(5000)
      expect(progress2?.current_value).toBe(7000)
    })
  })

  describe('getParticipants', () => {
    it('returns empty array for challenge with no participants', async () => {
      const challenge = createMockChallenge('c1')
      await saveChallenge(challenge)

      const participants = await getParticipants('c1')
      expect(participants).toEqual([])
    })

    it('returns user ids for challenge participants', async () => {
      const challenge = createMockChallenge('c1')
      await saveChallenge(challenge)
      await saveChallengeProgress('c1', 'user1', 5000)
      await saveChallengeProgress('c1', 'user2', 7000)

      const participants = await getParticipants('c1')

      expect(participants).toContain('user1')
      expect(participants).toContain('user2')
      expect(participants).toHaveLength(2)
    })

    it('returns unique participants', async () => {
      const challenge = createMockChallenge('c1')
      await saveChallenge(challenge)
      await saveChallengeProgress('c1', 'user1', 5000)
      await saveChallengeProgress('c1', 'user1', 7000) // Update same user

      const participants = await getParticipants('c1')

      expect(participants).toHaveLength(1)
      expect(participants[0]).toBe('user1')
    })
  })

  describe('clearChallengesTables', () => {
    it('clears all challenge data', async () => {
      const challenge = createMockChallenge('c1')
      await saveChallenge(challenge)
      await saveChallengeProgress('c1', 'user1', 5000)

      await clearChallengesTables()

      const challenges = await getChallenges()
      expect(challenges).toEqual([])
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
    ...overrides,
  }
}

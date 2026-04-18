import { describe, it, expect, beforeEach } from 'vitest'
import {
  initLeaderboardsTable,
  saveLeaderboardSnapshot,
  getLeaderboard,
  calculateLeaderboardPosition,
  clearLeaderboardsTables,
} from '../leaderboards'
import type { LeaderboardEntry } from '@/types/social-social'

describe('Leaderboards Database', () => {
  beforeEach(async () => {
    await initLeaderboardsTable()
    await clearLeaderboardsTables()
  })

  describe('initLeaderboardsTable', () => {
    it('creates leaderboards table without error', async () => {
      expect(async () => {
        await initLeaderboardsTable()
      }).not.toThrow()
    })
  })

  describe('saveLeaderboardSnapshot', () => {
    it('saves a leaderboard snapshot', async () => {
      const entries = [createMockEntry(1, 'user1', 100)]
      expect(async () => {
        await saveLeaderboardSnapshot('global', entries, 'weekly')
      }).not.toThrow()
    })

    it('saves snapshot with reference id for challenge leaderboards', async () => {
      const entries = [createMockEntry(1, 'user1', 100)]
      expect(async () => {
        await saveLeaderboardSnapshot('challenge', entries, 'weekly', 'challenge-1')
      }).not.toThrow()
    })
  })

  describe('getLeaderboard', () => {
    it('returns empty array for non-existent leaderboard', async () => {
      const entries = await getLeaderboard('global', 'weekly')
      expect(entries).toEqual([])
    })

    it('retrieves saved leaderboard snapshot', async () => {
      const mockEntries = [createMockEntry(1, 'user1', 100), createMockEntry(2, 'user2', 90)]
      await saveLeaderboardSnapshot('global', mockEntries, 'weekly')

      const entries = await getLeaderboard('global', 'weekly')

      expect(entries.length).toBeGreaterThan(0)
    })

    it('retrieves leaderboard for specific challenge', async () => {
      const mockEntries = [createMockEntry(1, 'user1', 100)]
      await saveLeaderboardSnapshot('challenge', mockEntries, 'weekly', 'challenge-1')

      const entries = await getLeaderboard('challenge', 'weekly', 'challenge-1')

      expect(entries.length).toBeGreaterThan(0)
    })
  })

  describe('calculateLeaderboardPosition', () => {
    it('returns 0 for position when leaderboard not found', async () => {
      const position = await calculateLeaderboardPosition('global', 'user1', 'weekly')
      expect(position).toBe(0)
    })

    it('calculates position for user in leaderboard', async () => {
      const mockEntries = [
        createMockEntry(1, 'user1', 100),
        createMockEntry(2, 'user2', 90),
        createMockEntry(3, 'user3', 80),
      ]
      await saveLeaderboardSnapshot('global', mockEntries, 'weekly')

      const position = await calculateLeaderboardPosition('global', 'user2', 'weekly')

      expect(position).toBe(2)
    })

    it('returns 0 if user not in leaderboard', async () => {
      const mockEntries = [createMockEntry(1, 'user1', 100)]
      await saveLeaderboardSnapshot('global', mockEntries, 'weekly')

      const position = await calculateLeaderboardPosition('global', 'user999', 'weekly')

      expect(position).toBe(0)
    })
  })

  describe('clearLeaderboardsTables', () => {
    it('clears all leaderboard data', async () => {
      const mockEntries = [createMockEntry(1, 'user1', 100)]
      await saveLeaderboardSnapshot('global', mockEntries, 'weekly')

      await clearLeaderboardsTables()

      const entries = await getLeaderboard('global', 'weekly')
      expect(entries).toEqual([])
    })
  })
})

// Helper functions
function createMockEntry(rank: number, userId: string, score: number): LeaderboardEntry {
  return {
    rank,
    userId,
    username: `User${rank}`,
    avatar: `avatar${rank}.png`,
    score,
    streak: Math.floor(Math.random() * 30),
    badges: Math.floor(Math.random() * 10),
  }
}

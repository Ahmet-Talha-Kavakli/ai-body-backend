import { describe, it, expect, beforeEach } from 'vitest'
import { useLeaderboardStore } from '../leaderboardStore'
import type { Leaderboard, LeaderboardEntry } from '@/types/social-social'

describe('LeaderboardStore', () => {
  beforeEach(() => {
    useLeaderboardStore.setState({
      global: null,
      friend: null,
      challenge: null,
      myRank: 0,
      period: 'weekly',
      loading: false,
    })
  })

  function getState() {
    return useLeaderboardStore.getState()
  }

  describe('State Initialization', () => {
    it('initializes with null leaderboards', () => {
      const state = getState()
      expect(state.global).toBeNull()
      expect(state.friend).toBeNull()
      expect(state.challenge).toBeNull()
    })

    it('initializes with myRank 0', () => {
      const state = getState()
      expect(state.myRank).toBe(0)
    })

    it('initializes with period weekly', () => {
      const state = getState()
      expect(state.period).toBe('weekly')
    })

    it('initializes with loading false', () => {
      const state = getState()
      expect(state.loading).toBe(false)
    })
  })

  describe('setGlobal', () => {
    it('sets global leaderboard', () => {
      const mockLeaderboard = createMockLeaderboard('global')
      getState().setGlobal(mockLeaderboard)

      expect(getState().global).toEqual(mockLeaderboard)
    })

    it('replaces existing global leaderboard', () => {
      const leaderboard1 = createMockLeaderboard('global', [
        createMockEntry(1, 'user1', 100),
      ])
      const leaderboard2 = createMockLeaderboard('global', [
        createMockEntry(1, 'user2', 150),
      ])

      getState().setGlobal(leaderboard1)
      getState().setGlobal(leaderboard2)

      expect(getState().global?.entries[0].userId).toBe('user2')
    })
  })

  describe('setFriend', () => {
    it('sets friend leaderboard', () => {
      const mockLeaderboard = createMockLeaderboard('friend')
      getState().setFriend(mockLeaderboard)

      expect(getState().friend).toEqual(mockLeaderboard)
    })
  })

  describe('setChallenge', () => {
    it('sets challenge leaderboard', () => {
      const mockLeaderboard = createMockLeaderboard('challenge', [], 'challenge-1')
      getState().setChallenge(mockLeaderboard)

      expect(getState().challenge).toEqual(mockLeaderboard)
    })
  })

  describe('setMyRank', () => {
    it('sets my rank', () => {
      getState().setMyRank(5)
      expect(getState().myRank).toBe(5)
    })

    it('updates my rank', () => {
      getState().setMyRank(5)
      getState().setMyRank(3)
      expect(getState().myRank).toBe(3)
    })
  })

  describe('setPeriod', () => {
    it('sets period to daily', () => {
      getState().setPeriod('daily')
      expect(getState().period).toBe('daily')
    })

    it('sets period to weekly', () => {
      getState().setPeriod('weekly')
      expect(getState().period).toBe('weekly')
    })

    it('sets period to monthly', () => {
      getState().setPeriod('monthly')
      expect(getState().period).toBe('monthly')
    })

    it('sets period to allTime', () => {
      getState().setPeriod('allTime')
      expect(getState().period).toBe('allTime')
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

  describe('getTopPlayers', () => {
    it('returns top N players', () => {
      const entries = [
        createMockEntry(1, 'user1', 100),
        createMockEntry(2, 'user2', 90),
        createMockEntry(3, 'user3', 80),
        createMockEntry(4, 'user4', 70),
      ]
      const leaderboard = createMockLeaderboard('global', entries)
      getState().setGlobal(leaderboard)

      const topPlayers = getState().getTopPlayers(3)

      expect(topPlayers).toHaveLength(3)
      expect(topPlayers[0].userId).toBe('user1')
      expect(topPlayers[1].userId).toBe('user2')
      expect(topPlayers[2].userId).toBe('user3')
    })

    it('returns all players if count exceeds available', () => {
      const entries = [
        createMockEntry(1, 'user1', 100),
        createMockEntry(2, 'user2', 90),
      ]
      const leaderboard = createMockLeaderboard('global', entries)
      getState().setGlobal(leaderboard)

      const topPlayers = getState().getTopPlayers(10)

      expect(topPlayers).toHaveLength(2)
    })

    it('returns empty array if no global leaderboard', () => {
      const topPlayers = getState().getTopPlayers(10)

      expect(topPlayers).toEqual([])
    })
  })

  describe('getMyRankInfo', () => {
    it('returns my rank information', () => {
      const entries = [
        createMockEntry(1, 'user1', 100),
        createMockEntry(2, 'user2', 90),
        createMockEntry(3, 'myUser', 80),
      ]
      const leaderboard = createMockLeaderboard('global', entries)
      getState().setGlobal(leaderboard)
      getState().setMyRank(3)

      const myRankInfo = getState().getMyRankInfo()

      expect(myRankInfo).toBeDefined()
      expect(myRankInfo?.userId).toBe('myUser')
      expect(myRankInfo?.rank).toBe(3)
      expect(myRankInfo?.score).toBe(80)
    })

    it('returns null if rank not found', () => {
      const entries = [
        createMockEntry(1, 'user1', 100),
        createMockEntry(2, 'user2', 90),
      ]
      const leaderboard = createMockLeaderboard('global', entries)
      getState().setGlobal(leaderboard)
      getState().setMyRank(99)

      const myRankInfo = getState().getMyRankInfo()

      expect(myRankInfo).toBeNull()
    })

    it('returns null if no global leaderboard', () => {
      getState().setMyRank(1)

      const myRankInfo = getState().getMyRankInfo()

      expect(myRankInfo).toBeNull()
    })
  })

  describe('maintains separate leaderboard types', () => {
    it('keeps global separate from friend', () => {
      const globalLeaderboard = createMockLeaderboard('global', [
        createMockEntry(1, 'global-user', 100),
      ])
      const friendLeaderboard = createMockLeaderboard('friend', [
        createMockEntry(1, 'friend-user', 95),
      ])

      getState().setGlobal(globalLeaderboard)
      getState().setFriend(friendLeaderboard)

      expect(getState().global?.entries[0].userId).toBe('global-user')
      expect(getState().friend?.entries[0].userId).toBe('friend-user')
    })

    it('keeps challenge separate from others', () => {
      const challengeLeaderboard = createMockLeaderboard('challenge', [
        createMockEntry(1, 'challenge-user', 85),
      ])
      const globalLeaderboard = createMockLeaderboard('global', [
        createMockEntry(1, 'global-user', 100),
      ])

      getState().setChallenge(challengeLeaderboard)
      getState().setGlobal(globalLeaderboard)

      expect(getState().challenge?.entries[0].userId).toBe('challenge-user')
      expect(getState().global?.entries[0].userId).toBe('global-user')
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

function createMockLeaderboard(
  type: 'global' | 'friend' | 'challenge',
  entries: LeaderboardEntry[] = [],
  referenceId?: string
): Leaderboard {
  const defaultEntries = entries.length
    ? entries
    : [
        createMockEntry(1, 'user1', 100),
        createMockEntry(2, 'user2', 90),
        createMockEntry(3, 'user3', 80),
      ]

  return {
    type,
    referenceId,
    period: 'weekly',
    entries: defaultEntries,
    lastUpdated: new Date().toISOString(),
  }
}

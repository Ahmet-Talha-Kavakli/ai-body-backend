import { create } from 'zustand'
import type { Leaderboard, LeaderboardEntry } from '@/types/social-social'

interface LeaderboardState {
  global: Leaderboard | null
  friend: Leaderboard | null
  challenge: Leaderboard | null
  myRank: number
  period: 'daily' | 'weekly' | 'monthly' | 'allTime'
  loading: boolean

  setGlobal: (leaderboard: Leaderboard) => void
  setFriend: (leaderboard: Leaderboard) => void
  setChallenge: (leaderboard: Leaderboard) => void
  setMyRank: (rank: number) => void
  setPeriod: (period: 'daily' | 'weekly' | 'monthly' | 'allTime') => void
  setLoading: (loading: boolean) => void

  getTopPlayers: (count: number) => LeaderboardEntry[]
  getMyRankInfo: () => LeaderboardEntry | null
}

export const useLeaderboardStore = create<LeaderboardState>((set, get) => ({
  global: null,
  friend: null,
  challenge: null,
  myRank: 0,
  period: 'weekly',
  loading: false,

  setGlobal: (leaderboard) => set({ global: leaderboard }),
  setFriend: (leaderboard) => set({ friend: leaderboard }),
  setChallenge: (leaderboard) => set({ challenge: leaderboard }),
  setMyRank: (rank) => set({ myRank: rank }),
  setPeriod: (period) => set({ period }),
  setLoading: (loading) => set({ loading }),

  getTopPlayers: (count) => {
    const { global } = get()
    return global?.entries.slice(0, count) || []
  },

  getMyRankInfo: () => {
    const { global, myRank } = get()
    return global?.entries.find((e) => e.rank === myRank) || null
  },
}))

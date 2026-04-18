import { create } from 'zustand'
import type { UserProfile, FriendRequest } from '../types/social'
import { searchFriends as searchFriendsService } from '../services/friendService'

interface FriendState {
  // State
  friends: UserProfile[]
  friendRequests: FriendRequest[]
  myProfile: UserProfile | null
  searchResults: UserProfile[]
  loading: boolean
  error: string | null

  // Actions
  setFriends: (friends: UserProfile[]) => void
  setFriendRequests: (requests: FriendRequest[]) => void
  setMyProfile: (profile: UserProfile) => void
  setSearchResults: (results: UserProfile[]) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void

  // Friend operations
  addFriend: (friend: UserProfile) => void
  removeFriend: (userId: string) => void
  isFriend: (userId: string) => boolean
  getFriendCount: () => number

  // Search
  searchFriends: (query: string) => Promise<void>
  clearSearchResults: () => void

  // Requests
  addFriendRequest: (request: FriendRequest) => void
  removeFriendRequest: (requestId: string) => void
  getFriendRequestCount: () => number
  hasPendingRequest: (fromUserId: string) => boolean
}

export const useFriendStore = create<FriendState>((set, get) => ({
  // Initial state
  friends: [],
  friendRequests: [],
  myProfile: null,
  searchResults: [],
  loading: false,
  error: null,

  // Setters
  setFriends: (friends) => set({ friends }),
  setFriendRequests: (requests) => set({ friendRequests: requests }),
  setMyProfile: (profile) => set({ myProfile: profile }),
  setSearchResults: (results) => set({ searchResults: results }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),

  // Friend operations
  addFriend: (friend) =>
    set((state) => ({
      friends: [...state.friends, friend],
      searchResults: state.searchResults.filter((f) => f.userId !== friend.userId),
    })),
  removeFriend: (userId) =>
    set((state) => ({
      friends: state.friends.filter((f) => f.userId !== userId),
    })),
  isFriend: (userId) => {
    const { friends } = get()
    return friends.some((f) => f.userId === userId)
  },
  getFriendCount: () => get().friends.length,

  // Search
  searchFriends: async (query) => {
    set({ loading: true, error: null })
    try {
      const results = await searchFriendsService(query)
      const userProfiles = results.map(
        (result) =>
          ({
            id: result.userId,
            userId: result.userId,
            username: result.username,
            avatar: result.avatar,
            bio: result.bio,
            stats: { totalWorkouts: 0, totalSteps: 0, totalCalories: 0, longestStreak: 0 },
            badges: [],
            createdAt: new Date().toISOString(),
          }) as UserProfile
      )
      set({ searchResults: userProfiles, loading: false })
    } catch (error) {
      set({ error: (error as Error).message, loading: false })
    }
  },
  clearSearchResults: () => set({ searchResults: [] }),

  // Friend requests
  addFriendRequest: (request) =>
    set((state) => ({
      friendRequests: [...state.friendRequests, request],
    })),
  removeFriendRequest: (requestId) =>
    set((state) => ({
      friendRequests: state.friendRequests.filter((r) => r.id !== requestId),
    })),
  getFriendRequestCount: () => get().friendRequests.length,
  hasPendingRequest: (fromUserId) => {
    const { friendRequests } = get()
    return friendRequests.some((r) => r.fromUserId === fromUserId && r.status === 'pending')
  },
}))

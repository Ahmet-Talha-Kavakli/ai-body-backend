export interface UserProfile {
  id: string
  userId: string
  username: string
  avatar: string
  bio: string
  stats: {
    totalWorkouts: number
    totalSteps: number
    totalCalories: number
    longestStreak: number
  }
  badges: string[]
  createdAt: string
}

export interface Friendship {
  id: string
  userId: string
  friendId: string
  status: 'pending' | 'accepted' | 'blocked'
  createdAt: string
}

export interface FriendRequest {
  id: string
  fromUserId: string
  toUserId: string
  status: 'pending' | 'accepted' | 'rejected'
  createdAt: string
}

export interface FriendListItem extends UserProfile {
  friendshipStatus: 'friend' | 'pending' | 'blocked'
}

export interface FriendSearchResult {
  userId: string
  username: string
  avatar: string
  bio: string
  isFriend: boolean
  pendingRequest?: boolean
}

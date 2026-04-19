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

export interface Nutrition {
  calories: number
  proteinG: number
  carbsG: number
  fatG: number
  fiberG: number
}

export interface SharedMeal {
  id: string
  mealLogId: string
  userId: string
  foodName: string
  photoUrl: string
  nutrition: Nutrition
  shareType: 'private' | 'friends' | 'team'
  sharedWith: {
    friendIds?: string[]
    teamId?: string
  }
  createdAt: string
  reactions?: Array<{
    userId: string
    type: 'like' | 'heart'
  }>
}

export interface SocialFeedItem {
  id: string
  userId: string
  userName: string
  userAvatar: string
  foodName: string
  photoUrl: string
  nutrition: Nutrition
  timestamp: string
  shareType: 'friends' | 'team'
  reactions: Array<{
    type: 'like' | 'heart'
    count: number
  }>
}

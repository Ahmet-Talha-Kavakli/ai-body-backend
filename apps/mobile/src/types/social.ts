export interface SharedMeal {
  id: string
  mealLogId: string
  userId: string
  foodName: string
  photoUrl: string
  nutrition: {
    calories: number
    proteinG: number
    carbsG: number
    fatG: number
    fiberG: number
  }
  shareType: 'private' | 'friends' | 'team'
  sharedWith: {
    friendIds?: string[]
    teamId?: string
  }
  createdAt: string
  reactions?: { userId: string; type: 'like' | 'heart' }[]
}

export interface SocialFeedItem {
  id: string
  userId: string
  userName: string
  userAvatar: string
  foodName: string
  photoUrl: string
  nutrition: {
    calories: number
    proteinG: number
    carbsG: number
    fatG: number
    fiberG: number
  }
  timestamp: string
  shareType: 'friends' | 'team'
  reactions: { type: 'like' | 'heart'; count: number }[]
}

export interface SocialFeedFilter {
  shareType?: 'friends' | 'team'
  userId?: string
  limit?: number
  offset?: number
}

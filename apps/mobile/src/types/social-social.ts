export interface LeaderboardEntry {
  rank: number
  userId: string
  username: string
  avatar: string
  score: number
  streak: number
  badges: number
}

export interface Leaderboard {
  type: 'global' | 'friend' | 'challenge'
  referenceId?: string
  period: 'daily' | 'weekly' | 'monthly' | 'allTime'
  entries: LeaderboardEntry[]
  lastUpdated: string
}

export interface Badge {
  id: string
  name: string
  description: string
  icon: string
  category: 'nutrition' | 'health' | 'workout' | 'social' | 'streak'
  criteria: { type: string; target: number }
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
}

export interface UserBadge {
  badgeId: string
  userId: string
  unlockedAt: string
  progress: number
}

export interface FeedItem {
  id: string
  userId: string
  type: 'badge_earned' | 'challenge_completed' | 'workout_shared' | 'nutrition_logged' | 'streak_milestone'
  data: Record<string, any>
  createdAt: string
  likes: number
  comments: FeedComment[]
}

export interface FeedComment {
  id: string
  userId: string
  text: string
  createdAt: string
}

export interface Notification {
  id: string
  userId: string
  type: 'friend_request' | 'challenge_invite' | 'friend_achievement' | 'leaderboard_change' | 'daily_summary'
  relatedUserId?: string
  relatedChallengeId?: string
  read: boolean
  createdAt: string
}

export interface StreakData {
  userId: string
  type: 'workout' | 'nutrition' | 'steps' | 'custom'
  currentStreak: number
  longestStreak: number
  lastActivityDate: string
}

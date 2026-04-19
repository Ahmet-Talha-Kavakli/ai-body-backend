export interface Team {
  id: string
  name: string
  description?: string
  avatar?: string
  createdById: string
  createdAt: string // ISO 8601
  memberCount: number // 2-10
  isActive: boolean
  stats?: TeamStatsSnapshot
}

export interface TeamMember {
  id: string
  teamId: string
  userId: string
  userName: string
  userAvatar?: string
  joinedAt: string // ISO 8601
  role: 'creator' | 'member'
  contribution: {
    workouts: number
    calories: number
    steps: number
    duration: number
  }
}

export interface TeamChallenge {
  id: string
  teamId: string
  type: 'workouts' | 'calories' | 'steps' | 'duration' | 'custom'
  title: string
  description?: string
  goal: number
  currentProgress: number
  deadline: string // ISO 8601
  status: 'active' | 'completed' | 'failed'
  createdAt: string
  completedAt?: string
  rewards?: {
    badge?: string
    points?: number
  }
}

export interface TeamStatsSnapshot {
  id: string
  teamId: string
  snapshotDate: string // ISO 8601
  totalWorkouts: number
  totalCalories: number
  totalSteps: number
  totalDuration: number // minutes
  memberBreakdown: { [userId: string]: number }
}

export interface TeamAchievement {
  id: string
  teamId: string
  type: 'first_team' | 'ten_workouts' | 'milestone_calories' | 'milestone_steps'
  title: string
  description: string
  unlockedAt: string
  badge?: string
}

export interface TeamNotification {
  id: string
  teamId: string
  type: 'member_joined' | 'challenge_completed' | 'milestone_reached' | 'member_left'
  title: string
  message: string
  createdAt: string
  read: boolean
}

export interface TeamSyncQueueItem {
  id: string
  action: 'create_team' | 'invite_member' | 'create_challenge' | 'complete_challenge'
  data: Record<string, any>
  status: 'pending' | 'synced' | 'failed'
  retryCount: number
  createdAt: string
}

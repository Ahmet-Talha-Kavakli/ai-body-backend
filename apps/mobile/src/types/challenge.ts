export interface Challenge {
  id: string
  createdBy: string
  title: string
  description: string
  type: 'steps' | 'calories' | 'workout' | 'nutrition' | 'custom'
  target: number
  duration: 'daily' | 'weekly' | '30day' | 'custom'
  startDate: string
  endDate: string
  participants: string[]
  status: 'active' | 'completed' | 'cancelled'
  createdAt: string
}

export interface ChallengeProgress {
  challengeId: string
  userId: string
  currentValue: number
  completed: boolean
  completedAt?: string
}

export interface ChallengeWithProgress {
  challenge: Challenge
  progress: ChallengeProgress
  participantCount: number
  yourRank?: number
}

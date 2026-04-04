import type { ID, Timestamp } from './common'

export interface AIConversation {
  id: ID
  userId: ID
  context: AIConversationContext
  messages: AIMessage[]
  createdAt: Timestamp
  updatedAt: Timestamp
}

export type AIConversationContext =
  | 'program_generation'
  | 'workout_coaching'
  | 'nutrition_advice'
  | 'health_assessment'
  | 'general_coaching'

export interface AIMessage {
  id: ID
  conversationId: ID
  role: 'user' | 'assistant'
  content: string
  createdAt: Timestamp
  metadata?: Record<string, unknown>
}

export interface AIProgramGenerationRequest {
  userId: ID
  healthProfileId: ID
  injuryIds: ID[]
  preferences: {
    daysPerWeek: number
    sessionDurationMinutes: number
    availableEquipment: string[]
    specificGoals?: string
  }
}

export interface AICoachingFrame {
  sessionId: ID
  exerciseId: ID
  poseScore: number
  repCount: number
  currentIssues: string[]
  heartRateBpm?: number
  elapsedSeconds: number
}

export interface AICoachingResponse {
  message: string
  urgency: 'info' | 'correction' | 'encouragement' | 'warning'
  adjustIntensity?: 'increase' | 'decrease' | null
}

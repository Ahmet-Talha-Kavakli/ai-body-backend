/**
 * Core types for session recording, form analysis, and avatar management
 */

// Form Analysis
export interface FormError {
  bodyPart: string
  severity: 'low' | 'medium' | 'high'
  cue: string
  timestamp: number
}

export interface FormAnalysisResult {
  exercise: string
  formScore: number // 0-100
  repNumber: number
  timestamp: number
  errors: FormError[]
  muscleEngagement: Record<string, number> // {quadriceps: 0.85}
  depthAssessment: 'full' | 'partial' | 'shallow'
  stabilityScore: number // 0-1
  confidence: number // 0-1, model confidence
}

// Session Recording
export interface SessionFrame {
  timestamp: number
  exercise: string
  formScore: number
  repNumber: number
  errors: FormError[]
  muscleEngagement: Record<string, number>
}

export interface SessionRecord {
  id: string
  userId: string
  exercise: string
  startTime: Date
  endTime: Date
  totalReps: number
  avgFormScore: number
  frames: SessionFrame[]
  voiceFeedback: string[]
  syncStatus: 'pending' | 'synced' | 'failed'
}

// Avatar
export interface AvatarState {
  userId: string
  gender: 'male' | 'female'
  startingWeight: number // kg
  currentWeight: number // kg
  skinTone: 'light' | 'medium' | 'dark' | 'very-dark' | 'olive'
  lastUpdated: Date
}

// Voice Coach
export interface VoiceCoachConfig {
  apiKey: string
  assistantId: string
  language: 'tr' | 'en'
  timeout: number // 4000ms
  enableFallback: boolean
}

export interface VoiceMessage {
  id: string
  text: string
  type: 'feedback' | 'encouragement' | 'correction'
  timestamp: number
  played: boolean
}

// Sync
export interface SyncQueueItem {
  id: string
  sessionId: string
  status: 'pending' | 'syncing' | 'synced' | 'failed'
  retryCount: number
  lastError?: string
  nextRetryAt?: Date
}

export interface SyncConflict {
  sessionIdLocal: string
  sessionIdServer: string
  reason: 'duplicate' | 'partial-upload' | 'contradiction'
  resolutionStrategy: 'local-wins' | 'server-wins' | 'merge'
  metadata: Record<string, any>
}

// Session Configuration
export interface SessionConfig {
  userId: string
  exercise: string
  db: any // SQLite Database instance
  voiceCoachConfig?: VoiceCoachConfig
}

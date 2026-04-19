/**
 * Coaching Types - Live coaching session types and related data structures
 */

/**
 * Coach profile information
 */
export interface Coach {
  id: string
  name: string
  avatar?: string
  specializations: ('strength' | 'cardio' | 'nutrition' | 'mobility')[]
  certifications: string[]
  rating: number // 0-5
  reviewCount: number
  hourlyRate: number
  bio: string
  availability: {
    dayOfWeek: number // 0-6 (Sunday-Saturday)
    startTime: string // HH:MM format
    endTime: string // HH:MM format
    timezone: string // IANA timezone
  }[]
  verified: boolean
}

/**
 * Active or completed coaching session
 */
export interface CoachingSession {
  id: string
  userId: string
  coachId: string
  coach: Coach
  type: 'scheduled' | 'ondemand'
  scheduledAt?: string // ISO 8601, when session is booked for
  startedAt?: string // ISO 8601, when session actually started
  endedAt?: string // ISO 8601, when session ended
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'
  agoraChannel: string // coaching-session-{sessionId}
  agoraUserToken: string
  agoraCoachToken: string
  coachNotes?: string // text coach typed during session
  formScores?: { exercise: string; score: number }[] // avg form score per exercise
  recordingUrl?: string
  recordingConsent: boolean
  createdAt?: string // ISO 8601
}

/**
 * Post-session coaching program with exercises and recommendations
 */
export interface CoachingProgram {
  id: string
  userId: string
  coachId: string
  sessionId: string
  exercises: {
    name: string
    sets: number
    reps: number
    weight?: number
    formTips: string[]
    progression?: string
  }[]
  nutritionNotes?: string
  recoveryTips?: string
  nextSessionRecommendation?: string
  createdAt: string // ISO 8601
}

/**
 * Real-time form analysis frame during coaching session
 */
export interface FormAnalysisFrame {
  timestamp: number // ms since session start
  pose: {
    keypoint: string
    x: number
    y: number
    confidence: number
  }[]
  formScore: number // 0-100
  feedback: string[]
  repCount?: number
}

/**
 * Coaching rating and review
 */
export interface CoachRating {
  id: string
  userId: string
  coachId: string
  rating: number // 1-5
  review?: string
  sessionId?: string // optional link to session that prompted rating
  createdAt: string // ISO 8601
}

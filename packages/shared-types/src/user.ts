import type { FitnessGoal, FitnessLevel, Gender, ID, Timestamp } from './common'

export interface User {
  id: ID
  clerkId: string
  email: string
  name: string
  avatarUrl?: string
  createdAt: Timestamp
  updatedAt: Timestamp
  subscriptionTier: SubscriptionTier
}

export type SubscriptionTier = 'free' | 'pro' | 'elite'

export interface HealthProfile {
  id: ID
  userId: ID
  age: number
  gender: Gender
  heightCm: number
  weightKg: number
  fitnessLevel: FitnessLevel
  goals: FitnessGoal[]
  availableDaysPerWeek: number
  sessionDurationMinutes: number
  updatedAt: Timestamp
}

export interface Injury {
  id: ID
  userId: ID
  bodyPart: string
  severity: 'mild' | 'moderate' | 'severe'
  description: string
  isActive: boolean
  createdAt: Timestamp
}

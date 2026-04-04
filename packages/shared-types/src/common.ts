export type ID = string

export type Timestamp = string // ISO 8601

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}

export interface ApiResponse<T> {
  data: T
  success: boolean
  message?: string
}

export interface ApiError {
  code: string
  message: string
  statusCode: number
}

export type FitnessGoal =
  | 'weight_loss'
  | 'muscle_gain'
  | 'endurance'
  | 'flexibility'
  | 'general_fitness'
  | 'sport_specific'

export type FitnessLevel = 'beginner' | 'intermediate' | 'advanced' | 'elite'

export type Gender = 'male' | 'female' | 'other' | 'prefer_not_to_say'

export type EquipmentType =
  | 'barbell'
  | 'dumbbell'
  | 'kettlebell'
  | 'resistance_band'
  | 'cable_machine'
  | 'smith_machine'
  | 'pull_up_bar'
  | 'bench'
  | 'treadmill'
  | 'rowing_machine'
  | 'bike'
  | 'bodyweight'

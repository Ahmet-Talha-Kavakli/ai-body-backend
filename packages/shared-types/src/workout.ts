import type { EquipmentType, FitnessLevel, ID, Timestamp } from './common'

export type MuscleGroup =
  | 'chest'
  | 'back'
  | 'shoulders'
  | 'biceps'
  | 'triceps'
  | 'forearms'
  | 'core'
  | 'glutes'
  | 'quads'
  | 'hamstrings'
  | 'calves'
  | 'full_body'

export interface Exercise {
  id: ID
  name: string
  slug: string
  description: string
  muscleGroups: MuscleGroup[]
  equipment: EquipmentType[]
  difficultyLevel: FitnessLevel
  videoUrl?: string
  thumbnailUrl?: string
  animationKey: string // maps to 3D character animation
  cues: string[] // coaching cues
  commonMistakes: string[]
  poseKeypoints?: PoseKeypointConfig
}

export interface PoseKeypointConfig {
  keyJoints: string[] // MediaPipe landmark names
  angleThresholds: Record<string, { min: number; max: number }>
  repDetectionJoint: string
  repThreshold: number
}

export interface WorkoutProgram {
  id: ID
  userId: ID
  name: string
  description: string
  generatedByAi: boolean
  aiVersion?: string
  weeks: ProgramWeek[]
  createdAt: Timestamp
  updatedAt: Timestamp
  isActive: boolean
}

export interface ProgramWeek {
  id: ID
  programId: ID
  weekNumber: number
  days: ProgramDay[]
}

export interface ProgramDay {
  id: ID
  weekId: ID
  dayNumber: number
  name: string
  exercises: PlannedExercise[]
  estimatedDurationMinutes: number
  notes?: string
}

export interface PlannedExercise {
  id: ID
  exerciseId: ID
  exercise?: Exercise
  sets: number
  reps?: number
  durationSeconds?: number
  restSeconds: number
  rpe?: number // 1-10 rate of perceived exertion
  notes?: string
  order: number
}

export interface WorkoutSession {
  id: ID
  userId: ID
  programDayId?: ID
  startedAt: Timestamp
  endedAt?: Timestamp
  durationSeconds?: number
  completedSets: CompletedSet[]
  poseAnalyses: PoseAnalysisSummary[]
  heartRateData?: HeartRateReading[]
  overallFormScore?: number // 0-100
  caloriesBurned?: number
  notes?: string
}

export interface CompletedSet {
  id: ID
  sessionId: ID
  exerciseId: ID
  setNumber: number
  reps?: number
  weightKg?: number
  durationSeconds?: number
  formScore: number // 0-100
  repData: RepData[]
}

export interface RepData {
  repNumber: number
  durationMs: number
  formScore: number
  feedback: string[]
}

export interface PoseAnalysisSummary {
  exerciseId: ID
  avgFormScore: number
  topIssues: string[]
  repCount: number
}

export interface HeartRateReading {
  timestamp: Timestamp
  bpm: number
  zone: HeartRateZone
}

export type HeartRateZone = 'rest' | 'warmup' | 'fat_burn' | 'cardio' | 'peak'

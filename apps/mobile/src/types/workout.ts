/**
 * Workout Session and Program Types
 */

export interface WorkoutSession {
  id: string
  userId: string
  programId: string
  dayId: string
  startedAt: number
  endedAt?: number
  status: 'active' | 'paused' | 'completed' | 'abandoned'
  completedExercises: string[] // Exercise IDs
  currentExerciseId?: string
  notes?: string
}

export interface CompletedSet {
  exerciseId: string
  setNumber: number
  reps: number
  weight?: number
  duration?: number // For timed exercises
  rir?: number // Reps in reserve
  formScore?: number // 0-100
  videoId?: string
}

export interface FormRepData {
  repNumber: number
  keypoints: Keypoint[]
  angles: AngleData[]
  timestamp: number
  videoFrame?: string // Base64 or video URL
}

export interface Keypoint {
  name: string
  x: number
  y: number
  z?: number
  confidence: number
}

export interface AngleData {
  name: string // e.g., "leftKneeAngle"
  angle: number // Degrees
  isViolation?: boolean
  severity?: 'low' | 'medium' | 'high'
}

export interface FormError {
  type: 'angle' | 'position' | 'stability' | 'range'
  exerciseId: string
  repNumber: number
  severity: 'low' | 'medium' | 'high'
  message: string
  recommendation?: string
  affectedJoints?: string[]
}

export interface WorkoutProgram {
  id: string
  userId: string
  name: string
  description?: string
  goal: 'strength' | 'hypertrophy' | 'endurance' | 'weight-loss'
  weeks: ProgramWeek[]
  createdAt: number
  updatedAt: number
  isActive: boolean
}

export interface ProgramWeek {
  weekNumber: number
  days: ProgramDay[]
}

export interface ProgramDay {
  dayId: string
  dayNumber: number
  name: string
  focusAreas: string[]
  exercises: PlannedExercise[]
  restDay?: boolean
}

export interface PlannedExercise {
  exerciseId: string
  exerciseName: string
  sets: number
  reps: number | string // Can be range like "8-12"
  weight?: number
  restPeriod?: number // Seconds
  notes?: string
  formAnalysisEnabled: boolean
}

/**
 * Exercise and Form Rule Types
 */

export interface Exercise {
  id: string
  name: string
  category: string
  description?: string
  instructions?: string[]
  videoUrl?: string
  primaryMuscles: string[]
  secondaryMuscles?: string[]
  equipment?: string[]
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  formRules: FormRule[]
  poseConfig: PoseConfig
  defaultSets?: number
  defaultReps?: number
  createdAt: number
  updatedAt: number
}

export interface FormRule {
  id: string
  name: string
  description: string
  type: 'angle' | 'position' | 'stability' | 'range'
  severity: 'low' | 'medium' | 'high'
  condition: string // Human-readable condition
  angleConstraints?: {
    joint: string
    min?: number
    max?: number
    ideal?: number
  }
  positionConstraints?: {
    bodyPart: string
    position: string
  }
  stabilityConstraints?: {
    region: string
    maxDeviation: number // Pixels or degrees
  }
}

export interface PoseConfig {
  requiredKeypoints: string[] // List of MediaPipe keypoints needed
  bodyPositions: BodyPosition[]
  referenceAngles: Record<string, number> // Joint angles at neutral position
  symmetryCheck?: boolean
  stabilityThreshold?: number // 0-1
}

export interface BodyPosition {
  name: string
  keypoints: string[]
  alignment: 'vertical' | 'horizontal' | 'diagonal'
  tolerance?: number // Degrees
}

export interface ExerciseLibrary {
  exercises: Exercise[]
  lastUpdated: number
  version: string
}

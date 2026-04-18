/**
 * Form Analysis and Pose Detection Types
 */

export interface FormAnalysisResult {
  exerciseId: string
  repNumber: number
  timestamp: number
  overallScore: number // 0-100
  violations: FormViolation[]
  feedback: FeedbackMessage[]
  muscleEngagement: MuscleEngagement[]
  metrics: FormMetrics
}

export interface FormViolation {
  ruleId: string
  ruleName: string
  severity: 'low' | 'medium' | 'high'
  detectedValue: number
  expectedRange: { min: number; max: number }
  affectedJoints?: string[]
  frame?: number
  confidence: number
}

export interface FeedbackMessage {
  type: 'correction' | 'positive' | 'warning'
  message: string
  actionItems?: string[]
  priority: number // 1-10, 10 is highest priority
}

export interface MuscleEngagement {
  muscleName: string
  engagementLevel: number // 0-100
  expected: number
  feedback?: string
}

export interface FormMetrics {
  rangeOfMotion: Record<string, number> // Joint -> degrees
  stability: Record<string, number> // Body part -> stability score
  symmetry?: number // 0-100 for bilateral exercises
  tempo?: {
    eccentric: number // milliseconds
    concentric: number // milliseconds
    isometric?: number
  }
  totalRepTime: number
}

export interface PoseAnalysisPipeline {
  frameBuffer: FormRepData[]
  currentFrame: NormalizedKeypoint[]
  angles: AngleExtraction
  ruleEvaluation: RuleEvaluation[]
}

export interface FormRepData {
  repNumber: number
  keypoints: Keypoint[]
  angles: AngleData[]
  timestamp: number
  videoFrame?: string
}

export interface Keypoint {
  name: string
  x: number
  y: number
  z?: number
  confidence: number
}

export interface AngleData {
  name: string
  angle: number
  isViolation?: boolean
  severity?: 'low' | 'medium' | 'high'
}

export interface NormalizedKeypoint {
  name: string
  x: number
  y: number
  z?: number
  confidence: number
  normalized: boolean
}

export interface AngleExtraction {
  joints: Record<string, number> // Joint name -> angle in degrees
  timestamp: number
  isValid: boolean
}

export interface RuleEvaluation {
  ruleId: string
  ruleName: string
  passed: boolean
  severity: 'low' | 'medium' | 'high'
  detectedValue?: number
  expectedRange?: { min: number; max: number }
  confidence: number
}

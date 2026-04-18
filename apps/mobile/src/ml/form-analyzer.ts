/**
 * Form Analysis Engine
 * Analyzes exercise form by evaluating keypoints against form rules
 * Generates scores and feedback for real-time coaching
 */

import {
  FormAnalysisResult,
  FormViolation,
  FeedbackMessage,
  MuscleEngagement,
  FormMetrics,
  Keypoint,
} from '../types/form-analysis'
import { getFormRulesForExercise } from '../utils/form-rules'
import { calculateJointAngle, calculateDistance } from './pose-extractor'

export class FormAnalyzer {
  exerciseType: string
  frameBuffer: Keypoint[][] = []
  private maxBufferSize = 30 // Store up to 30 frames for analysis

  constructor(exerciseType: string) {
    this.exerciseType = exerciseType
  }

  /**
   * Analyze a single rep based on current frame keypoints
   * @param keypoints Current frame keypoints from MediaPipe
   * @param repNumber The rep number being analyzed
   * @param exerciseId The exercise ID
   * @returns FormAnalysisResult with scores and feedback
   */
  analyzeRep(keypoints: Keypoint[], repNumber: number, exerciseId: string): FormAnalysisResult {
    // Add frame to buffer
    this.frameBuffer.push(keypoints)
    if (this.frameBuffer.length > this.maxBufferSize) {
      this.frameBuffer.shift()
    }

    // Get form rules for this exercise
    const formRules = getFormRulesForExercise(exerciseId)

    // Evaluate each rule
    const violations: FormViolation[] = []
    for (const rule of formRules) {
      const evaluation = rule.evaluate(keypoints)

      if (!evaluation.passed) {
        violations.push({
          ruleId: rule.id,
          ruleName: rule.name,
          severity: rule.severity,
          detectedValue: evaluation.detectedValue || 0,
          expectedRange: evaluation.expectedRange || { min: 0, max: 100 },
          confidence: evaluation.confidence,
        })
      }
    }

    // Calculate overall score
    const overallScore = this.calculateOverallScore(violations, formRules)

    // Generate feedback messages
    const feedback = this.generateFeedback(violations, overallScore)

    // Calculate muscle engagement
    const muscleEngagement = this.calculateMuscleEngagement(exerciseId, violations)

    // Calculate metrics
    const metrics = this.calculateMetrics(keypoints)

    return {
      exerciseId,
      repNumber,
      timestamp: Date.now(),
      overallScore,
      violations,
      feedback,
      muscleEngagement,
      metrics,
    }
  }

  /**
   * Calculate overall form score (0-100)
   * Weighted by violation severity
   */
  private calculateOverallScore(
    violations: FormViolation[],
    totalRules: { severity: string }[]
  ): number {
    if (violations.length === 0) {
      return 100
    }

    // Calculate severity weights
    let violationScore = 0

    for (const violation of violations) {
      const severityWeight =
        violation.severity === 'high' ? 15 : violation.severity === 'medium' ? 10 : 5
      violationScore += severityWeight
    }

    // Maximum possible penalty = sum of all rule severities
    const maxPenalty = totalRules.reduce((acc, rule) => {
      const weight = rule.severity === 'high' ? 15 : rule.severity === 'medium' ? 10 : 5
      return acc + weight
    }, 0)

    const baseScore = Math.max(0, 100 - (violationScore / maxPenalty) * 100)

    // Add slight boost based on confidence
    const avgConfidence =
      violations.length > 0
        ? violations.reduce((acc, v) => acc + v.confidence, 0) / violations.length
        : 1

    return Math.round(baseScore * (0.95 + avgConfidence * 0.05))
  }

  /**
   * Generate feedback messages from violations
   */
  private generateFeedback(violations: FormViolation[], score: number): FeedbackMessage[] {
    const feedback: FeedbackMessage[] = []

    // Sort by severity
    const sortedViolations = [...violations].sort((a, b) => {
      const severityOrder = { high: 3, medium: 2, low: 1 }
      return (
        severityOrder[b.severity as keyof typeof severityOrder] -
        severityOrder[a.severity as keyof typeof severityOrder]
      )
    })

    // Add top 3 violations as feedback
    for (let i = 0; i < Math.min(3, sortedViolations.length); i++) {
      const violation = sortedViolations[i]

      feedback.push({
        type: 'correction',
        message: this.getViolationMessage(violation),
        priority: 10 - i * 3,
        actionItems: this.getActionItems(violation),
      })
    }

    // Add positive feedback if score is good
    if (score > 85 && violations.length <= 1) {
      feedback.push({
        type: 'positive',
        message: 'Great form! Keep it up.',
        priority: 5,
      })
    }

    return feedback
  }

  /**
   * Get human-readable message for a violation
   */
  private getViolationMessage(violation: FormViolation): string {
    const { ruleName, severity } = violation

    if (severity === 'high') {
      return `Critical: ${ruleName} - Correct immediately`
    } else if (severity === 'medium') {
      return `Caution: ${ruleName} - Review form`
    } else {
      return `Note: ${ruleName} - Minor adjustment needed`
    }
  }

  /**
   * Get action items for a violation
   */
  private getActionItems(violation: FormViolation): string[] {
    const { ruleId, detectedValue, expectedRange } = violation

    const actionMap: Record<string, (val: number, range: any) => string[]> = {
      knee_over_toe: () => [
        'Keep knee over ankle',
        'Do not let knee extend past toes',
        'Sit back more in the squat',
      ],
      knee_angle_range: () => ['Squat deeper', 'Achieve 60-100 degree knee angle'],
      back_angle: () => ['Maintain forward lean', 'Keep chest up', 'Lean forward 30-50 degrees'],
      symmetry: () => ['Balance weight equally', 'Avoid favoring one side', 'Keep hips level'],
      elbow_angle: () => ['Control descent', 'Keep elbows at 45-90 degrees'],
      shoulder_alignment: () => ['Keep shoulders level', 'Avoid shoulder shrug'],
      wrist_alignment: () => ['Keep wrists straight', 'Wrist directly above elbow'],
      elbow_symmetry: () => ['Balance both arms', 'Equal elbow angle on both sides'],
      back_extension: () => ['Full lockout', 'Extend back fully at top'],
      knee_angle_setup: () => ['Proper setup position', 'Knees at 80-100 degrees'],
      neutral_spine: () => ['Keep spine neutral', 'Avoid rounding back'],
    }

    if (actionMap[ruleId]) {
      return actionMap[ruleId](detectedValue || 0, expectedRange)
    }

    return ['Correct this form issue']
  }

  /**
   * Calculate muscle engagement levels
   */
  private calculateMuscleEngagement(
    exerciseId: string,
    violations: FormViolation[]
  ): MuscleEngagement[] {
    const exerciseId_lower = exerciseId.toLowerCase()

    const muscleMap: Record<string, { expected: number; muscles: string[] }> = {
      squat: {
        expected: 85,
        muscles: ['Quadriceps', 'Glutes', 'Hamstrings', 'Core'],
      },
      benchpress: {
        expected: 85,
        muscles: ['Pectorals', 'Triceps', 'Front Deltoids', 'Core'],
      },
      bench: {
        expected: 85,
        muscles: ['Pectorals', 'Triceps', 'Front Deltoids', 'Core'],
      },
      deadlift: {
        expected: 90,
        muscles: ['Glutes', 'Hamstrings', 'Back', 'Core'],
      },
    }

    const exerciseData = muscleMap[exerciseId_lower] || muscleMap.squat

    // Reduce engagement if there are violations
    const engagementReduction = violations.length * 5

    return exerciseData.muscles.map((muscle) => ({
      muscleName: muscle,
      engagementLevel: Math.max(60, exerciseData.expected - engagementReduction),
      expected: exerciseData.expected,
      feedback:
        engagementReduction > 0
          ? `${muscle} may not be properly engaged due to form issues`
          : undefined,
    }))
  }

  /**
   * Calculate form metrics (ROM, stability, tempo, etc.)
   */
  private calculateMetrics(keypoints: Keypoint[]): FormMetrics {
    // Calculate range of motion
    const rangeOfMotion = this.calculateRangeOfMotion(keypoints)

    // Calculate stability (based on how consistent keypoints are across frames)
    const stability = this.calculateStability()

    // Calculate total rep time (based on frame buffer)
    const totalRepTime = this.frameBuffer.length * (1000 / 30) // 30 FPS assumption

    // Calculate symmetry
    const symmetry = this.calculateSymmetry(keypoints)

    return {
      rangeOfMotion,
      stability,
      symmetry,
      totalRepTime,
    }
  }

  /**
   * Calculate range of motion for key joints
   */
  private calculateRangeOfMotion(keypoints: Keypoint[]): Record<string, number> {
    const rom: Record<string, number> = {}

    // Left knee ROM
    const leftHip = keypoints.find((k) => k.name === 'leftHip')
    const leftKnee = keypoints.find((k) => k.name === 'leftKnee')
    const leftAnkle = keypoints.find((k) => k.name === 'leftAnkle')

    if (leftHip && leftKnee && leftAnkle) {
      rom.leftKnee = calculateJointAngle(leftHip, leftKnee, leftAnkle)
    }

    // Right knee ROM
    const rightHip = keypoints.find((k) => k.name === 'rightHip')
    const rightKnee = keypoints.find((k) => k.name === 'rightKnee')
    const rightAnkle = keypoints.find((k) => k.name === 'rightAnkle')

    if (rightHip && rightKnee && rightAnkle) {
      rom.rightKnee = calculateJointAngle(rightHip, rightKnee, rightAnkle)
    }

    // Left elbow ROM
    const leftShoulder = keypoints.find((k) => k.name === 'leftShoulder')
    const leftElbow = keypoints.find((k) => k.name === 'leftElbow')
    const leftWrist = keypoints.find((k) => k.name === 'leftWrist')

    if (leftShoulder && leftElbow && leftWrist) {
      rom.leftElbow = calculateJointAngle(leftShoulder, leftElbow, leftWrist)
    }

    // Right elbow ROM
    const rightShoulder = keypoints.find((k) => k.name === 'rightShoulder')
    const rightElbow = keypoints.find((k) => k.name === 'rightElbow')
    const rightWrist = keypoints.find((k) => k.name === 'rightWrist')

    if (rightShoulder && rightElbow && rightWrist) {
      rom.rightElbow = calculateJointAngle(rightShoulder, rightElbow, rightWrist)
    }

    return rom
  }

  /**
   * Calculate stability (how much keypoints vary across frames)
   */
  private calculateStability(): Record<string, number> {
    const stability: Record<string, number> = {
      overall: 85,
      lower_body: 85,
      upper_body: 85,
    }

    if (this.frameBuffer.length < 2) {
      return stability
    }

    // Simple stability metric: deviation in keypoint positions
    let totalDeviation = 0

    for (let i = 1; i < this.frameBuffer.length; i++) {
      const prevFrame = this.frameBuffer[i - 1]
      const currFrame = this.frameBuffer[i]

      for (const kp of currFrame) {
        const prevKp = prevFrame.find((k) => k.name === kp.name)
        if (prevKp) {
          totalDeviation += calculateDistance(prevKp, kp)
        }
      }
    }

    const avgDeviation = totalDeviation / this.frameBuffer.length
    const stabilityScore = Math.max(0, 100 - avgDeviation * 2)

    return {
      overall: Math.round(stabilityScore),
      lower_body: Math.round(stabilityScore),
      upper_body: Math.round(stabilityScore),
    }
  }

  /**
   * Calculate symmetry score (left vs right)
   */
  private calculateSymmetry(keypoints: Keypoint[]): number {
    const leftHip = keypoints.find((k) => k.name === 'leftHip')
    const rightHip = keypoints.find((k) => k.name === 'rightHip')
    const leftKnee = keypoints.find((k) => k.name === 'leftKnee')
    const rightKnee = keypoints.find((k) => k.name === 'rightKnee')

    if (!leftHip || !rightHip || !leftKnee || !rightKnee) {
      return 85
    }

    // Calculate hip symmetry
    const hipDiff = Math.abs(leftHip.y - rightHip.y)

    // Calculate knee symmetry
    const kneeDiff = Math.abs(leftKnee.y - rightKnee.y)

    const totalDiff = hipDiff + kneeDiff
    const symmetryScore = Math.max(0, 100 - totalDiff)

    return Math.round(symmetryScore)
  }

  /**
   * Clear frame buffer (call at end of set)
   */
  clearFrameBuffer(): void {
    this.frameBuffer = []
  }
}

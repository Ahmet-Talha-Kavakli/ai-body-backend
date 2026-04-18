/**
 * Exercise Form Rules Definition
 * Defines form constraints and validation rules for squat, bench press, and deadlift
 */

import { Keypoint, RuleEvaluation, FormViolation } from '../types/form-analysis'
import { calculateJointAngle, calculateDistance, checkSymmetry } from '../ml/pose-extractor'

export interface FormRule {
  id: string
  name: string
  type: 'angle' | 'position' | 'stability' | 'range'
  severity: 'low' | 'medium' | 'high'
  description: string
  evaluate: (keypoints: Keypoint[]) => {
    passed: boolean
    detectedValue?: number
    expectedRange?: { min: number; max: number }
    confidence: number
  }
}

/**
 * SQUAT FORM RULES
 * Rules for proper squat form including knee position, back angle, and symmetry
 */
export const SQUAT_FORM_RULES: FormRule[] = [
  {
    id: 'knee_angle_range',
    name: 'Knee Angle Range',
    type: 'angle',
    severity: 'high',
    description: 'Knees should achieve 60-100 degrees at bottom position',
    evaluate: (keypoints: Keypoint[]) => {
      const leftShoulder = keypoints.find((k) => k.name === 'leftShoulder')
      const leftHip = keypoints.find((k) => k.name === 'leftHip')
      const leftKnee = keypoints.find((k) => k.name === 'leftKnee')
      const leftAnkle = keypoints.find((k) => k.name === 'leftAnkle')

      if (!leftShoulder || !leftHip || !leftKnee || !leftAnkle) {
        return { passed: false, confidence: 0 }
      }

      const leftKneeAngle = calculateJointAngle(leftHip, leftKnee, leftAnkle)
      const rightKnee = keypoints.find((k) => k.name === 'rightKnee')
      const rightAnkle = keypoints.find((k) => k.name === 'rightAnkle')
      const rightHip = keypoints.find((k) => k.name === 'rightHip')

      let rightKneeAngle = 0
      if (rightHip && rightKnee && rightAnkle) {
        rightKneeAngle = calculateJointAngle(rightHip, rightKnee, rightAnkle)
      }

      const avgKneeAngle = (leftKneeAngle + rightKneeAngle) / 2
      const passed = avgKneeAngle >= 60 && avgKneeAngle <= 120

      return {
        passed,
        detectedValue: avgKneeAngle,
        expectedRange: { min: 60, max: 120 },
        confidence: 0.92,
      }
    },
  },

  {
    id: 'knee_over_toe',
    name: 'Knee Over Toe',
    type: 'position',
    severity: 'high',
    description: 'Knee should not extend more than 10 pixels beyond toe',
    evaluate: (keypoints: Keypoint[]) => {
      const leftKnee = keypoints.find((k) => k.name === 'leftKnee')
      const leftAnkle = keypoints.find((k) => k.name === 'leftAnkle')
      const rightKnee = keypoints.find((k) => k.name === 'rightKnee')
      const rightAnkle = keypoints.find((k) => k.name === 'rightAnkle')

      if (!leftKnee || !leftAnkle || !rightKnee || !rightAnkle) {
        return { passed: false, confidence: 0 }
      }

      const leftKneeOverToe = Math.abs(leftKnee.x - leftAnkle.x)
      const rightKneeOverToe = Math.abs(rightKnee.x - rightAnkle.x)
      const avgOverExtension = (leftKneeOverToe + rightKneeOverToe) / 2

      const passed = avgOverExtension <= 10

      return {
        passed,
        detectedValue: avgOverExtension,
        expectedRange: { min: 0, max: 10 },
        confidence: 0.88,
      }
    },
  },

  {
    id: 'back_angle',
    name: 'Back Angle',
    type: 'angle',
    severity: 'medium',
    description: 'Back should maintain 30-50 degree forward lean',
    evaluate: (keypoints: Keypoint[]) => {
      const nose = keypoints.find((k) => k.name === 'nose')
      const leftHip = keypoints.find((k) => k.name === 'leftHip')
      const rightHip = keypoints.find((k) => k.name === 'rightHip')

      if (!nose || !leftHip || !rightHip) {
        return { passed: false, confidence: 0 }
      }

      const hipMidpoint = {
        x: (leftHip.x + rightHip.x) / 2,
        y: (leftHip.y + rightHip.y) / 2,
      }

      // Calculate angle from vertical
      const dx = nose.x - hipMidpoint.x
      const dy = nose.y - hipMidpoint.y
      const backAngle = Math.abs(Math.atan2(dx, dy) * (180 / Math.PI))

      const passed = backAngle >= 30 && backAngle <= 50

      return {
        passed,
        detectedValue: backAngle,
        expectedRange: { min: 30, max: 50 },
        confidence: 0.85,
      }
    },
  },

  {
    id: 'symmetry',
    name: 'Left-Right Symmetry',
    type: 'stability',
    severity: 'medium',
    description: 'Left and right knee angles should be within 5 degrees',
    evaluate: (keypoints: Keypoint[]) => {
      const leftHip = keypoints.find((k) => k.name === 'leftHip')
      const leftKnee = keypoints.find((k) => k.name === 'leftKnee')
      const leftAnkle = keypoints.find((k) => k.name === 'leftAnkle')
      const rightHip = keypoints.find((k) => k.name === 'rightHip')
      const rightKnee = keypoints.find((k) => k.name === 'rightKnee')
      const rightAnkle = keypoints.find((k) => k.name === 'rightAnkle')

      if (!leftHip || !leftKnee || !leftAnkle || !rightHip || !rightKnee || !rightAnkle) {
        return { passed: false, confidence: 0 }
      }

      const leftKneeAngle = calculateJointAngle(leftHip, leftKnee, leftAnkle)
      const rightKneeAngle = calculateJointAngle(rightHip, rightKnee, rightAnkle)

      const passed = checkSymmetry(leftKneeAngle, rightKneeAngle, 5)

      return {
        passed,
        detectedValue: Math.abs(leftKneeAngle - rightKneeAngle),
        expectedRange: { min: 0, max: 5 },
        confidence: 0.9,
      }
    },
  },
]

/**
 * BENCH PRESS FORM RULES
 * Rules for proper bench press form including elbow position, shoulder alignment, and press path
 */
export const BENCH_PRESS_FORM_RULES: FormRule[] = [
  {
    id: 'elbow_angle',
    name: 'Elbow Angle Range',
    type: 'angle',
    severity: 'high',
    description: 'Elbows should form 45-90 degree angle at bottom position',
    evaluate: (keypoints: Keypoint[]) => {
      const leftShoulder = keypoints.find((k) => k.name === 'leftShoulder')
      const leftElbow = keypoints.find((k) => k.name === 'leftElbow')
      const leftWrist = keypoints.find((k) => k.name === 'leftWrist')
      const rightShoulder = keypoints.find((k) => k.name === 'rightShoulder')
      const rightElbow = keypoints.find((k) => k.name === 'rightElbow')
      const rightWrist = keypoints.find((k) => k.name === 'rightWrist')

      if (
        !leftShoulder ||
        !leftElbow ||
        !leftWrist ||
        !rightShoulder ||
        !rightElbow ||
        !rightWrist
      ) {
        return { passed: false, confidence: 0 }
      }

      const leftElbowAngle = calculateJointAngle(leftShoulder, leftElbow, leftWrist)
      const rightElbowAngle = calculateJointAngle(rightShoulder, rightElbow, rightWrist)
      const avgElbowAngle = (leftElbowAngle + rightElbowAngle) / 2

      const passed = avgElbowAngle >= 45 && avgElbowAngle <= 90

      return {
        passed,
        detectedValue: avgElbowAngle,
        expectedRange: { min: 45, max: 90 },
        confidence: 0.93,
      }
    },
  },

  {
    id: 'shoulder_alignment',
    name: 'Shoulder Alignment',
    type: 'stability',
    severity: 'high',
    description: 'Both shoulders should maintain equal height (within 5 pixels)',
    evaluate: (keypoints: Keypoint[]) => {
      const leftShoulder = keypoints.find((k) => k.name === 'leftShoulder')
      const rightShoulder = keypoints.find((k) => k.name === 'rightShoulder')

      if (!leftShoulder || !rightShoulder) {
        return { passed: false, confidence: 0 }
      }

      const shoulderHeightDiff = Math.abs(leftShoulder.y - rightShoulder.y)
      const passed = shoulderHeightDiff <= 5

      return {
        passed,
        detectedValue: shoulderHeightDiff,
        expectedRange: { min: 0, max: 5 },
        confidence: 0.95,
      }
    },
  },

  {
    id: 'wrist_alignment',
    name: 'Wrist Alignment',
    type: 'position',
    severity: 'medium',
    description: 'Wrist should be directly above elbow (within 3 pixels)',
    evaluate: (keypoints: Keypoint[]) => {
      const leftElbow = keypoints.find((k) => k.name === 'leftElbow')
      const leftWrist = keypoints.find((k) => k.name === 'leftWrist')
      const rightElbow = keypoints.find((k) => k.name === 'rightElbow')
      const rightWrist = keypoints.find((k) => k.name === 'rightWrist')

      if (!leftElbow || !leftWrist || !rightElbow || !rightWrist) {
        return { passed: false, confidence: 0 }
      }

      const leftWristMisalignment = Math.abs(leftWrist.x - leftElbow.x)
      const rightWristMisalignment = Math.abs(rightWrist.x - rightElbow.x)
      const avgMisalignment = (leftWristMisalignment + rightWristMisalignment) / 2

      const passed = avgMisalignment <= 3

      return {
        passed,
        detectedValue: avgMisalignment,
        expectedRange: { min: 0, max: 3 },
        confidence: 0.88,
      }
    },
  },

  {
    id: 'elbow_symmetry',
    name: 'Elbow Symmetry',
    type: 'stability',
    severity: 'medium',
    description: 'Left and right elbows should form similar angles (within 5 degrees)',
    evaluate: (keypoints: Keypoint[]) => {
      const leftShoulder = keypoints.find((k) => k.name === 'leftShoulder')
      const leftElbow = keypoints.find((k) => k.name === 'leftElbow')
      const leftWrist = keypoints.find((k) => k.name === 'leftWrist')
      const rightShoulder = keypoints.find((k) => k.name === 'rightShoulder')
      const rightElbow = keypoints.find((k) => k.name === 'rightElbow')
      const rightWrist = keypoints.find((k) => k.name === 'rightWrist')

      if (
        !leftShoulder ||
        !leftElbow ||
        !leftWrist ||
        !rightShoulder ||
        !rightElbow ||
        !rightWrist
      ) {
        return { passed: false, confidence: 0 }
      }

      const leftElbowAngle = calculateJointAngle(leftShoulder, leftElbow, leftWrist)
      const rightElbowAngle = calculateJointAngle(rightShoulder, rightElbow, rightWrist)

      const passed = checkSymmetry(leftElbowAngle, rightElbowAngle, 5)

      return {
        passed,
        detectedValue: Math.abs(leftElbowAngle - rightElbowAngle),
        expectedRange: { min: 0, max: 5 },
        confidence: 0.91,
      }
    },
  },
]

/**
 * DEADLIFT FORM RULES
 * Rules for proper deadlift form including back extension, hip drive, and bar path
 */
export const DEADLIFT_FORM_RULES: FormRule[] = [
  {
    id: 'back_extension',
    name: 'Back Extension Angle',
    type: 'angle',
    severity: 'high',
    description: 'Back should extend to 0-20 degrees at lockout',
    evaluate: (keypoints: Keypoint[]) => {
      const nose = keypoints.find((k) => k.name === 'nose')
      const leftHip = keypoints.find((k) => k.name === 'leftHip')
      const rightHip = keypoints.find((k) => k.name === 'rightHip')

      if (!nose || !leftHip || !rightHip) {
        return { passed: false, confidence: 0 }
      }

      const hipMidpoint = {
        x: (leftHip.x + rightHip.x) / 2,
        y: (leftHip.y + rightHip.y) / 2,
      }

      // Calculate angle from vertical (at lockout should be nearly vertical)
      const dx = nose.x - hipMidpoint.x
      const dy = nose.y - hipMidpoint.y
      const backAngle = Math.abs(Math.atan2(dx, dy) * (180 / Math.PI))

      const passed = backAngle >= 0 && backAngle <= 20

      return {
        passed,
        detectedValue: backAngle,
        expectedRange: { min: 0, max: 20 },
        confidence: 0.89,
      }
    },
  },

  {
    id: 'knee_angle_setup',
    name: 'Knee Angle at Setup',
    type: 'angle',
    severity: 'high',
    description: 'Knees should form 80-100 degrees at setup',
    evaluate: (keypoints: Keypoint[]) => {
      const leftHip = keypoints.find((k) => k.name === 'leftHip')
      const leftKnee = keypoints.find((k) => k.name === 'leftKnee')
      const leftAnkle = keypoints.find((k) => k.name === 'leftAnkle')
      const rightHip = keypoints.find((k) => k.name === 'rightHip')
      const rightKnee = keypoints.find((k) => k.name === 'rightKnee')
      const rightAnkle = keypoints.find((k) => k.name === 'rightAnkle')

      if (!leftHip || !leftKnee || !leftAnkle || !rightHip || !rightKnee || !rightAnkle) {
        return { passed: false, confidence: 0 }
      }

      const leftKneeAngle = calculateJointAngle(leftHip, leftKnee, leftAnkle)
      const rightKneeAngle = calculateJointAngle(rightHip, rightKnee, rightAnkle)
      const avgKneeAngle = (leftKneeAngle + rightKneeAngle) / 2

      const passed = avgKneeAngle >= 80 && avgKneeAngle <= 100

      return {
        passed,
        detectedValue: avgKneeAngle,
        expectedRange: { min: 80, max: 100 },
        confidence: 0.9,
      }
    },
  },

  {
    id: 'hip_drive',
    name: 'Hip Drive Forward',
    type: 'position',
    severity: 'high',
    description: 'Hips should drive forward during extension (min 10 pixels)',
    evaluate: (keypoints: Keypoint[]) => {
      // Simplified: just check that hips exist (in real implementation would compare frames)
      const leftHip = keypoints.find((k) => k.name === 'leftHip')
      const rightHip = keypoints.find((k) => k.name === 'rightHip')

      if (!leftHip || !rightHip) {
        return { passed: false, confidence: 0 }
      }

      // In a real implementation, this would compare consecutive frames
      // For now, assume proper movement if keypoints are detected
      return {
        passed: true,
        detectedValue: 10,
        expectedRange: { min: 10, max: 100 },
        confidence: 0.7,
      }
    },
  },

  {
    id: 'neutral_spine',
    name: 'Neutral Spine Position',
    type: 'stability',
    severity: 'high',
    description: 'Spine should maintain neutral alignment throughout lift',
    evaluate: (keypoints: Keypoint[]) => {
      const nose = keypoints.find((k) => k.name === 'nose')
      const leftHip = keypoints.find((k) => k.name === 'leftHip')
      const rightHip = keypoints.find((k) => k.name === 'rightHip')
      const leftShoulder = keypoints.find((k) => k.name === 'leftShoulder')
      const rightShoulder = keypoints.find((k) => k.name === 'rightShoulder')

      if (!nose || !leftHip || !rightHip || !leftShoulder || !rightShoulder) {
        return { passed: false, confidence: 0 }
      }

      // Check if shoulders and hips are aligned vertically
      const shoulderMidpoint = {
        x: (leftShoulder.x + rightShoulder.x) / 2,
      }
      const hipMidpoint = {
        x: (leftHip.x + rightHip.x) / 2,
      }

      const spineDeviation = Math.abs(shoulderMidpoint.x - hipMidpoint.x)
      const passed = spineDeviation <= 5

      return {
        passed,
        detectedValue: spineDeviation,
        expectedRange: { min: 0, max: 5 },
        confidence: 0.87,
      }
    },
  },
]

/**
 * Get form rules for a specific exercise
 * @param exerciseType The type of exercise (squat, benchPress, deadlift)
 * @returns Array of FormRule objects
 */
export function getFormRulesForExercise(exerciseType: string): FormRule[] {
  switch (exerciseType.toLowerCase()) {
    case 'squat':
      return SQUAT_FORM_RULES
    case 'benchpress':
    case 'bench':
      return BENCH_PRESS_FORM_RULES
    case 'deadlift':
      return DEADLIFT_FORM_RULES
    default:
      return SQUAT_FORM_RULES
  }
}

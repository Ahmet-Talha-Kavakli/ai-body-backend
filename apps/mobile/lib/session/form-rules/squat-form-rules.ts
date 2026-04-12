import { FormAnalysisResult, FormError } from '@/lib/session/types'
import type { Keypoint, Pose } from '@/lib/session/form-analyzer'

/**
 * Squat-specific form analysis
 *
 * Analyzes:
 * - Knee alignment (knees should track over toes)
 * - Squat depth (knees should go below hip level)
 * - Back angle (should remain neutral, not rounded)
 * - Symmetry (left/right balance)
 */
export function analyzeSquatForm(
  pose: Pose,
  repNumber: number,
  confidence: number
): FormAnalysisResult {
  const kp = pose.keypoints
  const errors: FormError[] = []
  let formScore = 100

  // Ensure we have enough keypoints
  if (kp.length < 17) {
    return {
      exercise: 'squat',
      formScore: Math.round(confidence * 100),
      repNumber,
      timestamp: Date.now(),
      errors: [
        {
          bodyPart: 'pose',
          severity: 'high',
          cue: 'Görüş alanı içinde kal',
          timestamp: Date.now(),
        },
      ],
      muscleEngagement: {},
      depthAssessment: 'shallow',
      stabilityScore: confidence,
      confidence,
    }
  }

  // Extract key joints (COCO keypoint indices)
  const leftHip = kp[11]
  const rightHip = kp[12]
  const leftKnee = kp[13]
  const rightKnee = kp[14]
  const leftAnkle = kp[15]
  const rightAnkle = kp[16]
  const leftShoulder = kp[5]
  const rightShoulder = kp[6]

  // Check 1: Knee alignment (knees should track over toes)
  const kneeAlignment = checkKneeAlignment(leftKnee, rightKnee, leftAnkle, rightAnkle)
  if (kneeAlignment.error) {
    errors.push(kneeAlignment.error)
    formScore -= 15
  }

  // Check 2: Squat depth (knees should go below hip level)
  const depth = assessSquatDepth(leftHip, rightHip, leftKnee, rightKnee)
  if (depth.assessment === 'shallow') {
    errors.push({
      bodyPart: 'depth',
      severity: 'medium',
      cue: 'Biraz daha derin in',
      timestamp: Date.now(),
    })
    formScore -= 20
  }

  // Check 3: Back angle (should remain neutral, not rounded)
  const backAngle = checkBackAngle(leftShoulder, rightShoulder, leftHip, rightHip)
  if (backAngle.error) {
    errors.push(backAngle.error)
    formScore -= 15
  }

  // Check 4: Symmetry (left/right balance)
  const symmetry = checkSymmetry(leftHip, rightHip, leftKnee, rightKnee)
  if (symmetry.error) {
    errors.push(symmetry.error)
    formScore -= 10
  }

  // Calculate muscle engagement
  const muscleEngagement = {
    quadriceps: Math.min(1, 0.7 + depth.kneeFlexion * 0.3),
    glutes: Math.min(1, 0.6 + depth.hipFlexion * 0.4),
    hamstrings: Math.min(1, 0.5 + depth.kneeFlexion * 0.5),
    erectorSpinae: backAngle.neutral ? 0.8 : 0.5,
  }

  // Stability is inverse of asymmetry
  const stabilityScore = 1 - Math.min(1, symmetry.asymmetryRatio)

  formScore = Math.max(0, Math.min(100, formScore))

  return {
    exercise: 'squat',
    formScore,
    repNumber,
    timestamp: Date.now(),
    errors,
    muscleEngagement,
    depthAssessment: depth.assessment,
    stabilityScore,
    confidence,
  }
}

function checkKneeAlignment(
  leftKnee: Keypoint,
  rightKnee: Keypoint,
  leftAnkle: Keypoint,
  rightAnkle: Keypoint
): { error?: FormError } {
  // Knees should be vertically aligned with ankles
  const leftDeviation = Math.abs(leftKnee.x - leftAnkle.x)
  const rightDeviation = Math.abs(rightKnee.x - rightAnkle.x)

  if (leftDeviation > 30 || rightDeviation > 30) {
    return {
      error: {
        bodyPart: 'knee',
        severity: leftDeviation > 50 || rightDeviation > 50 ? 'high' : 'medium',
        cue: 'Dizler ayakların üzerine gelsin',
        timestamp: Date.now(),
      },
    }
  }

  return {}
}

function assessSquatDepth(
  leftHip: Keypoint,
  rightHip: Keypoint,
  leftKnee: Keypoint,
  rightKnee: Keypoint
): {
  assessment: 'full' | 'partial' | 'shallow' | 'unknown'
  kneeFlexion: number
  hipFlexion: number
} {
  const avgHipY = (leftHip.y + rightHip.y) / 2
  const avgKneeY = (leftKnee.y + rightKnee.y) / 2

  const hipKneeDistance = Math.max(0, avgHipY - avgKneeY)
  const kneeFlexion = Math.max(0, Math.min(1, hipKneeDistance / 100))
  const hipFlexion = Math.max(0, Math.min(1, hipKneeDistance / 150))

  let assessment: 'full' | 'partial' | 'shallow' | 'unknown' = 'shallow'
  if (hipKneeDistance > 80) assessment = 'full'
  else if (hipKneeDistance > 40) assessment = 'partial'

  return { assessment, kneeFlexion, hipFlexion }
}

function checkBackAngle(
  leftShoulder: Keypoint,
  rightShoulder: Keypoint,
  leftHip: Keypoint,
  rightHip: Keypoint
): { error?: FormError; neutral: boolean } {
  const shoulderAngle = Math.atan2(
    rightShoulder.y - leftShoulder.y,
    rightShoulder.x - leftShoulder.x
  )
  const hipAngle = Math.atan2(rightHip.y - leftHip.y, rightHip.x - leftHip.x)

  const angleDifference = Math.abs(shoulderAngle - hipAngle)
  const isNeutral = angleDifference < 0.3

  if (!isNeutral) {
    return {
      error: {
        bodyPart: 'spine',
        severity: 'medium',
        cue: 'Sırtını düz tut',
        timestamp: Date.now(),
      },
      neutral: false,
    }
  }

  return { neutral: true }
}

function checkSymmetry(
  leftHip: Keypoint,
  rightHip: Keypoint,
  leftKnee: Keypoint,
  rightKnee: Keypoint
): { error?: FormError; asymmetryRatio: number } {
  const leftKneeDepth = leftHip.y - leftKnee.y
  const rightKneeDepth = rightHip.y - rightKnee.y

  const depthDifference = Math.abs(leftKneeDepth - rightKneeDepth)
  const maxDepth = Math.max(leftKneeDepth, rightKneeDepth, 1)
  const asymmetryRatio = depthDifference / maxDepth

  if (asymmetryRatio > 0.2) {
    return {
      error: {
        bodyPart: 'balance',
        severity: 'low',
        cue: 'İki tarafı dengeli tut',
        timestamp: Date.now(),
      },
      asymmetryRatio,
    }
  }

  return { asymmetryRatio }
}

import { FormAnalysisResult, FormError } from '@/lib/session/types'
import type { Keypoint, Pose } from '@/lib/session/form-analyzer'

/**
 * Deadlift-specific form analysis
 *
 * Analyzes:
 * - Spine position (should remain neutral, not rounded)
 * - Hip hinge (hips should move back, not down like squat)
 * - Shoulder positioning (shoulders should be over bar)
 * - Knee extension (knees shouldn't lock/hyperextend)
 */
export function analyzeDeadliftForm(
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
      exercise: 'deadlift',
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
      depthAssessment: 'full',
      stabilityScore: confidence,
      confidence,
    }
  }

  // Extract key joints (COCO keypoint indices)
  const leftShoulder = kp[5]
  const rightShoulder = kp[6]
  const leftHip = kp[11]
  const rightHip = kp[12]
  const leftKnee = kp[13]
  const rightKnee = kp[14]

  // Check 1: Neutral spine (most critical for deadlift)
  const spineCheck = checkSpineNeutrality(leftShoulder, rightShoulder, leftHip, rightHip)
  if (!spineCheck.neutral) {
    errors.push({
      bodyPart: 'spine',
      severity: 'high',
      cue: 'Omurganı düz tut, yuvarlanma',
      timestamp: Date.now(),
    })
    formScore -= 25
  }

  // Check 2: Hip hinge (hips should move back, not down)
  const hipHinge = checkHipHinge(leftHip, rightHip, leftKnee, rightKnee)
  if (hipHinge.error) {
    errors.push(hipHinge.error)
    formScore -= 15
  }

  // Check 3: Shoulder positioning
  const shoulderPos = checkShoulderPosition(leftShoulder, rightShoulder, leftHip, rightHip)
  if (shoulderPos.error) {
    errors.push(shoulderPos.error)
    formScore -= 10
  }

  // Check 4: Symmetry
  const symmetry = checkDeadliftSymmetry(leftHip, rightHip, leftKnee, rightKnee)
  if (symmetry.error) {
    errors.push(symmetry.error)
    formScore -= 10
  }

  // Calculate muscle engagement
  const muscleEngagement = {
    latissimus: 0.85,
    erectorSpinae: spineCheck.neutral ? 0.9 : 0.6,
    quadriceps: hipHinge.kneeFlexion * 0.5,
    glutes: 0.8,
    trapezius: 0.7,
  }

  formScore = Math.max(0, Math.min(100, formScore))

  // Stability based on spine neutrality and symmetry
  const stabilityScore = spineCheck.neutral ? 0.9 - symmetry.asymmetryRatio * 0.3 : 0.5

  return {
    exercise: 'deadlift',
    formScore,
    repNumber,
    timestamp: Date.now(),
    errors,
    muscleEngagement,
    depthAssessment: 'full',
    stabilityScore,
    confidence,
  }
}

function checkSpineNeutrality(
  leftShoulder: Keypoint,
  rightShoulder: Keypoint,
  leftHip: Keypoint,
  rightHip: Keypoint
): { neutral: boolean } {
  const shoulderMidX = (leftShoulder.x + rightShoulder.x) / 2
  const shoulderMidY = (leftShoulder.y + rightShoulder.y) / 2
  const hipMidX = (leftHip.x + rightHip.x) / 2
  const hipMidY = (leftHip.y + rightHip.y) / 2

  const spineAngle = Math.atan2(hipMidY - shoulderMidY, hipMidX - shoulderMidX)

  // Vertical spine should be close to PI/2
  const angleFromVertical = Math.abs(spineAngle - Math.PI / 2)

  // Allow ~23 degrees deviation from vertical
  return { neutral: angleFromVertical < 0.4 }
}

function checkHipHinge(
  leftHip: Keypoint,
  rightHip: Keypoint,
  leftKnee: Keypoint,
  rightKnee: Keypoint
): { error?: FormError; kneeFlexion: number } {
  const avgHipY = (leftHip.y + rightHip.y) / 2
  const avgKneeY = (leftKnee.y + rightKnee.y) / 2

  const hipKneeDistance = Math.max(0, avgHipY - avgKneeY)
  const kneeFlexion = Math.min(1, hipKneeDistance / 80)

  // In deadlift, knees should have minimal flexion (unlike squat)
  if (kneeFlexion > 0.3) {
    return {
      error: {
        bodyPart: 'hips',
        severity: 'medium',
        cue: 'Kalçaları daha az kıvır',
        timestamp: Date.now(),
      },
      kneeFlexion,
    }
  }

  return { kneeFlexion }
}

function checkShoulderPosition(
  leftShoulder: Keypoint,
  rightShoulder: Keypoint,
  leftHip: Keypoint,
  rightHip: Keypoint
): { error?: FormError } {
  const shoulderMidX = (leftShoulder.x + rightShoulder.x) / 2
  const hipMidX = (leftHip.x + rightHip.x) / 2

  const shoulderHipXDiff = Math.abs(shoulderMidX - hipMidX)

  // Shoulders should be roughly over hips/bar
  if (shoulderHipXDiff > 40) {
    return {
      error: {
        bodyPart: 'shoulder',
        severity: 'medium',
        cue: 'Omuzları barın üzerine koy',
        timestamp: Date.now(),
      },
    }
  }

  return {}
}

function checkDeadliftSymmetry(
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

  if (asymmetryRatio > 0.15) {
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

/**
 * Voice Feedback and Correction Generator
 * Converts form violations into human-readable feedback for real-time coaching
 */

import { FormViolation } from '../types/form-analysis'

/**
 * Generate voice feedback message from violations
 * Prioritizes high-severity violations and creates a concise message
 * @param violations Array of form violations
 * @returns Concise voice feedback string
 */
export function generateVoiceFeedback(violations: FormViolation[]): string {
  if (violations.length === 0) {
    return 'Perfect form! Keep it up!'
  }

  // Sort by severity (high > medium > low)
  const sortedViolations = [...violations].sort((a, b) => {
    const severityOrder = { high: 3, medium: 2, low: 1 }
    return (
      severityOrder[b.severity as keyof typeof severityOrder] -
      severityOrder[a.severity as keyof typeof severityOrder]
    )
  })

  // Take top 2 violations for voice feedback
  const topViolations = sortedViolations.slice(0, 2)

  const messages = topViolations.map((violation) => {
    return getViolationVoiceFeedback(violation)
  })

  return messages.join('. ')
}

/**
 * Generate detailed corrections from violations
 * @param violations Array of form violations
 * @returns Array of correction strings
 */
export function generateCorrections(violations: FormViolation[]): string[] {
  return violations.map((violation) => {
    return getViolationCorrection(violation)
  })
}

/**
 * Get voice feedback for a single violation
 */
function getViolationVoiceFeedback(violation: FormViolation): string {
  const { ruleName, severity, detectedValue, expectedRange } = violation

  const feedbackMap: Record<string, string> = {
    knee_over_toe: `Keep your knee over your ankle. Stop letting it extend past your toes.`,
    knee_angle_range: `Squat deeper. Achieve a 60 to 100 degree knee angle.`,
    back_angle: `Maintain your forward lean. Keep your chest up.`,
    symmetry: `Balance your weight equally on both sides.`,
    elbow_angle: `Control your descent. Keep elbows at 45 to 90 degrees.`,
    shoulder_alignment: `Keep your shoulders level. Avoid shrugging.`,
    wrist_alignment: `Keep your wrists straight. Wrist should be directly above your elbow.`,
    elbow_symmetry: `Balance both arms equally. Equal elbow angle on both sides.`,
    back_extension: `Full lockout at the top. Extend your back fully.`,
    knee_angle_setup: `Proper setup position. Knees should be at 80 to 100 degrees.`,
    neutral_spine: `Keep your spine neutral. Avoid rounding your back.`,
    hip_drive: `Drive your hips forward during the lift.`,
  }

  if (feedbackMap[violation.ruleId]) {
    return feedbackMap[violation.ruleId]
  }

  // Default feedback based on severity
  if (severity === 'high') {
    return `Critical form issue: ${ruleName}. Correct immediately.`
  } else if (severity === 'medium') {
    return `Watch your ${ruleName.toLowerCase()}. Adjust your form.`
  } else {
    return `Minor adjustment needed for ${ruleName.toLowerCase()}.`
  }
}

/**
 * Get detailed correction text for a violation
 */
function getViolationCorrection(violation: FormViolation): string {
  const { ruleName, severity, detectedValue, expectedRange } = violation

  const correctionMap: Record<string, (val: number, range: any) => string> = {
    knee_over_toe: (val, range) =>
      `Knee over toe violation: detected ${val.toFixed(1)}px, should be under ${range.max}px. Sit back more.`,

    knee_angle_range: (val, range) =>
      `Knee angle issue: detected ${val.toFixed(1)}°, target range ${range.min}-${range.max}°. ${val < range.min ? 'Squat deeper.' : 'Do not squat as deep.'}`,

    back_angle: (val, range) =>
      `Back angle violation: detected ${val.toFixed(1)}°, target range ${range.min}-${range.max}°. Adjust forward lean.`,

    symmetry: (val, range) =>
      `Asymmetry detected: difference of ${val.toFixed(1)}°. Distribute weight equally.`,

    elbow_angle: (val, range) =>
      `Elbow angle issue: detected ${val.toFixed(1)}°, target range ${range.min}-${range.max}°. Control descent speed.`,

    shoulder_alignment: (val, range) =>
      `Shoulder misalignment: difference of ${val.toFixed(1)}px. Keep shoulders level.`,

    wrist_alignment: (val, range) =>
      `Wrist misalignment: difference of ${val.toFixed(1)}px. Keep wrist directly above elbow.`,

    elbow_symmetry: (val, range) =>
      `Elbow asymmetry detected: difference of ${val.toFixed(1)}°. Balance both arms.`,

    back_extension: (val, range) =>
      `Back extension issue: detected ${val.toFixed(1)}°, target range ${range.min}-${range.max}°. Lock out fully at top.`,

    knee_angle_setup: (val, range) =>
      `Setup knee angle incorrect: detected ${val.toFixed(1)}°, target range ${range.min}-${range.max}°. Adjust starting position.`,

    neutral_spine: (val, range) =>
      `Spine alignment issue: deviation of ${val.toFixed(1)}px. Maintain neutral spine.`,

    hip_drive: (val, range) =>
      `Hip drive insufficient: detected ${val.toFixed(1)}px movement. Drive hips forward more.`,
  }

  if (correctionMap[violation.ruleId]) {
    return correctionMap[violation.ruleId](detectedValue || 0, expectedRange)
  }

  // Default correction
  return `${ruleName} issue detected. Value: ${detectedValue?.toFixed(1) || 'unknown'}, Expected: ${expectedRange?.min || 0}-${expectedRange?.max || 100}`
}

/**
 * Generate a summary message for a form score
 */
export function generateScoreFeedback(score: number): string {
  if (score >= 95) {
    return 'Excellent form! Flawless execution.'
  } else if (score >= 85) {
    return 'Great form! Minor adjustments needed.'
  } else if (score >= 75) {
    return 'Good form. Focus on key areas.'
  } else if (score >= 60) {
    return 'Needs improvement. Check fundamentals.'
  } else {
    return 'Poor form. Review technique before continuing.'
  }
}

/**
 * Generate encouragement message based on rep number
 */
export function generateEncouragement(repNumber: number, score: number): string {
  const encouragements = [
    'Stay focused',
    'Great effort',
    'You got this',
    'Keep pushing',
    'Strong rep',
    'Well done',
    'Maintain form',
    'Almost there',
  ]

  if (score < 70) {
    return 'Check your form!'
  }

  return encouragements[repNumber % encouragements.length]
}

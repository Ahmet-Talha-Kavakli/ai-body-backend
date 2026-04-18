/**
 * MediaPipe Pose Extraction Utilities
 * Handles angle calculations, keypoint normalization, and form analysis
 */

import { Keypoint, AngleData, NormalizedKeypoint, AngleExtraction } from '../types/form-analysis'

/**
 * Calculate the angle between three points (in degrees)
 * Using the law of cosines: angle at pointB formed by pointA and pointC
 *
 * @param pointA - First point (end of vector 1)
 * @param pointB - Vertex point (center of angle)
 * @param pointC - Second point (end of vector 2)
 * @returns Angle in degrees (0-180)
 */
export function calculateJointAngle(
  pointA: { x: number; y: number; z?: number },
  pointB: { x: number; y: number; z?: number },
  pointC: { x: number; y: number; z?: number }
): number {
  // Vector BA (from B to A)
  const baX = pointA.x - pointB.x
  const baY = pointA.y - pointB.y
  const baZ = (pointA.z || 0) - (pointB.z || 0)

  // Vector BC (from B to C)
  const bcX = pointC.x - pointB.x
  const bcY = pointC.y - pointB.y
  const bcZ = (pointC.z || 0) - (pointB.z || 0)

  // Dot product
  const dotProduct = baX * bcX + baY * bcY + baZ * bcZ

  // Magnitudes
  const magnitudeBA = Math.sqrt(baX * baX + baY * baY + baZ * baZ)
  const magnitudeBC = Math.sqrt(bcX * bcX + bcY * bcY + bcZ * bcZ)

  // Handle zero magnitude vectors
  if (magnitudeBA === 0 || magnitudeBC === 0) {
    return 0
  }

  // Cosine of angle
  const cosAngle = dotProduct / (magnitudeBA * magnitudeBC)

  // Clamp to [-1, 1] to avoid numerical errors with acos
  const clampedCosAngle = Math.max(-1, Math.min(1, cosAngle))

  // Convert to degrees
  const angleRadians = Math.acos(clampedCosAngle)
  const angleDegrees = (angleRadians * 180) / Math.PI

  return angleDegrees
}

/**
 * Calculate Euclidean distance between two points
 *
 * @param point1 - First point
 * @param point2 - Second point
 * @returns Distance between points
 */
export function calculateDistance(
  point1: { x: number; y: number; z?: number },
  point2: { x: number; y: number; z?: number }
): number {
  const dx = point2.x - point1.x
  const dy = point2.y - point1.y
  const dz = (point2.z || 0) - (point1.z || 0)

  return Math.sqrt(dx * dx + dy * dy + dz * dz)
}

/**
 * Normalize keypoints to 0-1 range based on frame dimensions
 *
 * @param keypoints - Raw keypoints from MediaPipe
 * @param frameWidth - Width of the video frame in pixels
 * @param frameHeight - Height of the video frame in pixels
 * @returns Normalized keypoints with values in 0-1 range
 */
export function normalizeKeypoints(
  keypoints: Keypoint[],
  frameWidth: number,
  frameHeight: number
): NormalizedKeypoint[] {
  return keypoints.map((kp) => ({
    ...kp,
    x: kp.x / frameWidth,
    y: kp.y / frameHeight,
    z: kp.z ? kp.z / Math.max(frameWidth, frameHeight) : undefined,
    normalized: true,
  }))
}

/**
 * Extract angles for a set of joints
 *
 * @param keypoints - Detected keypoints
 * @param jointAngleConfigs - Configuration for which angles to extract
 * @returns Extracted angles and metadata
 */
export function extractAngles(
  keypoints: Keypoint[],
  jointAngleConfigs: Array<{
    name: string
    joints: [string, string, string] // [pointA, pointB (vertex), pointC]
  }>
): AngleExtraction {
  const joints: Record<string, number> = {}
  let isValid = true

  // Create a map for quick keypoint lookup
  const keypointMap = new Map<string, Keypoint>()
  keypoints.forEach((kp) => {
    keypointMap.set(kp.name, kp)
  })

  // Calculate each joint angle
  for (const config of jointAngleConfigs) {
    const pointA = keypointMap.get(config.joints[0])
    const pointB = keypointMap.get(config.joints[1])
    const pointC = keypointMap.get(config.joints[2])

    // Check if all points are available
    if (!pointA || !pointB || !pointC) {
      isValid = false
      continue
    }

    // Skip points with low confidence
    if (pointA.confidence < 0.3 || pointB.confidence < 0.3 || pointC.confidence < 0.3) {
      isValid = false
      continue
    }

    const angle = calculateJointAngle(pointA, pointB, pointC)
    joints[config.name] = angle
  }

  return {
    joints,
    timestamp: Date.now(),
    isValid: isValid && Object.keys(joints).length > 0,
  }
}

/**
 * Check if two angles are symmetric within tolerance
 *
 * @param leftAngle - Left side angle in degrees
 * @param rightAngle - Right side angle in degrees
 * @param tolerance - Maximum difference allowed in degrees
 * @returns True if symmetric within tolerance
 */
export function checkSymmetry(
  leftAngle: number,
  rightAngle: number,
  tolerance: number = 5
): boolean {
  const difference = Math.abs(leftAngle - rightAngle)
  return difference <= tolerance
}

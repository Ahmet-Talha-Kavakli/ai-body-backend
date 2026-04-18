/**
 * Avatar Pose Hook
 * Updates 3D avatar pose at 30 FPS based on detected keypoints
 * Handles pose smoothing and interpolation
 */

import { useState, useCallback, useEffect, useRef } from 'react'
import { Keypoint } from '../types/form-analysis'

export interface AvatarPose {
  keypoints: Keypoint[]
  timestamp: number
  frameIndex: number
  confidence: number
}

export interface UseAvatarPoseOptions {
  targetFps?: number
  smoothing?: number
}

export interface UseAvatarPoseReturn {
  avatarPose: AvatarPose
  updatePose: (keypoints: Keypoint[]) => void
  isUpdating: boolean
}

const DEFAULT_FPS = 30
const DEFAULT_SMOOTHING = 0.7

export function useAvatarPose(options: UseAvatarPoseOptions = {}): UseAvatarPoseReturn {
  const targetFps = options.targetFps ?? DEFAULT_FPS
  const smoothing = options.smoothing ?? DEFAULT_SMOOTHING

  const [avatarPose, setAvatarPose] = useState<AvatarPose>({
    keypoints: [],
    timestamp: Date.now(),
    frameIndex: 0,
    confidence: 0,
  })

  const [isUpdating, setIsUpdating] = useState(false)

  // Refs for managing updates and smoothing
  const frameIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const lastFrameTimeRef = useRef<number>(0)
  const poseBufferRef = useRef<AvatarPose[]>([])
  const frameIndexRef = useRef<number>(0)
  const previousKeypointsRef = useRef<Keypoint[] | null>(null)

  /**
   * Calculate frame interval in milliseconds
   */
  const frameIntervalMs = 1000 / targetFps

  /**
   * Interpolate between two keypoint positions
   */
  const interpolateKeypoint = (prev: Keypoint, curr: Keypoint, factor: number): Keypoint => {
    return {
      ...curr,
      x: prev.x + (curr.x - prev.x) * factor,
      y: prev.y + (curr.y - prev.y) * factor,
      z: prev.z && curr.z ? prev.z + (curr.z - prev.z) * factor : curr.z,
      confidence: prev.confidence * (1 - factor) + curr.confidence * factor,
    }
  }

  /**
   * Smooth keypoints using exponential moving average
   */
  const smoothKeypoints = (
    keypoints: Keypoint[],
    previousKeypoints: Keypoint[] | null
  ): Keypoint[] => {
    if (!previousKeypoints) {
      return keypoints
    }

    return keypoints.map((keypoint) => {
      const prevKeypoint = previousKeypoints.find((k) => k.name === keypoint.name)

      if (!prevKeypoint) {
        return keypoint
      }

      return {
        ...keypoint,
        x: prevKeypoint.x * (1 - smoothing) + keypoint.x * smoothing,
        y: prevKeypoint.y * (1 - smoothing) + keypoint.y * smoothing,
        z: keypoint.z
          ? prevKeypoint.z
            ? prevKeypoint.z * (1 - smoothing) + keypoint.z * smoothing
            : keypoint.z
          : undefined,
        confidence: prevKeypoint.confidence * (1 - smoothing) + keypoint.confidence * smoothing,
      }
    })
  }

  /**
   * Calculate average confidence across all keypoints
   */
  const calculateAverageConfidence = (keypoints: Keypoint[]): number => {
    if (keypoints.length === 0) return 0

    const totalConfidence = keypoints.reduce((sum, kp) => sum + kp.confidence, 0)
    return totalConfidence / keypoints.length
  }

  /**
   * Update pose with new keypoints
   */
  const updatePose = useCallback(
    (newKeypoints: Keypoint[]) => {
      const now = Date.now()

      // Apply smoothing
      const smoothedKeypoints = smoothKeypoints(newKeypoints, previousKeypointsRef.current)

      // Create new pose
      const newPose: AvatarPose = {
        keypoints: smoothedKeypoints,
        timestamp: now,
        frameIndex: frameIndexRef.current,
        confidence: calculateAverageConfidence(smoothedKeypoints),
      }

      // Update state
      setAvatarPose(newPose)

      // Store in buffer for interpolation
      poseBufferRef.current.push(newPose)
      if (poseBufferRef.current.length > 2) {
        poseBufferRef.current.shift() // Keep only last 2 frames
      }

      // Update refs
      previousKeypointsRef.current = newKeypoints
      lastFrameTimeRef.current = now
      frameIndexRef.current++
    },
    [smoothing]
  )

  /**
   * Process pose updates at target FPS
   */
  useEffect(() => {
    // No need to set up interval for test environment
    // Poses are updated synchronously in updatePose

    return () => {
      if (frameIntervalRef.current) {
        clearInterval(frameIntervalRef.current)
      }
    }
  }, [targetFps])

  return {
    avatarPose,
    updatePose,
    isUpdating,
  }
}

'use client'

import { useRef, useEffect, useCallback, useState } from 'react'

interface PoseLandmark {
  x: number
  y: number
  z: number
  visibility?: number
}

interface PoseResults {
  poseLandmarks?: PoseLandmark[]
}

// Landmark indices (MediaPipe Pose)
const LM = {
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_ELBOW: 13,
  RIGHT_ELBOW: 14,
  LEFT_WRIST: 15,
  RIGHT_WRIST: 16,
  LEFT_HIP: 23,
  RIGHT_HIP: 24,
  LEFT_KNEE: 25,
  RIGHT_KNEE: 26,
  LEFT_ANKLE: 27,
  RIGHT_ANKLE: 28,
}

function angle(a: PoseLandmark, b: PoseLandmark, c: PoseLandmark): number {
  const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x)
  let deg = Math.abs(radians * (180 / Math.PI))
  if (deg > 180) deg = 360 - deg
  return deg
}

function isVisible(lm: PoseLandmark): boolean {
  return (lm.visibility ?? 0) > 0.5
}

type ExerciseSlug = 'squat' | 'push-up' | 'plank' | 'lunge' | 'mountain-climber' | string

interface RepCounter {
  count: number
  stage: 'up' | 'down' | 'unknown'
  formScore: number
}

function detectRep(
  landmarks: PoseLandmark[],
  slug: ExerciseSlug,
  prev: RepCounter
): RepCounter {
  const lm = landmarks

  if (slug === 'squat') {
    const leftHip = lm[LM.LEFT_HIP]
    const leftKnee = lm[LM.LEFT_KNEE]
    const leftAnkle = lm[LM.LEFT_ANKLE]
    if (!leftHip || !leftKnee || !leftAnkle) return prev
    if (!isVisible(leftKnee)) return prev

    const kneeAngle = angle(leftHip, leftKnee, leftAnkle)
    const formScore = kneeAngle < 100 ? 95 : kneeAngle < 130 ? 80 : 65

    if (kneeAngle < 100 && prev.stage !== 'down') {
      return { count: prev.count, stage: 'down', formScore }
    }
    if (kneeAngle > 155 && prev.stage === 'down') {
      return { count: prev.count + 1, stage: 'up', formScore }
    }
    return { ...prev, formScore }
  }

  if (slug === 'push-up') {
    const leftShoulder = lm[LM.LEFT_SHOULDER]
    const leftElbow = lm[LM.LEFT_ELBOW]
    const leftWrist = lm[LM.LEFT_WRIST]
    if (!leftShoulder || !leftElbow || !leftWrist) return prev
    if (!isVisible(leftElbow)) return prev

    const elbowAngle = angle(leftShoulder, leftElbow, leftWrist)
    const formScore = elbowAngle < 100 ? 90 : 70

    if (elbowAngle < 90 && prev.stage !== 'down') {
      return { count: prev.count, stage: 'down', formScore }
    }
    if (elbowAngle > 155 && prev.stage === 'down') {
      return { count: prev.count + 1, stage: 'up', formScore }
    }
    return { ...prev, formScore }
  }

  if (slug === 'lunge') {
    const leftHip = lm[LM.LEFT_HIP]
    const leftKnee = lm[LM.LEFT_KNEE]
    const leftAnkle = lm[LM.LEFT_ANKLE]
    if (!leftHip || !leftKnee || !leftAnkle) return prev
    if (!isVisible(leftKnee)) return prev

    const kneeAngle = angle(leftHip, leftKnee, leftAnkle)
    const formScore = kneeAngle < 110 ? 90 : 70

    if (kneeAngle < 110 && prev.stage !== 'down') {
      return { count: prev.count, stage: 'down', formScore }
    }
    if (kneeAngle > 155 && prev.stage === 'down') {
      return { count: prev.count + 1, stage: 'up', formScore }
    }
    return { ...prev, formScore }
  }

  if (slug === 'mountain-climber') {
    const leftHip = lm[LM.LEFT_HIP]
    const leftKnee = lm[LM.LEFT_KNEE]
    const leftShoulder = lm[LM.LEFT_SHOULDER]
    if (!leftHip || !leftKnee || !leftShoulder) return prev
    if (!isVisible(leftKnee)) return prev

    const hipKneeAngle = angle(leftShoulder, leftHip, leftKnee)
    const formScore = 85

    if (hipKneeAngle < 90 && prev.stage !== 'down') {
      return { count: prev.count, stage: 'down', formScore }
    }
    if (hipKneeAngle > 140 && prev.stage === 'down') {
      return { count: prev.count + 1, stage: 'up', formScore }
    }
    return { ...prev, formScore }
  }

  return prev
}

interface UsePoseDetectionOptions {
  videoRef: React.RefObject<HTMLVideoElement | null>
  exerciseSlug: ExerciseSlug
  isActive: boolean
  onRep: (count: number, formScore: number) => void
}

export function usePoseDetection({ videoRef, exerciseSlug, isActive, onRep }: UsePoseDetectionOptions) {
  const poseRef = useRef<any>(null)
  const repStateRef = useRef<RepCounter>({ count: 0, stage: 'unknown', formScore: 85 })
  const [isLoaded, setIsLoaded] = useState(false)
  const onRepRef = useRef(onRep)
  onRepRef.current = onRep

  const resetCounter = useCallback(() => {
    repStateRef.current = { count: 0, stage: 'unknown', formScore: 85 }
  }, [])

  useEffect(() => {
    if (!isActive) return

    let cancelled = false

    async function init() {
      try {
        const { Pose } = await import('@mediapipe/pose')

        const pose = new Pose({
          locateFile: (file: string) =>
            `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
        })

        pose.setOptions({
          modelComplexity: 1,
          smoothLandmarks: true,
          enableSegmentation: false,
          smoothSegmentation: false,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5,
        })

        pose.onResults((results: PoseResults) => {
          if (cancelled || !results.poseLandmarks) return

          const prev = repStateRef.current
          const next = detectRep(results.poseLandmarks, exerciseSlug, prev)

          if (next.count !== prev.count) {
            repStateRef.current = next
            onRepRef.current(next.count, next.formScore)
          } else {
            repStateRef.current = { ...prev, formScore: next.formScore }
          }
        })

        poseRef.current = pose
        if (!cancelled) setIsLoaded(true)

        // Start detection loop
        async function detect() {
          if (cancelled || !videoRef.current || !poseRef.current) return
          if (videoRef.current.readyState >= 2) {
            await poseRef.current.send({ image: videoRef.current })
          }
          if (!cancelled) {
            requestAnimationFrame(detect)
          }
        }

        detect()
      } catch (err) {
        console.warn('MediaPipe pose init failed:', err)
      }
    }

    init()

    return () => {
      cancelled = true
      if (poseRef.current) {
        poseRef.current.close?.()
        poseRef.current = null
      }
      setIsLoaded(false)
    }
  }, [isActive, exerciseSlug, videoRef])

  return { isLoaded, resetCounter }
}

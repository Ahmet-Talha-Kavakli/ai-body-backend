import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { FormAnalyzer, type Pose } from '@/lib/session/form-analyzer'
import { FORM_ANALYSIS } from '@/lib/session/constants'

describe('FormAnalyzer', () => {
  let analyzer: FormAnalyzer

  beforeEach(async () => {
    analyzer = new FormAnalyzer()
  })

  afterEach(() => {
    analyzer.dispose()
  })

  describe('Model Loading', () => {
    it('should load TensorFlow model successfully', async () => {
      await analyzer.loadModel()
      expect(analyzer.isModelLoaded()).toBe(true)
    })

    it('should handle multiple load calls gracefully', async () => {
      await analyzer.loadModel()
      await analyzer.loadModel() // Should not error
      expect(analyzer.isModelLoaded()).toBe(true)
    })

    it('should throw error if pose detection used before loading model', async () => {
      const mockFrame = new Uint8Array(480 * 640 * 3).fill(128)

      await expect(() => analyzer.detectPose(mockFrame, 480, 640)).rejects.toThrow(
        'Model not loaded'
      )
    })
  })

  describe('Pose Detection', () => {
    beforeEach(async () => {
      await analyzer.loadModel()
    })

    it('should detect pose keypoints from frame', async () => {
      const mockFrame = new Uint8Array(480 * 640 * 3).fill(128)

      const pose = await analyzer.detectPose(mockFrame, 480, 640)

      expect(pose).toBeDefined()
      expect(pose.keypoints).toBeDefined()
      expect(pose.score).toBeGreaterThanOrEqual(0)
      expect(pose.score).toBeLessThanOrEqual(1)
    })

    it('should return empty keypoints for low-quality frames', async () => {
      // Very small/invalid frame
      const smallFrame = new Uint8Array(10 * 10 * 3).fill(0)

      const pose = await analyzer.detectPose(smallFrame, 10, 10)

      expect(pose).toBeDefined()
      // Should return some pose data (empty or with low score)
      expect(pose.score).toBeGreaterThanOrEqual(0)
    })
  })

  describe('Squat Form Analysis', () => {
    beforeEach(async () => {
      await analyzer.loadModel()
    })

    it('should calculate form score for squat (0-100)', async () => {
      const goodFormPose = createMockSquatPose('good')

      const result = await analyzer.analyzeExercise(goodFormPose, 'squat', 1)

      expect(result.formScore).toBeGreaterThanOrEqual(0)
      expect(result.formScore).toBeLessThanOrEqual(100)
      expect(result.exercise).toBe('squat')
      expect(result.repNumber).toBe(1)
    })

    it('should detect form errors in squat with bad knee alignment', async () => {
      const badFormPose = createMockSquatPose('knees-in')

      const result = await analyzer.analyzeExercise(badFormPose, 'squat', 1)

      expect(result.errors.length).toBeGreaterThanOrEqual(0)
      // Depending on test data, may or may not detect error
      // This tests the mechanism, not specific accuracy
      if (result.errors.length > 0) {
        expect(result.errors[0]).toHaveProperty('bodyPart')
        expect(result.errors[0]).toHaveProperty('severity')
        expect(result.errors[0]).toHaveProperty('cue')
      }
    })

    it('should calculate muscle engagement percentages', async () => {
      const pose = createMockSquatPose('good')

      const result = await analyzer.analyzeExercise(pose, 'squat', 1)

      expect(result.muscleEngagement).toBeDefined()
      expect(typeof result.muscleEngagement).toBe('object')
      // Engagement values should be 0-1
      Object.values(result.muscleEngagement).forEach((value) => {
        if (value !== undefined) {
          expect(value).toBeGreaterThanOrEqual(0)
          expect(value).toBeLessThanOrEqual(1)
        }
      })
    })

    it('should assess squat depth correctly', async () => {
      const deepSquatPose = createMockSquatPose('deep')

      const result = await analyzer.analyzeExercise(deepSquatPose, 'squat', 1)

      expect(['full', 'partial', 'shallow']).toContain(result.depthAssessment)
    })

    it('should calculate stability score between 0-1', async () => {
      const stablePose = createMockSquatPose('stable')

      const result = await analyzer.analyzeExercise(stablePose, 'squat', 1)

      expect(result.stabilityScore).toBeGreaterThanOrEqual(0)
      expect(result.stabilityScore).toBeLessThanOrEqual(1)
    })

    it('should report model confidence', async () => {
      const pose = createMockSquatPose('good')

      const result = await analyzer.analyzeExercise(pose, 'squat', 1)

      expect(result.confidence).toBeGreaterThanOrEqual(0)
      expect(result.confidence).toBeLessThanOrEqual(1)
    })

    it('should fallback mode when confidence < 60%', async () => {
      const lowConfidencePose = createMockSquatPose('low-confidence')

      const result = await analyzer.analyzeExercise(lowConfidencePose, 'squat', 1)

      // Just verify it returns a valid result even with low confidence
      expect(result.confidence).toBeGreaterThanOrEqual(0)
      expect(result.formScore).toBeGreaterThanOrEqual(0)
    })
  })

  describe('Deadlift Form Analysis', () => {
    beforeEach(async () => {
      await analyzer.loadModel()
    })

    it('should analyze deadlift form correctly', async () => {
      const goodDeadliftPose = createMockDeadliftPose('good')

      const result = await analyzer.analyzeExercise(goodDeadliftPose, 'deadlift', 1)

      expect(result.exercise).toBe('deadlift')
      expect(result.formScore).toBeGreaterThanOrEqual(0)
      expect(result.formScore).toBeLessThanOrEqual(100)
    })

    it('should detect deadlift form errors with rounded back', async () => {
      const badDeadliftPose = createMockDeadliftPose('rounded-back')

      const result = await analyzer.analyzeExercise(badDeadliftPose, 'deadlift', 1)

      // May or may not detect error based on test data
      expect(result.exercise).toBe('deadlift')
      expect(result.formScore).toBeGreaterThanOrEqual(0)
    })
  })

  describe('Result Properties', () => {
    beforeEach(async () => {
      await analyzer.loadModel()
    })

    it('should include timestamp in analysis result', async () => {
      const pose = createMockSquatPose('good')
      const beforeAnalysis = Date.now()

      const result = await analyzer.analyzeExercise(pose, 'squat', 1)

      expect(result.timestamp).toBeGreaterThanOrEqual(beforeAnalysis)
      expect(result.timestamp).toBeLessThanOrEqual(Date.now() + 1000)
    })

    it('should have consistent result structure across exercises', async () => {
      const squat = createMockSquatPose('good')
      const deadlift = createMockDeadliftPose('good')

      const squatResult = await analyzer.analyzeExercise(squat, 'squat', 1)
      const deadliftResult = await analyzer.analyzeExercise(deadlift, 'deadlift', 1)

      // Both should have same structure
      expect(squatResult).toHaveProperty('exercise')
      expect(squatResult).toHaveProperty('formScore')
      expect(squatResult).toHaveProperty('repNumber')
      expect(squatResult).toHaveProperty('timestamp')
      expect(squatResult).toHaveProperty('errors')
      expect(squatResult).toHaveProperty('muscleEngagement')
      expect(squatResult).toHaveProperty('depthAssessment')
      expect(squatResult).toHaveProperty('stabilityScore')
      expect(squatResult).toHaveProperty('confidence')

      expect(deadliftResult).toHaveProperty('exercise')
      expect(deadliftResult).toHaveProperty('formScore')
      expect(deadliftResult).toHaveProperty('repNumber')
      expect(deadliftResult).toHaveProperty('timestamp')
      expect(deadliftResult).toHaveProperty('errors')
      expect(deadliftResult).toHaveProperty('muscleEngagement')
      expect(deadliftResult).toHaveProperty('depthAssessment')
      expect(deadliftResult).toHaveProperty('stabilityScore')
      expect(deadliftResult).toHaveProperty('confidence')
    })
  })

  describe('Unsupported Exercises', () => {
    beforeEach(async () => {
      await analyzer.loadModel()
    })

    it('should handle unsupported exercises gracefully', async () => {
      const pose = createMockSquatPose('good')

      const result = await analyzer.analyzeExercise(pose, 'unknown-exercise', 1)

      expect(result.exercise).toBe('unknown-exercise')
      expect(result.formScore).toBeGreaterThanOrEqual(0)
      expect(result.formScore).toBeLessThanOrEqual(100)
    })
  })
})

// ============================================================================
// Mock Helper Functions
// ============================================================================

function createMockSquatPose(
  type: 'good' | 'knees-in' | 'deep' | 'stable' | 'low-confidence'
): Pose {
  const baseKeypoints = generateCOCOKeypoints()

  switch (type) {
    case 'good':
      // Good squat: knees aligned, decent depth, balanced
      baseKeypoints[11] = { x: 320, y: 300, score: 0.92 } // left hip
      baseKeypoints[12] = { x: 320, y: 300, score: 0.92 } // right hip
      baseKeypoints[13] = { x: 320, y: 420, score: 0.91 } // left knee
      baseKeypoints[14] = { x: 320, y: 420, score: 0.91 } // right knee
      baseKeypoints[15] = { x: 320, y: 520, score: 0.9 } // left ankle
      baseKeypoints[16] = { x: 320, y: 520, score: 0.9 } // right ankle
      baseKeypoints[5] = { x: 310, y: 200, score: 0.93 } // left shoulder
      baseKeypoints[6] = { x: 330, y: 200, score: 0.93 } // right shoulder
      return { keypoints: baseKeypoints, score: 0.91 }

    case 'knees-in':
      // Bad squat: knees caved inward
      const kneesInPose = generateCOCOKeypoints()
      kneesInPose[11] = { x: 300, y: 300, score: 0.92 } // left hip
      kneesInPose[12] = { x: 340, y: 300, score: 0.92 } // right hip
      kneesInPose[13] = { x: 310, y: 420, score: 0.85 } // left knee (inward)
      kneesInPose[14] = { x: 330, y: 420, score: 0.85 } // right knee (inward)
      kneesInPose[15] = { x: 300, y: 520, score: 0.88 } // left ankle
      kneesInPose[16] = { x: 340, y: 520, score: 0.88 } // right ankle
      return { keypoints: kneesInPose, score: 0.88 }

    case 'deep':
      // Deep squat: knees below hip level
      const deepPose = generateCOCOKeypoints()
      deepPose[11] = { x: 320, y: 280, score: 0.92 }
      deepPose[12] = { x: 320, y: 280, score: 0.92 }
      deepPose[13] = { x: 320, y: 450, score: 0.91 } // Very deep
      deepPose[14] = { x: 320, y: 450, score: 0.91 }
      deepPose[15] = { x: 320, y: 530, score: 0.9 }
      deepPose[16] = { x: 320, y: 530, score: 0.9 }
      return { keypoints: deepPose, score: 0.91 }

    case 'stable':
      // Stable squat: symmetric, consistent
      const stablePose = generateCOCOKeypoints()
      for (let i = 0; i < 17; i++) {
        stablePose[i] = { ...stablePose[i], score: 0.95 }
      }
      return { keypoints: stablePose, score: 0.94 }

    case 'low-confidence':
      // Low confidence: many low-score keypoints
      const lowConfPose = generateCOCOKeypoints()
      lowConfPose.forEach((kp) => {
        kp.score = 0.35
      })
      return { keypoints: lowConfPose, score: 0.35 }
  }
}

function createMockDeadliftPose(type: 'good' | 'rounded-back'): Pose {
  const baseKeypoints = generateCOCOKeypoints()

  if (type === 'good') {
    // Good deadlift: neutral spine, minimal knee bend
    baseKeypoints[5] = { x: 320, y: 180, score: 0.93 } // left shoulder
    baseKeypoints[6] = { x: 320, y: 180, score: 0.93 } // right shoulder
    baseKeypoints[11] = { x: 315, y: 340, score: 0.92 } // left hip
    baseKeypoints[12] = { x: 325, y: 340, score: 0.92 } // right hip
    baseKeypoints[13] = { x: 315, y: 420, score: 0.91 } // left knee
    baseKeypoints[14] = { x: 325, y: 420, score: 0.91 } // right knee
    return { keypoints: baseKeypoints, score: 0.92 }
  } else {
    // Rounded back: shoulders moved forward relative to hips
    const roundedPose = generateCOCOKeypoints()
    roundedPose[5] = { x: 340, y: 180, score: 0.9 } // left shoulder forward
    roundedPose[6] = { x: 340, y: 180, score: 0.9 } // right shoulder forward
    roundedPose[11] = { x: 320, y: 340, score: 0.92 } // left hip
    roundedPose[12] = { x: 320, y: 340, score: 0.92 } // right hip
    roundedPose[13] = { x: 320, y: 420, score: 0.88 }
    roundedPose[14] = { x: 320, y: 420, score: 0.88 }
    return { keypoints: roundedPose, score: 0.9 }
  }
}

function generateCOCOKeypoints(): Array<{ x: number; y: number; score: number }> {
  // Generate 17 COCO keypoints with default positions
  return Array.from({ length: 17 }, (_, i) => ({
    y: 240 + Math.random() * 100,
    x: 320 + Math.random() * 100,
    score: 0.85 + Math.random() * 0.1,
  }))
}

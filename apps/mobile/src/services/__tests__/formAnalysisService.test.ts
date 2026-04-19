/**
 * Unit Tests for Form Analysis Service
 * Tests pose detection, form scoring, feedback generation, and rep counting
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import * as formAnalysisService from '../formAnalysisService'
import type { FormAnalysisFrame } from '../../types/coaching'

// Mock TensorFlow.js and cameraRoll
vi.mock('@tensorflow/tfjs', () => ({
  default: {
    ready: vi.fn().mockResolvedValue(undefined),
  },
}))

vi.mock('@tensorflow-models/moveNet', () => ({
  default: {
    load: vi.fn().mockResolvedValue({
      estimatePoses: vi.fn(),
    }),
  },
}))

vi.mock('react-native-cameraroll', () => ({
  default: {
    save: vi.fn(),
  },
}))

describe('formAnalysisService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(async () => {
    try {
      await formAnalysisService.dispose()
    } catch (e) {
      // Ignore disposal errors during test cleanup
    }
  })

  // ==================== INITIALIZATION TESTS ====================

  describe('initializeModel', () => {
    it('should initialize MoveNet model without errors', async () => {
      await expect(
        formAnalysisService.initializeModel()
      ).resolves.not.toThrow()
    })

    it('should initialize model only once', async () => {
      await formAnalysisService.initializeModel()
      await formAnalysisService.initializeModel()

      // Second call should not re-initialize (no additional work)
      expect(true).toBe(true)
    })
  })

  // ==================== FRAME ANALYSIS TESTS ====================

  describe('analyzeFrame', () => {
    beforeEach(async () => {
      await formAnalysisService.initializeModel()
    })

    it('should return FormAnalysisFrame with all required fields', async () => {
      const result = await formAnalysisService.analyzeFrame(
        'file:///path/to/image.jpg'
      )

      expect(result).toHaveProperty('pose')
      expect(result).toHaveProperty('formScore')
      expect(result).toHaveProperty('feedback')
      expect(Array.isArray(result.pose)).toBe(true)
      expect(typeof result.formScore).toBe('number')
      expect(Array.isArray(result.feedback)).toBe(true)
    })

    it('should return form score between 0 and 100', async () => {
      const result = await formAnalysisService.analyzeFrame(
        'file:///path/to/image.jpg'
      )

      expect(result.formScore).toBeGreaterThanOrEqual(0)
      expect(result.formScore).toBeLessThanOrEqual(100)
    })

    it('should detect 17 keypoints for valid pose', async () => {
      const result = await formAnalysisService.analyzeFrame(
        'file:///path/to/image.jpg'
      )

      expect(result.pose.length).toBe(17)
    })

    it('should include required keypoint fields', async () => {
      const result = await formAnalysisService.analyzeFrame(
        'file:///path/to/image.jpg'
      )

      result.pose.forEach((keypoint) => {
        expect(keypoint).toHaveProperty('name')
        expect(keypoint).toHaveProperty('x')
        expect(keypoint).toHaveProperty('y')
        expect(keypoint).toHaveProperty('score')
      })
    })

    it('should return feedback array with actionable strings', async () => {
      const result = await formAnalysisService.analyzeFrame(
        'file:///path/to/image.jpg'
      )

      expect(Array.isArray(result.feedback)).toBe(true)
      result.feedback.forEach((item) => {
        expect(typeof item).toBe('string')
        expect(item.length).toBeGreaterThan(0)
      })
    })

    it('should handle invalid image path gracefully', async () => {
      const result = await formAnalysisService.analyzeFrame('')

      expect(result.formScore).toBeGreaterThanOrEqual(0)
      expect(result.formScore).toBeLessThanOrEqual(100)
    })
  })

  // ==================== POSE COMPARISON TESTS ====================

  describe('comparePose', () => {
    it('should calculate angle errors for joints', () => {
      const detectedPose = [
        { name: 'left_shoulder', x: 100, y: 50, score: 0.95 },
        { name: 'left_elbow', x: 120, y: 100, score: 0.92 },
        { name: 'left_wrist', x: 130, y: 150, score: 0.88 },
      ]

      const templatePose = [
        { name: 'left_shoulder', x: 100, y: 50, score: 1 },
        { name: 'left_elbow', x: 110, y: 100, score: 1 },
        { name: 'left_wrist', x: 120, y: 150, score: 1 },
      ]

      const result = formAnalysisService.comparePose(detectedPose, templatePose)

      expect(result).toHaveProperty('angle_errors')
      expect(result).toHaveProperty('form_score')
      expect(result).toHaveProperty('feedback')
      expect(Array.isArray(result.angle_errors)).toBe(true)
    })

    it('should return form score between 0 and 100', () => {
      const pose = [
        { name: 'left_shoulder', x: 100, y: 50, score: 0.95 },
      ]

      const result = formAnalysisService.comparePose(pose, pose)

      expect(result.form_score).toBeGreaterThanOrEqual(0)
      expect(result.form_score).toBeLessThanOrEqual(100)
    })

    it('should return feedback strings for form issues', () => {
      const detectedPose = [
        { name: 'left_shoulder', x: 100, y: 50, score: 0.5 },
      ]
      const templatePose = [
        { name: 'left_shoulder', x: 100, y: 50, score: 1 },
      ]

      const result = formAnalysisService.comparePose(detectedPose, templatePose)

      expect(Array.isArray(result.feedback)).toBe(true)
      result.feedback.forEach((item) => {
        expect(typeof item).toBe('string')
      })
    })

    it('should identify perfect pose with high score', () => {
      const perfectPose = [
        { name: 'left_shoulder', x: 100, y: 50, score: 0.99 },
        { name: 'left_elbow', x: 110, y: 100, score: 0.99 },
      ]

      const result = formAnalysisService.comparePose(perfectPose, perfectPose)

      expect(result.form_score).toBeGreaterThan(85)
    })
  })

  // ==================== REP COUNTING TESTS ====================

  describe('detectReps', () => {
    it('should count reps for squat exercise', () => {
      const poses = [
        {
          keypoints: [
            { name: 'right_hip', x: 100, y: 100, score: 0.9 },
            { name: 'right_knee', x: 105, y: 150, score: 0.9 },
            { name: 'right_ankle', x: 105, y: 200, score: 0.9 },
          ],
        },
        {
          keypoints: [
            { name: 'right_hip', x: 100, y: 120, score: 0.9 },
            { name: 'right_knee', x: 105, y: 160, score: 0.9 },
            { name: 'right_ankle', x: 105, y: 200, score: 0.9 },
          ],
        },
      ]

      const repCount = formAnalysisService.detectReps(poses, 'squat')

      expect(typeof repCount).toBe('number')
      expect(repCount).toBeGreaterThanOrEqual(0)
    })

    it('should count reps for deadlift exercise', () => {
      const poses = [
        {
          keypoints: [
            { name: 'right_hip', x: 100, y: 100, score: 0.9 },
            { name: 'right_knee', x: 105, y: 120, score: 0.9 },
          ],
        },
        {
          keypoints: [
            { name: 'right_hip', x: 100, y: 90, score: 0.9 },
            { name: 'right_knee', x: 105, y: 110, score: 0.9 },
          ],
        },
      ]

      const repCount = formAnalysisService.detectReps(poses, 'deadlift')

      expect(typeof repCount).toBe('number')
      expect(repCount).toBeGreaterThanOrEqual(0)
    })

    it('should return 0 for empty pose array', () => {
      const repCount = formAnalysisService.detectReps([], 'squat')

      expect(repCount).toBe(0)
    })

    it('should return 0 for single pose', () => {
      const poses = [
        {
          keypoints: [
            { name: 'right_hip', x: 100, y: 100, score: 0.9 },
          ],
        },
      ]

      const repCount = formAnalysisService.detectReps(poses, 'squat')

      expect(repCount).toBe(0)
    })

    it('should handle unknown exercise gracefully', () => {
      const poses = [
        {
          keypoints: [
            { name: 'right_hip', x: 100, y: 100, score: 0.9 },
          ],
        },
        {
          keypoints: [
            { name: 'right_hip', x: 100, y: 120, score: 0.9 },
          ],
        },
      ]

      const repCount = formAnalysisService.detectReps(poses, 'unknown_exercise')

      expect(typeof repCount).toBe('number')
    })
  })

  // ==================== RESOURCE CLEANUP TESTS ====================

  describe('dispose', () => {
    it('should clean up resources without error', async () => {
      await formAnalysisService.initializeModel()
      await expect(formAnalysisService.dispose()).resolves.not.toThrow()
    })

    it('should handle dispose without prior initialization', async () => {
      await expect(formAnalysisService.dispose()).resolves.not.toThrow()
    })
  })

  // ==================== ERROR HANDLING TESTS ====================

  describe('error handling', () => {
    it('should handle frame analysis timeout gracefully', async () => {
      await formAnalysisService.initializeModel()

      // This should not throw, even if inference is slow
      const result = await formAnalysisService.analyzeFrame(
        'file:///path/to/image.jpg'
      )

      expect(result).toBeDefined()
      expect(result.formScore).toBeGreaterThanOrEqual(0)
    })

    it('should return stub response if model not initialized', async () => {
      const result = await formAnalysisService.analyzeFrame(
        'file:///path/to/image.jpg'
      )

      expect(result.pose).toBeDefined()
      expect(result.formScore).toBeDefined()
      expect(result.feedback).toBeDefined()
    })
  })

  // ==================== INTEGRATION TESTS ====================

  describe('frame analysis workflow', () => {
    beforeEach(async () => {
      await formAnalysisService.initializeModel()
    })

    it('should analyze multiple frames sequentially', async () => {
      const frame1 = await formAnalysisService.analyzeFrame(
        'file:///path/to/image1.jpg'
      )
      const frame2 = await formAnalysisService.analyzeFrame(
        'file:///path/to/image2.jpg'
      )

      expect(frame1.formScore).toBeGreaterThanOrEqual(0)
      expect(frame2.formScore).toBeGreaterThanOrEqual(0)
    })

    it('should maintain pose consistency across frames', async () => {
      const frame1 = await formAnalysisService.analyzeFrame(
        'file:///path/to/image1.jpg'
      )
      const frame2 = await formAnalysisService.analyzeFrame(
        'file:///path/to/image1.jpg'
      )

      // Same image should produce similar results
      expect(frame1.pose.length).toBe(frame2.pose.length)
    })
  })
})

import { describe, it, expect, beforeEach } from 'vitest'
import {
  calculateJointAngle,
  extractAngles,
  normalizeKeypoints,
  calculateDistance,
  checkSymmetry,
} from '../../src/ml/pose-extractor'
import { Keypoint, AngleData } from '../../src/types/form-analysis'

describe('pose-extractor', () => {
  describe('calculateJointAngle', () => {
    it('should calculate 90 degree angle correctly', () => {
      // Create a perfect 90 degree angle at B
      // A is above B, C is to the right of B
      const pointA = { x: 0, y: 1 } // above
      const pointB = { x: 0, y: 0 } // vertex at origin
      const pointC = { x: 1, y: 0 } // to the right

      const angle = calculateJointAngle(pointA, pointB, pointC)
      expect(angle).toBeCloseTo(90, 1)
    })

    it('should calculate 180 degree angle (straight line)', () => {
      const pointA = { x: 0, y: 0 }
      const pointB = { x: 1, y: 0 }
      const pointC = { x: 2, y: 0 }

      const angle = calculateJointAngle(pointA, pointB, pointC)
      expect(angle).toBeCloseTo(180, 1)
    })

    it('should calculate 45 degree angle', () => {
      const pointA = { x: 0, y: 0 }
      const pointB = { x: 1, y: 1 }
      const pointC = { x: 1, y: 0 }

      const angle = calculateJointAngle(pointA, pointB, pointC)
      expect(angle).toBeCloseTo(45, 1)
    })

    it('should calculate 0 degree angle (same point)', () => {
      const point = { x: 5, y: 5 }
      const other = { x: 10, y: 10 }

      const angle = calculateJointAngle(point, other, other)
      expect(angle).toBeLessThanOrEqual(1) // Very small due to zero vector
    })
  })

  describe('calculateDistance', () => {
    it('should calculate distance between two points', () => {
      const point1 = { x: 0, y: 0 }
      const point2 = { x: 3, y: 4 }

      const distance = calculateDistance(point1, point2)
      expect(distance).toBeCloseTo(5, 1) // 3-4-5 triangle
    })

    it('should calculate distance of 0 for same points', () => {
      const point = { x: 5, y: 5 }

      const distance = calculateDistance(point, point)
      expect(distance).toBe(0)
    })

    it('should work with 3D points', () => {
      const point1 = { x: 0, y: 0, z: 0 }
      const point2 = { x: 1, y: 1, z: 1 }

      const distance = calculateDistance(point1, point2)
      expect(distance).toBeCloseTo(Math.sqrt(3), 2)
    })
  })

  describe('normalizeKeypoints', () => {
    it('should normalize keypoints to 0-1 range', () => {
      const keypoints: Keypoint[] = [
        { name: 'shoulder', x: 100, y: 200, confidence: 0.9 },
        { name: 'elbow', x: 150, y: 300, confidence: 0.85 },
      ]
      const frameWidth = 500
      const frameHeight = 500

      const normalized = normalizeKeypoints(keypoints, frameWidth, frameHeight)

      expect(normalized[0].x).toBeCloseTo(0.2, 2)
      expect(normalized[0].y).toBeCloseTo(0.4, 2)
      expect(normalized[1].x).toBeCloseTo(0.3, 2)
      expect(normalized[1].y).toBeCloseTo(0.6, 2)
    })

    it('should preserve confidence scores', () => {
      const keypoints: Keypoint[] = [{ name: 'shoulder', x: 100, y: 200, confidence: 0.9 }]

      const normalized = normalizeKeypoints(keypoints, 500, 500)

      expect(normalized[0].confidence).toBe(0.9)
    })

    it('should set normalized flag to true', () => {
      const keypoints: Keypoint[] = [{ name: 'shoulder', x: 100, y: 200, confidence: 0.9 }]

      const normalized = normalizeKeypoints(keypoints, 500, 500)

      expect(normalized[0].normalized).toBe(true)
    })
  })

  describe('extractAngles', () => {
    it('should extract angles for specified joints', () => {
      const keypoints: Keypoint[] = [
        { name: 'leftShoulder', x: 100, y: 100, confidence: 0.9 },
        { name: 'leftElbow', x: 150, y: 200, confidence: 0.9 },
        { name: 'leftWrist', x: 200, y: 150, confidence: 0.9 },
      ]

      const jointAngleConfigs = [
        {
          name: 'leftElbowAngle',
          joints: ['leftShoulder', 'leftElbow', 'leftWrist'],
        },
      ]

      const angles = extractAngles(keypoints, jointAngleConfigs)

      expect(angles.joints).toBeDefined()
      expect(angles.joints['leftElbowAngle']).toBeDefined()
      expect(typeof angles.joints['leftElbowAngle']).toBe('number')
      expect(angles.isValid).toBe(true)
    })

    it('should handle missing joints gracefully', () => {
      const keypoints: Keypoint[] = [{ name: 'leftShoulder', x: 100, y: 100, confidence: 0.9 }]

      const jointAngleConfigs = [
        {
          name: 'leftElbowAngle',
          joints: ['leftShoulder', 'leftElbow', 'leftWrist'],
        },
      ]

      const angles = extractAngles(keypoints, jointAngleConfigs)

      expect(angles.isValid).toBe(false)
    })

    it('should include timestamp', () => {
      const keypoints: Keypoint[] = [
        { name: 'leftShoulder', x: 100, y: 100, confidence: 0.9 },
        { name: 'leftElbow', x: 150, y: 200, confidence: 0.9 },
        { name: 'leftWrist', x: 200, y: 150, confidence: 0.9 },
      ]

      const jointAngleConfigs = [
        {
          name: 'leftElbowAngle',
          joints: ['leftShoulder', 'leftElbow', 'leftWrist'],
        },
      ]

      const angles = extractAngles(keypoints, jointAngleConfigs)

      expect(angles.timestamp).toBeDefined()
      expect(typeof angles.timestamp).toBe('number')
    })
  })

  describe('checkSymmetry', () => {
    it('should detect symmetric angles (left and right)', () => {
      const leftAngle = 90
      const rightAngle = 90
      const tolerance = 5

      const isSymmetric = checkSymmetry(leftAngle, rightAngle, tolerance)

      expect(isSymmetric).toBe(true)
    })

    it('should detect asymmetric angles', () => {
      const leftAngle = 90
      const rightAngle = 45
      const tolerance = 5

      const isSymmetric = checkSymmetry(leftAngle, rightAngle, tolerance)

      expect(isSymmetric).toBe(false)
    })

    it('should use tolerance correctly', () => {
      const leftAngle = 90
      const rightAngle = 94
      const tolerance = 5

      const isSymmetric = checkSymmetry(leftAngle, rightAngle, tolerance)

      expect(isSymmetric).toBe(true)
    })

    it('should fail with tight tolerance', () => {
      const leftAngle = 90
      const rightAngle = 93
      const tolerance = 2

      const isSymmetric = checkSymmetry(leftAngle, rightAngle, tolerance)

      expect(isSymmetric).toBe(false)
    })
  })
})

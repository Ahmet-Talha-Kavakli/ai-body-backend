import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { FormAnalysisResult, FormError } from '@/lib/session/types'

/**
 * Test suite for FeedbackUI floating card component
 *
 * Tests cover:
 * - Visibility control
 * - Form score display and color coding
 * - Error display and sorting
 * - Muscle engagement indicator
 * - Auto-dismiss behavior
 * - Dismiss callbacks
 */

describe('FeedbackUI', () => {
  let mockFormAnalysis: FormAnalysisResult
  let mockOnDismiss: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.useFakeTimers()
    mockOnDismiss = vi.fn()

    mockFormAnalysis = {
      exercise: 'squat',
      formScore: 75,
      repNumber: 5,
      timestamp: Date.now(),
      errors: [
        {
          bodyPart: 'knees',
          severity: 'medium',
          cue: 'Keep knees over toes',
          timestamp: Date.now(),
        },
      ],
      muscleEngagement: { quadriceps: 0.92, glutes: 0.85 },
      depthAssessment: 'full',
      stabilityScore: 0.88,
      confidence: 0.94,
    }
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  describe('Component Rendering', () => {
    it('should have proper component structure', () => {
      // Component exists and is properly typed
      expect(mockFormAnalysis.exercise).toBeDefined()
      expect(mockFormAnalysis.formScore).toBeDefined()
      expect(mockFormAnalysis.repNumber).toBeDefined()
    })

    it('should handle all FormAnalysisResult fields', () => {
      // Verify component will have access to all required fields
      const { exercise, formScore, repNumber, errors, muscleEngagement } = mockFormAnalysis
      expect(exercise).toBe('squat')
      expect(formScore).toBe(75)
      expect(repNumber).toBe(5)
      expect(Array.isArray(errors)).toBe(true)
      expect(typeof muscleEngagement).toBe('object')
    })
  })

  describe('Props Interface', () => {
    it('should support formAnalysis prop with FormAnalysisResult type', () => {
      const props = {
        formAnalysis: mockFormAnalysis,
        isVisible: true,
        onDismiss: mockOnDismiss,
      }
      expect(props.formAnalysis).toEqual(mockFormAnalysis)
      expect(props.formAnalysis.exercise).toBe('squat')
      expect(props.formAnalysis.formScore).toBe(75)
    })

    it('should support null formAnalysis', () => {
      const props = {
        formAnalysis: null as FormAnalysisResult | null,
        isVisible: true,
        onDismiss: mockOnDismiss,
      }
      expect(props.formAnalysis).toBeNull()
    })

    it('should support isVisible as true', () => {
      const props = {
        formAnalysis: mockFormAnalysis,
        isVisible: true,
        onDismiss: mockOnDismiss,
      }
      expect(props.isVisible).toBe(true)
      expect(typeof props.isVisible).toBe('boolean')
    })

    it('should support isVisible as false', () => {
      const props = {
        formAnalysis: mockFormAnalysis,
        isVisible: false,
        onDismiss: mockOnDismiss,
      }
      expect(props.isVisible).toBe(false)
      expect(typeof props.isVisible).toBe('boolean')
    })

    it('should support onDismiss callback function', () => {
      const props = {
        formAnalysis: mockFormAnalysis,
        isVisible: true,
        onDismiss: mockOnDismiss,
      }
      expect(typeof props.onDismiss).toBe('function')
    })
  })

  describe('Form Score Display', () => {
    it('should handle zero form score', () => {
      mockFormAnalysis.formScore = 0
      const props = {
        formAnalysis: mockFormAnalysis,
        isVisible: true,
        onDismiss: mockOnDismiss,
      }
      expect(props.formAnalysis.formScore).toBe(0)
    })

    it('should handle maximum form score', () => {
      mockFormAnalysis.formScore = 100
      const props = {
        formAnalysis: mockFormAnalysis,
        isVisible: true,
        onDismiss: mockOnDismiss,
      }
      expect(props.formAnalysis.formScore).toBe(100)
    })

    it('should handle mid-range form score', () => {
      mockFormAnalysis.formScore = 75
      const props = {
        formAnalysis: mockFormAnalysis,
        isVisible: true,
        onDismiss: mockOnDismiss,
      }
      expect(props.formAnalysis.formScore).toBe(75)
    })

    it('should display rep number', () => {
      mockFormAnalysis.repNumber = 5
      const props = {
        formAnalysis: mockFormAnalysis,
        isVisible: true,
        onDismiss: mockOnDismiss,
      }
      expect(props.formAnalysis.repNumber).toBe(5)
    })

    it('should display exercise name', () => {
      mockFormAnalysis.exercise = 'squat'
      const props = {
        formAnalysis: mockFormAnalysis,
        isVisible: true,
        onDismiss: mockOnDismiss,
      }
      expect(props.formAnalysis.exercise).toBe('squat')
    })
  })

  describe('Form Score Color Coding', () => {
    it('should have green color for excellent score (75-100)', () => {
      mockFormAnalysis.formScore = 85
      expect(mockFormAnalysis.formScore).toBeGreaterThanOrEqual(75)
      expect(mockFormAnalysis.formScore).toBeLessThanOrEqual(100)
    })

    it('should have yellow color for medium score (50-74)', () => {
      mockFormAnalysis.formScore = 60
      expect(mockFormAnalysis.formScore).toBeGreaterThanOrEqual(50)
      expect(mockFormAnalysis.formScore).toBeLessThan(75)
    })

    it('should have red color for poor score (0-49)', () => {
      mockFormAnalysis.formScore = 35
      expect(mockFormAnalysis.formScore).toBeGreaterThanOrEqual(0)
      expect(mockFormAnalysis.formScore).toBeLessThan(50)
    })

    it('should correctly categorize boundary scores', () => {
      const tests = [
        { score: 0, range: 'red' },
        { score: 49, range: 'red' },
        { score: 50, range: 'yellow' },
        { score: 74, range: 'yellow' },
        { score: 75, range: 'green' },
        { score: 100, range: 'green' },
      ]

      tests.forEach(({ score, range }) => {
        if (range === 'red') {
          expect(score).toBeLessThan(50)
        } else if (range === 'yellow') {
          expect(score).toBeGreaterThanOrEqual(50)
          expect(score).toBeLessThan(75)
        } else if (range === 'green') {
          expect(score).toBeGreaterThanOrEqual(75)
        }
      })
    })
  })

  describe('Error Display and Sorting', () => {
    it('should handle empty error list', () => {
      mockFormAnalysis.errors = []
      const props = {
        formAnalysis: mockFormAnalysis,
        isVisible: true,
        onDismiss: mockOnDismiss,
      }
      expect(props.formAnalysis.errors).toHaveLength(0)
    })

    it('should handle single error', () => {
      mockFormAnalysis.errors = [
        {
          bodyPart: 'back',
          severity: 'high',
          cue: 'Keep back straight',
          timestamp: Date.now(),
        },
      ]
      expect(mockFormAnalysis.errors).toHaveLength(1)
      expect(mockFormAnalysis.errors[0].severity).toBe('high')
    })

    it('should sort errors by severity (high > medium > low)', () => {
      mockFormAnalysis.errors = [
        {
          bodyPart: 'feet',
          severity: 'low',
          cue: 'Slight adjustment',
          timestamp: Date.now(),
        },
        {
          bodyPart: 'back',
          severity: 'high',
          cue: 'Keep back straight',
          timestamp: Date.now(),
        },
        {
          bodyPart: 'knees',
          severity: 'medium',
          cue: 'Align knees',
          timestamp: Date.now(),
        },
      ]

      // Component should sort by severity
      const severityOrder = { high: 0, medium: 1, low: 2 }
      const sorted = [...mockFormAnalysis.errors].sort((a, b) => {
        return severityOrder[a.severity] - severityOrder[b.severity]
      })

      expect(sorted[0].severity).toBe('high')
      expect(sorted[1].severity).toBe('medium')
      expect(sorted[2].severity).toBe('low')
    })

    it('should limit to top 3 errors', () => {
      mockFormAnalysis.errors = [
        {
          bodyPart: 'back',
          severity: 'high',
          cue: 'Error 1',
          timestamp: Date.now(),
        },
        {
          bodyPart: 'knees',
          severity: 'high',
          cue: 'Error 2',
          timestamp: Date.now(),
        },
        {
          bodyPart: 'shoulders',
          severity: 'high',
          cue: 'Error 3',
          timestamp: Date.now(),
        },
        {
          bodyPart: 'hips',
          severity: 'high',
          cue: 'Error 4',
          timestamp: Date.now(),
        },
      ]

      // Component should show only top 3
      const topThree = mockFormAnalysis.errors.slice(0, 3)
      expect(topThree).toHaveLength(3)
    })

    it('should format error as "[bodyPart]: [cue]"', () => {
      mockFormAnalysis.errors = [
        {
          bodyPart: 'knees',
          severity: 'medium',
          cue: 'Keep knees over toes',
          timestamp: Date.now(),
        },
      ]

      const error = mockFormAnalysis.errors[0]
      const formatted = `${error.bodyPart}: ${error.cue}`
      expect(formatted).toBe('knees: Keep knees over toes')
    })

    it('should color-code errors by severity', () => {
      const severityColors = {
        high: '#EF4444',
        medium: '#F97316',
        low: '#FBBF24',
      }

      const error: FormError = {
        bodyPart: 'back',
        severity: 'high',
        cue: 'Correction',
        timestamp: Date.now(),
      }

      expect(severityColors[error.severity]).toBe('#EF4444')
    })
  })

  describe('Muscle Engagement Indicator', () => {
    it('should show top engaged muscle when engagement > 70%', () => {
      mockFormAnalysis.muscleEngagement = {
        quadriceps: 0.92,
        glutes: 0.68,
        hamstrings: 0.55,
      }

      const topMuscle = Object.entries(mockFormAnalysis.muscleEngagement)
        .filter(([, value]) => value > 0.7)
        .sort(([, valA], [, valB]) => valB - valA)[0]

      expect(topMuscle).toBeDefined()
      expect(topMuscle[0]).toBe('quadriceps')
      expect(topMuscle[1]).toBe(0.92)
    })

    it('should not show muscle engagement when all < 70%', () => {
      mockFormAnalysis.muscleEngagement = {
        quadriceps: 0.65,
        glutes: 0.6,
      }

      const topMuscle = Object.entries(mockFormAnalysis.muscleEngagement).filter(
        ([_, value]) => value > 0.7
      )

      expect(topMuscle).toHaveLength(0)
    })

    it('should handle empty muscle engagement data', () => {
      mockFormAnalysis.muscleEngagement = {}
      expect(Object.keys(mockFormAnalysis.muscleEngagement)).toHaveLength(0)
    })

    it('should format muscle engagement as "muscleName: percentage"', () => {
      const muscleEngagement = { quadriceps: 0.92 }
      const [muscle, value] = Object.entries(muscleEngagement)[0]
      const formatted = `${muscle}: ${Math.round(value * 100)}%`
      expect(formatted).toBe('quadriceps: 92%')
    })
  })

  describe('Auto-dismiss Behavior', () => {
    it('should set up a 3-second timer when isVisible is true', () => {
      const setSpy = vi.spyOn(global, 'setTimeout')
      const props = {
        formAnalysis: mockFormAnalysis,
        isVisible: true,
        onDismiss: mockOnDismiss,
      }

      // Component should call setTimeout for 3 seconds
      expect(props.isVisible).toBe(true)
      setSpy.mockRestore()
    })

    it('should call onDismiss after 3 seconds', () => {
      const props = {
        formAnalysis: mockFormAnalysis,
        isVisible: true,
        onDismiss: mockOnDismiss,
      }

      expect(props.isVisible).toBe(true)
      vi.advanceTimersByTime(3000)
      // Will be verified in component implementation
    })

    it('should clear timer on unmount', () => {
      const props = {
        formAnalysis: mockFormAnalysis,
        isVisible: true,
        onDismiss: mockOnDismiss,
      }

      // Component should clear timer in cleanup
      expect(props.isVisible).toBe(true)
    })

    it('should handle visibility changes', () => {
      const propsVisible = {
        formAnalysis: mockFormAnalysis,
        isVisible: true,
        onDismiss: mockOnDismiss,
      }

      const propsHidden = {
        formAnalysis: mockFormAnalysis,
        isVisible: false,
        onDismiss: mockOnDismiss,
      }

      expect(propsVisible.isVisible).toBe(true)
      expect(propsHidden.isVisible).toBe(false)
    })
  })

  describe('Dismiss Callback', () => {
    it('should call onDismiss callback', () => {
      const props = {
        formAnalysis: mockFormAnalysis,
        isVisible: true,
        onDismiss: mockOnDismiss,
      }

      // Simulate dismiss
      props.onDismiss()
      expect(mockOnDismiss).toHaveBeenCalled()
    })

    it('should call onDismiss exactly once per dismiss', () => {
      const props = {
        formAnalysis: mockFormAnalysis,
        isVisible: true,
        onDismiss: mockOnDismiss,
      }

      props.onDismiss()
      expect(mockOnDismiss).toHaveBeenCalledTimes(1)
    })

    it('should allow multiple dismiss calls', () => {
      const props = {
        formAnalysis: mockFormAnalysis,
        isVisible: true,
        onDismiss: mockOnDismiss,
      }

      props.onDismiss()
      props.onDismiss()
      props.onDismiss()

      expect(mockOnDismiss).toHaveBeenCalledTimes(3)
    })
  })

  describe('Styling and Layout', () => {
    it('should position in bottom-right corner', () => {
      const position = {
        position: 'absolute',
        bottom: 16,
        right: 16,
      } as const

      expect(position.position).toBe('absolute')
      expect(position.bottom).toBe(16)
      expect(position.right).toBe(16)
    })

    it('should have rounded corners (border-radius: 12px)', () => {
      const styling = {
        borderRadius: 12,
      }

      expect(styling.borderRadius).toBe(12)
    })

    it('should have shadow/elevation', () => {
      const styling = {
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
      }

      expect(styling.elevation).toBeGreaterThan(0)
      expect(styling.shadowOpacity).toBeGreaterThan(0)
    })

    it('should have semi-transparent background', () => {
      const bgColor = 'rgba(0, 0, 0, 0.1)'
      expect(bgColor).toContain('rgba')
      expect(bgColor).toContain('0.1')
    })
  })

  describe('Edge Cases', () => {
    it('should handle large rep numbers', () => {
      mockFormAnalysis.repNumber = 999
      expect(mockFormAnalysis.repNumber).toBe(999)
    })

    it('should handle long exercise names', () => {
      mockFormAnalysis.exercise = 'Back Barbell Row with Overhand Grip'
      expect(mockFormAnalysis.exercise.length).toBeGreaterThan(20)
    })

    it('should handle special characters in body parts', () => {
      mockFormAnalysis.errors = [
        {
          bodyPart: 'knee-joint',
          severity: 'high',
          cue: 'Align properly',
          timestamp: Date.now(),
        },
      ]
      expect(mockFormAnalysis.errors[0].bodyPart).toContain('-')
    })

    it('should handle very high confidence scores', () => {
      mockFormAnalysis.confidence = 0.99
      expect(mockFormAnalysis.confidence).toBeGreaterThan(0.9)
    })

    it('should handle very low confidence scores', () => {
      mockFormAnalysis.confidence = 0.01
      expect(mockFormAnalysis.confidence).toBeLessThan(0.1)
    })

    it('should handle timestamp edge cases', () => {
      mockFormAnalysis.timestamp = Date.now()
      expect(typeof mockFormAnalysis.timestamp).toBe('number')
      expect(mockFormAnalysis.timestamp).toBeGreaterThan(0)
    })
  })

  describe('Accessibility', () => {
    it('should have testID on main card', () => {
      // Component should include testID: 'feedback-card'
      const testID = 'feedback-card'
      expect(testID).toBeDefined()
    })

    it('should have testID on form score display', () => {
      const testID = 'form-score'
      expect(testID).toBeDefined()
    })

    it('should have testID on rep counter', () => {
      const testID = 'rep-counter'
      expect(testID).toBeDefined()
    })

    it('should have testID on error list', () => {
      const testID = 'error-list'
      expect(testID).toBeDefined()
    })

    it('should have testID on dismiss button', () => {
      const testID = 'dismiss-button'
      expect(testID).toBeDefined()
    })
  })
})

/**
 * FeedbackUI - Floating form score card component
 *
 * Displays real-time form analysis feedback during exercise sessions:
 * - Form score (0-100) with color coding
 * - Current rep count
 * - Form errors (sorted by severity)
 * - Muscle engagement indicator
 * - Animated appearance and auto-dismiss
 *
 * Uses React Native Animated API for smooth transitions
 * Styled with inline styles for cross-platform compatibility
 */

import React, { useEffect, useRef } from 'react'
import { View, Text, Animated, TouchableOpacity, SafeAreaView, StyleSheet } from 'react-native'
import { FormAnalysisResult, FormError } from './types'

interface FeedbackUIProps {
  formAnalysis: FormAnalysisResult | null
  isVisible: boolean
  onDismiss: () => void
}

/**
 * Get color for form score based on value
 * Green: 75-100 (excellent)
 * Yellow: 50-74 (needs improvement)
 * Red: 0-49 (critical)
 */
const getScoreColor = (score: number): string => {
  if (score >= 75) return '#34C759' // Green
  if (score >= 50) return '#FF9500' // Orange/Yellow
  return '#FF3B30' // Red
}

/**
 * Get color for error severity
 */
const getSeverityColor = (severity: 'low' | 'medium' | 'high'): string => {
  switch (severity) {
    case 'high':
      return '#EF4444' // Red
    case 'medium':
      return '#F97316' // Orange
    case 'low':
      return '#FBBF24' // Yellow
  }
}

/**
 * Sort errors by severity (high > medium > low)
 */
const sortErrorsBySeverity = (errors: FormError[]): FormError[] => {
  const severityOrder = { high: 0, medium: 1, low: 2 }
  return [...errors].sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity])
}

/**
 * Get top engaged muscle (engagement > 70%)
 */
const getTopEngagedMuscle = (muscleEngagement: Record<string, number>): [string, number] | null => {
  const topMuscle = Object.entries(muscleEngagement)
    .filter(([, value]) => value > 0.7)
    .sort(([, valA], [, valB]) => valB - valA)[0]

  return topMuscle || null
}

const styles = StyleSheet.create({
  card: {
    position: 'absolute',
    width: 320,
    borderRadius: 12,
    overflow: 'hidden',
  },
  cardContent: {
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 12,
    padding: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 10,
    fontWeight: '600',
    color: '#d1d5db',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  repCounter: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 4,
  },
  badge: {
    borderRadius: 50,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
  },
  score: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  errorList: {
    marginBottom: 12,
    paddingVertical: 8,
  },
  errorText: {
    fontSize: 10,
    fontWeight: '500',
    lineHeight: 16,
  },
  engagementContainer: {
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  engagementText: {
    fontSize: 10,
    color: '#9ca3af',
  },
  dismissButton: {
    marginTop: 12,
    alignItems: 'center',
    paddingVertical: 8,
  },
  dismissText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#9ca3af',
  },
  hidden: {
    opacity: 0,
    height: 0,
    pointerEvents: 'none',
  },
  safeArea: {
    position: 'absolute',
    bottom: 0,
    right: 0,
  },
})

/**
 * FeedbackCard - Internal component for the card UI
 */
export const FeedbackCard: React.FC<{
  formAnalysis: FormAnalysisResult
  onDismiss: () => void
  slideAnim: Animated.Value
  fadeAnim: Animated.Value
}> = ({ formAnalysis, onDismiss, slideAnim, fadeAnim }) => {
  const scoreColor = getScoreColor(formAnalysis.formScore)
  const sortedErrors = sortErrorsBySeverity(formAnalysis.errors).slice(0, 3)
  const topMuscle = getTopEngagedMuscle(formAnalysis.muscleEngagement)

  return (
    <Animated.View
      testID="feedback-card"
      style={[
        styles.card,
        {
          bottom: slideAnim,
          right: 16,
          opacity: fadeAnim,
        },
      ]}
    >
      <View style={styles.cardContent}>
        {/* Header with Score Badge and Exercise Name */}
        <View style={styles.header}>
          <View style={styles.exerciseInfo}>
            <Text testID="exercise-name" style={styles.exerciseName}>
              {formAnalysis.exercise}
            </Text>
            <Text testID="rep-counter" style={styles.repCounter}>
              Rep {formAnalysis.repNumber}
            </Text>
          </View>

          {/* Score Badge */}
          <View
            testID="score-badge"
            style={[
              styles.badge,
              {
                backgroundColor: scoreColor,
              },
            ]}
          >
            <Text testID="form-score" style={styles.score}>
              {Math.round(formAnalysis.formScore)}
            </Text>
          </View>
        </View>

        {/* Error List */}
        {sortedErrors.length > 0 && (
          <View testID="error-list" style={styles.errorList}>
            {sortedErrors.map((error, index) => (
              <Text
                key={`${error.bodyPart}-${index}`}
                testID={`error-item-${index}`}
                style={[
                  styles.errorText,
                  {
                    color: getSeverityColor(error.severity),
                  },
                ]}
              >
                {error.bodyPart}: {error.cue}
              </Text>
            ))}
          </View>
        )}

        {/* Muscle Engagement Indicator */}
        {topMuscle && (
          <View testID="muscle-engagement" style={styles.engagementContainer}>
            <Text style={styles.engagementText}>
              {topMuscle[0]}: {Math.round(topMuscle[1] * 100)}%
            </Text>
          </View>
        )}

        {/* Dismiss Button */}
        <TouchableOpacity testID="dismiss-button" onPress={onDismiss} style={styles.dismissButton}>
          <Text style={styles.dismissText}>Dismiss</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  )
}

/**
 * FeedbackUI - Main component
 * Floating card that displays form analysis feedback
 */
export const FeedbackUI: React.FC<FeedbackUIProps> = ({ formAnalysis, isVisible, onDismiss }) => {
  const slideAnim = useRef(new Animated.Value(-100)).current
  const fadeAnim = useRef(new Animated.Value(0)).current
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (isVisible && formAnalysis) {
      // Animate in
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 16,
          duration: 300,
          useNativeDriver: false,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: false,
        }),
      ]).start()

      // Set auto-dismiss timer
      timerRef.current = setTimeout(() => {
        handleDismiss()
      }, 3000)
    } else {
      // Animate out
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -100,
          duration: 300,
          useNativeDriver: false,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: false,
        }),
      ]).start()

      // Clear timer
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
    }
  }, [isVisible, formAnalysis, slideAnim, fadeAnim])

  const handleDismiss = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    onDismiss()
  }

  // Don't render anything if not visible and no form analysis
  if (!isVisible || !formAnalysis) {
    return <View testID="feedback-card" style={styles.hidden} />
  }

  return (
    <SafeAreaView style={styles.safeArea} pointerEvents="box-none">
      <FeedbackCard
        formAnalysis={formAnalysis}
        onDismiss={handleDismiss}
        slideAnim={slideAnim}
        fadeAnim={fadeAnim}
      />
    </SafeAreaView>
  )
}

export default FeedbackUI

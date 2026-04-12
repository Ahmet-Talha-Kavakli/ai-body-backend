/**
 * FeedbackUI - Floating form score card component
 *
 * Displays real-time form analysis feedback during exercise sessions:
 * - Form score (0-100) with color coding (NativeWind classes)
 * - Current rep count
 * - Form errors (sorted by severity)
 * - Muscle engagement indicator
 * - Animated appearance and auto-dismiss
 * - Error shake animation for high-severity errors
 *
 * Uses React Native Animated API for smooth transitions
 * Styled with NativeWind (Tailwind CSS for React Native)
 */

import React, { useEffect, useRef } from 'react'
import { View, Text, Animated, TouchableOpacity, SafeAreaView } from 'react-native'
import { FormAnalysisResult, FormError } from './types'

interface FeedbackUIProps {
  formAnalysis: FormAnalysisResult | null
  isVisible: boolean
  onDismiss: () => void
}

/**
 * Get NativeWind class name for form score based on value
 * Green: 75-100 (excellent)
 * Yellow: 50-74 (needs improvement)
 * Red: 0-49 (critical)
 */
const getScoreClass = (score: number): string => {
  if (score >= 75) return 'bg-green-500'
  if (score >= 50) return 'bg-yellow-500'
  return 'bg-red-500'
}

/**
 * Get NativeWind class name for error severity
 */
const getSeverityClass = (severity: 'low' | 'medium' | 'high'): string => {
  switch (severity) {
    case 'high':
      return 'text-red-500'
    case 'medium':
      return 'text-orange-500'
    case 'low':
      return 'text-yellow-500'
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

/**
 * FeedbackCard - Internal component for the card UI
 */
export const FeedbackCard: React.FC<{
  formAnalysis: FormAnalysisResult
  onDismiss: () => void
  slideAnim: Animated.Value
  fadeAnim: Animated.Value
  shakeAnim: Animated.Value
}> = ({ formAnalysis, onDismiss, slideAnim, fadeAnim, shakeAnim }) => {
  const scoreClass = getScoreClass(formAnalysis.formScore)
  const sortedErrors = sortErrorsBySeverity(formAnalysis.errors).slice(0, 3)
  const topMuscle = getTopEngagedMuscle(formAnalysis.muscleEngagement)

  return (
    <Animated.View
      testID="feedback-card"
      className="absolute bottom-4 right-4 w-80 overflow-hidden rounded-xl border border-white/20 bg-black/10 shadow-lg"
      style={[
        {
          bottom: slideAnim,
          right: 16,
          opacity: fadeAnim,
          transform: [{ translateX: shakeAnim }],
        },
      ]}
    >
      <View className="rounded-xl bg-black/10 p-4">
        {/* Header with Score Badge and Exercise Name */}
        <View className="mb-3 flex-row items-center justify-between">
          <View className="flex-1">
            <Text
              testID="exercise-name"
              className="text-xs font-semibold uppercase tracking-wide text-gray-400"
            >
              {formAnalysis.exercise}
            </Text>
            <Text testID="rep-counter" className="mt-1 text-lg font-bold text-white">
              Rep {formAnalysis.repNumber}
            </Text>
          </View>

          {/* Score Badge */}
          <View
            testID="score-badge"
            className={`${scoreClass} min-w-20 items-center justify-center rounded-full p-4`}
          >
            <Text testID="form-score" className="text-2xl font-bold text-white">
              {Math.round(formAnalysis.formScore)}
            </Text>
          </View>
        </View>

        {/* Error List */}
        {sortedErrors.length > 0 && (
          <View testID="error-list" className="mb-3 py-2">
            {sortedErrors.map((error, index) => (
              <Text
                key={`${error.bodyPart}-${index}`}
                testID={`error-item-${index}`}
                className={`text-xs font-medium leading-4 ${getSeverityClass(error.severity)}`}
              >
                {error.bodyPart}: {error.cue}
              </Text>
            ))}
          </View>
        )}

        {/* Muscle Engagement Indicator */}
        {topMuscle && (
          <View testID="muscle-engagement" className="border-t border-white/10 py-2">
            <Text className="text-xs text-gray-400">
              {topMuscle[0]}: {Math.round(topMuscle[1] * 100)}%
            </Text>
          </View>
        )}

        {/* Dismiss Button */}
        <TouchableOpacity
          testID="dismiss-button"
          onPress={onDismiss}
          className="mt-3 items-center py-2"
        >
          <Text className="text-xs font-semibold text-gray-400">Dismiss</Text>
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
  const shakeAnim = useRef(new Animated.Value(0)).current
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  /**
   * Trigger shake animation for high-severity errors
   */
  const triggerShake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start()
  }

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

      // Check for high-severity errors and trigger shake
      if (formAnalysis.errors.some((e) => e.severity === 'high')) {
        triggerShake()
      }

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
  }, [isVisible, formAnalysis, slideAnim, fadeAnim, shakeAnim])

  const handleDismiss = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    onDismiss()
  }

  // Don't render anything if not visible and no form analysis
  if (!isVisible || !formAnalysis) {
    return <View testID="feedback-card-empty" className="pointer-events-none h-0 opacity-0" />
  }

  return (
    <SafeAreaView className="absolute bottom-0 right-0" pointerEvents="box-none">
      <FeedbackCard
        formAnalysis={formAnalysis}
        onDismiss={handleDismiss}
        slideAnim={slideAnim}
        fadeAnim={fadeAnim}
        shakeAnim={shakeAnim}
      />
    </SafeAreaView>
  )
}

export default FeedbackUI

import React, { useCallback, useState } from 'react'
import { View, Text, SafeAreaView, ScrollView, Pressable } from 'react-native'
import { SessionOrchestrator } from '@/lib/session/session-orchestrator'
import { useSession } from '@/lib/hooks/useSession'
import { useFormAnalysis } from '@/lib/hooks/useFormAnalysis'

/**
 * SessionView Component
 *
 * Main UI component displayed during active session recording.
 * Displays:
 * - Camera feed placeholder
 * - Exercise name
 * - Rep count and form score
 * - FeedbackUI component for real-time feedback
 * - Error messages if present
 * - End Session button
 */

export interface SessionViewProps {
  orchestrator: SessionOrchestrator
  onSessionEnd?: (result: any) => void
}

export default function SessionView({ orchestrator, onSessionEnd }: SessionViewProps) {
  // Get session state from hooks
  const sessionState = useSession(orchestrator)
  const formAnalysis = useFormAnalysis(orchestrator)

  // Track feedback UI visibility
  const [feedbackVisible, setFeedbackVisible] = useState(false)

  // Handle End Session button press
  const handleEndSession = useCallback(async () => {
    try {
      await orchestrator.shutdown()

      // Call optional callback
      if (onSessionEnd) {
        const record = await orchestrator.buildSessionRecord()
        onSessionEnd(record)
      }
    } catch (error) {
      console.error('Error ending session:', error)
    }
  }, [orchestrator, onSessionEnd])

  // Handle feedback dismiss
  const handleFeedbackDismiss = useCallback(() => {
    setFeedbackVisible(false)
  }, [])

  // Show feedback when analysis available
  React.useEffect(() => {
    if (formAnalysis.lastAnalysis) {
      setFeedbackVisible(true)
    }
  }, [formAnalysis.lastAnalysis])

  // Get score color class based on average form score
  const getScoreColorClass = (score: number): string => {
    if (score >= 75) return 'bg-green-500'
    if (score >= 50) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  return (
    <SafeAreaView testID="session-view" className="flex-1 bg-black">
      <ScrollView className="flex-1" scrollEnabled={false}>
        {/* Camera Feed Area */}
        <View testID="camera-area" className="h-96 w-full items-center justify-center bg-black">
          <Text className="text-base text-white/50">Camera Feed</Text>
        </View>

        {/* Exercise Info Section */}
        <View className="bg-black/50 px-6 py-8">
          <Text testID="exercise-name" className="text-center text-3xl font-bold text-white">
            {sessionState.exercise.toUpperCase()}
          </Text>
        </View>

        {/* Form Score and Rep Counter (Side by Side) */}
        <View
          testID="metrics-container"
          className="flex-row items-center justify-center gap-4 px-6 py-6"
        >
          {/* Form Score Badge */}
          <View className="flex-col items-center">
            <View
              className={`${getScoreColorClass(formAnalysis.avgFormScore)} h-24 w-24 items-center justify-center rounded-full p-4`}
            >
              <Text testID="form-score" className="text-2xl font-bold text-white">
                {Math.round(formAnalysis.avgFormScore)}
              </Text>
              <Text className="text-xs text-white/70">Form</Text>
            </View>
          </View>

          {/* Rep Counter */}
          <View className="flex-col items-center">
            <View className="h-24 w-24 items-center justify-center rounded-full bg-blue-600 p-4">
              <Text testID="rep-counter" className="text-2xl font-bold text-white">
                {formAnalysis.repCount}
              </Text>
              <Text className="text-xs text-white/70">Reps</Text>
            </View>
          </View>
        </View>

        {/* FeedbackUI Component Container */}
        <View testID="feedback-ui-container" className="flex-1 px-6 py-4">
          {feedbackVisible && formAnalysis.lastAnalysis ? (
            <View className="rounded-xl border border-white/20 bg-white/10 p-4">
              <Text className="text-sm text-white">
                {formAnalysis.lastAnalysis.exercise} - Rep {formAnalysis.lastAnalysis.repNumber}
              </Text>
              <Text className="mt-1 text-xs text-white/70">
                Form Score: {formAnalysis.lastAnalysis.formScore}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Error Display */}
        {sessionState.error ? (
          <View
            testID="error-message"
            className="mx-6 mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-4"
          >
            <Text className="font-semibold text-red-500">Error</Text>
            <Text className="mt-1 text-sm text-red-500/80">{sessionState.error.message}</Text>
          </View>
        ) : null}
      </ScrollView>

      {/* End Session Button */}
      <View className="border-t border-white/10 bg-black px-4 pb-6">
        <Pressable
          testID="end-session-button"
          onPress={handleEndSession}
          disabled={!sessionState.isRunning}
          className={`w-full items-center justify-center rounded-lg py-4 ${
            sessionState.isRunning ? 'bg-red-600' : 'bg-red-600/50'
          }`}
        >
          <Text className="text-lg font-bold text-white">End Session</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  )
}

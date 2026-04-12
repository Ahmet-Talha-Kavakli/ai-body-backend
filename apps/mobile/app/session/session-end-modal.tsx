import React, { useEffect, useRef } from 'react'
import { View, Text, Modal, SafeAreaView, Pressable, Animated } from 'react-native'
import { SessionRecord } from '@/lib/session/types'
import { useRouter } from 'expo-router'

/**
 * SessionEndModal Component
 *
 * Modal displayed after session ends, showing:
 * - Exercise name
 * - Total reps completed
 * - Average form score
 * - Session duration
 * - Done button to navigate back
 *
 * Animates in with slide-up motion.
 */

export interface SessionEndModalProps {
  visible: boolean
  sessionRecord: SessionRecord
  onClose?: () => void
}

export default function SessionEndModal({ visible, sessionRecord, onClose }: SessionEndModalProps) {
  const router = useRouter()
  const slideAnim = useRef(new Animated.Value(500)).current

  // Animate modal slide up
  useEffect(() => {
    if (visible) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start()
    } else {
      Animated.timing(slideAnim, {
        toValue: 500,
        duration: 300,
        useNativeDriver: true,
      }).start()
    }
  }, [visible, slideAnim])

  // Calculate session duration in minutes
  const durationMinutes = Math.floor(
    (sessionRecord.endTime.getTime() - sessionRecord.startTime.getTime()) / 1000 / 60
  )

  // Handle Done button press
  const handleDone = () => {
    if (onClose) {
      onClose()
    }
    router.back()
  }

  return (
    <Modal
      testID="session-end-modal"
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleDone}
    >
      <View testID="modal-backdrop" className="flex-1 items-center justify-center bg-black/70">
        <Animated.View
          testID="modal-content"
          style={{
            transform: [{ translateY: slideAnim }],
          }}
          className="w-11/12 max-w-sm"
        >
          <SafeAreaView className="rounded-2xl border border-white/20 bg-black/90 p-6">
            {/* Summary Container */}
            <View testID="summary-container" className="items-center gap-8">
              {/* Exercise Title */}
              <View className="items-center">
                <Text testID="exercise-title" className="text-4xl font-bold text-white">
                  {sessionRecord.exercise.toUpperCase()}
                </Text>
                <Text className="mt-2 text-sm text-white/50">Session Complete!</Text>
              </View>

              {/* Stats Grid */}
              <View className="w-full gap-6">
                {/* Reps Stat */}
                <View testID="reps-stat" className="items-center rounded-xl bg-white/5 p-4">
                  <Text className="text-sm font-medium text-white/70">Total Reps</Text>
                  <Text className="mt-2 text-3xl font-bold text-white">
                    {sessionRecord.totalReps}
                  </Text>
                </View>

                {/* Form Score Stat */}
                <View testID="score-stat" className="items-center rounded-xl bg-white/5 p-4">
                  <Text className="text-sm font-medium text-white/70">Avg Form Score</Text>
                  <Text className="mt-2 text-3xl font-bold text-white">
                    {Math.round(sessionRecord.avgFormScore)}%
                  </Text>
                </View>

                {/* Duration Stat */}
                <View testID="duration-stat" className="items-center rounded-xl bg-white/5 p-4">
                  <Text className="text-sm font-medium text-white/70">Duration</Text>
                  <Text className="mt-2 text-3xl font-bold text-white">{durationMinutes}m</Text>
                </View>
              </View>

              {/* Done Button */}
              <Pressable
                testID="done-button"
                onPress={handleDone}
                className="w-full items-center justify-center rounded-lg bg-blue-600 py-4 active:bg-blue-700"
              >
                <Text className="text-lg font-bold text-white">Done</Text>
              </Pressable>
            </View>
          </SafeAreaView>
        </Animated.View>
      </View>
    </Modal>
  )
}

import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  Alert,
} from 'react-native'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { useCoachingStore } from '../../store/useCoachingStore'
import { useSessionStore } from '../../store/useSessionStore'
import {
  SessionTimer,
  FormFeedbackOverlay,
} from '../../components/coaching'
import * as liveCoachingService from '../../services/liveCoachingService'

type RootStackParamList = {
  LiveSession: { sessionId: string }
  SessionReview: { sessionId: string }
}

type Props = NativeStackScreenProps<RootStackParamList, 'LiveSession'>

/**
 * LiveSessionScreen - main coaching video call interface
 * Shows video feed, controls, form feedback, and session timer
 */
export const LiveSessionScreen: React.FC<Props> = ({ route, navigation }) => {
  const { sessionId } = route.params
  const {
    currentSession,
    setCurrentSession,
    formScores,
    updateSession,
  } = useCoachingStore()
  const {
    videoOn,
    audioOn,
    isRecording,
    elapsedTime,
    setVideoOn,
    setAudioOn,
    setRecording,
    setElapsedTime,
    reset: resetSession,
  } = useSessionStore()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadSession()

    // Simulate timer updates
    const timer = setInterval(() => {
      setElapsedTime(elapsedTime + 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [elapsedTime])

  const loadSession = async () => {
    try {
      setLoading(true)
      setError(null)
      const session = await liveCoachingService.getSession(sessionId)
      setCurrentSession(session)

      // Initialize video/audio based on session
      setVideoOn(true)
      setAudioOn(true)
      setRecording(session.recordingConsent)
    } catch (err) {
      setError('Failed to load session')
      console.error('Error loading session:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleEndSession = async () => {
    Alert.alert(
      'End Session?',
      'This will end your coaching session.',
      [
        {
          text: 'Cancel',
          onPress: () => {},
        },
        {
          text: 'End',
          onPress: async () => {
            try {
              await liveCoachingService.completeSession(sessionId)
              resetSession()
              navigation.replace('SessionReview', { sessionId })
            } catch (err) {
              Alert.alert('Error', 'Failed to end session')
            }
          },
        },
      ]
    )
  }

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-black">
        <ActivityIndicator size="large" color="white" />
      </View>
    )
  }

  if (error) {
    return (
      <View className="flex-1 items-center justify-center bg-black">
        <Text className="text-white mb-4">{error}</Text>
        <Pressable
          onPress={loadSession}
          className="bg-blue-600 rounded-lg px-6 py-3"
        >
          <Text className="text-white font-semibold">Retry</Text>
        </Pressable>
      </View>
    )
  }

  const currentFormScore = formScores.length > 0
    ? formScores[formScores.length - 1]
    : null

  return (
    <View className="flex-1 bg-black">
      {/* Video Area - Placeholder for Agora video */}
      <View className="flex-1 relative">
        <View className="flex-1 bg-gray-900 items-center justify-center">
          <Text className="text-white text-lg">
            {currentSession?.coach.name || 'Coach'}
          </Text>
          <Text className="text-gray-400 text-sm mt-2">Video Stream Here</Text>
        </View>

        {/* Session Timer - Top Left */}
        <View className="absolute top-4 left-4">
          <SessionTimer elapsedSeconds={elapsedTime} />
        </View>

        {/* Form Feedback Overlay - Right Side */}
        {currentFormScore && (
          <View className="absolute top-4 right-4 w-32">
            <FormFeedbackOverlay
              formScore={currentFormScore.formScore}
              feedback={currentFormScore.feedback}
            />
          </View>
        )}
      </View>

      {/* Controls Bar - Bottom */}
      <View className="bg-gray-900 px-4 py-4 flex-row items-center justify-around">
        {/* Microphone Toggle */}
        <Pressable
          onPress={() => setAudioOn(!audioOn)}
          className={`rounded-full p-3 ${
            audioOn ? 'bg-blue-600' : 'bg-red-600'
          }`}
        >
          <Text className="text-white text-xl">{audioOn ? '🎤' : '🔇'}</Text>
        </Pressable>

        {/* Video Toggle */}
        <Pressable
          onPress={() => setVideoOn(!videoOn)}
          className={`rounded-full p-3 ${
            videoOn ? 'bg-blue-600' : 'bg-red-600'
          }`}
        >
          <Text className="text-white text-xl">{videoOn ? '📹' : '⛔'}</Text>
        </Pressable>

        {/* Recording Indicator */}
        <View
          className={`rounded-full p-3 ${
            isRecording ? 'bg-red-600' : 'bg-gray-700'
          }`}
        >
          <Text className="text-white text-xl">
            {isRecording ? '⚫' : '○'}
          </Text>
        </View>

        {/* End Call Button */}
        <Pressable
          onPress={handleEndSession}
          className="rounded-full p-3 bg-red-600"
        >
          <Text className="text-white text-xl">📞</Text>
        </Pressable>
      </View>

      {/* Chat/Notes Area - Optional */}
      <View className="bg-gray-800 px-4 py-3 border-t border-gray-700">
        <Text className="text-white text-sm">
          Coach will provide feedback and form tips here
        </Text>
      </View>
    </View>
  )
}

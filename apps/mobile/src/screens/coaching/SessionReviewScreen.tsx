import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  Image,
  Pressable,
  ActivityIndicator,
  Alert,
} from 'react-native'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { useCoachingStore } from '../../store/useCoachingStore'
import { FormScoreGauge } from '../../components/coaching'
import * as liveCoachingService from '../../services/liveCoachingService'

type RootStackParamList = {
  SessionReview: { sessionId: string }
  CoachingProgram: { programId: string }
  CoachingTab: undefined
}

type Props = NativeStackScreenProps<RootStackParamList, 'SessionReview'>

/**
 * SessionReviewScreen - post-session review and rating
 * Shows form score, coach notes, and allows rating the coach
 */
export const SessionReviewScreen: React.FC<Props> = ({ route, navigation }) => {
  const { sessionId } = route.params
  const { sessions } = useCoachingStore()
  const [rating, setRating] = useState(0)
  const [review, setReview] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSessionDetails()
  }, [sessionId])

  const loadSessionDetails = async () => {
    try {
      setLoading(true)
      // Session should already be in store
      const session = sessions.find((s) => s.id === sessionId)
      if (!session) {
        const sessionData = await liveCoachingService.getSession(sessionId)
        // Would update store here in real app
      }
    } catch (error) {
      console.error('Error loading session:', error)
    } finally {
      setLoading(false)
    }
  }

  const session = sessions.find((s) => s.id === sessionId)

  const handleSubmitRating = async () => {
    if (rating === 0) {
      Alert.alert('Please rate your coach')
      return
    }

    try {
      setSubmitting(true)
      if (session) {
        await liveCoachingService.rateCoach(session.coachId, rating, review)
        Alert.alert('Thank You!', 'Your feedback has been recorded.', [
          {
            text: 'Back to Coaching',
            onPress: () => navigation.navigate('CoachingTab'),
          },
        ])
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to submit rating')
      console.error('Error submitting rating:', err)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    )
  }

  if (!session) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text className="text-gray-600">Session not found</Text>
      </View>
    )
  }

  const avgFormScore = session.formScores
    ? Math.round(
        session.formScores.reduce((sum, f) => sum + f.score, 0) /
          session.formScores.length
      )
    : 0

  return (
    <ScrollView className="flex-1 bg-gray-50">
      {/* Coach Info */}
      <View className="bg-white p-4 items-center border-b border-gray-200">
        {session.coach.avatar && (
          <Image
            source={{ uri: session.coach.avatar }}
            className="w-20 h-20 rounded-full mb-3"
          />
        )}
        <Text className="text-xl font-bold text-gray-900">
          {session.coach.name}
        </Text>
        <Text className="text-gray-600 text-sm mt-1">
          {session.coach.specializations.join(', ')}
        </Text>
      </View>

      {/* Form Score */}
      <View className="bg-white p-4 border-b border-gray-200 items-center">
        <Text className="text-base font-semibold text-gray-900 mb-3">
          Your Form Score
        </Text>
        {avgFormScore > 0 ? (
          <>
            <FormScoreGauge score={avgFormScore} size="large" />
            <Text className="text-sm text-gray-600 mt-4 text-center">
              Average score from {session.formScores?.length || 0} reps analyzed
            </Text>
          </>
        ) : (
          <Text className="text-gray-600">No form data recorded</Text>
        )}
      </View>

      {/* Coach Notes */}
      {session.coachNotes && (
        <View className="bg-white p-4 border-b border-gray-200">
          <Text className="font-semibold text-gray-900 mb-2">Coach Notes</Text>
          <View className="bg-blue-50 rounded-lg p-3 border border-blue-200">
            <Text className="text-gray-700 leading-5">{session.coachNotes}</Text>
          </View>
        </View>
      )}

      {/* Rating Section */}
      <View className="bg-white p-4 border-b border-gray-200">
        <Text className="font-semibold text-gray-900 mb-4">
          Rate Your Coach
        </Text>

        {/* Star Rating */}
        <View className="flex-row gap-2 mb-4 justify-center">
          {[1, 2, 3, 4, 5].map((star) => (
            <Pressable key={star} onPress={() => setRating(star)}>
              <Text className="text-4xl">
                {star <= rating ? '⭐' : '☆'}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Review Text */}
        <Text className="text-sm text-gray-600 mb-2">
          Optional: Share your feedback
        </Text>
        <View className="bg-gray-100 rounded-lg border border-gray-300 p-3">
          <Text
            className="text-gray-700 min-h-20"
            editable={true}
            multiline={true}
            placeholder="How was your experience?"
          >
            {review}
          </Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View className="p-4 gap-3 mb-6">
        <Pressable
          onPress={handleSubmitRating}
          disabled={rating === 0 || submitting}
          className={`rounded-lg py-4 px-4 ${
            rating > 0 ? 'bg-blue-600' : 'bg-gray-300'
          }`}
        >
          {submitting ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white text-center font-semibold text-lg">
              Submit Rating
            </Text>
          )}
        </Pressable>

        <Pressable
          onPress={() => navigation.navigate('CoachingTab')}
          className="bg-white border border-gray-300 rounded-lg py-4 px-4"
        >
          <Text className="text-gray-900 text-center font-semibold">
            Back to Coaching
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  )
}

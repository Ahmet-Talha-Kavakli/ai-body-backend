import React, { useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
} from 'react-native'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { useCoachingStore } from '../../store/useCoachingStore'
import * as liveCoachingService from '../../services/liveCoachingService'

type RootStackParamList = {
  OnDemandRequest: { coachId?: string }
  LiveSession: { sessionId: string }
}

type Props = NativeStackScreenProps<RootStackParamList, 'OnDemandRequest'>

const SPECIALIZATIONS = ['strength', 'cardio', 'nutrition', 'mobility']

/**
 * OnDemandRequestScreen - allows user to request immediate coaching
 * Shows estimated wait time and specialization preference
 */
export const OnDemandRequestScreen: React.FC<Props> = ({ route, navigation }) => {
  const { coachId } = route.params || {}
  const { addSession, setCurrentSession } = useCoachingStore()
  const [selectedSpec, setSelectedSpec] = useState<string | undefined>()
  const [loading, setLoading] = useState(false)
  const [waitingForCoach, setWaitingForCoach] = useState(false)

  const handleRequestCoaching = async () => {
    try {
      setLoading(true)

      // Create on-demand session
      const session = await liveCoachingService.createSession(
        coachId || 'available',
        'ondemand'
      )

      addSession(session)
      setCurrentSession(session)

      // Simulate waiting for coach to accept
      setWaitingForCoach(true)
      Alert.alert('Request Sent', 'Waiting for a coach to accept your request...')

      // In real app, would use WebSocket or polling to update when coach joins
      // For now, simulate coach assignment after 3 seconds
      setTimeout(() => {
        setWaitingForCoach(false)
        navigation.navigate('LiveSession', { sessionId: session.id })
      }, 3000)
    } catch (err) {
      Alert.alert('Request Failed', 'Please try again')
      console.error('Error requesting coaching:', err)
    } finally {
      setLoading(false)
    }
  }

  if (waitingForCoach) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#2563eb" className="mb-4" />
        <Text className="text-xl font-semibold text-gray-900 mb-2">
          Finding a Coach
        </Text>
        <Text className="text-gray-600 text-center px-6 mb-4">
          Estimated wait: 2-5 minutes
        </Text>
        <Pressable
          onPress={() => {
            setWaitingForCoach(false)
            navigation.goBack()
          }}
          className="bg-gray-300 rounded-lg px-6 py-3"
        >
          <Text className="text-gray-900 font-semibold">Cancel Request</Text>
        </Pressable>
      </View>
    )
  }

  return (
    <ScrollView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white p-4 border-b border-gray-200">
        <Text className="text-2xl font-bold text-gray-900 mb-2">
          Request Coaching Now
        </Text>
        <Text className="text-gray-600">
          Get matched with an available coach immediately
        </Text>
      </View>

      {/* Specialization Preference */}
      <View className="bg-white p-4 border-b border-gray-200 m-4 rounded-lg">
        <Text className="text-base font-semibold text-gray-900 mb-3">
          Coaching Focus (Optional)
        </Text>
        <Text className="text-sm text-gray-600 mb-3">
          Select your preferred coaching type
        </Text>
        <View className="gap-2">
          {SPECIALIZATIONS.map((spec) => (
            <Pressable
              key={spec}
              onPress={() => setSelectedSpec(selectedSpec === spec ? undefined : spec)}
              className={`border rounded-lg px-4 py-3 flex-row items-center ${
                selectedSpec === spec
                  ? 'bg-blue-50 border-blue-500'
                  : 'bg-white border-gray-300'
              }`}
            >
              <View
                className={`w-5 h-5 rounded-full border-2 mr-3 ${
                  selectedSpec === spec
                    ? 'bg-blue-600 border-blue-600'
                    : 'border-gray-400'
                }`}
              >
                {selectedSpec === spec && (
                  <View className="flex-1 items-center justify-center">
                    <Text className="text-white font-bold">✓</Text>
                  </View>
                )}
              </View>
              <Text
                className={`font-medium capitalize ${
                  selectedSpec === spec ? 'text-blue-600' : 'text-gray-700'
                }`}
              >
                {spec}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Info Cards */}
      <View className="px-4 gap-3 mb-6">
        <View className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <Text className="font-semibold text-blue-900 mb-1">
            Expected Wait Time
          </Text>
          <Text className="text-blue-800">5-10 minutes</Text>
        </View>

        <View className="bg-green-50 rounded-lg p-4 border border-green-200">
          <Text className="font-semibold text-green-900 mb-1">
            How It Works
          </Text>
          <Text className="text-green-800 text-sm leading-5">
            • Request submitted to available coaches{'\n'}• Next available coach
            accepts your request{'\n'}• Video call starts immediately{'\n'}• Pay
            as you go
          </Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View className="p-4 gap-3 mb-6">
        <Pressable
          onPress={handleRequestCoaching}
          disabled={loading}
          className="bg-blue-600 rounded-lg py-4 px-4"
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white text-center font-semibold text-lg">
              Request Coaching Now
            </Text>
          )}
        </Pressable>

        <Pressable
          onPress={() => navigation.goBack()}
          className="bg-white border border-gray-300 rounded-lg py-4 px-4"
        >
          <Text className="text-gray-900 text-center font-semibold">Cancel</Text>
        </Pressable>
      </View>
    </ScrollView>
  )
}

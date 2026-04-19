import React, { useEffect, useState } from 'react'
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
import type { Coach } from '../../types/coaching'

type RootStackParamList = {
  SessionBooking: { coachId: string }
  CoachProfile: { coachId: string }
}

type Props = NativeStackScreenProps<RootStackParamList, 'SessionBooking'>

/**
 * SessionBookingScreen - allows user to select date/time and book a session
 * Shows coach info, available slots, and confirmation
 */
export const SessionBookingScreen: React.FC<Props> = ({ route, navigation }) => {
  const { coachId } = route.params
  const { addSession } = useCoachingStore()
  const [coach, setCoach] = useState<Coach | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadCoach()
  }, [coachId])

  const loadCoach = async () => {
    try {
      setLoading(true)
      setError(null)
      const coachData = await liveCoachingService.getCoach(coachId)
      setCoach(coachData)
    } catch (err) {
      setError('Failed to load coach profile')
      console.error('Error loading coach:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleBookSession = async () => {
    if (!selectedDate || !selectedTime) {
      Alert.alert('Please select a date and time')
      return
    }

    try {
      setSubmitting(true)
      const scheduledDate = new Date(selectedDate)
      const [hours, minutes] = selectedTime.split(':')
      scheduledDate.setHours(parseInt(hours), parseInt(minutes), 0)

      const session = await liveCoachingService.createSession(
        coachId,
        'scheduled',
        scheduledDate.toISOString()
      )

      addSession(session)

      Alert.alert('Session Booked!', 'Your coaching session has been scheduled.', [
        {
          text: 'View Session',
          onPress: () => navigation.goBack(),
        },
      ])
    } catch (err) {
      Alert.alert('Booking Failed', 'Please try again')
      console.error('Error booking session:', err)
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

  if (error || !coach) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text className="text-gray-600 mb-4">{error || 'Coach not found'}</Text>
        <Pressable
          onPress={loadCoach}
          className="bg-blue-600 rounded-lg px-6 py-3"
        >
          <Text className="text-white font-semibold">Retry</Text>
        </Pressable>
      </View>
    )
  }

  return (
    <ScrollView className="flex-1 bg-gray-50">
      {/* Coach Summary */}
      <View className="bg-white p-4 border-b border-gray-200">
        <Text className="text-lg font-semibold text-gray-900 mb-2">
          {coach.name}
        </Text>
        <Text className="text-gray-600">${coach.hourlyRate}/hour</Text>
      </View>

      {/* Date Selection */}
      <View className="bg-white p-4 border-b border-gray-200">
        <Text className="text-base font-semibold text-gray-900 mb-3">
          Select Date
        </Text>
        <Text className="text-sm text-gray-600 mb-4">
          {selectedDate
            ? selectedDate.toLocaleDateString()
            : 'Tap to select a date'}
        </Text>
        <Pressable
          onPress={() => {
            const tomorrow = new Date()
            tomorrow.setDate(tomorrow.getDate() + 1)
            setSelectedDate(tomorrow)
          }}
          className="bg-gray-100 rounded-lg px-4 py-3 border border-gray-300"
        >
          <Text className="text-gray-700">
            {selectedDate
              ? selectedDate.toLocaleDateString()
              : 'Choose Date'}
          </Text>
        </Pressable>
      </View>

      {/* Time Selection */}
      {selectedDate && coach.availability && coach.availability.length > 0 && (
        <View className="bg-white p-4 border-b border-gray-200">
          <Text className="text-base font-semibold text-gray-900 mb-3">
            Select Time
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {coach.availability.map((slot, idx) => (
              <Pressable
                key={idx}
                onPress={() => setSelectedTime(slot.startTime)}
                className={`px-4 py-2 rounded-lg border ${
                  selectedTime === slot.startTime
                    ? 'bg-blue-600 border-blue-600'
                    : 'bg-white border-gray-300'
                }`}
              >
                <Text
                  className={`font-medium ${
                    selectedTime === slot.startTime
                      ? 'text-white'
                      : 'text-gray-700'
                  }`}
                >
                  {slot.startTime}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}

      {/* Confirmation */}
      {selectedDate && selectedTime && (
        <View className="bg-blue-50 p-4 border-b border-blue-200 m-4 rounded-lg">
          <Text className="font-semibold text-gray-900 mb-2">
            Booking Summary
          </Text>
          <View className="gap-2">
            <View className="flex-row justify-between">
              <Text className="text-gray-700">Coach:</Text>
              <Text className="text-gray-900 font-medium">{coach.name}</Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-gray-700">Date:</Text>
              <Text className="text-gray-900 font-medium">
                {selectedDate.toLocaleDateString()}
              </Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-gray-700">Time:</Text>
              <Text className="text-gray-900 font-medium">{selectedTime}</Text>
            </View>
            <View className="flex-row justify-between border-t border-blue-200 pt-2 mt-2">
              <Text className="text-gray-900 font-semibold">Total:</Text>
              <Text className="text-blue-600 font-bold text-lg">
                ${coach.hourlyRate}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Action Buttons */}
      <View className="p-4 gap-3 mb-6">
        <Pressable
          onPress={handleBookSession}
          disabled={!selectedDate || !selectedTime || submitting}
          className={`rounded-lg py-4 px-4 ${
            selectedDate && selectedTime
              ? 'bg-blue-600'
              : 'bg-gray-300'
          }`}
        >
          {submitting ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white text-center font-semibold text-lg">
              Confirm Booking
            </Text>
          )}
        </Pressable>

        <Pressable
          onPress={() => navigation.goBack()}
          className="bg-white border border-gray-300 rounded-lg py-4 px-4"
        >
          <Text className="text-gray-900 text-center font-semibold text-lg">
            Cancel
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  )
}

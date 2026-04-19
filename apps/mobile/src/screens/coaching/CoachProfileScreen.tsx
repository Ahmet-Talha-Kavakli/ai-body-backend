import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  Image,
  Pressable,
  ActivityIndicator,
} from 'react-native'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { useCoachStore } from '../../store/useCoachStore'
import {
  AvailabilityCalendar,
  FormScoreGauge,
} from '../../components/coaching'
import * as liveCoachingService from '../../services/liveCoachingService'
import type { Coach } from '../../types/coaching'

type RootStackParamList = {
  CoachProfile: { coachId: string }
  SessionBooking: { coachId: string }
  OnDemandRequest: { coachId?: string }
}

type Props = NativeStackScreenProps<RootStackParamList, 'CoachProfile'>

/**
 * CoachProfileScreen - displays detailed coach information
 * Shows bio, certifications, availability, and booking options
 */
export const CoachProfileScreen: React.FC<Props> = ({ route, navigation }) => {
  const { coachId } = route.params
  const { setSelectedCoach } = useCoachStore()
  const [coach, setCoach] = useState<Coach | null>(null)
  const [loading, setLoading] = useState(true)
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
      setSelectedCoach(coachData)
    } catch (err) {
      setError('Failed to load coach profile')
      console.error('Error loading coach:', err)
    } finally {
      setLoading(false)
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
      {/* Header */}
      <View className="bg-white p-4 items-center border-b border-gray-200">
        {coach.avatar && (
          <Image
            source={{ uri: coach.avatar }}
            className="w-24 h-24 rounded-full mb-3"
          />
        )}
        <View className="items-center">
          <Text className="text-2xl font-bold text-gray-900">{coach.name}</Text>
          <View className="flex-row items-center mt-2">
            <Text className="text-yellow-500 mr-1">⭐</Text>
            <Text className="text-gray-700 font-semibold">
              {coach.rating.toFixed(1)}
            </Text>
            <Text className="text-gray-500 ml-2">
              ({coach.reviewCount} reviews)
            </Text>
          </View>
          <Text className="text-lg font-semibold text-blue-600 mt-2">
            ${coach.hourlyRate}/hr
          </Text>
        </View>
      </View>

      {/* Bio */}
      <View className="bg-white p-4 border-b border-gray-200">
        <Text className="font-semibold text-gray-900 mb-2">About</Text>
        <Text className="text-gray-700 leading-5">{coach.bio}</Text>
      </View>

      {/* Certifications */}
      {coach.certifications && coach.certifications.length > 0 && (
        <View className="bg-white p-4 border-b border-gray-200">
          <Text className="font-semibold text-gray-900 mb-2">
            Certifications
          </Text>
          {coach.certifications.map((cert, index) => (
            <View
              key={index}
              className="flex-row items-center mb-2 bg-green-50 rounded-lg p-2"
            >
              <Text className="text-green-600 mr-2">✓</Text>
              <Text className="text-gray-700">{cert}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Specializations */}
      <View className="bg-white p-4 border-b border-gray-200">
        <Text className="font-semibold text-gray-900 mb-3">
          Specializations
        </Text>
        <View className="flex-row flex-wrap gap-2">
          {coach.specializations.map((spec) => (
            <View key={spec} className="bg-blue-100 rounded-full px-4 py-2">
              <Text className="text-blue-700 font-medium capitalize">
                {spec}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* Availability */}
      <View className="bg-white p-4 border-b border-gray-200">
        <AvailabilityCalendar
          availability={coach.availability}
          onSelectTime={(slot) => {
            navigation.navigate('SessionBooking', { coachId: coach.id })
          }}
        />
      </View>

      {/* Action Buttons */}
      <View className="p-4 gap-3 mb-6">
        <Pressable
          onPress={() =>
            navigation.navigate('SessionBooking', { coachId: coach.id })
          }
          className="bg-blue-600 rounded-lg py-4 px-4"
        >
          <Text className="text-white text-center font-semibold text-lg">
            Schedule Session
          </Text>
        </Pressable>

        <Pressable
          onPress={() =>
            navigation.navigate('OnDemandRequest', { coachId: coach.id })
          }
          className="bg-white border border-blue-600 rounded-lg py-4 px-4"
        >
          <Text className="text-blue-600 text-center font-semibold text-lg">
            Request On-Demand
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  )
}

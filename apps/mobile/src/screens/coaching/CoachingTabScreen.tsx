import React, { useEffect, useState } from 'react'
import { View, Text, ScrollView, Pressable, FlatList, ActivityIndicator } from 'react-native'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { useCoachingStore } from '../../store/useCoachingStore'
import { useCoachStore } from '../../store/useCoachStore'
import { CoachCard } from '../../components/coaching'
import * as liveCoachingService from '../../services/liveCoachingService'

type RootStackParamList = {
  CoachingTab: undefined
  CoachList: undefined
  CoachProfile: { coachId: string }
  SessionBooking: { coachId: string }
  OnDemandRequest: undefined
  LiveSession: { sessionId: string }
  SessionReview: { sessionId: string }
  CoachingProgram: { programId: string }
}

type Props = NativeStackScreenProps<RootStackParamList, 'CoachingTab'>

/**
 * CoachingTabScreen - main hub for live coaching
 * Shows upcoming sessions, featured coaches, and quick actions
 */
export const CoachingTabScreen: React.FC<Props> = ({ navigation }) => {
  const { activeSessions, currentSession } = useCoachingStore()
  const { coaches, setCoaches } = useCoachStore()
  const [featuredCoaches, setFeaturedCoaches] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadCoaches()
  }, [])

  const loadCoaches = async () => {
    try {
      setLoading(true)
      const allCoaches = await liveCoachingService.getCoaches(undefined, 10)
      setCoaches(allCoaches)
      // Get top 3 by rating for featured section
      const featured = allCoaches.sort((a, b) => b.rating - a.rating).slice(0, 3)
      setFeaturedCoaches(featured)
    } catch (error) {
      console.error('Error loading coaches:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <ScrollView className="flex-1 bg-gray-50">
      {/* Upcoming Sessions */}
      {activeSessions && activeSessions.length > 0 && (
        <View className="bg-white p-4 mb-4">
          <Text className="text-lg font-semibold text-gray-900 mb-3">
            Upcoming Sessions
          </Text>
          {activeSessions.map((session) => (
            <View
              key={session.id}
              className="bg-blue-50 rounded-lg p-4 mb-3 border border-blue-200"
            >
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-gray-900 font-semibold">
                  {session.coach.name}
                </Text>
                {session.status === 'in_progress' && (
                  <View className="bg-green-500 px-2 py-1 rounded">
                    <Text className="text-white text-xs font-medium">
                      Live
                    </Text>
                  </View>
                )}
              </View>
              <Text className="text-gray-600 text-sm mb-3">
                {session.scheduledAt
                  ? new Date(session.scheduledAt).toLocaleString()
                  : 'On Demand'}
              </Text>
              <Pressable
                onPress={() =>
                  navigation.navigate('LiveSession', { sessionId: session.id })
                }
                className="bg-blue-600 rounded-lg py-2 px-4"
              >
                <Text className="text-white text-center font-semibold">
                  {session.status === 'in_progress' ? 'Join Now' : 'View'}
                </Text>
              </Pressable>
            </View>
          ))}
        </View>
      )}

      {/* Quick Action */}
      <View className="px-4 py-3 gap-3">
        <Pressable
          onPress={() => navigation.navigate('OnDemandRequest')}
          className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg py-4 px-4"
        >
          <Text className="text-white text-center font-semibold text-lg">
            Request Coaching Now
          </Text>
        </Pressable>

        <Pressable
          onPress={() => navigation.navigate('CoachList')}
          className="bg-white border border-gray-300 rounded-lg py-4 px-4"
        >
          <Text className="text-gray-900 text-center font-semibold text-lg">
            Find a Coach
          </Text>
        </Pressable>
      </View>

      {/* Featured Coaches */}
      <View className="px-4 py-4">
        <Text className="text-lg font-semibold text-gray-900 mb-3">
          Featured Coaches
        </Text>
        {loading ? (
          <ActivityIndicator size="large" color="#2563eb" />
        ) : (
          <FlatList
            scrollEnabled={false}
            data={featuredCoaches}
            renderItem={({ item: coach }) => (
              <CoachCard
                coach={coach}
                onPress={() =>
                  navigation.navigate('CoachProfile', { coachId: coach.id })
                }
              />
            )}
            keyExtractor={(coach) => coach.id}
          />
        )}
      </View>
    </ScrollView>
  )
}

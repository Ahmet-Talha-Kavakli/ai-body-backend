import React, { useEffect, useState } from 'react'
import { View, Text, Image, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native'
import type { RouteProp } from '@react-navigation/native'
import type { UserProfile } from '../../types/social'
import { getUserProfile } from '../../services/friendService'
import { useFriendStore } from '../../store/friendStore'

type Props = {
  route: RouteProp<{ params: { userId: string } }, 'params'>
}

export function FriendProfileScreen({ route }: Props) {
  const { userId } = route.params
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { isFriend, removeFriend, addFriend } = useFriendStore()

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true)
        const data = await getUserProfile(userId)
        setProfile(data)
      } catch (err) {
        setError((err as Error).message)
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [userId])

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    )
  }

  if (error || !profile) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <Text className="text-red-600">{error || 'Profile not found'}</Text>
      </View>
    )
  }

  const isCurrentFriend = isFriend(userId)

  const handleFriendToggle = () => {
    if (isCurrentFriend) {
      removeFriend(userId)
    } else {
      addFriend(profile)
    }
  }

  return (
    <ScrollView className="flex-1 bg-white">
      {/* Profile Header */}
      <View className="bg-blue-500 p-6 items-center">
        <Image
          source={{ uri: profile.avatar }}
          className="w-24 h-24 rounded-full mb-4"
        />
        <Text className="text-3xl font-bold text-white">{profile.username}</Text>
        <Text className="text-blue-100 mt-2">{profile.bio}</Text>
      </View>

      {/* Friend Action Button */}
      <View className="px-4 py-4">
        <TouchableOpacity
          onPress={handleFriendToggle}
          className={`py-3 rounded-lg ${isCurrentFriend ? 'bg-gray-200' : 'bg-blue-500'}`}
        >
          <Text
            className={`text-center font-semibold text-lg ${isCurrentFriend ? 'text-gray-700' : 'text-white'}`}
          >
            {isCurrentFriend ? 'Remove Friend' : 'Add Friend'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Stats Grid */}
      <View className="px-4 py-4">
        <Text className="text-xl font-bold text-gray-900 mb-4">Stats</Text>
        <View className="grid grid-cols-2 gap-4">
          <View className="bg-gray-100 p-4 rounded-lg">
            <Text className="text-gray-600 text-sm">Workouts</Text>
            <Text className="text-2xl font-bold text-gray-900">{profile.stats.totalWorkouts}</Text>
          </View>
          <View className="bg-gray-100 p-4 rounded-lg">
            <Text className="text-gray-600 text-sm">Steps</Text>
            <Text className="text-2xl font-bold text-gray-900">
              {(profile.stats.totalSteps / 1000).toFixed(1)}K
            </Text>
          </View>
          <View className="bg-gray-100 p-4 rounded-lg">
            <Text className="text-gray-600 text-sm">Calories</Text>
            <Text className="text-2xl font-bold text-gray-900">
              {(profile.stats.totalCalories / 1000).toFixed(1)}K
            </Text>
          </View>
          <View className="bg-gray-100 p-4 rounded-lg">
            <Text className="text-gray-600 text-sm">Streak</Text>
            <Text className="text-2xl font-bold text-gray-900">{profile.stats.longestStreak}</Text>
          </View>
        </View>
      </View>

      {/* Badges */}
      {profile.badges.length > 0 && (
        <View className="px-4 py-4">
          <Text className="text-xl font-bold text-gray-900 mb-4">Badges</Text>
          <View className="flex-row flex-wrap gap-2">
            {profile.badges.map((badge) => (
              <View key={badge} className="bg-yellow-100 px-3 py-1 rounded-full">
                <Text className="text-yellow-700 text-sm font-semibold">{badge}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Member Since */}
      <View className="px-4 py-4 border-t border-gray-200">
        <Text className="text-gray-600">
          Member since {new Date(profile.createdAt).toLocaleDateString()}
        </Text>
      </View>
    </ScrollView>
  )
}

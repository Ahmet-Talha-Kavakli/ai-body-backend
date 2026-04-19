import React from 'react'
import { Pressable, Text, View } from 'react-native'
import type { Recommendation } from '../../types'

interface FriendRecommendationCardProps {
  friend: Recommendation
  onPress?: () => void
}

export function FriendRecommendationCard({
  friend,
  onPress,
}: FriendRecommendationCardProps) {
  return (
    <Pressable
      onPress={onPress}
      className="mb-3 rounded-lg border border-purple-200 bg-purple-50 p-4 shadow-sm"
      testID="friend-recommendation-card"
    >
      <View className="flex-row items-start justify-between">
        <View className="flex-1">
          <View className="mb-2 flex-row items-center">
            <Text className="mr-2 text-xl">👥</Text>
            <Text className="text-xs font-medium text-purple-600">
              {friend.confidence}% match
            </Text>
          </View>
          <Text
            className="mb-1 text-sm font-bold text-gray-900"
            numberOfLines={2}
          >
            {friend.title}
          </Text>
          <Text className="mb-2 text-xs text-gray-600" numberOfLines={2}>
            {friend.description}
          </Text>
          <Text className="text-xs italic text-gray-500">
            {friend.reasoning}
          </Text>
        </View>
      </View>
    </Pressable>
  )
}

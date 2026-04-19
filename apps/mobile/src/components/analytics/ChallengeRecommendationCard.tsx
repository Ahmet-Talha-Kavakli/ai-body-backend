import React from 'react'
import { Pressable, Text, View } from 'react-native'
import type { Recommendation } from '../../types'

interface ChallengeRecommendationCardProps {
  challenge: Recommendation
  onPress?: () => void
}

export function ChallengeRecommendationCard({
  challenge,
  onPress,
}: ChallengeRecommendationCardProps) {
  return (
    <Pressable
      onPress={onPress}
      className="mb-3 rounded-lg border border-red-200 bg-red-50 p-4 shadow-sm"
      testID="challenge-recommendation-card"
    >
      <View className="flex-row items-start justify-between">
        <View className="flex-1">
          <View className="mb-2 flex-row items-center">
            <Text className="mr-2 text-xl">🏆</Text>
            <Text className="text-xs font-medium text-red-600">
              {challenge.confidence}% chance
            </Text>
          </View>
          <Text
            className="mb-1 text-sm font-bold text-gray-900"
            numberOfLines={2}
          >
            {challenge.title}
          </Text>
          <Text className="mb-2 text-xs text-gray-600" numberOfLines={2}>
            {challenge.description}
          </Text>
          <Text className="text-xs italic text-gray-500">
            {challenge.reasoning}
          </Text>
        </View>
      </View>
    </Pressable>
  )
}

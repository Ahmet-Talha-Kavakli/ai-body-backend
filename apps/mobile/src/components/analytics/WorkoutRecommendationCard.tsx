import React from 'react'
import { Pressable, Text, View } from 'react-native'
import type { Recommendation } from '../../types'

interface WorkoutRecommendationCardProps {
  workout: Recommendation
  onPress?: () => void
}

export function WorkoutRecommendationCard({
  workout,
  onPress,
}: WorkoutRecommendationCardProps) {
  return (
    <Pressable
      onPress={onPress}
      className="mb-3 rounded-lg border border-blue-200 bg-blue-50 p-4 shadow-sm"
      testID="workout-recommendation-card"
    >
      <View className="flex-row items-start justify-between">
        <View className="flex-1">
          <View className="mb-2 flex-row items-center">
            <Text className="mr-2 text-xl">💪</Text>
            <Text className="text-xs font-medium text-blue-600">
              {workout.confidence}% match
            </Text>
          </View>
          <Text
            className="mb-1 text-sm font-bold text-gray-900"
            numberOfLines={2}
          >
            {workout.title}
          </Text>
          <Text className="mb-2 text-xs text-gray-600" numberOfLines={2}>
            {workout.description}
          </Text>
          <Text className="text-xs italic text-gray-500">
            {workout.reasoning}
          </Text>
        </View>
      </View>
    </Pressable>
  )
}

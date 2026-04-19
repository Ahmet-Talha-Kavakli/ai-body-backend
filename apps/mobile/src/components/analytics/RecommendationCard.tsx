import React from 'react'
import { Pressable, Text, View } from 'react-native'
import type { Recommendation } from '../../types'

interface RecommendationCardProps {
  recommendation: Recommendation
  onPress?: () => void
}

const TypeBadgeColor: Record<Recommendation['type'], string> = {
  meal: 'bg-orange-100 text-orange-800',
  workout: 'bg-blue-100 text-blue-800',
  health: 'bg-green-100 text-green-800',
  friend: 'bg-purple-100 text-purple-800',
  challenge: 'bg-red-100 text-red-800',
  coaching: 'bg-indigo-100 text-indigo-800',
}

export function RecommendationCard({
  recommendation,
  onPress,
}: RecommendationCardProps) {
  return (
    <Pressable
      onPress={onPress}
      className="mb-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
      testID="recommendation-card"
    >
      <View className="flex-row items-start justify-between">
        <View className="flex-1">
          <View className="mb-2 flex-row items-center">
            <View
              className={`mr-2 rounded-full px-2 py-1 ${TypeBadgeColor[recommendation.type]}`}
            >
              <Text className="text-xs font-semibold capitalize">
                {recommendation.type}
              </Text>
            </View>
            <Text className="text-xs font-medium text-gray-500">
              {recommendation.confidence}% match
            </Text>
          </View>
          <Text
            className="mb-1 text-sm font-bold text-gray-900"
            numberOfLines={2}
          >
            {recommendation.title}
          </Text>
          <Text
            className="mb-2 text-xs text-gray-600"
            numberOfLines={2}
          >
            {recommendation.description}
          </Text>
          <Text className="text-xs italic text-gray-500">
            {recommendation.reasoning}
          </Text>
        </View>
      </View>
    </Pressable>
  )
}

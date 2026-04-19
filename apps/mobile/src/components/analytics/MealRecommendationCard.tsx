import React from 'react'
import { Pressable, Text, View } from 'react-native'
import type { Recommendation } from '../../types'

interface MealRecommendationCardProps {
  meal: Recommendation
  onPress?: () => void
}

export function MealRecommendationCard({
  meal,
  onPress,
}: MealRecommendationCardProps) {
  return (
    <Pressable
      onPress={onPress}
      className="mb-3 rounded-lg border border-orange-200 bg-orange-50 p-4 shadow-sm"
      testID="meal-recommendation-card"
    >
      <View className="flex-row items-start justify-between">
        <View className="flex-1">
          <View className="mb-2 flex-row items-center">
            <Text className="mr-2 text-xl">🍽️</Text>
            <Text className="text-xs font-medium text-orange-600">
              {meal.confidence}% match
            </Text>
          </View>
          <Text
            className="mb-1 text-sm font-bold text-gray-900"
            numberOfLines={2}
          >
            {meal.title}
          </Text>
          <Text className="mb-2 text-xs text-gray-600" numberOfLines={2}>
            {meal.description}
          </Text>
          <Text className="text-xs italic text-gray-500">
            {meal.reasoning}
          </Text>
        </View>
      </View>
    </Pressable>
  )
}

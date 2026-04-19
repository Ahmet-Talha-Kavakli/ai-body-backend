import React from 'react'
import { Pressable, Text, View } from 'react-native'
import type { CoachingInsight } from '../../types'

interface HealthInsightCardProps {
  insight: CoachingInsight
  onPress?: () => void
}

const DomainBadgeColor: Record<CoachingInsight['domain'], string> = {
  performance: 'bg-purple-100 text-purple-800',
  nutrition: 'bg-orange-100 text-orange-800',
  recovery: 'bg-green-100 text-green-800',
  behavioral: 'bg-blue-100 text-blue-800',
}

export function HealthInsightCard({
  insight,
  onPress,
}: HealthInsightCardProps) {
  return (
    <Pressable
      onPress={onPress}
      className="mb-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
      testID="health-insight-card"
    >
      <View className="flex-row items-start justify-between">
        <View className="flex-1">
          <View className="mb-2 flex-row items-center">
            <View
              className={`mr-2 rounded-full px-2 py-1 ${DomainBadgeColor[insight.domain]}`}
            >
              <Text className="text-xs font-semibold capitalize">
                {insight.domain}
              </Text>
            </View>
            {insight.actionable && (
              <Text className="text-xs font-medium text-green-600">
                Actionable
              </Text>
            )}
          </View>
          <Text
            className="mb-2 text-sm font-bold text-gray-900"
            numberOfLines={2}
          >
            {insight.title}
          </Text>
          <Text className="mb-2 text-xs text-gray-600" numberOfLines={3}>
            {insight.insight}
          </Text>
          {insight.suggestedAction && (
            <View className="bg-gray-50 rounded p-2">
              <Text className="text-xs font-medium text-gray-700">
                Action: {insight.suggestedAction}
              </Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  )
}

import React from 'react'
import { Pressable, Text, View } from 'react-native'
import type { CoachingInsight } from '../../types'

interface CoachingCardProps {
  coaching: CoachingInsight
  onPress?: () => void
}

const DomainBadgeColor: Record<CoachingInsight['domain'], string> = {
  performance: 'bg-purple-100 text-purple-800',
  nutrition: 'bg-orange-100 text-orange-800',
  recovery: 'bg-green-100 text-green-800',
  behavioral: 'bg-blue-100 text-blue-800',
}

const DomainIcon: Record<CoachingInsight['domain'], string> = {
  performance: '💪',
  nutrition: '🍎',
  recovery: '😴',
  behavioral: '🧠',
}

export function CoachingCard({
  coaching,
  onPress,
}: CoachingCardProps) {
  return (
    <Pressable
      onPress={onPress}
      className="mb-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
      testID="coaching-card"
    >
      <View className="flex-row items-start justify-between">
        <View className="flex-1">
          <View className="mb-2 flex-row items-center">
            <Text className="mr-2 text-xl">{DomainIcon[coaching.domain]}</Text>
            <View
              className={`rounded-full px-2 py-1 ${DomainBadgeColor[coaching.domain]}`}
            >
              <Text className="text-xs font-semibold capitalize">
                {coaching.domain}
              </Text>
            </View>
          </View>
          <Text
            className="mb-2 text-sm font-bold text-gray-900"
            numberOfLines={2}
          >
            {coaching.title}
          </Text>
          <Text className="mb-3 text-xs text-gray-600" numberOfLines={3}>
            {coaching.insight}
          </Text>
          {coaching.suggestedAction && (
            <View className="rounded-lg bg-indigo-50 p-3">
              <Text className="text-xs font-semibold text-indigo-900 mb-1">
                Next Step
              </Text>
              <Text className="text-xs text-indigo-800">
                {coaching.suggestedAction}
              </Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  )
}

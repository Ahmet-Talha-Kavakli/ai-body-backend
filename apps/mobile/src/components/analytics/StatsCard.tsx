import React from 'react'
import { Pressable, Text, View } from 'react-native'

interface StatsCardProps {
  label: string
  value: string | number
  unit: string
  trend: 'up' | 'down' | 'flat'
  percentChange: number
  icon: string
  onPress?: () => void
}

const TrendIcon: Record<'up' | 'down' | 'flat', string> = {
  up: '📈',
  down: '📉',
  flat: '➡️',
}

const TrendColor: Record<'up' | 'down' | 'flat', string> = {
  up: 'text-green-600',
  down: 'text-red-600',
  flat: 'text-gray-600',
}

export function StatsCard({
  label,
  value,
  unit,
  trend,
  percentChange,
  icon,
  onPress,
}: StatsCardProps) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-1 rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
      testID="stats-card"
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-1">
          <Text className="text-xs font-medium text-gray-600 mb-1">
            {label}
          </Text>
          <View className="flex-row items-baseline">
            <Text className="text-2xl font-bold text-gray-900">
              {value}
            </Text>
            <Text className="ml-1 text-xs text-gray-500">{unit}</Text>
          </View>
          <View className="flex-row items-center mt-2">
            <Text className="mr-1">{TrendIcon[trend]}</Text>
            <Text className={`text-xs font-medium ${TrendColor[trend]}`}>
              {Math.abs(percentChange)}% {trend === 'down' ? 'down' : 'up'}
            </Text>
          </View>
        </View>
        <Text className="text-3xl ml-2">{icon}</Text>
      </View>
    </Pressable>
  )
}

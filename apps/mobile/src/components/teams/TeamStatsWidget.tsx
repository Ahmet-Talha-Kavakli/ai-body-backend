import React, { useState } from 'react'
import { View, Text, TouchableOpacity } from 'react-native'
import type { TeamStatsSnapshot } from '../../types/teams'

interface Props {
  stats?: TeamStatsSnapshot
}

type TimePeriod = 'week' | 'month'

export function TeamStatsWidget({ stats }: Props) {
  const [period, setPeriod] = useState<TimePeriod>('week')

  if (!stats) {
    return (
      <View className="bg-gray-50 rounded-lg p-4" testID="stats-widget-empty">
        <Text className="text-gray-500 text-center">No stats available</Text>
      </View>
    )
  }

  // Calculate trend indicators (mock - would be calculated from historical data)
  const trends = {
    workouts: '↑',
    calories: '↑',
    steps: '→',
    duration: '↑',
  }

  const statCards = [
    {
      label: 'Workouts',
      value: stats.totalWorkouts,
      trend: trends.workouts,
      color: 'bg-blue-50',
      textColor: 'text-blue-700',
    },
    {
      label: 'Calories',
      value: stats.totalCalories,
      trend: trends.calories,
      color: 'bg-red-50',
      textColor: 'text-red-700',
    },
    {
      label: 'Steps',
      value: Math.floor(stats.totalSteps / 1000),
      trend: trends.steps,
      color: 'bg-green-50',
      textColor: 'text-green-700',
      unit: 'k',
    },
    {
      label: 'Duration',
      value: Math.floor(stats.totalDuration / 60),
      trend: trends.duration,
      color: 'bg-orange-50',
      textColor: 'text-orange-700',
      unit: 'h',
    },
  ]

  return (
    <View testID="stats-widget">
      {/* Time Period Toggle */}
      <View className="flex-row justify-between items-center mb-4">
        <Text className="font-semibold text-gray-900">Team Statistics</Text>
        <View className="flex-row bg-gray-100 rounded-lg p-1">
          {(['week', 'month'] as const).map((p) => (
            <TouchableOpacity
              key={p}
              onPress={() => setPeriod(p)}
              className={`px-3 py-1 rounded ${
                period === p ? 'bg-white shadow-sm' : 'bg-transparent'
              }`}
              testID={`period-${p}`}
            >
              <Text
                className={`text-xs font-semibold ${
                  period === p ? 'text-blue-600' : 'text-gray-600'
                }`}
              >
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Stats Cards Grid */}
      <View className="flex-row flex-wrap -mx-1">
        {statCards.map((card) => (
          <View key={card.label} className="w-1/2 px-1 mb-2">
            <View className={`${card.color} rounded-lg p-3`}>
              <View className="flex-row justify-between items-start mb-1">
                <Text className="text-xs text-gray-600 font-semibold">
                  {card.label}
                </Text>
                <Text className={`text-lg ${card.textColor}`}>{card.trend}</Text>
              </View>
              <View className="flex-row items-baseline">
                <Text className={`text-2xl font-bold ${card.textColor}`}>
                  {card.value}
                </Text>
                {card.unit && (
                  <Text className={`text-sm ${card.textColor} ml-1`}>
                    {card.unit}
                  </Text>
                )}
              </View>
            </View>
          </View>
        ))}
      </View>
    </View>
  )
}

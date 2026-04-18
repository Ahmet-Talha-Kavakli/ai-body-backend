import React from 'react'
import { View, Text, TouchableOpacity } from 'react-native'

interface HealthDashboardWidgetProps {
  avgHeartRate: number
  sleepDuration: number
  totalSteps: number
  activeCalories: number
  onTap: () => void
}

export function HealthDashboardWidget({
  avgHeartRate,
  sleepDuration,
  totalSteps,
  activeCalories,
  onTap,
}: HealthDashboardWidgetProps) {
  const sleepHours = Math.round(sleepDuration / 60)

  return (
    <TouchableOpacity onPress={onTap} activeOpacity={0.7}>
      <View className="rounded-lg border border-gray-200 bg-white p-6">
        <Text className="mb-4 text-lg font-semibold text-gray-900">Today's Health</Text>

        <View className="flex flex-row justify-between gap-4">
          <View className="flex flex-1 flex-col gap-1">
            <Text className="text-xs font-medium text-gray-600">Heart Rate</Text>
            <Text className="text-2xl font-bold text-gray-900">{avgHeartRate}</Text>
            <Text className="text-xs text-gray-500">bpm</Text>
          </View>

          <View className="flex flex-1 flex-col gap-1">
            <Text className="text-xs font-medium text-gray-600">Sleep</Text>
            <Text className="text-2xl font-bold text-gray-900">{sleepHours}</Text>
            <Text className="text-xs text-gray-500">hours</Text>
          </View>

          <View className="flex flex-1 flex-col gap-1">
            <Text className="text-xs font-medium text-gray-600">Steps</Text>
            <Text className="text-2xl font-bold text-gray-900">{totalSteps.toLocaleString()}</Text>
            <Text className="text-xs text-gray-500">today</Text>
          </View>

          <View className="flex flex-1 flex-col gap-1">
            <Text className="text-xs font-medium text-gray-600">Calories</Text>
            <Text className="text-2xl font-bold text-gray-900">{activeCalories}</Text>
            <Text className="text-xs text-gray-500">kcal</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  )
}

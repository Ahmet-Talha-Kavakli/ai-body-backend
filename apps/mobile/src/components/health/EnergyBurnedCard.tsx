import React from 'react'
import { View, Text } from 'react-native'

interface EnergyBurnedCardProps {
  activeCalories: number
  basalCalories: number
  weeklyActiveAvg: number
}

export function EnergyBurnedCard({
  activeCalories,
  basalCalories,
  weeklyActiveAvg,
}: EnergyBurnedCardProps) {
  const maxActive = Math.max(activeCalories, weeklyActiveAvg, 500)
  const activeProgress = (activeCalories / maxActive) * 100

  return (
    <View className="rounded-lg border border-gray-200 bg-white p-6">
      <Text className="mb-6 text-lg font-semibold text-gray-900">Energy Burned</Text>

      <View className="flex flex-col gap-6">
        {/* Active Calories */}
        <View className="flex flex-col gap-2">
          <View className="flex flex-row justify-between">
            <Text className="font-medium text-gray-700">Active</Text>
            <Text className="font-semibold text-gray-900">{activeCalories} kcal</Text>
          </View>
          <View className="flex h-2 overflow-hidden rounded-full bg-gray-200">
            <View
              style={{ width: `${activeProgress}%` }}
              className="bg-orange-500"
            />
          </View>
          <Text className="text-xs text-gray-500">Weekly avg: {weeklyActiveAvg} kcal</Text>
        </View>

        {/* Basal Calories */}
        <View className="flex flex-col gap-2">
          <View className="flex flex-row justify-between">
            <Text className="font-medium text-gray-700">Basal</Text>
            <Text className="font-semibold text-gray-900">{basalCalories} kcal</Text>
          </View>
          <View className="flex h-2 overflow-hidden rounded-full bg-gray-200">
            <View
              style={{ width: 100 }}
              className="bg-blue-400"
            />
          </View>
          <Text className="text-xs text-gray-500">Daily burn rate</Text>
        </View>

        {/* Total */}
        <View className="border-t border-gray-200 pt-4">
          <View className="flex flex-row justify-between">
            <Text className="font-semibold text-gray-700">Total</Text>
            <Text className="text-xl font-bold text-gray-900">
              {activeCalories + basalCalories}
            </Text>
          </View>
          <Text className="text-xs text-gray-500">kcal burned today</Text>
        </View>
      </View>
    </View>
  )
}

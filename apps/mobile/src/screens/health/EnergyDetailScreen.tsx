import React, { useState } from 'react'
import { View, ScrollView, Text, TouchableOpacity } from 'react-native'
import { useHealthStore } from '../../store/healthStore'
import { EnergyBurnedCard } from '../../components/health/EnergyBurnedCard'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'

type EnergyDetailScreenNavigationProp = NativeStackNavigationProp<any, 'EnergyDetail'>

interface EnergyDetailScreenProps {
  navigation: EnergyDetailScreenNavigationProp
  route: any
}

export function EnergyDetailScreen({ navigation }: EnergyDetailScreenProps) {
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month'>('today')
  const { energyData, getTotalEnergy } = useHealthStore()

  const today = new Date().toISOString().split('T')[0]
  const todayEnergy = getTotalEnergy(today)

  const todayData = energyData.filter(e => e.date === today)[0]
  const activeCalories = todayData?.activeCalories || 0
  const basalCalories = todayData?.basalCalories || 0

  const weeklyActiveAvg = energyData.length > 0
    ? Math.round(energyData.reduce((sum, d) => sum + d.activeCalories, 0) / energyData.length)
    : 0

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="flex flex-col gap-6 px-4 py-6">
        {/* Header */}
        <View>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text className="text-sm font-medium text-blue-600">Back</Text>
          </TouchableOpacity>
          <Text className="mt-2 text-3xl font-bold text-gray-900">Energy Burned</Text>
        </View>

        {/* Time Range Picker */}
        <View className="flex flex-row gap-2 rounded-lg bg-white p-2">
          {(['today', 'week', 'month'] as const).map(range => (
            <TouchableOpacity
              key={range}
              onPress={() => setTimeRange(range)}
              className={`flex-1 rounded-md py-2 px-3 ${
                timeRange === range ? 'bg-blue-500' : 'bg-gray-100'
              }`}
            >
              <Text
                className={`text-center text-sm font-medium ${
                  timeRange === range ? 'text-white' : 'text-gray-700'
                }`}
              >
                {range.charAt(0).toUpperCase() + range.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Card */}
        <EnergyBurnedCard
          activeCalories={activeCalories}
          basalCalories={basalCalories}
          weeklyActiveAvg={weeklyActiveAvg}
        />

        {/* Stats */}
        <View className="flex flex-col gap-4 rounded-lg border border-gray-200 bg-white p-4">
          <Text className="text-sm font-semibold text-gray-900">Breakdown</Text>
          <View className="flex flex-col gap-3">
            <View className="flex flex-row justify-between">
              <Text className="text-sm text-gray-600">Active Calories</Text>
              <Text className="font-semibold text-gray-900">{activeCalories} kcal</Text>
            </View>
            <View className="flex flex-row justify-between">
              <Text className="text-sm text-gray-600">Basal Calories</Text>
              <Text className="font-semibold text-gray-900">{basalCalories} kcal</Text>
            </View>
            <View className="border-t border-gray-200 pt-3" />
            <View className="flex flex-row justify-between">
              <Text className="text-sm text-gray-600">Total</Text>
              <Text className="text-lg font-bold text-gray-900">{todayEnergy} kcal</Text>
            </View>
            <View className="flex flex-row justify-between">
              <Text className="text-sm text-gray-600">Weekly Avg (Active)</Text>
              <Text className="font-semibold text-gray-900">{weeklyActiveAvg} kcal</Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  )
}

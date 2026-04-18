import React, { useState } from 'react'
import { View, ScrollView, Text, TouchableOpacity } from 'react-native'
import { useHealthStore } from '../../store/healthStore'
import { HeartRateChart } from '../../components/health/HeartRateChart'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'

type HeartRateDetailScreenNavigationProp = NativeStackNavigationProp<any, 'HeartRateDetail'>

interface HeartRateDetailScreenProps {
  navigation: HeartRateDetailScreenNavigationProp
  route: any
}

export function HeartRateDetailScreen({ navigation }: HeartRateDetailScreenProps) {
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month'>('today')
  const { heartRateReadings, getAverageHeartRate } = useHealthStore()

  const today = new Date().toISOString().split('T')[0]
  const avgHeartRate = getAverageHeartRate(today)
  const minBpm = heartRateReadings.length > 0 ? Math.min(...heartRateReadings.map(r => r.bpm)) : 0
  const maxBpm = heartRateReadings.length > 0 ? Math.max(...heartRateReadings.map(r => r.bpm)) : 0

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="flex flex-col gap-6 px-4 py-6">
        {/* Header */}
        <View>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text className="text-sm font-medium text-blue-600">Back</Text>
          </TouchableOpacity>
          <Text className="mt-2 text-3xl font-bold text-gray-900">Heart Rate</Text>
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

        {/* Chart */}
        <HeartRateChart
          readings={heartRateReadings}
          timeRange={timeRange}
        />

        {/* Stats */}
        <View className="flex flex-col gap-4 rounded-lg border border-gray-200 bg-white p-4">
          <Text className="text-sm font-semibold text-gray-900">Statistics</Text>
          <View className="flex flex-col gap-3">
            <View className="flex flex-row justify-between">
              <Text className="text-sm text-gray-600">Current</Text>
              <Text className="font-semibold text-gray-900">
                {heartRateReadings.length > 0 ? heartRateReadings[heartRateReadings.length - 1].bpm : 0} bpm
              </Text>
            </View>
            <View className="flex flex-row justify-between">
              <Text className="text-sm text-gray-600">Average</Text>
              <Text className="font-semibold text-gray-900">{avgHeartRate} bpm</Text>
            </View>
            <View className="flex flex-row justify-between">
              <Text className="text-sm text-gray-600">Minimum</Text>
              <Text className="font-semibold text-gray-900">{minBpm} bpm</Text>
            </View>
            <View className="flex flex-row justify-between">
              <Text className="text-sm text-gray-600">Maximum</Text>
              <Text className="font-semibold text-gray-900">{maxBpm} bpm</Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  )
}

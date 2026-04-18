import React, { useState } from 'react'
import { View, ScrollView, Text, TouchableOpacity } from 'react-native'
import { useHealthStore } from '../../store/healthStore'
import { SleepStagesChart } from '../../components/health/SleepStagesChart'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'

type SleepDetailScreenNavigationProp = NativeStackNavigationProp<any, 'SleepDetail'>

interface SleepDetailScreenProps {
  navigation: SleepDetailScreenNavigationProp
  route: any
}

export function SleepDetailScreen({ navigation }: SleepDetailScreenProps) {
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month'>('week')
  const { sleepSessions, getSleepDuration } = useHealthStore()

  const today = new Date().toISOString().split('T')[0]
  const totalSleepMinutes = getSleepDuration(today)

  const getTotalMinutes = (session: any) => {
    const stages = session.stages || {}
    return (
      (stages.remMinutes || 0) +
      (stages.deepMinutes || 0) +
      (stages.lightMinutes || 0) +
      (stages.awakeMinutes || 0)
    )
  }

  const avgSleepMinutes = sleepSessions.length > 0
    ? Math.round(sleepSessions.reduce((sum, s) => sum + getTotalMinutes(s), 0) / sleepSessions.length)
    : 0

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="flex flex-col gap-6 px-4 py-6">
        {/* Header */}
        <View>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text className="text-sm font-medium text-blue-600">Back</Text>
          </TouchableOpacity>
          <Text className="mt-2 text-3xl font-bold text-gray-900">Sleep Analysis</Text>
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
        <SleepStagesChart sessions={sleepSessions} />

        {/* Stats */}
        <View className="flex flex-col gap-4 rounded-lg border border-gray-200 bg-white p-4">
          <Text className="text-sm font-semibold text-gray-900">Sleep Statistics</Text>
          <View className="flex flex-col gap-3">
            <View className="flex flex-row justify-between">
              <Text className="text-sm text-gray-600">Last Night</Text>
              <Text className="font-semibold text-gray-900">
                {(totalSleepMinutes / 60).toFixed(1)} hours
              </Text>
            </View>
            <View className="flex flex-row justify-between">
              <Text className="text-sm text-gray-600">Weekly Average</Text>
              <Text className="font-semibold text-gray-900">
                {(avgSleepMinutes / 60).toFixed(1)} hours
              </Text>
            </View>
            <View className="flex flex-row justify-between">
              <Text className="text-sm text-gray-600">Total Nights</Text>
              <Text className="font-semibold text-gray-900">{sleepSessions.length}</Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  )
}

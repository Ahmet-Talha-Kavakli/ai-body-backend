import React, { useState } from 'react'
import { View, ScrollView, Text, TouchableOpacity } from 'react-native'
import { useHealthStore } from '../../store/healthStore'
import { StepProgressRing } from '../../components/health/StepProgressRing'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'

type StepsDetailScreenNavigationProp = NativeStackNavigationProp<any, 'StepsDetail'>

interface StepsDetailScreenProps {
  navigation: StepsDetailScreenNavigationProp
  route: any
}

const STEP_GOAL = 10000

export function StepsDetailScreen({ navigation }: StepsDetailScreenProps) {
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month'>('today')
  const { stepData, getTotalSteps } = useHealthStore()

  const today = new Date().toISOString().split('T')[0]
  const todaySteps = getTotalSteps(today)

  const avgSteps = stepData.length > 0
    ? Math.round(stepData.reduce((sum, d) => sum + d.count, 0) / stepData.length)
    : 0

  const goalPercentage = Math.round((todaySteps / STEP_GOAL) * 100)

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="flex flex-col gap-6 px-4 py-6">
        {/* Header */}
        <View>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text className="text-sm font-medium text-blue-600">Back</Text>
          </TouchableOpacity>
          <Text className="mt-2 text-3xl font-bold text-gray-900">Activity Tracking</Text>
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

        {/* Progress Ring */}
        <StepProgressRing
          current={todaySteps}
          goal={STEP_GOAL}
        />

        {/* Stats */}
        <View className="flex flex-col gap-4 rounded-lg border border-gray-200 bg-white p-4">
          <Text className="text-sm font-semibold text-gray-900">Statistics</Text>
          <View className="flex flex-col gap-3">
            <View className="flex flex-row justify-between">
              <Text className="text-sm text-gray-600">Today</Text>
              <Text className="font-semibold text-gray-900">{todaySteps.toLocaleString()}</Text>
            </View>
            <View className="flex flex-row justify-between">
              <Text className="text-sm text-gray-600">Goal</Text>
              <Text className="font-semibold text-gray-900">{STEP_GOAL.toLocaleString()}</Text>
            </View>
            <View className="flex flex-row justify-between">
              <Text className="text-sm text-gray-600">Percentage</Text>
              <Text className="font-semibold text-gray-900">{goalPercentage}%</Text>
            </View>
            <View className="flex flex-row justify-between">
              <Text className="text-sm text-gray-600">Daily Average</Text>
              <Text className="font-semibold text-gray-900">{avgSteps.toLocaleString()}</Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  )
}

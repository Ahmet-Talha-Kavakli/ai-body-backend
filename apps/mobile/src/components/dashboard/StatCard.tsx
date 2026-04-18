import React from 'react'
import { View, Text } from 'react-native'
import { Card } from '../shared/Card'
import { ProgressBar } from '../shared/ProgressBar'

interface StatCardProps {
  title: string
  current: number
  goal: number
  unit: string
  icon?: string
  testID?: string
}

export function StatCard({ title, current, goal, unit, icon, testID }: StatCardProps) {
  const percentage = (current / goal) * 100

  return (
    <Card testID={testID} className="mb-4">
      <View className="mb-3 flex-row items-start justify-between">
        <Text className="text-sm text-gray-600">{title}</Text>
        <Text className="text-xs text-gray-500">{icon}</Text>
      </View>
      <View className="mb-2">
        <Text className="text-2xl font-bold">
          {current} <Text className="text-lg text-gray-600">{unit}</Text>
        </Text>
        <Text className="text-xs text-gray-500">
          Goal: {goal} {unit}
        </Text>
      </View>
      <ProgressBar percentage={percentage} />
    </Card>
  )
}

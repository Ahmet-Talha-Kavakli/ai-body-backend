import React from 'react'
import { ScrollView, Text } from 'react-native'
import { Card } from '../../../components/shared/Card'

export function SleepTab() {
  return (
    <ScrollView className="flex-1 p-6">
      <Card className="mb-4">
        <Text className="mb-2 text-sm text-gray-600">Average Sleep</Text>
        <Text className="text-3xl font-bold">7h 30m</Text>
      </Card>
      <Card>
        <Text className="mb-2 text-sm text-gray-600">Sleep Quality</Text>
        <Text className="text-3xl font-bold">8/10</Text>
      </Card>
    </ScrollView>
  )
}

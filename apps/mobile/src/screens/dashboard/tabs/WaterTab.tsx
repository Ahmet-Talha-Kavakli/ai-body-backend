import React from 'react'
import { ScrollView, View, Text } from 'react-native'
import { Card } from '../../../components/shared/Card'
import { Button } from '../../../components/shared/Button'

export function WaterTab() {
  return (
    <ScrollView className="flex-1 p-6">
      <Card className="mb-4">
        <Text className="mb-2 text-sm text-gray-600">Daily Goal</Text>
        <Text className="text-3xl font-bold">1500ml / 2000ml</Text>
      </Card>
      <View className="gap-2">
        <Button label="+ 250ml" onPress={() => {}} />
        <Button label="+ 500ml" onPress={() => {}} />
      </View>
    </ScrollView>
  )
}

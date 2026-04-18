import React from 'react'
import { ScrollView, Text } from 'react-native'
import { Card } from '../../../components/shared/Card'

export function HealthTab({ profile }: any) {
  return (
    <ScrollView className="flex-1 p-6">
      <Card className="mb-4">
        <Text className="mb-2 text-sm text-gray-600">Health Conditions</Text>
        <Text className="text-gray-800">
          {profile?.healthConditions?.length > 0
            ? profile.healthConditions.join(', ')
            : 'None reported'}
        </Text>
      </Card>
      <Card>
        <Text className="mb-2 text-sm text-gray-600">Injuries</Text>
        <Text className="text-gray-800">
          {profile?.injuries?.length > 0 ? profile.injuries.join(', ') : 'None reported'}
        </Text>
      </Card>
    </ScrollView>
  )
}

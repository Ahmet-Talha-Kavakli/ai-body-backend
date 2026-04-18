import React from 'react'
import { View, ScrollView, Text } from 'react-native'
import { Card } from '../../../components/shared/Card'

interface OverviewTabProps {
  profile: any
}

export function OverviewTab({ profile }: OverviewTabProps) {
  const calculateBMI = (weight: number, height: number) => {
    return (weight / (height / 100) ** 2).toFixed(1)
  }

  const bmi =
    profile?.weight && profile?.height ? calculateBMI(profile.weight, profile.height) : 'N/A'

  return (
    <ScrollView className="flex-1 p-6">
      <Card className="mb-4">
        <Text className="mb-2 text-sm text-gray-600">Age</Text>
        <Text className="text-2xl font-bold">{profile?.age || 'N/A'} years</Text>
      </Card>

      <Card className="mb-4">
        <Text className="mb-2 text-sm text-gray-600">BMI</Text>
        <Text className="text-2xl font-bold">{bmi}</Text>
        <Text className="mt-2 text-xs text-gray-500">
          {profile?.weight}kg / {profile?.height}cm
        </Text>
      </Card>

      <Card className="mb-4">
        <Text className="mb-2 text-sm text-gray-600">Fitness Level</Text>
        <Text className="text-lg font-bold">Intermediate</Text>
      </Card>

      <Card>
        <Text className="mb-2 text-sm text-gray-600">Goal</Text>
        <Text className="text-lg font-bold capitalize">
          {profile?.goalType?.replace('_', ' ') || 'Not set'}
        </Text>
      </Card>
    </ScrollView>
  )
}

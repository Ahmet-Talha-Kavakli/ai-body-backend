import React from 'react'
import { View, Text } from 'react-native'

interface OnboardingProgressProps {
  currentStep: number
  totalSteps: number
}

export function OnboardingProgress({ currentStep, totalSteps }: OnboardingProgressProps) {
  return (
    <View className="mb-6">
      <View className="overflow-hidden rounded-full bg-gray-200">
        <View
          className="bg-blue-600"
          style={{ width: `${(currentStep / totalSteps) * 100}%`, height: 8 }}
        />
      </View>
      <Text className="mt-2 text-center text-xs text-gray-600">
        Step {currentStep} of {totalSteps}
      </Text>
    </View>
  )
}

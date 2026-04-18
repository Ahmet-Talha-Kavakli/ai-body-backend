import React from 'react'
import { Pressable, Text } from 'react-native'

interface QuickActionButtonProps {
  label: string
  icon: string
  onPress: () => void
  testID?: string
}

export function QuickActionButton({ label, icon, onPress, testID }: QuickActionButtonProps) {
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      className="m-2 flex-1 items-center justify-center rounded-lg border border-gray-200 bg-white p-4"
    >
      <Text className="mb-2 text-2xl">{icon}</Text>
      <Text className="text-center text-xs font-semibold text-gray-700">{label}</Text>
    </Pressable>
  )
}

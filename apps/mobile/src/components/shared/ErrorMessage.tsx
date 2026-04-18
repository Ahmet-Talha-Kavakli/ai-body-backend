import React from 'react'
import { View, Text } from 'react-native'

interface ErrorMessageProps {
  message: string
  onDismiss?: () => void
}

export function ErrorMessage({ message }: ErrorMessageProps) {
  return (
    <View className="mb-4 rounded-lg border border-red-300 bg-red-100 p-3">
      <Text className="text-sm text-red-700">{message}</Text>
    </View>
  )
}

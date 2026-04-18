import React from 'react'
import { ActivityIndicator, View } from 'react-native'

interface LoadingSpinnerProps {
  size?: 'small' | 'large'
  color?: string
}

export function LoadingSpinner({ size = 'large', color = '#2563EB' }: LoadingSpinnerProps) {
  return (
    <View className="flex-1 items-center justify-center py-8">
      <ActivityIndicator size={size} color={color} />
    </View>
  )
}

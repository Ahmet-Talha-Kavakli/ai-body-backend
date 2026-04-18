import React from 'react'
import { View } from 'react-native'

interface ProgressBarProps {
  percentage: number
  height?: number
  color?: string
}

export function ProgressBar({ percentage, height = 8, color = '#2563EB' }: ProgressBarProps) {
  const safePercentage = Math.min(Math.max(percentage, 0), 100)

  return (
    <View className="overflow-hidden rounded-full bg-gray-200" style={{ height }}>
      <View
        className="rounded-full bg-blue-600"
        style={{
          width: `${safePercentage}%`,
          height: '100%',
        }}
      />
    </View>
  )
}

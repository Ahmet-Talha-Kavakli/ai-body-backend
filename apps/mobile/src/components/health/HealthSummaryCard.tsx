import React from 'react'
import { View, Text, TouchableOpacity } from 'react-native'

interface HealthSummaryCardProps {
  icon: string
  label: string
  value: string
  unit?: string
  onTap?: () => void
}

export function HealthSummaryCard({
  icon,
  label,
  value,
  unit,
  onTap,
}: HealthSummaryCardProps) {
  const content = (
    <View className="flex flex-col items-center gap-2 rounded-lg border border-gray-200 bg-white p-4">
      <Text className="text-sm font-medium text-gray-600">{label}</Text>
      <View className="flex flex-row items-baseline gap-1">
        <Text className="text-3xl font-bold text-gray-900">{value}</Text>
        {unit && <Text className="text-xs text-gray-500">{unit}</Text>}
      </View>
    </View>
  )

  if (onTap) {
    return <TouchableOpacity onPress={onTap}>{content}</TouchableOpacity>
  }

  return content
}

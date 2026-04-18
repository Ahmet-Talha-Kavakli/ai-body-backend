import React from 'react'
import { View, Text, TouchableOpacity } from 'react-native'

interface PermissionRequestCardProps {
  icon: string
  title: string
  description: string
  onAllow: () => void
  onMaybeLater: () => void
}

export function PermissionRequestCard({
  icon,
  title,
  description,
  onAllow,
  onMaybeLater,
}: PermissionRequestCardProps) {
  return (
    <View className="flex flex-col gap-4 rounded-lg border border-gray-200 bg-white p-6">
      <View className="flex flex-col gap-2">
        <Text className="text-lg font-semibold text-gray-900">{title}</Text>
        <Text className="text-sm text-gray-600">{description}</Text>
      </View>

      <View className="flex flex-col gap-3">
        <TouchableOpacity
          onPress={onAllow}
          className="rounded-lg bg-blue-500 px-4 py-3"
        >
          <Text className="text-center font-semibold text-white">Allow in Settings</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onMaybeLater}
          className="rounded-lg border border-gray-300 bg-white px-4 py-3"
        >
          <Text className="text-center font-medium text-gray-700">Maybe Later</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

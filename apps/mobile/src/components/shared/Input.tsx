import React from 'react'
import { TextInput, View, Text } from 'react-native'

interface InputProps {
  label?: string
  placeholder?: string
  value: string
  onChangeText: (text: string) => void
  error?: string
  secureTextEntry?: boolean
}

export function Input({
  label,
  placeholder,
  value,
  onChangeText,
  error,
  secureTextEntry,
}: InputProps) {
  return (
    <View className="mb-4">
      {label && <Text className="mb-1 text-sm font-semibold text-gray-700">{label}</Text>}
      <TextInput
        className="rounded-lg border border-gray-300 px-3 py-2 text-base text-gray-900"
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
      />
      {error && <Text className="mt-1 text-xs text-red-500">{error}</Text>}
    </View>
  )
}

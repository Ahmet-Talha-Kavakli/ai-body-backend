import React from 'react'
import { View, Text, Animated } from 'react-native'

interface TypingIndicatorProps {
  userNames: string[]
}

export function TypingIndicator({ userNames }: TypingIndicatorProps) {
  // Limit displayed names to 3, show "..." if more
  const displayNames = userNames.slice(0, 3)
  const hasMore = userNames.length > 3

  const nameText = displayNames.length === 0
    ? ''
    : displayNames.length === 1
      ? `${displayNames[0]} is typing...`
      : displayNames.length === 2
        ? `${displayNames[0]} and ${displayNames[1]} are typing...`
        : `${displayNames.join(', ')} are typing...`

  const finalText = hasMore ? nameText.replace('are typing...', 'and others are typing...') : nameText

  return (
    <View className="flex-row items-center gap-1 px-4 py-2 mb-2">
      {userNames.length > 0 && (
        <>
          {/* Animated dots */}
          <View className="flex-row gap-1">
            <View className="w-2 h-2 bg-gray-400 rounded-full" />
            <View className="w-2 h-2 bg-gray-400 rounded-full" />
            <View className="w-2 h-2 bg-gray-400 rounded-full" />
          </View>

          {/* Typing text */}
          <Text className="text-sm text-gray-600">{finalText}</Text>
        </>
      )}
    </View>
  )
}

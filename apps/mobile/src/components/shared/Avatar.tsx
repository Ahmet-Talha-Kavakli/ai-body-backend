import React from 'react'
import { Image, View, Text } from 'react-native'

interface AvatarProps {
  url?: string
  initials?: string
  size?: 'sm' | 'md' | 'lg'
}

export function Avatar({ url, initials, size = 'md' }: AvatarProps) {
  const sizeClasses = { sm: 'w-8 h-8', md: 'w-12 h-12', lg: 'w-16 h-16' }
  const textSizeClasses = { sm: 'text-xs', md: 'text-sm', lg: 'text-lg' }

  if (url) {
    return (
      <Image
        source={{ uri: url }}
        className={`${sizeClasses[size]} rounded-full`}
        resizeMode="cover"
      />
    )
  }

  return (
    <View className={`${sizeClasses[size]} items-center justify-center rounded-full bg-blue-600`}>
      <Text className={`${textSizeClasses[size]} font-bold text-white`}>{initials}</Text>
    </View>
  )
}

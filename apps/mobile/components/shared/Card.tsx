import React from 'react'
import { View } from 'react-native'

interface CardProps {
  children: React.ReactNode
  className?: string
}

export function Card({ children, className }: CardProps) {
  return (
    <View className={`rounded-lg border border-gray-200 bg-white p-4 shadow-sm ${className || ''}`}>
      {children}
    </View>
  )
}

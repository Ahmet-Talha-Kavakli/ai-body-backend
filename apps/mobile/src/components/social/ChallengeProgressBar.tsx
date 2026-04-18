import React from 'react'
import { View } from 'react-native'

interface ChallengeProgressBarProps {
  current: number
  target: number
}

export function ChallengeProgressBar({ current, target }: ChallengeProgressBarProps) {
  const percentage = (current / target) * 100
  return (
    <View style={{ width: '100%', height: 8, backgroundColor: '#e0e0e0' }}>
      <View style={{ width: `${Math.min(percentage, 100)}%`, height: '100%', backgroundColor: '#4CAF50' }} />
    </View>
  )
}

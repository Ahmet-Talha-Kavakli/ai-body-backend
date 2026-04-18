import React from 'react'
import { View, Text } from 'react-native'
import type { ChallengeWithProgress } from '@/types/challenge'

interface ChallengeCardProps {
  challenge: ChallengeWithProgress
  onJoin?: () => void
}

export function ChallengeCard({ challenge, onJoin }: ChallengeCardProps) {
  return (
    <View>
      <Text>{challenge.challenge.title}</Text>
      <Text>{challenge.progress.currentValue}/{challenge.challenge.target}</Text>
    </View>
  )
}

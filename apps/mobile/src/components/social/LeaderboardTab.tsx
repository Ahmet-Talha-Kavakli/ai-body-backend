import React from 'react'
import { View, Text } from 'react-native'
import type { Leaderboard } from '@/types/social-social'

interface LeaderboardTabProps {
  leaderboard: Leaderboard | null
  onPeriodChange?: (period: 'daily' | 'weekly' | 'monthly' | 'allTime') => void
}

export function LeaderboardTab({ leaderboard, onPeriodChange }: LeaderboardTabProps) {
  return (
    <View>
      <Text>{leaderboard?.type}</Text>
      <Text>{leaderboard?.entries.length || 0} players</Text>
    </View>
  )
}

import React from 'react'
import { View, Text } from 'react-native'
import type { LeaderboardEntry } from '@/types/social-social'

interface LeaderboardRowProps {
  entry: LeaderboardEntry
}

export function LeaderboardRow({ entry }: LeaderboardRowProps) {
  return (
    <View>
      <Text>#{entry.rank}</Text>
      <Text>{entry.username}</Text>
      <Text>{entry.score} pts</Text>
    </View>
  )
}

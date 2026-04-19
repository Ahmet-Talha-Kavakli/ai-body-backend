import React from 'react'
import { View, Text, Image } from 'react-native'

interface Props {
  rank: number
  name: string
  avatar?: string
  contribution: number
  percentage: number
  testID?: string
}

function getRankMedal(rank: number): string {
  if (rank === 1) return '🥇'
  if (rank === 2) return '🥈'
  if (rank === 3) return '🥉'
  return `${rank}`
}

export function TeamLeaderboardRow({
  rank,
  name,
  avatar,
  contribution,
  percentage,
  testID,
}: Props) {
  const medal = getRankMedal(rank)
  const isMedalRank = rank <= 3

  return (
    <View
      className="flex-row items-center justify-between p-3 border-b border-gray-100"
      testID={testID}
    >
      {/* Rank Medal */}
      <View className="w-12 items-center">
        {isMedalRank ? (
          <Text className="text-2xl">{medal}</Text>
        ) : (
          <Text className="font-bold text-gray-600 text-lg">#{rank}</Text>
        )}
      </View>

      {/* Avatar and Name */}
      <View className="flex-row items-center flex-1 mx-2">
        <Image
          source={{ uri: avatar || 'https://via.placeholder.com/36' }}
          className="w-9 h-9 rounded-full mr-2"
          testID={`leaderboard-avatar-${rank}`}
        />
        <Text className="font-semibold text-gray-900 flex-1">{name}</Text>
      </View>

      {/* Contribution and Percentage */}
      <View className="items-end w-20">
        <Text className="font-bold text-gray-900">{contribution}</Text>
        <Text className="text-xs text-gray-500">{percentage}%</Text>
      </View>
    </View>
  )
}

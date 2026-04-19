import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
} from 'react-native'
import { TeamLeaderboardRow } from '../../components/teams/TeamLeaderboardRow'
import type { TeamMember } from '../../types/teams'

interface Props {
  navigation: any
  route: any
}

type TimePeriod = 'week' | 'month' | 'all-time'

export function TeamLeaderboardScreen({ navigation, route }: Props) {
  const { teamId } = route.params
  const [members, setMembers] = useState<TeamMember[]>([])
  const [period, setPeriod] = useState<TimePeriod>('week')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadLeaderboard()
  }, [teamId, period])

  const loadLeaderboard = async () => {
    setLoading(true)
    try {
      // In real app: fetch from useTeamDetailStore with period filter
      setMembers([])
    } finally {
      setLoading(false)
    }
  }

  const sortedMembers = members.sort(
    (a, b) => b.contribution.workouts - a.contribution.workouts
  )
  const totalContribution = sortedMembers.reduce(
    (sum, m) => sum + m.contribution.workouts,
    0
  )

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white border-b border-gray-200 p-4">
        <Text className="text-2xl font-bold text-gray-900 mb-4">
          Leaderboard
        </Text>

        {/* Period Filter */}
        <View className="flex-row justify-between">
          {(['week', 'month', 'all-time'] as const).map((p) => (
            <TouchableOpacity
              key={p}
              onPress={() => setPeriod(p)}
              className={`flex-1 py-2 rounded-lg items-center mx-1 ${
                period === p ? 'bg-blue-500' : 'bg-gray-200'
              }`}
              testID={`period-${p}`}
            >
              <Text
                className={`font-semibold ${
                  period === p ? 'text-white' : 'text-gray-700'
                }`}
              >
                {p === 'all-time' ? 'All Time' : p.charAt(0).toUpperCase() + p.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Leaderboard List */}
      {sortedMembers.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-gray-500 text-lg">No members</Text>
        </View>
      ) : (
        <FlatList
          data={sortedMembers}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => (
            <TeamLeaderboardRow
              rank={index + 1}
              name={item.userName}
              avatar={item.userAvatar}
              contribution={item.contribution.workouts}
              percentage={
                totalContribution > 0
                  ? Math.round(
                      (item.contribution.workouts / totalContribution) * 100
                    )
                  : 0
              }
              testID={`leaderboard-${item.id}`}
            />
          )}
          testID="leaderboard-list"
        />
      )}
    </SafeAreaView>
  )
}

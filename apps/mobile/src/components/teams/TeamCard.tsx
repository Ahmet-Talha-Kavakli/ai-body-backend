import React from 'react'
import { View, Text, TouchableOpacity, Image, ScrollView } from 'react-native'
import type { Team } from '../../types/teams'

interface Props {
  team: Team
  onPress: (teamId: string) => void
}

export function TeamCard({ team, onPress }: Props) {
  const handlePress = () => {
    onPress(team.id)
  }

  const topMembers = team.stats?.memberBreakdown
    ? Object.entries(team.stats.memberBreakdown)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
    : []

  return (
    <TouchableOpacity
      onPress={handlePress}
      className="bg-white border border-gray-200 rounded-lg p-4 mb-3"
    >
      {/* Team Header */}
      <View className="flex-row items-center mb-3">
        <Image
          source={{ uri: team.avatar || 'https://via.placeholder.com/50' }}
          className="w-12 h-12 rounded-full mr-3"
          testID="team-avatar"
        />
        <View className="flex-1">
          <Text className="font-bold text-lg text-gray-900">{team.name}</Text>
          <Text className="text-sm text-gray-500">{team.memberCount}/10 members</Text>
        </View>
      </View>

      {/* Description */}
      {team.description && (
        <Text className="text-sm text-gray-600 mb-3 leading-5">
          {team.description}
        </Text>
      )}

      {/* Stats Summary */}
      {team.stats && (
        <View className="flex-row justify-between mb-3 p-3 bg-gray-50 rounded">
          <View className="items-center">
            <Text className="text-xs text-gray-500">Workouts</Text>
            <Text className="font-bold text-gray-900">{team.stats.totalWorkouts}</Text>
          </View>
          <View className="items-center">
            <Text className="text-xs text-gray-500">Calories</Text>
            <Text className="font-bold text-gray-900">{team.stats.totalCalories} cal</Text>
          </View>
          <View className="items-center">
            <Text className="text-xs text-gray-500">Steps</Text>
            <Text className="font-bold text-gray-900">{Math.floor(team.stats.totalSteps / 1000)}k</Text>
          </View>
        </View>
      )}

      {/* Leaderboard Preview */}
      {topMembers.length > 0 && (
        <View testID="leaderboard-preview" className="border-t border-gray-200 pt-3">
          <Text className="text-xs font-semibold text-gray-600 mb-2">Top Members</Text>
          {topMembers.slice(0, 3).map((entry, index) => (
            <View key={entry[0]} className="flex-row justify-between py-1">
              <Text className="text-xs text-gray-600">#{index + 1}</Text>
              <Text className="text-xs text-gray-600 flex-1">{entry[0]}</Text>
              <Text className="text-xs font-semibold text-gray-900">{entry[1]}</Text>
            </View>
          ))}
        </View>
      )}
    </TouchableOpacity>
  )
}

import React from 'react'
import { View, Text, TouchableOpacity, Image } from 'react-native'
import type { TeamMember } from '../../types/teams'

interface Props {
  member: TeamMember
  rank: number
  totalTeamContribution: number
  onPress?: (memberId: string) => void
  onRemove?: (memberId: string) => void
  showRemoveButton?: boolean
}

export function TeamMemberCard({
  member,
  rank,
  totalTeamContribution,
  onPress,
  onRemove,
  showRemoveButton = false,
}: Props) {
  const contribution = member.contribution.workouts + member.contribution.calories / 100 + member.contribution.steps / 10000 + member.contribution.duration
  const percentage = totalTeamContribution > 0 ? Math.round((contribution / totalTeamContribution) * 100) : 0

  return (
    <TouchableOpacity
      onPress={() => onPress?.(member.id)}
      className="flex-row items-center justify-between p-3 border-b border-gray-100"
      testID={`member-card-${member.id}`}
    >
      <View className="flex-row items-center flex-1">
        {/* Rank */}
        <Text className="font-bold text-gray-900 w-10">{rank}</Text>

        {/* Avatar and Name */}
        <Image
          source={{ uri: member.userAvatar || 'https://via.placeholder.com/40' }}
          className="w-10 h-10 rounded-full mr-3"
          testID={`member-avatar-${member.id}`}
        />
        <View className="flex-1">
          <Text className="font-semibold text-gray-900">{member.userName}</Text>
          <Text className="text-xs text-gray-500 capitalize">{member.role}</Text>
        </View>
      </View>

      {/* Stats and Percentage */}
      <View className="items-end mr-3">
        <Text className="text-sm font-semibold text-gray-900">{contribution.toFixed(0)}</Text>
        <Text className="text-xs text-gray-500">{percentage}% of team</Text>
      </View>

      {/* Remove Button */}
      {showRemoveButton && (
        <TouchableOpacity
          onPress={() => onRemove?.(member.id)}
          className="p-2"
          testID={`remove-member-${member.id}`}
        >
          <Text className="text-red-500 font-semibold">×</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  )
}

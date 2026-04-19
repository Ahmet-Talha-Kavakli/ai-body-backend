import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  Alert,
} from 'react-native'
import { TeamMemberCard } from '../../components/teams/TeamMemberCard'
import type { TeamMember } from '../../types/teams'

interface Props {
  navigation: any
  route: any
}

export function TeamMembersScreen({ navigation, route }: Props) {
  const { teamId } = route.params
  const [members, setMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreator, setIsCreator] = useState(false)
  const [totalContribution, setTotalContribution] = useState(0)

  useEffect(() => {
    loadMembers()
  }, [teamId])

  const loadMembers = async () => {
    setLoading(true)
    try {
      // In real app: fetch from useTeamDetailStore
      setMembers([])
      setTotalContribution(0)
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveMember = (memberId: string) => {
    Alert.alert(
      'Remove Member',
      'Are you sure you want to remove this member from the team?',
      [
        { text: 'Cancel' },
        {
          text: 'Remove',
          onPress: async () => {
            // In real app: call useTeamDetailStore.removeMember
            setMembers(members.filter((m) => m.id !== memberId))
          },
          style: 'destructive',
        },
      ]
    )
  }

  const sortedMembers = members.sort(
    (a, b) => {
      const aTotal = a.contribution.workouts + a.contribution.calories / 100 + a.contribution.steps / 10000 + a.contribution.duration
      const bTotal = b.contribution.workouts + b.contribution.calories / 100 + b.contribution.steps / 10000 + b.contribution.duration
      return bTotal - aTotal
    }
  )

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white border-b border-gray-200 p-4">
        <View className="flex-row justify-between items-center mb-2">
          <Text className="text-2xl font-bold text-gray-900">
            Team Members
          </Text>
          <Text className="text-gray-600">
            {members.length}/10
          </Text>
        </View>
        <Text className="text-gray-600">
          {members.length} members in this team
        </Text>
      </View>

      {/* Members List */}
      {members.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-gray-500 text-lg">No members</Text>
        </View>
      ) : (
        <FlatList
          data={sortedMembers}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => (
            <TeamMemberCard
              member={item}
              rank={index + 1}
              totalTeamContribution={totalContribution}
              onRemove={isCreator ? handleRemoveMember : undefined}
              showRemoveButton={isCreator && item.role === 'member'}
            />
          )}
          testID="members-list"
        />
      )}

      {/* Invite Button */}
      {isCreator && members.length < 10 && (
        <View className="p-4 bg-white border-t border-gray-200">
          <TouchableOpacity
            onPress={() =>
              navigation.navigate('InviteToTeam', { teamId })
            }
            className="bg-blue-500 p-4 rounded-lg items-center"
            testID="invite-members-button"
          >
            <Text className="text-white font-bold">Invite Members</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  )
}

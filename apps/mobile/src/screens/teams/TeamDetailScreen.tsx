import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Image,
  Alert,
} from 'react-native'
import { TeamStatsWidget } from '../../components/teams/TeamStatsWidget'
import { TeamLeaderboardRow } from '../../components/teams/TeamLeaderboardRow'
import { TeamChallengeCard } from '../../components/teams/TeamChallengeCard'
import type { Team, TeamMember, TeamChallenge } from '../../types/teams'

interface Props {
  navigation: any
  route: any
}

export function TeamDetailScreen({ navigation, route }: Props) {
  const { teamId } = route.params
  const [team, setTeam] = useState<Team | null>(null)
  const [members, setMembers] = useState<TeamMember[]>([])
  const [challenges, setChallenges] = useState<TeamChallenge[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreator, setIsCreator] = useState(false)

  useEffect(() => {
    loadTeamDetail()
  }, [teamId])

  const loadTeamDetail = async () => {
    setLoading(true)
    try {
      // In real app: fetch from useTeamDetailStore
      // const team = await useTeamDetailStore.getTeam(teamId)
      setTeam(null)
      setMembers([])
      setChallenges([])
    } finally {
      setLoading(false)
    }
  }

  const handleLeaveTeam = () => {
    Alert.alert(
      'Leave Team',
      'Are you sure you want to leave this team?',
      [
        { text: 'Cancel' },
        {
          text: 'Leave',
          onPress: async () => {
            // In real app: call useTeamsStore.leaveTeam
            navigation.goBack()
          },
          style: 'destructive',
        },
      ]
    )
  }

  const handleDeleteTeam = () => {
    Alert.alert(
      'Delete Team',
      'This will permanently delete the team. This cannot be undone.',
      [
        { text: 'Cancel' },
        {
          text: 'Delete',
          onPress: async () => {
            // In real app: call useTeamsStore.deleteTeam
            navigation.goBack()
          },
          style: 'destructive',
        },
      ]
    )
  }

  const topMembers = members.slice(0, 3)

  if (loading || !team) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center">
        <Text>Loading...</Text>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView testID="team-detail-scroll">
        {/* Header */}
        <View className="bg-white border-b border-gray-200 p-4">
          <View className="flex-row items-center mb-4">
            <Image
              source={{
                uri: team.avatar || 'https://via.placeholder.com/60',
              }}
              className="w-16 h-16 rounded-full mr-4"
            />
            <View className="flex-1">
              <Text className="text-2xl font-bold text-gray-900">
                {team.name}
              </Text>
              <Text className="text-gray-600">
                {team.memberCount}/10 members
              </Text>
            </View>
          </View>
          {team.description && (
            <Text className="text-gray-600">{team.description}</Text>
          )}
        </View>

        {/* Stats Widget */}
        <View className="p-4">
          <TeamStatsWidget stats={team.stats} />
        </View>

        {/* Leaderboard Preview */}
        <View className="bg-white border-b border-gray-200 mt-4">
          <View className="p-4 border-b border-gray-200">
            <View className="flex-row justify-between items-center">
              <Text className="font-bold text-gray-900">Leaderboard</Text>
              <TouchableOpacity
                onPress={() =>
                  navigation.navigate('TeamLeaderboard', { teamId })
                }
              >
                <Text className="text-blue-500 font-semibold">View All</Text>
              </TouchableOpacity>
            </View>
          </View>
          {topMembers.map((member, index) => (
            <TeamLeaderboardRow
              key={member.id}
              rank={index + 1}
              name={member.userName}
              avatar={member.userAvatar}
              contribution={member.contribution.workouts}
              percentage={25}
              testID={`leaderboard-row-${index}`}
            />
          ))}
        </View>

        {/* Active Challenges */}
        {challenges.length > 0 && (
          <View className="p-4">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="font-bold text-lg text-gray-900">
                Active Challenges
              </Text>
              {isCreator && (
                <TouchableOpacity
                  onPress={() =>
                    navigation.navigate('CreateChallenge', { teamId })
                  }
                >
                  <Text className="text-blue-500 font-semibold">+ New</Text>
                </TouchableOpacity>
              )}
            </View>
            {challenges
              .filter((c) => c.status === 'active')
              .map((challenge) => (
                <TeamChallengeCard
                  key={challenge.id}
                  challenge={challenge}
                  members={members}
                  onPress={() =>
                    navigation.navigate('TeamChallenges', { teamId })
                  }
                />
              ))}
          </View>
        )}

        {/* Team Members Section */}
        <View className="bg-white border-t border-gray-200 mt-4 p-4">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="font-bold text-gray-900">Team Members</Text>
            <TouchableOpacity
              onPress={() =>
                navigation.navigate('TeamMembers', { teamId })
              }
            >
              <Text className="text-blue-500 font-semibold">View All</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Actions */}
        <View className="p-4 gap-3">
          <TouchableOpacity
            onPress={() =>
              navigation.navigate('InviteToTeam', { teamId })
            }
            className="bg-blue-500 p-4 rounded-lg items-center"
            testID="invite-button"
          >
            <Text className="text-white font-bold">Invite Members</Text>
          </TouchableOpacity>

          {isCreator ? (
            <TouchableOpacity
              onPress={handleDeleteTeam}
              className="bg-red-500 p-4 rounded-lg items-center"
              testID="delete-team-button"
            >
              <Text className="text-white font-bold">Delete Team</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={handleLeaveTeam}
              className="bg-gray-400 p-4 rounded-lg items-center"
              testID="leave-team-button"
            >
              <Text className="text-white font-bold">Leave Team</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

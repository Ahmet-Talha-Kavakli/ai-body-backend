import React, { useEffect, useState } from 'react'
import { View, Text, TouchableOpacity, FlatList, SafeAreaView } from 'react-native'
import { TeamCard } from '../../components/teams/TeamCard'
import type { Team } from '../../types/teams'

interface Props {
  navigation: any
}

export function TeamsTabScreen({ navigation }: Props) {
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // In real app, fetch from store
    loadTeams()
  }, [])

  const loadTeams = async () => {
    setLoading(true)
    try {
      // Placeholder: fetch teams from useTeamsStore
      setTeams([])
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTeam = () => {
    navigation.navigate('CreateTeam')
  }

  const handleTeamPress = (teamId: string) => {
    navigation.navigate('TeamDetail', { teamId })
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="flex-1">
        {/* Header */}
        <View className="bg-white border-b border-gray-200 p-4 flex-row justify-between items-center">
          <Text className="text-2xl font-bold text-gray-900">Teams</Text>
          <TouchableOpacity
            onPress={handleCreateTeam}
            className="bg-blue-500 px-4 py-2 rounded-lg"
            testID="create-team-button"
          >
            <Text className="text-white font-semibold">+ Team</Text>
          </TouchableOpacity>
        </View>

        {/* Teams List */}
        {teams.length === 0 ? (
          <View className="flex-1 items-center justify-center">
            <Text className="text-gray-500 text-lg mb-4">No teams yet</Text>
            <TouchableOpacity
              onPress={handleCreateTeam}
              className="bg-blue-500 px-6 py-3 rounded-lg"
            >
              <Text className="text-white font-semibold">Create Your First Team</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={teams}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TeamCard team={item} onPress={handleTeamPress} />
            )}
            contentContainerStyle={{ padding: 16 }}
            testID="teams-list"
          />
        )}
      </View>
    </SafeAreaView>
  )
}

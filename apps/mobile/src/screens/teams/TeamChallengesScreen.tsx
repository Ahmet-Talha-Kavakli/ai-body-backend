import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
} from 'react-native'
import { TeamChallengeCard } from '../../components/teams/TeamChallengeCard'
import type { TeamChallenge, TeamMember } from '../../types/teams'

interface Props {
  navigation: any
  route: any
}

export function TeamChallengesScreen({ navigation, route }: Props) {
  const { teamId } = route.params
  const [challenges, setChallenges] = useState<TeamChallenge[]>([])
  const [members, setMembers] = useState<TeamMember[]>([])
  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active')
  const [loading, setLoading] = useState(true)
  const [isCreator, setIsCreator] = useState(false)

  useEffect(() => {
    loadChallenges()
  }, [teamId])

  const loadChallenges = async () => {
    setLoading(true)
    try {
      // In real app: fetch from useTeamDetailStore
      setChallenges([])
      setMembers([])
    } finally {
      setLoading(false)
    }
  }

  const filteredChallenges = challenges.filter(
    (c) => c.status === (activeTab === 'active' ? 'active' : 'completed')
  )

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white border-b border-gray-200 p-4">
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-2xl font-bold text-gray-900">Challenges</Text>
          {isCreator && (
            <TouchableOpacity
              onPress={() =>
                navigation.navigate('CreateChallenge', { teamId })
              }
              className="bg-blue-500 px-4 py-2 rounded-lg"
              testID="create-challenge-button"
            >
              <Text className="text-white font-semibold">+ New</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Tab Selector */}
        <View className="flex-row gap-2">
          {(['active', 'completed'] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              className={`flex-1 py-2 rounded-lg items-center ${
                activeTab === tab ? 'bg-blue-500' : 'bg-gray-200'
              }`}
              testID={`tab-${tab}`}
            >
              <Text
                className={`font-semibold ${
                  activeTab === tab ? 'text-white' : 'text-gray-700'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Challenges List */}
      {filteredChallenges.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-gray-500 text-lg mb-4">
            No {activeTab} challenges
          </Text>
          {activeTab === 'active' && isCreator && (
            <TouchableOpacity
              onPress={() =>
                navigation.navigate('CreateChallenge', { teamId })
              }
              className="bg-blue-500 px-6 py-3 rounded-lg"
            >
              <Text className="text-white font-semibold">
                Create First Challenge
              </Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={filteredChallenges}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View className="p-4">
              <TeamChallengeCard
                challenge={item}
                members={members}
                onPress={() => {
                  // Navigate to challenge detail if needed
                }}
              />
            </View>
          )}
          testID="challenges-list"
        />
      )}
    </SafeAreaView>
  )
}

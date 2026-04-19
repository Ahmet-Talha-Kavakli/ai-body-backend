import React, { useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  SafeAreaView,
  Alert,
} from 'react-native'

interface Props {
  navigation: any
}

export function CreateTeamScreen({ navigation }: Props) {
  const [teamName, setTeamName] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)

  const handleCreate = async () => {
    if (!teamName.trim()) {
      Alert.alert('Error', 'Team name is required')
      return
    }

    setLoading(true)
    try {
      // In real app, call useTeamsStore.createTeam
      // const team = await useTeamsStore.createTeam(teamName, description)
      // navigation.goBack()
      navigation.goBack()
    } catch (error) {
      Alert.alert('Error', 'Failed to create team')
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView>
        {/* Header */}
        <View className="flex-row justify-between items-center p-4 border-b border-gray-200">
          <Text className="text-xl font-bold text-gray-900">Create Team</Text>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text className="text-2xl">✕</Text>
          </TouchableOpacity>
        </View>

        {/* Form */}
        <View className="p-4">
          {/* Team Name */}
          <View className="mb-6">
            <Text className="font-semibold text-gray-900 mb-2">Team Name *</Text>
            <TextInput
              value={teamName}
              onChangeText={setTeamName}
              placeholder="e.g., Morning Warriors"
              className="border border-gray-300 rounded-lg p-3 text-gray-900"
              testID="team-name-input"
            />
          </View>

          {/* Description */}
          <View className="mb-6">
            <Text className="font-semibold text-gray-900 mb-2">
              Description (Optional)
            </Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="What's your team about?"
              multiline
              numberOfLines={4}
              className="border border-gray-300 rounded-lg p-3 text-gray-900"
              testID="team-description-input"
            />
          </View>

          {/* Create Button */}
          <TouchableOpacity
            onPress={handleCreate}
            disabled={loading || !teamName.trim()}
            className={`p-4 rounded-lg items-center ${
              loading || !teamName.trim()
                ? 'bg-gray-300'
                : 'bg-blue-500'
            }`}
            testID="create-button"
          >
            <Text className="text-white font-bold text-lg">
              {loading ? 'Creating...' : 'Create Team'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

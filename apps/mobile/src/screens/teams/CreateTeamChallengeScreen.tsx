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
  route: any
}

type ChallengeType = 'workouts' | 'calories' | 'steps' | 'duration' | 'custom'

export function CreateTeamChallengeScreen({ navigation, route }: Props) {
  const { teamId } = route.params
  const [type, setType] = useState<ChallengeType>('workouts')
  const [title, setTitle] = useState('')
  const [goal, setGoal] = useState('')
  const [days, setDays] = useState('7')
  const [loading, setLoading] = useState(false)

  const challengeTypes: ChallengeType[] = ['workouts', 'calories', 'steps', 'duration', 'custom']

  const handleCreate = async () => {
    if (!title.trim() || !goal.trim() || !days.trim()) {
      Alert.alert('Error', 'Please fill in all fields')
      return
    }

    setLoading(true)
    try {
      // In real app: call useTeamDetailStore.createChallenge
      navigation.goBack()
    } catch (error) {
      Alert.alert('Error', 'Failed to create challenge')
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView>
        {/* Header */}
        <View className="flex-row justify-between items-center p-4 border-b border-gray-200">
          <Text className="text-xl font-bold text-gray-900">
            Create Challenge
          </Text>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text className="text-2xl">✕</Text>
          </TouchableOpacity>
        </View>

        {/* Form */}
        <View className="p-4">
          {/* Challenge Type */}
          <View className="mb-6">
            <Text className="font-semibold text-gray-900 mb-3">
              Challenge Type
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {challengeTypes.map((t) => (
                <TouchableOpacity
                  key={t}
                  onPress={() => setType(t)}
                  className={`px-4 py-2 rounded-full ${
                    type === t
                      ? 'bg-blue-500'
                      : 'bg-gray-200'
                  }`}
                  testID={`type-${t}`}
                >
                  <Text
                    className={`font-semibold capitalize ${
                      type === t
                        ? 'text-white'
                        : 'text-gray-700'
                    }`}
                  >
                    {t}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Title */}
          <View className="mb-6">
            <Text className="font-semibold text-gray-900 mb-2">
              Challenge Title *
            </Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="e.g., 50 Workouts Challenge"
              className="border border-gray-300 rounded-lg p-3 text-gray-900"
              testID="challenge-title-input"
            />
          </View>

          {/* Goal */}
          <View className="mb-6">
            <Text className="font-semibold text-gray-900 mb-2">Goal *</Text>
            <View className="flex-row items-center">
              <TextInput
                value={goal}
                onChangeText={setGoal}
                placeholder="50"
                keyboardType="numeric"
                className="flex-1 border border-gray-300 rounded-lg p-3 text-gray-900"
                testID="goal-input"
              />
              <Text className="ml-2 text-gray-600 font-semibold">
                {type === 'calories' ? 'kcal' : type === 'steps' ? 'steps' : type === 'duration' ? 'min' : 'count'}
              </Text>
            </View>
          </View>

          {/* Duration */}
          <View className="mb-6">
            <Text className="font-semibold text-gray-900 mb-2">
              Duration (Days) *
            </Text>
            <TextInput
              value={days}
              onChangeText={setDays}
              placeholder="7"
              keyboardType="numeric"
              className="border border-gray-300 rounded-lg p-3 text-gray-900"
              testID="duration-input"
            />
          </View>

          {/* Create Button */}
          <TouchableOpacity
            onPress={handleCreate}
            disabled={loading || !title.trim() || !goal.trim()}
            className={`p-4 rounded-lg items-center ${
              loading || !title.trim() || !goal.trim()
                ? 'bg-gray-300'
                : 'bg-blue-500'
            }`}
            testID="create-challenge-button"
          >
            <Text className="text-white font-bold text-lg">
              {loading ? 'Creating...' : 'Create Challenge'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

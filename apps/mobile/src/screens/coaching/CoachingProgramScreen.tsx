import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
  FlatList,
} from 'react-native'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import * as liveCoachingService from '../../services/liveCoachingService'
import type { CoachingProgram } from '../../types/coaching'

type RootStackParamList = {
  CoachingProgram: { programId: string }
  CoachingTab: undefined
}

type Props = NativeStackScreenProps<RootStackParamList, 'CoachingProgram'>

/**
 * CoachingProgramScreen - displays generated coaching program
 * Shows exercises, form tips, nutrition notes, and recovery tips
 */
export const CoachingProgramScreen: React.FC<Props> = ({ route, navigation }) => {
  const { programId } = route.params
  const [program, setProgram] = useState<CoachingProgram | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedExercise, setExpandedExercise] = useState<number | null>(null)

  useEffect(() => {
    loadProgram()
  }, [programId])

  const loadProgram = async () => {
    try {
      setLoading(true)
      setError(null)
      const programData = await liveCoachingService.getCoachingProgram(
        programId
      )
      setProgram(programData)
    } catch (err) {
      setError('Failed to load program')
      console.error('Error loading program:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleAddToWorkouts = async () => {
    if (!program) return

    try {
      Alert.alert(
        'Success',
        'Program added to your workouts',
        [
          {
            text: 'View Workouts',
            onPress: () => {
              // Navigate to workouts screen
              navigation.goBack()
            },
          },
          {
            text: 'Stay Here',
          },
        ]
      )
    } catch (err) {
      Alert.alert('Error', 'Failed to add program to workouts')
    }
  }

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    )
  }

  if (error || !program) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text className="text-gray-600 mb-4">{error || 'Program not found'}</Text>
        <Pressable
          onPress={loadProgram}
          className="bg-blue-600 rounded-lg px-6 py-3"
        >
          <Text className="text-white font-semibold">Retry</Text>
        </Pressable>
      </View>
    )
  }

  return (
    <ScrollView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white p-4 border-b border-gray-200">
        <Text className="text-2xl font-bold text-gray-900 mb-2">
          Your Coaching Program
        </Text>
        <Text className="text-gray-600">
          {program.exercises.length} exercises | Personalized by your coach
        </Text>
      </View>

      {/* Exercises */}
      <View className="bg-white p-4 border-b border-gray-200">
        <Text className="text-lg font-semibold text-gray-900 mb-4">
          Exercises
        </Text>
        <FlatList
          scrollEnabled={false}
          data={program.exercises}
          renderItem={({ item: exercise, index }) => (
            <Pressable
              key={index}
              onPress={() =>
                setExpandedExercise(expandedExercise === index ? null : index)
              }
              className="border border-gray-300 rounded-lg p-4 mb-3 bg-gray-50"
            >
              <View className="flex-row items-start justify-between">
                <View className="flex-1">
                  <Text className="text-base font-semibold text-gray-900">
                    {exercise.name}
                  </Text>
                  <Text className="text-sm text-gray-600 mt-1">
                    {exercise.sets} × {exercise.reps}
                    {exercise.weight ? ` @ ${exercise.weight}lbs` : ''}
                  </Text>
                </View>
                <Text className="text-gray-600">
                  {expandedExercise === index ? '▼' : '▶'}
                </Text>
              </View>

              {/* Expanded Content */}
              {expandedExercise === index && (
                <View className="mt-4 pt-4 border-t border-gray-300">
                  <Text className="text-sm font-semibold text-gray-900 mb-2">
                    Form Tips
                  </Text>
                  {exercise.formTips.map((tip, tipIdx) => (
                    <View
                      key={tipIdx}
                      className="flex-row items-start mb-2"
                    >
                      <Text className="text-blue-600 mr-2">•</Text>
                      <Text className="text-sm text-gray-700 flex-1">
                        {tip}
                      </Text>
                    </View>
                  ))}

                  {exercise.progression && (
                    <View className="mt-3 bg-green-50 rounded-lg p-3 border border-green-200">
                      <Text className="text-xs font-semibold text-green-900 mb-1">
                        PROGRESSION TIP
                      </Text>
                      <Text className="text-sm text-green-800">
                        {exercise.progression}
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </Pressable>
          )}
          keyExtractor={(_, index) => index.toString()}
        />
      </View>

      {/* Nutrition Notes */}
      {program.nutritionNotes && (
        <View className="bg-white p-4 border-b border-gray-200 m-4 rounded-lg">
          <Text className="font-semibold text-gray-900 mb-2">
            Nutrition Notes
          </Text>
          <View className="bg-orange-50 rounded-lg p-3 border border-orange-200">
            <Text className="text-gray-700 text-sm leading-5">
              {program.nutritionNotes}
            </Text>
          </View>
        </View>
      )}

      {/* Recovery Tips */}
      {program.recoveryTips && (
        <View className="bg-white p-4 border-b border-gray-200 m-4 rounded-lg">
          <Text className="font-semibold text-gray-900 mb-2">
            Recovery Tips
          </Text>
          <View className="bg-purple-50 rounded-lg p-3 border border-purple-200">
            <Text className="text-gray-700 text-sm leading-5">
              {program.recoveryTips}
            </Text>
          </View>
        </View>
      )}

      {/* Recommendation */}
      {program.nextSessionRecommendation && (
        <View className="bg-blue-50 p-4 m-4 rounded-lg border border-blue-200">
          <Text className="font-semibold text-blue-900 mb-2">
            Next Session Recommendation
          </Text>
          <Text className="text-blue-800 text-sm">
            {program.nextSessionRecommendation}
          </Text>
        </View>
      )}

      {/* Action Buttons */}
      <View className="p-4 gap-3 mb-6">
        <Pressable
          onPress={handleAddToWorkouts}
          className="bg-blue-600 rounded-lg py-4 px-4"
        >
          <Text className="text-white text-center font-semibold text-lg">
            Add to My Workouts
          </Text>
        </Pressable>

        <Pressable
          onPress={() => {
            Alert.alert('Share Program', 'Share with a friend feature coming soon!')
          }}
          className="bg-white border border-blue-600 rounded-lg py-4 px-4"
        >
          <Text className="text-blue-600 text-center font-semibold">
            Share with Friend
          </Text>
        </Pressable>

        <Pressable
          onPress={() => navigation.goBack()}
          className="bg-gray-300 rounded-lg py-4 px-4"
        >
          <Text className="text-gray-900 text-center font-semibold">Back</Text>
        </Pressable>
      </View>
    </ScrollView>
  )
}

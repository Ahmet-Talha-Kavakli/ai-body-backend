/**
 * Exercise Library Screen
 * Browse 300+ exercises with search and muscle group filtering
 */

import React, { useState, useEffect, useCallback } from 'react'
import { View, Text, TextInput, FlatList, Pressable, ScrollView } from 'react-native'
import {
  getExercisesByMuscle,
  searchExercises,
  getAllMuscleGroups,
  type Exercise,
} from '@/src/db/exerciseLibrary'

interface ExerciseLibraryScreenProps {
  onSelectExercise?: (exercise: Exercise) => void
}

export function ExerciseLibraryScreen({ onSelectExercise }: ExerciseLibraryScreenProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null)
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [muscleGroups, setMuscleGroups] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  // Load muscle groups on mount
  useEffect(() => {
    const loadMuscleGroups = async () => {
      const groups = await getAllMuscleGroups()
      setMuscleGroups(groups)
    }

    loadMuscleGroups()
  }, [])

  // Update exercises based on search and filter
  useEffect(() => {
    const updateExercises = async () => {
      setLoading(true)

      try {
        if (searchQuery.trim()) {
          // Search by name
          const results = await searchExercises(searchQuery)
          setExercises(results)
        } else if (selectedMuscle) {
          // Filter by muscle group
          const results = await getExercisesByMuscle(selectedMuscle)
          setExercises(results)
        } else {
          // Show all
          const results = await getExercisesByMuscle('all')
          setExercises(results)
        }
      } catch (error) {
        console.error('Failed to load exercises:', error)
        setExercises([])
      } finally {
        setLoading(false)
      }
    }

    updateExercises()
  }, [searchQuery, selectedMuscle])

  const handleExerciseSelect = useCallback(
    (exercise: Exercise) => {
      onSelectExercise?.(exercise)
    },
    [onSelectExercise]
  )

  const renderExerciseItem = ({ item }: { item: Exercise }) => (
    <Pressable
      onPress={() => handleExerciseSelect(item)}
      className="mb-3 rounded-lg border border-slate-200 bg-slate-50 p-4"
    >
      <Text className="text-lg font-semibold text-slate-900">{item.name}</Text>
      <Text className="mt-1 text-sm text-slate-600">{item.description}</Text>

      <View className="mt-2 flex-row gap-2">
        <Text className="rounded bg-blue-100 px-2 py-1 text-xs text-blue-800">{item.category}</Text>
        <Text className="rounded bg-green-100 px-2 py-1 text-xs text-green-800">
          {item.difficulty}
        </Text>
      </View>

      {item.muscleGroups.length > 0 && (
        <View className="mt-2">
          <Text className="text-xs font-medium text-slate-700">Targets:</Text>
          <Text className="text-xs text-slate-600">{item.muscleGroups.join(', ')}</Text>
        </View>
      )}

      {item.variations && item.variations.length > 0 && (
        <View className="mt-2">
          <Text className="text-xs font-medium text-slate-700">Variations:</Text>
          <Text className="text-xs text-slate-600">{item.variations.join(', ')}</Text>
        </View>
      )}
    </Pressable>
  )

  return (
    <View className="flex-1 bg-white">
      {/* Search Bar */}
      <View className="border-b border-slate-200 bg-white p-4">
        <TextInput
          placeholder="Search exercises..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          className="rounded-lg bg-slate-100 px-4 py-2 text-base"
          placeholderTextColor="#999"
        />
      </View>

      {/* Muscle Group Filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="border-b border-slate-200 bg-slate-50 px-4 py-3"
        scrollEnabled={true}
      >
        <Pressable
          onPress={() => setSelectedMuscle(null)}
          className={`mr-2 rounded-full px-3 py-1.5 ${
            selectedMuscle === null ? 'bg-blue-600' : 'bg-slate-200'
          }`}
        >
          <Text
            className={`text-sm font-medium ${
              selectedMuscle === null ? 'text-white' : 'text-slate-700'
            }`}
          >
            All
          </Text>
        </Pressable>

        {muscleGroups.map((muscle) => (
          <Pressable
            key={muscle}
            onPress={() => setSelectedMuscle(muscle)}
            className={`mr-2 rounded-full px-3 py-1.5 ${
              selectedMuscle === muscle ? 'bg-blue-600' : 'bg-slate-200'
            }`}
          >
            <Text
              className={`text-sm font-medium capitalize ${
                selectedMuscle === muscle ? 'text-white' : 'text-slate-700'
              }`}
            >
              {muscle}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Exercise List */}
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-slate-600">Loading exercises...</Text>
        </View>
      ) : exercises.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-slate-600">No exercises found</Text>
        </View>
      ) : (
        <FlatList
          data={exercises}
          renderItem={renderExerciseItem}
          keyExtractor={(item) => item.id}
          className="flex-1 px-4 py-4"
          ListHeaderComponent={
            <Text className="mb-3 text-sm text-slate-500">{exercises.length} exercises</Text>
          }
        />
      )}
    </View>
  )
}

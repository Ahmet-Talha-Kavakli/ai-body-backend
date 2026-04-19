import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  FlatList,
  TextInput,
  Pressable,
  ActivityIndicator,
} from 'react-native'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { useCoachStore } from '../../store/useCoachStore'
import { CoachCard } from '../../components/coaching'
import * as liveCoachingService from '../../services/liveCoachingService'

type RootStackParamList = {
  CoachList: undefined
  CoachProfile: { coachId: string }
}

type Props = NativeStackScreenProps<RootStackParamList, 'CoachList'>

const SPECIALIZATIONS = ['strength', 'cardio', 'nutrition', 'mobility']

/**
 * CoachListScreen - displays list of available coaches with filters
 * Allows filtering by specialization and max rate
 */
export const CoachListScreen: React.FC<Props> = ({ navigation }) => {
  const { coaches, filteredCoaches, setCoaches, applyFilter, clearFilters } =
    useCoachStore()
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSpecialization, setSelectedSpecialization] = useState<
    string | undefined
  >()

  useEffect(() => {
    loadCoaches()
  }, [])

  const loadCoaches = async () => {
    try {
      setLoading(true)
      const allCoaches = await liveCoachingService.getCoaches()
      setCoaches(allCoaches)
    } catch (error) {
      console.error('Error loading coaches:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSpecializationFilter = (spec: string) => {
    if (selectedSpecialization === spec) {
      setSelectedSpecialization(undefined)
      clearFilters()
    } else {
      setSelectedSpecialization(spec)
      applyFilter({ specialization: spec as any })
    }
  }

  const filterBySearch = (query: string) => {
    setSearchQuery(query)
    if (query.trim() === '') {
      clearFilters()
    }
  }

  const displayCoaches = searchQuery.trim()
    ? coaches.filter(
        (coach) =>
          coach.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          coach.bio.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : filteredCoaches

  return (
    <View className="flex-1 bg-gray-50">
      {/* Search Bar */}
      <View className="bg-white p-4 border-b border-gray-200">
        <TextInput
          placeholder="Search coaches..."
          value={searchQuery}
          onChangeText={filterBySearch}
          className="bg-gray-100 rounded-lg px-4 py-3 text-gray-900"
        />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Specialization Filters */}
        <View className="bg-white p-4 border-b border-gray-200">
          <Text className="text-sm font-semibold text-gray-700 mb-3">
            Specialization
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {SPECIALIZATIONS.map((spec) => (
              <Pressable
                key={spec}
                onPress={() => handleSpecializationFilter(spec)}
                className={`px-4 py-2 rounded-full ${
                  selectedSpecialization === spec
                    ? 'bg-blue-600'
                    : 'bg-gray-200'
                }`}
              >
                <Text
                  className={`text-sm font-medium capitalize ${
                    selectedSpecialization === spec
                      ? 'text-white'
                      : 'text-gray-700'
                  }`}
                >
                  {spec}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Coaches List */}
        <View className="p-4">
          {loading ? (
            <ActivityIndicator size="large" color="#2563eb" />
          ) : displayCoaches.length > 0 ? (
            <FlatList
              scrollEnabled={false}
              data={displayCoaches}
              renderItem={({ item: coach }) => (
                <CoachCard
                  coach={coach}
                  onPress={() =>
                    navigation.navigate('CoachProfile', { coachId: coach.id })
                  }
                />
              )}
              keyExtractor={(coach) => coach.id}
            />
          ) : (
            <View className="items-center justify-center py-12">
              <Text className="text-gray-600 text-center">
                No coaches found matching your criteria
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  )
}

import React, { useState, useEffect } from 'react'
import { View, Text, FlatList, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { SocialFeedCard } from '../../components/social/SocialFeedCard'

type RootStackParamList = {
  SocialFeedScreen: undefined
  [key: string]: any
}

type Props = NativeStackScreenProps<RootStackParamList, 'SocialFeedScreen'>

interface SharedMeal {
  id: string
  mealLogId: string
  userId: string
  foodName: string
  photoUrl: string
  nutrition: {
    calories: number
    proteinG: number
    carbsG: number
    fatG: number
    fiberG: number
  }
  shareType: 'private' | 'friends' | 'team'
  sharedWith: string[]
  userName: string
  userAvatar: string
  createdAt: string
  likes: number
  comments: number
}

export function SocialFeedScreen({ navigation }: Props) {
  const [meals, setMeals] = useState<SharedMeal[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    loadFeed()
  }, [])

  const loadFeed = async () => {
    setIsLoading(true)
    try {
      // Mock shared meals
      const mockMeals: SharedMeal[] = [
        {
          id: 'share-1',
          mealLogId: 'meal-1',
          userId: 'user-123',
          foodName: 'Grilled Salmon',
          photoUrl: 'https://via.placeholder.com/300',
          nutrition: {
            calories: 520,
            proteinG: 42,
            carbsG: 28,
            fatG: 18,
            fiberG: 4,
          },
          shareType: 'friends',
          sharedWith: ['user-456', 'user-789'],
          userName: 'John Fitness',
          userAvatar: 'https://via.placeholder.com/40',
          createdAt: new Date(Date.now() - 3600000).toISOString(),
          likes: 8,
          comments: 3,
        },
        {
          id: 'share-2',
          mealLogId: 'meal-2',
          userId: 'user-456',
          foodName: 'Protein Smoothie Bowl',
          photoUrl: 'https://via.placeholder.com/300',
          nutrition: {
            calories: 380,
            proteinG: 28,
            carbsG: 52,
            fatG: 8,
            fiberG: 12,
          },
          shareType: 'friends',
          sharedWith: ['user-123', 'user-789'],
          userName: 'Sarah Fit',
          userAvatar: 'https://via.placeholder.com/40',
          createdAt: new Date(Date.now() - 7200000).toISOString(),
          likes: 12,
          comments: 5,
        },
      ]

      setMeals(mockMeals)
    } catch (error) {
      console.error('Failed to load feed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await loadFeed()
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleMealPress = (mealId: string) => {
    navigation.navigate('SharedMealDetailScreen', { mealId })
  }

  if (isLoading && !isRefreshing) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#0066cc" />
        <Text style={styles.loadingText}>Loading feed...</Text>
      </View>
    )
  }

  return (
    <FlatList
      data={meals}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <SocialFeedCard sharedMeal={item} onPress={() => handleMealPress(item.id)} />
      )}
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No meals shared yet</Text>
          <Text style={styles.emptySubtext}>Invite friends to see their meal updates</Text>
        </View>
      }
      contentContainerStyle={styles.listContainer}
      refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />}
    />
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  listContainer: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
  },
})

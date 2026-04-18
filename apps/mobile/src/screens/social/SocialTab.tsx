import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native'
import { useState, useEffect } from 'react'
import { useSocialFeedStore } from '@/store/socialFeedStore'
import { FeedItem } from '@/components/social/FeedItem'
import { NotificationBell } from '@/components/social/NotificationBell'
import type { FeedItem as FeedItemType } from '@/types/social-social'

type FeedFilter = 'all' | 'badge_earned' | 'challenge_completed' | 'workout_shared' | 'nutrition_logged' | 'streak_milestone'

export function SocialTab() {
  const { feed, loading, error, setLoading, filterFeed } = useSocialFeedStore()
  const [selectedFilter, setSelectedFilter] = useState<FeedFilter>('all')
  const [refreshing, setRefreshing] = useState(false)

  const filteredFeed = selectedFilter === 'all' ? feed : filterFeed(selectedFilter)

  const handleRefresh = async () => {
    setRefreshing(true)
    // Simulate network fetch
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setRefreshing(false)
  }

  useEffect(() => {
    // Initialize feed on mount
    if (feed.length === 0) {
      setLoading(true)
      setTimeout(() => {
        setLoading(false)
      }, 1000)
    }
  }, [])

  const filters: { label: string; value: FeedFilter }[] = [
    { label: 'All', value: 'all' },
    { label: 'Badges', value: 'badge_earned' },
    { label: 'Challenges', value: 'challenge_completed' },
    { label: 'Workouts', value: 'workout_shared' },
    { label: 'Nutrition', value: 'nutrition_logged' },
    { label: 'Streaks', value: 'streak_milestone' },
  ]

  if (loading && feed.length === 0) {
    return (
      <View className="flex-1 bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className="mt-4 text-gray-600 dark:text-gray-400">Loading feed...</Text>
      </View>
    )
  }

  return (
    <View className="flex-1 bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <View className="flex-row justify-between items-center px-4 py-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <Text className="text-2xl font-bold text-gray-900 dark:text-white">Social Feed</Text>
        <NotificationBell />
      </View>

      {/* Filters */}
      <View className="px-4 py-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <FlatList
          data={filters}
          keyExtractor={(item) => item.value}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8 }}
          renderItem={({ item: filter }) => (
            <TouchableOpacity
              onPress={() => setSelectedFilter(filter.value)}
              className={`px-4 py-2 rounded-full ${
                selectedFilter === filter.value
                  ? 'bg-blue-500'
                  : 'bg-gray-200 dark:bg-gray-700'
              }`}
            >
              <Text
                className={`font-medium text-sm ${
                  selectedFilter === filter.value
                    ? 'text-white'
                    : 'text-gray-700 dark:text-gray-300'
                }`}
              >
                {filter.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Feed */}
      {error && (
        <View className="mx-4 mt-4 p-4 bg-red-100 dark:bg-red-900/20 rounded-lg border border-red-300 dark:border-red-700">
          <Text className="text-sm font-medium text-red-700 dark:text-red-400">{error}</Text>
        </View>
      )}

      {filteredFeed.length === 0 ? (
        <View className="flex-1 flex items-center justify-center">
          <Text className="text-lg font-semibold text-gray-500 dark:text-gray-400">
            No feed items yet
          </Text>
          <Text className="text-sm text-gray-400 dark:text-gray-500 mt-2">
            {selectedFilter === 'all'
              ? 'Follow friends and join challenges to see content'
              : `No ${selectedFilter.replace(/_/g, ' ')} items yet`}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredFeed}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View className="px-4 pt-3">
              <FeedItem item={item} />
            </View>
          )}
          contentContainerStyle={{ paddingBottom: 20 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        />
      )}
    </View>
  )
}

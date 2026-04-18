import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native'
import { useState, useEffect } from 'react'
import { useSocialFeedStore } from '@/store/socialFeedStore'
import type { Notification } from '@/types/social-social'

type NotificationFilter = 'all' | 'friend_request' | 'challenge_invite' | 'friend_achievement' | 'leaderboard_change' | 'daily_summary'

export function NotificationsScreen() {
  const {
    notifications,
    loading,
    error,
    setLoading,
    markAsRead,
    markAllAsRead,
    filterNotifications,
    clearOldNotifications,
  } = useSocialFeedStore()
  const [selectedFilter, setSelectedFilter] = useState<NotificationFilter>('all')
  const [refreshing, setRefreshing] = useState(false)

  const filteredNotifications =
    selectedFilter === 'all' ? notifications : filterNotifications(selectedFilter)

  const handleRefresh = async () => {
    setRefreshing(true)
    // Simulate network fetch
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setRefreshing(false)
  }

  useEffect(() => {
    // Initialize notifications on mount
    if (notifications.length === 0) {
      setLoading(true)
      setTimeout(() => {
        setLoading(false)
      }, 1000)
    }

    // Clean old notifications (older than 30 days)
    clearOldNotifications(30)
  }, [])

  const getNotificationIcon = (type: Notification['type']): string => {
    const icons: Record<Notification['type'], string> = {
      friend_request: '👤',
      challenge_invite: '🎯',
      friend_achievement: '🏆',
      leaderboard_change: '📊',
      daily_summary: '📋',
    }
    return icons[type]
  }

  const getNotificationTitle = (type: Notification['type']): string => {
    const titles: Record<Notification['type'], string> = {
      friend_request: 'Friend Request',
      challenge_invite: 'Challenge Invite',
      friend_achievement: "Friend's Achievement",
      leaderboard_change: 'Leaderboard Update',
      daily_summary: 'Daily Summary',
    }
    return titles[type]
  }

  const getNotificationMessage = (notification: Notification): string => {
    switch (notification.type) {
      case 'friend_request':
        return `${notification.relatedUserId || 'Someone'} sent you a friend request`
      case 'challenge_invite':
        return `You were invited to a challenge`
      case 'friend_achievement':
        return `${notification.relatedUserId || 'A friend'} achieved something great!`
      case 'leaderboard_change':
        return `Your rank or score changed on the leaderboard`
      case 'daily_summary':
        return `Check out your daily activity summary`
      default:
        return 'New notification'
    }
  }

  const filters: { label: string; value: NotificationFilter }[] = [
    { label: 'All', value: 'all' },
    { label: 'Requests', value: 'friend_request' },
    { label: 'Invites', value: 'challenge_invite' },
    { label: 'Achievements', value: 'friend_achievement' },
    { label: 'Leaderboard', value: 'leaderboard_change' },
    { label: 'Summary', value: 'daily_summary' },
  ]

  if (loading && notifications.length === 0) {
    return (
      <View className="flex-1 bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className="mt-4 text-gray-600 dark:text-gray-400">Loading notifications...</Text>
      </View>
    )
  }

  return (
    <View className="flex-1 bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <View className="px-4 py-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <View className="flex-row justify-between items-center">
          <Text className="text-2xl font-bold text-gray-900 dark:text-white">Notifications</Text>
          {notifications.some((n) => !n.read) && (
            <TouchableOpacity
              onPress={() => markAllAsRead()}
              className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 rounded"
            >
              <Text className="text-blue-600 dark:text-blue-400 text-sm font-medium">
                Mark all as read
              </Text>
            </TouchableOpacity>
          )}
        </View>
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

      {/* Error Display */}
      {error && (
        <View className="mx-4 mt-4 p-4 bg-red-100 dark:bg-red-900/20 rounded-lg border border-red-300 dark:border-red-700">
          <Text className="text-sm font-medium text-red-700 dark:text-red-400">{error}</Text>
        </View>
      )}

      {/* Notifications List */}
      {filteredNotifications.length === 0 ? (
        <View className="flex-1 flex items-center justify-center">
          <Text className="text-lg font-semibold text-gray-500 dark:text-gray-400">
            No notifications
          </Text>
          <Text className="text-sm text-gray-400 dark:text-gray-500 mt-2">
            {selectedFilter === 'all'
              ? "You're all caught up!"
              : `No ${selectedFilter.replace(/_/g, ' ')} notifications`}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredNotifications}
          keyExtractor={(item) => item.id}
          renderItem={({ item: notification }) => (
            <TouchableOpacity
              onPress={() => !notification.read && markAsRead(notification.id)}
              className={`flex-row items-start gap-3 px-4 py-4 border-b border-gray-200 dark:border-gray-700 ${
                !notification.read ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-white dark:bg-gray-800'
              }`}
            >
              {/* Icon */}
              <Text className="text-2xl mt-1">{getNotificationIcon(notification.type)}</Text>

              {/* Content */}
              <View className="flex-1">
                <Text className="text-sm font-semibold text-gray-900 dark:text-white">
                  {getNotificationTitle(notification.type)}
                </Text>
                <Text className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {getNotificationMessage(notification)}
                </Text>
                <Text className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                  {new Date(notification.createdAt).toLocaleString()}
                </Text>
              </View>

              {/* Unread Indicator */}
              {!notification.read && (
                <View className="w-3 h-3 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
              )}
            </TouchableOpacity>
          )}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}
    </View>
  )
}

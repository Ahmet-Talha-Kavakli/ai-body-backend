import { View, Text, TouchableOpacity, Modal, FlatList } from 'react-native'
import { useState } from 'react'
import { useSocialFeedStore } from '@/store/socialFeedStore'
import type { Notification } from '@/types/social-social'

interface Props {
  onPress?: () => void
  showDropdown?: boolean
}

export function NotificationBell({ onPress, showDropdown = false }: Props) {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    filterNotifications,
  } = useSocialFeedStore()
  const [dropdownVisible, setDropdownVisible] = useState(showDropdown)

  const handleBellPress = () => {
    setDropdownVisible(!dropdownVisible)
    onPress?.()
  }

  const handleNotificationPress = (notificationId: string) => {
    markAsRead(notificationId)
  }

  const handleMarkAllAsRead = () => {
    markAllAsRead()
  }

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

  const getNotificationMessage = (notification: Notification): string => {
    switch (notification.type) {
      case 'friend_request':
        return `${notification.relatedUserId || 'Someone'} sent a friend request`
      case 'challenge_invite':
        return `You were invited to a challenge`
      case 'friend_achievement':
        return `${notification.relatedUserId || 'A friend'} achieved something great!`
      case 'leaderboard_change':
        return `Your leaderboard position changed`
      case 'daily_summary':
        return `Your daily summary is ready`
      default:
        return 'New notification'
    }
  }

  const recentNotifications = notifications.slice(0, 5)

  return (
    <>
      {/* Bell Icon */}
      <TouchableOpacity
        onPress={handleBellPress}
        className="relative p-2"
      >
        <Text className="text-2xl">🔔</Text>
        {unreadCount > 0 && (
          <View className="absolute top-0 right-0 bg-red-500 rounded-full w-6 h-6 flex items-center justify-center">
            <Text className="text-white text-xs font-bold">
              {unreadCount > 9 ? '9+' : unreadCount}
            </Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Dropdown Modal */}
      <Modal
        visible={dropdownVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDropdownVisible(false)}
      >
        <View className="flex-1 bg-black/50">
          <TouchableOpacity
            className="flex-1"
            onPress={() => setDropdownVisible(false)}
          />

          <View className="bg-white dark:bg-gray-800 rounded-t-2xl max-h-2/3 shadow-lg">
            {/* Header */}
            <View className="flex-row justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
              <Text className="text-lg font-bold text-gray-900 dark:text-white">
                Notifications
              </Text>
              {unreadCount > 0 && (
                <TouchableOpacity onPress={handleMarkAllAsRead}>
                  <Text className="text-blue-600 dark:text-blue-400 text-sm font-medium">
                    Mark all as read
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Notifications List */}
            {recentNotifications.length > 0 ? (
              <FlatList
                data={recentNotifications}
                keyExtractor={(notification) => notification.id}
                scrollEnabled={true}
                renderItem={({ item: notification }) => (
                  <TouchableOpacity
                    onPress={() => handleNotificationPress(notification.id)}
                    className={`flex-row items-center gap-3 p-4 border-b border-gray-100 dark:border-gray-700 ${
                      !notification.read ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                    }`}
                  >
                    {/* Icon */}
                    <View className="text-2xl">
                      {getNotificationIcon(notification.type)}
                    </View>

                    {/* Message */}
                    <View className="flex-1">
                      <Text
                        className={`text-sm ${
                          !notification.read
                            ? 'font-semibold text-gray-900 dark:text-white'
                            : 'font-normal text-gray-600 dark:text-gray-400'
                        }`}
                      >
                        {getNotificationMessage(notification)}
                      </Text>
                      <Text className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {new Date(notification.createdAt).toLocaleDateString()}
                      </Text>
                    </View>

                    {/* Unread Indicator */}
                    {!notification.read && (
                      <View className="w-3 h-3 bg-blue-500 rounded-full" />
                    )}
                  </TouchableOpacity>
                )}
              />
            ) : (
              <View className="flex items-center justify-center py-8">
                <Text className="text-lg text-gray-500 dark:text-gray-400 font-medium">
                  No notifications
                </Text>
                <Text className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                  You're all caught up!
                </Text>
              </View>
            )}

            {/* Footer - Close Button */}
            <View className="p-4 border-t border-gray-200 dark:border-gray-700">
              <TouchableOpacity
                onPress={() => setDropdownVisible(false)}
                className="bg-gray-100 dark:bg-gray-700 rounded-lg py-3"
              >
                <Text className="text-center font-semibold text-gray-900 dark:text-white">
                  Close
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  )
}

import React, { useState } from 'react'
import { View, Text, TouchableOpacity, FlatList, Modal } from 'react-native'
import type { TeamNotification } from '../../types/teams'

interface Props {
  notifications: TeamNotification[]
  onNotificationPress?: (notification: TeamNotification) => void
  onMarkAsRead?: (notificationId: string) => void
}

export function TeamNotificationBell({
  notifications,
  onNotificationPress,
  onMarkAsRead,
}: Props) {
  const [showDropdown, setShowDropdown] = useState(false)
  const unreadCount = notifications.filter((n) => !n.read).length

  const handleNotificationPress = (notification: TeamNotification) => {
    onMarkAsRead?.(notification.id)
    onNotificationPress?.(notification)
    setShowDropdown(false)
  }

  const getNotificationIcon = (type: TeamNotification['type']): string => {
    const icons: Record<TeamNotification['type'], string> = {
      member_joined: '👋',
      challenge_completed: '🎉',
      milestone_reached: '⭐',
      member_left: '👋',
    }
    return icons[type]
  }

  return (
    <View testID="notification-bell">
      {/* Bell Button */}
      <TouchableOpacity
        onPress={() => setShowDropdown(!showDropdown)}
        className="relative p-2"
        testID="bell-button"
      >
        <Text className="text-2xl">🔔</Text>
        {unreadCount > 0 && (
          <View
            className="absolute top-0 right-0 bg-red-500 rounded-full w-5 h-5 items-center justify-center"
            testID="unread-badge"
          >
            <Text className="text-xs font-bold text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Dropdown Modal */}
      <Modal
        visible={showDropdown}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDropdown(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setShowDropdown(false)}
          className="flex-1 bg-black/50"
        >
          <View
            onStartShouldSetResponder={() => true}
            className="absolute top-12 right-2 bg-white rounded-lg shadow-lg w-80 max-h-96"
          >
            {/* Header */}
            <View className="border-b border-gray-200 p-4">
              <Text className="font-bold text-gray-900">Notifications</Text>
            </View>

            {/* Notifications List */}
            {notifications.length > 0 ? (
              <FlatList
                data={notifications}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    onPress={() => handleNotificationPress(item)}
                    className={`border-b border-gray-100 p-3 ${
                      !item.read ? 'bg-blue-50' : 'bg-white'
                    }`}
                    testID={`notification-${item.id}`}
                  >
                    <View className="flex-row items-start">
                      <Text className="text-lg mr-2">
                        {getNotificationIcon(item.type)}
                      </Text>
                      <View className="flex-1">
                        <Text className="font-semibold text-gray-900">
                          {item.title}
                        </Text>
                        <Text className="text-sm text-gray-600 mt-1">
                          {item.message}
                        </Text>
                        <Text className="text-xs text-gray-500 mt-1">
                          {new Date(item.createdAt).toLocaleDateString()}
                        </Text>
                      </View>
                      {!item.read && (
                        <View className="bg-blue-500 rounded-full w-2 h-2 ml-2 mt-1" />
                      )}
                    </View>
                  </TouchableOpacity>
                )}
                scrollEnabled
              />
            ) : (
              <View className="p-4 items-center">
                <Text className="text-gray-500">No notifications</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  )
}

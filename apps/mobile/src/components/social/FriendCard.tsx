import React from 'react'
import { View, Text, TouchableOpacity, Image } from 'react-native'
import type { UserProfile } from '../../types/social'

interface Props {
  friend: UserProfile
  isFriend: boolean
  onFollow?: () => void
  onUnfollow?: () => void
  onPress?: () => void
}

export function FriendCard({ friend, isFriend, onFollow, onUnfollow, onPress }: Props) {
  const handleButtonPress = () => {
    if (isFriend) {
      onUnfollow?.()
    } else {
      onFollow?.()
    }
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      className="flex-row items-center justify-between p-4 border-b border-gray-200"
    >
      <View className="flex-row items-center flex-1">
        <Image
          source={{ uri: friend.avatar }}
          className="w-12 h-12 rounded-full mr-3"
          testID="friend-avatar"
        />
        <View className="flex-1">
          <Text className="font-semibold text-gray-900">{friend.username}</Text>
          <Text className="text-sm text-gray-500">{friend.stats.totalWorkouts} workouts</Text>
        </View>
      </View>
      <TouchableOpacity
        onPress={handleButtonPress}
        className={`px-4 py-2 rounded-lg ${isFriend ? 'bg-gray-200' : 'bg-blue-500'}`}
      >
        <Text className={`font-semibold ${isFriend ? 'text-gray-700' : 'text-white'}`}>
          {isFriend ? 'Unfollow' : 'Follow'}
        </Text>
      </TouchableOpacity>
    </TouchableOpacity>
  )
}

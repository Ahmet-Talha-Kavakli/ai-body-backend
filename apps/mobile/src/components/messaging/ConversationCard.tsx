import React from 'react'
import { View, Text, Image, TouchableOpacity } from 'react-native'
import type { Conversation } from '../../types/messaging'

interface ConversationCardProps {
  conversation: Conversation
  onPress: (conversationId: string) => void
}

const formatTime = (isoString: string): string => {
  const date = new Date(isoString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function ConversationCard({ conversation, onPress }: ConversationCardProps) {
  const avatar = conversation.type === 'dm' ? conversation.participantAvatar : conversation.groupAvatar
  const name = conversation.type === 'dm' ? conversation.participantName : conversation.groupName
  const showBadge = conversation.unreadCount > 0

  return (
    <TouchableOpacity
      className="flex-row items-center px-4 py-3 border-b border-gray-200 active:bg-gray-100"
      onPress={() => onPress(conversation.id)}
    >
      {/* Avatar */}
      {avatar && (
        <Image
          source={{ uri: avatar }}
          className="w-12 h-12 rounded-full mr-3"
        />
      )}

      {/* No Avatar Placeholder */}
      {!avatar && (
        <View className="w-12 h-12 rounded-full bg-blue-300 mr-3 items-center justify-center">
          <Text className="text-white font-bold text-lg">{name?.[0]?.toUpperCase()}</Text>
        </View>
      )}

      {/* Message Info */}
      <View className="flex-1">
        <View className="flex-row items-center justify-between mb-1">
          <Text className="font-semibold text-base text-black flex-1">{name}</Text>
          <Text className="text-xs text-gray-500 ml-2">
            {formatTime(conversation.lastMessageAt)}
          </Text>
        </View>

        <Text
          numberOfLines={1}
          className={`text-sm ${showBadge ? 'font-semibold text-gray-900' : 'text-gray-600'}`}
        >
          {conversation.lastMessage}
        </Text>
      </View>

      {/* Unread Badge */}
      {showBadge && (
        <View className="ml-2 bg-red-500 rounded-full w-6 h-6 items-center justify-center">
          <Text className="text-white text-xs font-bold">
            {conversation.unreadCount > 9 ? '9+' : conversation.unreadCount}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  )
}

import React from 'react'
import { View, Text, Image } from 'react-native'
import type { Message } from '../../types/messaging'

interface MessageBubbleProps {
  message: Message
  isSent: boolean
  showAvatar: boolean
}

const formatTime = (isoString: string): string => {
  const date = new Date(isoString)
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
}

export function MessageBubble({ message, isSent, showAvatar }: MessageBubbleProps) {
  return (
    <View
      testID="message-bubble"
      className={`flex ${isSent ? 'sent flex-row-reverse' : 'received flex-row'} mb-2 px-4`}
    >
      {/* Avatar */}
      {showAvatar && message.senderAvatar && (
        <Image
          testID="message-avatar"
          source={{ uri: message.senderAvatar }}
          className="w-8 h-8 rounded-full mx-2"
        />
      )}

      <View className={`flex-1 ${isSent ? 'items-end' : 'items-start'}`}>
        {/* Sender Name (for group/received messages) */}
        {!isSent && (
          <Text className="text-xs text-gray-600 mb-1 font-semibold">{message.senderName}</Text>
        )}

        {/* Bubble */}
        <View
          className={`px-4 py-2 rounded-lg max-w-xs ${
            isSent ? 'bg-blue-500 rounded-br-none' : 'bg-gray-200 rounded-bl-none'
          }`}
        >
          <Text className={`text-base ${isSent ? 'text-white' : 'text-black'}`}>
            {message.content}
          </Text>
        </View>

        {/* Timestamp and Read Receipt */}
        <View className={`flex-row items-center gap-1 mt-1 ${isSent ? 'flex-row-reverse' : 'flex-row'}`}>
          <Text className={`text-xs ${isSent ? 'text-gray-600' : 'text-gray-500'}`}>
            {formatTime(message.createdAt)}
          </Text>

          {/* Read Receipt */}
          {isSent && (
            <Text testID="read-receipt" {...(message.read ? { testID: 'double-check' } : { testID: 'single-check' })}>
              {message.read ? '✓✓' : '✓'}
            </Text>
          )}
        </View>
      </View>
    </View>
  )
}

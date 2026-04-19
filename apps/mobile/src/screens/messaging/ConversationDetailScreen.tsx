import React, { useState, useCallback, useRef } from 'react'
import { View, Text, TextInput, FlatList, TouchableOpacity, KeyboardAvoidingView } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { useChatStore } from '../../store/useChatStore'
import { useMessagingStore } from '../../store/useMessagingStore'
import { MessageBubble } from '../../components/messaging/MessageBubble'
import { TypingIndicator } from '../../components/messaging/TypingIndicator'
import type { Message } from '../../types/messaging'

const MAX_MESSAGE_LENGTH = 500

export function ConversationDetailScreen({ route, navigation }: any) {
  const { conversationId } = route.params
  const messages = useChatStore((state) => state.messages)
  const typingUsers = useChatStore((state) => state.typingUsers)
  const addMessage = useChatStore((state) => state.addMessage)
  const setMessages = useChatStore((state) => state.setMessages)
  const setTypingUsers = useChatStore((state) => state.setTypingUsers)
  const hasMore = useChatStore((state) => state.hasMore)

  const [messageInput, setMessageInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const flatListRef = useRef<FlatList>(null)

  useFocusEffect(
    useCallback(() => {
      loadMessages()
      return () => {
        setTypingUsers([])
      }
    }, [conversationId])
  )

  const loadMessages = async () => {
    // Load messages from API
    setIsLoading(true)
    try {
      // TODO: Fetch messages from API
    } finally {
      setIsLoading(false)
    }
  }

  const handleSendMessage = async () => {
    const trimmed = messageInput.trim()
    if (!trimmed || trimmed.length > MAX_MESSAGE_LENGTH) return

    const message: Message = {
      id: `msg_${Date.now()}`,
      senderId: 'current-user-id',
      senderName: 'You',
      content: trimmed,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      read: true,
      recipientId: conversationId,
    }

    addMessage(message)
    setMessageInput('')
    flatListRef.current?.scrollToEnd({ animated: true })

    // TODO: Send to API
  }

  const handleLoadOlderMessages = () => {
    if (hasMore) {
      // Load more messages for pagination
    }
  }

  const renderMessage = ({ item }: { item: Message }) => (
    <MessageBubble message={item} isSent={item.senderId === 'current-user-id'} showAvatar={true} />
  )

  const renderFooter = () => (
    <>
      {typingUsers.length > 0 && <TypingIndicator userNames={typingUsers} />}
    </>
  )

  return (
    <KeyboardAvoidingView className="flex-1 bg-white">
      {/* Header */}
      <View className="px-4 py-3 border-b border-gray-200 flex-row items-center justify-between">
        <Text className="text-lg font-semibold text-black">Conversation</Text>
        <TouchableOpacity
          onPress={() => navigation.openDrawer?.()}
          className="p-2"
        >
          <Text className="text-lg">⋮</Text>
        </TouchableOpacity>
      </View>

      {/* Messages List */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        onEndReached={handleLoadOlderMessages}
        onEndReachedThreshold={0.3}
        ListFooterComponent={renderFooter}
        inverted={false}
      />

      {/* Message Input */}
      <View className="px-4 py-3 border-t border-gray-200 flex-row items-center gap-2">
        <TextInput
          value={messageInput}
          onChangeText={setMessageInput}
          placeholder="Type a message..."
          multiline
          maxLength={MAX_MESSAGE_LENGTH}
          className="flex-1 bg-gray-100 rounded-lg px-3 py-2 text-base text-black"
          placeholderTextColor="#999"
        />
        <TouchableOpacity
          onPress={handleSendMessage}
          disabled={!messageInput.trim()}
          className={`p-2 rounded-lg ${messageInput.trim() ? 'bg-blue-500' : 'bg-gray-300'}`}
        >
          <Text className="text-white text-lg">↑</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  )
}

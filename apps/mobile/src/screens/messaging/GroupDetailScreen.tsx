import React, { useState, useCallback, useRef } from 'react'
import { View, Text, TextInput, FlatList, TouchableOpacity, KeyboardAvoidingView, Image, ScrollView } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { useChatStore } from '../../store/useChatStore'
import { MessageBubble } from '../../components/messaging/MessageBubble'
import { TypingIndicator } from '../../components/messaging/TypingIndicator'
import type { Group, Message } from '../../types/messaging'

const MAX_MESSAGE_LENGTH = 500

export function GroupDetailScreen({ route, navigation }: any) {
  const { groupId } = route.params
  const messages = useChatStore((state) => state.messages)
  const typingUsers = useChatStore((state) => state.typingUsers)
  const addMessage = useChatStore((state) => state.addMessage)
  const setTypingUsers = useChatStore((state) => state.setTypingUsers)

  const [messageInput, setMessageInput] = useState('')
  const [group, setGroup] = useState<Group | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showMemberList, setShowMemberList] = useState(false)
  const flatListRef = useRef<FlatList>(null)

  useFocusEffect(
    useCallback(() => {
      loadGroup()
      loadMessages()
      return () => {
        setTypingUsers([])
      }
    }, [groupId])
  )

  const loadGroup = async () => {
    // Load group info from API
  }

  const loadMessages = async () => {
    setIsLoading(true)
    try {
      // Load group messages from API
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
      groupId: groupId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      read: true,
    }

    addMessage(message)
    setMessageInput('')
    flatListRef.current?.scrollToEnd({ animated: true })

    // TODO: Send to API
  }

  const handleRemoveMember = (userId: string) => {
    if (!group) return
    if (group.createdById !== 'current-user-id') return

    // Remove member
  }

  const handleLeaveGroup = () => {
    // Leave group and navigate back
    navigation.goBack()
  }

  const handleDeleteGroup = () => {
    if (!group || group.createdById !== 'current-user-id') return
    // Delete group and navigate back
    navigation.goBack()
  }

  const renderMessage = ({ item }: { item: Message }) => (
    <MessageBubble message={item} isSent={item.senderId === 'current-user-id'} showAvatar={true} />
  )

  const renderMember = ({ item }: { item: string }) => (
    <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-200">
      <Text className="text-base text-black">{item}</Text>
      {group?.createdById === 'current-user-id' && item !== 'current-user-id' && (
        <TouchableOpacity onPress={() => handleRemoveMember(item)} className="p-2">
          <Text className="text-red-500 text-sm">Remove</Text>
        </TouchableOpacity>
      )}
    </View>
  )

  const renderFooter = () => (
    <>
      {typingUsers.length > 0 && <TypingIndicator userNames={typingUsers} />}
    </>
  )

  return (
    <KeyboardAvoidingView className="flex-1 bg-white">
      {/* Header */}
      <View className="px-4 py-3 border-b border-gray-200">
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-1">
            <Text className="text-lg font-semibold text-black">{group?.name}</Text>
            <Text className="text-sm text-gray-600">{group?.members.length ?? 0} members</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.openDrawer?.()} className="p-2">
            <Text className="text-lg">⋮</Text>
          </TouchableOpacity>
        </View>

        {/* Group Info */}
        {group && (
          <>
            {group.avatar && (
              <Image source={{ uri: group.avatar }} className="w-16 h-16 rounded-lg mb-2" />
            )}
            {group.description && (
              <Text className="text-sm text-gray-700 mb-3">{group.description}</Text>
            )}
          </>
        )}

        {/* View Members Button */}
        <TouchableOpacity
          onPress={() => setShowMemberList(!showMemberList)}
          className="py-2 px-3 bg-blue-100 rounded-lg"
        >
          <Text className="text-blue-600 text-sm font-semibold">
            {showMemberList ? 'Hide Members' : 'View Members'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Member List (if shown) */}
      {showMemberList && group && (
        <ScrollView className="max-h-64 border-b border-gray-200">
          {group.members.map((memberId) => (
            <View key={memberId} className="flex-row items-center justify-between px-4 py-3 border-b border-gray-200">
              <Text className="text-base text-black">{memberId}</Text>
              {group.createdById === 'current-user-id' && memberId !== 'current-user-id' && (
                <TouchableOpacity onPress={() => handleRemoveMember(memberId)} className="p-2">
                  <Text className="text-red-500 text-sm">Remove</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
        </ScrollView>
      )}

      {/* Messages List */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
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

      {/* Group Actions */}
      {group && (
        <View className="px-4 py-3 border-t border-gray-200 gap-2">
          {group.createdById === 'current-user-id' ? (
            <TouchableOpacity
              onPress={handleDeleteGroup}
              className="py-2 px-4 bg-red-500 rounded-lg items-center"
            >
              <Text className="text-white font-semibold">Delete Group</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={handleLeaveGroup}
              className="py-2 px-4 bg-orange-500 rounded-lg items-center"
            >
              <Text className="text-white font-semibold">Leave Group</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </KeyboardAvoidingView>
  )
}

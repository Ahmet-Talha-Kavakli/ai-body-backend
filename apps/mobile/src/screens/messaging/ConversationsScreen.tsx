import React, { useState, useCallback } from 'react'
import { View, Text, TextInput, FlatList, RefreshControl, TouchableOpacity } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { useMessagingStore } from '../../store/useMessagingStore'
import { ConversationCard } from '../../components/messaging/ConversationCard'
import type { Conversation } from '../../types/messaging'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'

interface NavigationProps {
  navigate: (screen: string, params?: object) => void
}

export function ConversationsScreen({ navigation }: { navigation: NavigationProps }) {
  const conversations = useMessagingStore((state) => state.conversations)
  const setCurrentConversation = useMessagingStore((state) => state.setCurrentConversation)
  const [searchQuery, setSearchQuery] = useState('')
  const [refreshing, setRefreshing] = useState(false)

  useFocusEffect(
    useCallback(() => {
      // Load conversations when screen is focused
      loadConversations()
    }, [])
  )

  const loadConversations = async () => {
    // Implement API call to load conversations
  }

  const onRefresh = useCallback(() => {
    setRefreshing(true)
    loadConversations().finally(() => setRefreshing(false))
  }, [])

  const filteredConversations = conversations.filter((conv) => {
    const name = conv.type === 'dm' ? conv.participantName : conv.groupName
    return name?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false
  })

  const sortedConversations = [...filteredConversations].sort(
    (a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
  )

  const handleConversationPress = (conversationId: string) => {
    setCurrentConversation(conversationId)
    navigation.navigate('ConversationDetail', { conversationId })
  }

  const renderConversation = ({ item }: { item: Conversation }) => (
    <ConversationCard conversation={item} onPress={handleConversationPress} />
  )

  const renderEmpty = () => (
    <View className="flex-1 items-center justify-center px-4">
      {searchQuery ? (
        <>
          <Text className="text-lg font-semibold text-gray-900 mb-2">No conversations found</Text>
          <Text className="text-sm text-gray-600 text-center">
            Try searching with a different name or create a new conversation
          </Text>
        </>
      ) : (
        <>
          <Text className="text-lg font-semibold text-gray-900 mb-2">No conversations yet</Text>
          <Text className="text-sm text-gray-600 text-center">
            Start messaging by creating a new conversation or adding friends
          </Text>
        </>
      )}
    </View>
  )

  return (
    <View className="flex-1 bg-white">
      {/* Header with title and action buttons */}
      <View className="px-4 py-4 border-b border-gray-200">
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-2xl font-bold text-black">Messages</Text>
          <View className="flex-row gap-3">
            <TouchableOpacity
              onPress={() => navigation.navigate('CreateDM')}
              className="p-2 rounded-lg hover:bg-gray-100"
            >
              <Text className="text-lg">✏️</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => navigation.navigate('CreateGroup')}
              className="p-2 rounded-lg hover:bg-gray-100"
            >
              <Text className="text-lg">👥</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Search bar */}
        <TextInput
          placeholder="Search conversations..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          className="w-full h-10 bg-gray-100 rounded-lg px-3 text-base text-black"
          placeholderTextColor="#999"
        />
      </View>

      {/* Conversations list */}
      <FlatList
        data={sortedConversations}
        renderItem={renderConversation}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={renderEmpty}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      />
    </View>
  )
}

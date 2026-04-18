import React, { useState, useCallback } from 'react'
import { View, Text, TextInput, ScrollView, ActivityIndicator, FlatList } from 'react-native'
import { useFriendStore } from '../../store/friendStore'
import { FriendCard } from '../../components/social/FriendCard'
import { sendFriendRequest } from '../../services/friendService'

export function FriendDiscoveryScreen() {
  const [query, setQuery] = useState('')
  const {
    searchResults,
    loading,
    error,
    searchFriends,
    clearSearchResults,
    addFriend,
    isFriend,
    addFriendRequest,
  } = useFriendStore()

  const handleSearch = useCallback(
    async (text: string) => {
      setQuery(text)
      if (text.trim()) {
        await searchFriends(text)
      } else {
        clearSearchResults()
      }
    },
    [searchFriends, clearSearchResults]
  )

  const handleFollow = useCallback(
    async (userId: string) => {
      try {
        await sendFriendRequest(userId)
        // Show success feedback
        const friend = searchResults.find((f) => f.userId === userId)
        if (friend) {
          addFriend(friend)
        }
      } catch (err) {
        console.error('Failed to send friend request:', err)
      }
    },
    [searchResults, addFriend]
  )

  return (
    <View className="flex-1 bg-white">
      {/* Search Header */}
      <View className="bg-blue-500 p-4">
        <TextInput
          value={query}
          onChangeText={handleSearch}
          placeholder="Search friends..."
          className="bg-white px-4 py-2 rounded-lg text-base"
          placeholderTextColor="#999"
        />
      </View>

      {/* Error State */}
      {error && (
        <View className="bg-red-100 p-4">
          <Text className="text-red-700">{error}</Text>
        </View>
      )}

      {/* Loading State */}
      {loading && (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text className="mt-4 text-gray-600">Searching...</Text>
        </View>
      )}

      {/* Results */}
      {!loading && searchResults.length > 0 && (
        <FlatList
          data={searchResults}
          keyExtractor={(item) => item.userId}
          renderItem={({ item }) => (
            <FriendCard
              friend={item}
              isFriend={isFriend(item.userId)}
              onFollow={() => handleFollow(item.userId)}
            />
          )}
          scrollEnabled={false}
        />
      )}

      {/* Empty State */}
      {!loading && query && searchResults.length === 0 && (
        <View className="flex-1 justify-center items-center">
          <Text className="text-gray-500 text-base">No friends found</Text>
        </View>
      )}

      {/* Initial State */}
      {!loading && !query && searchResults.length === 0 && (
        <View className="flex-1 justify-center items-center p-8">
          <Text className="text-2xl font-bold text-gray-900 mb-2">Discover Friends</Text>
          <Text className="text-gray-600 text-center">
            Search for other users by name to add them to your friends list
          </Text>
        </View>
      )}
    </View>
  )
}

import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  FlatList,
  SafeAreaView,
  Share,
} from 'react-native'

interface Friend {
  id: string
  name: string
  username: string
}

interface Props {
  navigation: any
  route: any
}

export function InviteToTeamScreen({ navigation, route }: Props) {
  const { teamId } = route.params
  const [inviteCode, setInviteCode] = useState('TEAM-' + teamId.slice(0, 8).toUpperCase())
  const [searchText, setSearchText] = useState('')
  const [friends, setFriends] = useState<Friend[]>([])
  const [pendingInvites, setPendingInvites] = useState<Friend[]>([])
  const [selectedFriends, setSelectedFriends] = useState<Set<string>>(new Set())

  useEffect(() => {
    loadFriends()
  }, [])

  const loadFriends = async () => {
    // In real app: fetch from friendStore
    setFriends([])
    setPendingInvites([])
  }

  const handleCopyCode = async () => {
    // Copy to clipboard
    // Toast.show('Invite code copied!')
  }

  const handleShareCode = async () => {
    try {
      await Share.share({
        message: `Join my team using code: ${inviteCode}`,
        title: 'Team Invite',
      })
    } catch (error) {
      // Handle error
    }
  }

  const toggleFriendSelection = (friendId: string) => {
    const newSelected = new Set(selectedFriends)
    if (newSelected.has(friendId)) {
      newSelected.delete(friendId)
    } else {
      newSelected.add(friendId)
    }
    setSelectedFriends(newSelected)
  }

  const handleSendInvites = async () => {
    if (selectedFriends.size === 0) return

    // In real app: call useTeamsStore.inviteMembers
    setSelectedFriends(new Set())
  }

  const filteredFriends = friends.filter(
    (f) =>
      f.name.toLowerCase().includes(searchText.toLowerCase()) ||
      f.username.toLowerCase().includes(searchText.toLowerCase())
  )

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white border-b border-gray-200 p-4">
        <Text className="text-xl font-bold text-gray-900 mb-4">
          Invite Members
        </Text>

        {/* Invite Code Section */}
        <View className="bg-blue-50 p-4 rounded-lg mb-4">
          <Text className="text-xs text-gray-600 mb-2">Share Invite Code</Text>
          <View className="flex-row items-center gap-2">
            <View className="flex-1 bg-white border border-gray-300 rounded-lg p-3">
              <Text
                className="font-mono text-lg font-bold text-gray-900"
                testID="invite-code"
              >
                {inviteCode}
              </Text>
            </View>
            <TouchableOpacity
              onPress={handleCopyCode}
              className="bg-blue-500 p-3 rounded-lg"
              testID="copy-code-button"
            >
              <Text className="text-white font-semibold">Copy</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            onPress={handleShareCode}
            className="bg-blue-600 p-3 rounded-lg items-center mt-3"
            testID="share-code-button"
          >
            <Text className="text-white font-semibold">Share</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Search and Friends List */}
      <View className="flex-1">
        <View className="p-4 bg-white border-b border-gray-200">
          <Text className="font-semibold text-gray-900 mb-2">
            Invite Friends ({selectedFriends.size} selected)
          </Text>
          <TextInput
            value={searchText}
            onChangeText={setSearchText}
            placeholder="Search friends..."
            className="border border-gray-300 rounded-lg p-3 text-gray-900"
            testID="search-friends-input"
          />
        </View>

        {/* Friends List */}
        {filteredFriends.length === 0 ? (
          <View className="flex-1 items-center justify-center">
            <Text className="text-gray-500">
              {searchText ? 'No friends found' : 'No friends available'}
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredFriends}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => toggleFriendSelection(item.id)}
                className="flex-row items-center justify-between p-4 border-b border-gray-100"
                testID={`friend-${item.id}`}
              >
                <View className="flex-1">
                  <Text className="font-semibold text-gray-900">
                    {item.name}
                  </Text>
                  <Text className="text-sm text-gray-600">
                    @{item.username}
                  </Text>
                </View>
                <View
                  className={`w-6 h-6 rounded border-2 items-center justify-center ${
                    selectedFriends.has(item.id)
                      ? 'bg-blue-500 border-blue-500'
                      : 'border-gray-300'
                  }`}
                >
                  {selectedFriends.has(item.id) && (
                    <Text className="text-white text-sm">✓</Text>
                  )}
                </View>
              </TouchableOpacity>
            )}
            testID="friends-list"
          />
        )}
      </View>

      {/* Pending Invites Section */}
      {pendingInvites.length > 0 && (
        <View className="bg-white border-t border-gray-200 p-4">
          <Text className="font-semibold text-gray-900 mb-3">
            Pending Invites ({pendingInvites.length})
          </Text>
          {pendingInvites.map((invite) => (
            <View
              key={invite.id}
              className="flex-row justify-between items-center mb-2 p-2 bg-gray-50 rounded"
            >
              <View>
                <Text className="font-semibold text-gray-900">
                  {invite.name}
                </Text>
                <Text className="text-xs text-gray-500">Invite pending</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Send Button */}
      {selectedFriends.size > 0 && (
        <View className="p-4 bg-white border-t border-gray-200">
          <TouchableOpacity
            onPress={handleSendInvites}
            className="bg-blue-500 p-4 rounded-lg items-center"
            testID="send-invites-button"
          >
            <Text className="text-white font-bold">
              Send {selectedFriends.size} Invite{selectedFriends.size > 1 ? 's' : ''}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  )
}

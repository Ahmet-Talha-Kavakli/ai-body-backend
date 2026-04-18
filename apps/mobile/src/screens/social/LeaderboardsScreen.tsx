import React, { useEffect, useState } from 'react'
import { View, Text, FlatList, Pressable } from 'react-native'
import { useLeaderboardStore } from '@/store/leaderboardStore'
import { LeaderboardRow } from '@/components/social/LeaderboardRow'
import { LeaderboardTab } from '@/components/social/LeaderboardTab'
import type { Leaderboard } from '@/types/social-social'

export function LeaderboardsScreen() {
  const { global, friend, challenge, period, setPeriod, loading } = useLeaderboardStore()
  const [selectedLeaderboard, setSelectedLeaderboard] = useState<'global' | 'friend' | 'challenge'>(
    'global'
  )

  const leaderboard: Leaderboard | null =
    selectedLeaderboard === 'global' ? global : selectedLeaderboard === 'friend' ? friend : challenge

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
        <Pressable
          onPress={() => setSelectedLeaderboard('global')}
          style={{
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderRadius: 8,
            backgroundColor: selectedLeaderboard === 'global' ? '#007AFF' : '#e0e0e0',
          }}
        >
          <Text style={{ color: selectedLeaderboard === 'global' ? 'white' : 'black' }}>
            Global
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setSelectedLeaderboard('friend')}
          style={{
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderRadius: 8,
            backgroundColor: selectedLeaderboard === 'friend' ? '#007AFF' : '#e0e0e0',
          }}
        >
          <Text style={{ color: selectedLeaderboard === 'friend' ? 'white' : 'black' }}>
            Friends
          </Text>
        </Pressable>
      </View>

      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
        {(['daily', 'weekly', 'monthly', 'allTime'] as const).map((p) => (
          <Pressable
            key={p}
            onPress={() => setPeriod(p)}
            style={{
              paddingHorizontal: 8,
              paddingVertical: 4,
              borderRadius: 4,
              backgroundColor: period === p ? '#007AFF' : '#e0e0e0',
            }}
          >
            <Text style={{ color: period === p ? 'white' : 'black', fontSize: 12 }}>
              {p === 'allTime' ? 'All Time' : p.charAt(0).toUpperCase() + p.slice(1)}
            </Text>
          </Pressable>
        ))}
      </View>

      {loading && <Text>Loading...</Text>}

      {leaderboard && <LeaderboardTab leaderboard={leaderboard} />}

      <FlatList
        data={leaderboard?.entries || []}
        keyExtractor={(item) => item.userId}
        renderItem={({ item }) => <LeaderboardRow entry={item} />}
      />
    </View>
  )
}

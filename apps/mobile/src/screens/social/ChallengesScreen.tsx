import React, { useEffect, useState } from 'react'
import { View, Text, FlatList } from 'react-native'
import { useChallengeStore } from '@/store/challengeStore'
import { ChallengeCard } from '@/components/social/ChallengeCard'
import type { ChallengeWithProgress } from '@/types/challenge'

export function ChallengesScreen() {
  const { challenges, myChallenges, loading } = useChallengeStore()
  const [selectedTab, setSelectedTab] = useState<'all' | 'my'>('all')

  const data = selectedTab === 'all' ? challenges : myChallenges

  return (
    <View style={{ flex: 1 }}>
      <View style={{ flexDirection: 'row', gap: 8, padding: 16 }}>
        <Text
          onPress={() => setSelectedTab('all')}
          style={{ fontWeight: selectedTab === 'all' ? 'bold' : 'normal' }}
        >
          All Challenges
        </Text>
        <Text
          onPress={() => setSelectedTab('my')}
          style={{ fontWeight: selectedTab === 'my' ? 'bold' : 'normal' }}
        >
          My Challenges
        </Text>
      </View>

      {loading && <Text>Loading...</Text>}

      <FlatList
        data={data}
        keyExtractor={(item) => item.challenge.id}
        renderItem={({ item }) => <ChallengeCard challenge={item} />}
      />
    </View>
  )
}

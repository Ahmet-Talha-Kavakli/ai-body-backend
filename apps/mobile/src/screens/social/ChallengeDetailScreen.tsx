import React, { useEffect, useState } from 'react'
import { View, Text, FlatList } from 'react-native'
import { getChallengeDetail } from '@/services/challengeService'
import { ChallengeProgressBar } from '@/components/social/ChallengeProgressBar'
import { LeaderboardRow } from '@/components/social/LeaderboardRow'
import type { ChallengeWithProgress } from '@/types/challenge'
import type { LeaderboardEntry } from '@/types/social-social'

interface ChallengeDetailScreenProps {
  challengeId: string
}

export function ChallengeDetailScreen({ challengeId }: ChallengeDetailScreenProps) {
  const [challenge, setChallenge] = useState<ChallengeWithProgress | null>(null)
  const [loading, setLoading] = useState(true)
  const [leaderboardEntries, setLeaderboardEntries] = useState<LeaderboardEntry[]>([])

  useEffect(() => {
    loadChallenge()
  }, [challengeId])

  async function loadChallenge() {
    try {
      const data = await getChallengeDetail(challengeId)
      setChallenge(data)
      // Mock leaderboard entries for now
      setLeaderboardEntries([])
    } catch (error) {
      console.error('Error loading challenge:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <Text>Loading...</Text>
  if (!challenge) return <Text>Challenge not found</Text>

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 20, fontWeight: 'bold' }}>{challenge.challenge.title}</Text>
      <Text>{challenge.challenge.description}</Text>

      <ChallengeProgressBar
        current={challenge.progress.currentValue}
        target={challenge.challenge.target}
      />
      <Text>
        {challenge.progress.currentValue} / {challenge.challenge.target}
      </Text>

      <Text style={{ fontSize: 16, fontWeight: 'bold', marginTop: 16 }}>Leaderboard</Text>
      <FlatList
        data={leaderboardEntries}
        keyExtractor={(item) => item.userId}
        renderItem={({ item }) => <LeaderboardRow entry={item} />}
      />
    </View>
  )
}

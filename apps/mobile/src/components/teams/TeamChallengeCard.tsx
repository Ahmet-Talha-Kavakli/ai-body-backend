import React from 'react'
import { View, Text, TouchableOpacity, Image } from 'react-native'
import type { TeamChallenge, TeamMember } from '../../types/teams'

interface Props {
  challenge: TeamChallenge
  members?: TeamMember[]
  onPress?: (challengeId: string) => void
}

function getChallengeIcon(type: TeamChallenge['type']): string {
  const icons: Record<TeamChallenge['type'], string> = {
    workouts: '🏋️',
    calories: '🔥',
    steps: '🚶',
    duration: '⏱️',
    custom: '⭐',
  }
  return icons[type]
}

function getProgressPercentage(progress: number, goal: number): number {
  return goal > 0 ? Math.round((progress / goal) * 100) : 0
}

function getDaysRemaining(deadline: string): number {
  const now = new Date()
  const deadlineDate = new Date(deadline)
  const msPerDay = 24 * 60 * 60 * 1000
  return Math.ceil((deadlineDate.getTime() - now.getTime()) / msPerDay)
}

export function TeamChallengeCard({ challenge, members = [], onPress }: Props) {
  const progress = getProgressPercentage(challenge.currentProgress, challenge.goal)
  const daysLeft = getDaysRemaining(challenge.deadline)

  // Get top 3 contributing members
  const topMembers = members
    .sort((a, b) => {
      const aContrib = a.contribution.workouts + a.contribution.calories / 100
      const bContrib = b.contribution.workouts + b.contribution.calories / 100
      return bContrib - aContrib
    })
    .slice(0, 3)

  return (
    <TouchableOpacity
      onPress={() => onPress?.(challenge.id)}
      className="bg-white border border-gray-200 rounded-lg p-4 mb-3"
      testID={`challenge-card-${challenge.id}`}
    >
      {/* Header */}
      <View className="flex-row items-start justify-between mb-3">
        <View className="flex-1 mr-3">
          <View className="flex-row items-center mb-1">
            <Text className="text-lg mr-2">{getChallengeIcon(challenge.type)}</Text>
            <Text className="font-bold text-lg text-gray-900 flex-1">{challenge.title}</Text>
          </View>
          {challenge.description && (
            <Text className="text-sm text-gray-600">{challenge.description}</Text>
          )}
        </View>
        <View
          className={`px-3 py-1 rounded-full ${
            challenge.status === 'active' ? 'bg-green-100' : challenge.status === 'completed' ? 'bg-blue-100' : 'bg-red-100'
          }`}
        >
          <Text
            className={`text-xs font-semibold ${
              challenge.status === 'active' ? 'text-green-700' : challenge.status === 'completed' ? 'text-blue-700' : 'text-red-700'
            }`}
          >
            {challenge.status.toUpperCase()}
          </Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View className="mb-3">
        <View className="flex-row justify-between mb-1">
          <Text className="text-sm font-semibold text-gray-700">
            {challenge.currentProgress} / {challenge.goal}
          </Text>
          <Text className="text-sm font-semibold text-gray-700">{progress}%</Text>
        </View>
        <View className="bg-gray-200 rounded-full h-2 overflow-hidden">
          <View
            className="bg-blue-500 h-full"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </View>
      </View>

      {/* Deadline */}
      <View className="mb-3 pb-3 border-b border-gray-100">
        <Text className="text-xs text-gray-500">
          {daysLeft > 0 ? `${daysLeft} days left` : daysLeft === 0 ? 'Ends today' : 'Expired'}
        </Text>
      </View>

      {/* Top Contributors Preview */}
      {topMembers.length > 0 && (
        <View className="flex-row items-center">
          <Text className="text-xs text-gray-600 mr-2">Top members:</Text>
          <View className="flex-row -space-x-2">
            {topMembers.map((member) => (
              <Image
                key={member.id}
                source={{ uri: member.userAvatar || 'https://via.placeholder.com/24' }}
                className="w-6 h-6 rounded-full border border-white"
                testID={`contributor-avatar-${member.id}`}
              />
            ))}
          </View>
        </View>
      )}
    </TouchableOpacity>
  )
}

import React, { useEffect, useState } from 'react'
import { ScrollView, Text } from 'react-native'
import { getAuthenticatedClient } from '../../../api/client'
import { Card } from '../../../components/shared/Card'
import { ProgressBar } from '../../../components/shared/ProgressBar'
import { LoadingSpinner } from '../../../components/shared/LoadingSpinner'

export function ActivityTab() {
  const [activity, setActivity] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadActivity()
  }, [])

  async function loadActivity() {
    try {
      const client = await getAuthenticatedClient()
      const response = await client.get('/api/health/activity')
      setActivity(response.data)
    } catch (error) {
      console.error('Failed to load activity:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <LoadingSpinner />

  return (
    <ScrollView className="flex-1 p-6">
      <Card className="mb-4">
        <Text className="mb-2 text-sm text-gray-600">Steps Today</Text>
        <Text className="text-3xl font-bold">{activity?.todaySteps || 0}</Text>
        <ProgressBar percentage={((activity?.todaySteps || 0) / 10000) * 100} />
      </Card>

      <Card className="mb-4">
        <Text className="mb-2 text-sm text-gray-600">Active Minutes</Text>
        <Text className="text-3xl font-bold">{activity?.activeMinutes || 0}</Text>
        <Text className="mt-2 text-xs text-gray-500">Today</Text>
      </Card>

      <Card>
        <Text className="mb-2 text-sm text-gray-600">Calories Burned</Text>
        <Text className="text-3xl font-bold">{activity?.calories || 0}</Text>
        <Text className="mt-2 text-xs text-gray-500">kcal</Text>
      </Card>
    </ScrollView>
  )
}

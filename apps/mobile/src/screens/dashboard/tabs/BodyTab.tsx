import React, { useEffect, useState } from 'react'
import { View, ScrollView, Text } from 'react-native'
import { getAuthenticatedClient } from '../../../api/client'
import { Card } from '../../../components/shared/Card'
import { Button } from '../../../components/shared/Button'
import { Input } from '../../../components/shared/Input'
import { LoadingSpinner } from '../../../components/shared/LoadingSpinner'

export function BodyTab() {
  const [body, setBody] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [weight, setWeight] = useState('')
  const [showAddWeight, setShowAddWeight] = useState(false)

  useEffect(() => {
    loadBody()
  }, [])

  async function loadBody() {
    try {
      const client = await getAuthenticatedClient()
      const response = await client.get('/api/health/body')
      setBody(response.data)
    } catch (error) {
      console.error('Failed to load body:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddWeight = async () => {
    try {
      const client = await getAuthenticatedClient()
      await client.post('/api/health/weight', { weight: parseFloat(weight) })
      await loadBody()
      setWeight('')
      setShowAddWeight(false)
    } catch (error) {
      console.error('Failed to add weight:', error)
    }
  }

  if (loading) return <LoadingSpinner />

  return (
    <ScrollView className="flex-1 p-6">
      <Card className="mb-4">
        <Text className="mb-2 text-sm text-gray-600">Current Weight</Text>
        <Text className="text-3xl font-bold">{body?.weight || 'N/A'} kg</Text>
        {body?.targetWeight && (
          <Text className="mt-2 text-xs text-gray-500">Goal: {body.targetWeight} kg</Text>
        )}
      </Card>

      {!showAddWeight ? (
        <Button label="Add Weight Entry" onPress={() => setShowAddWeight(true)} />
      ) : (
        <Card className="mb-4">
          <Input label="Weight (kg)" value={weight} onChangeText={setWeight} placeholder="70.5" />
          <View className="flex-row gap-2">
            <Button label="Cancel" onPress={() => setShowAddWeight(false)} variant="secondary" />
            <Button label="Save" onPress={handleAddWeight} />
          </View>
        </Card>
      )}

      <Card>
        <Text className="mb-2 text-sm text-gray-600">Height</Text>
        <Text className="text-2xl font-bold">{body?.height || 'N/A'} cm</Text>
      </Card>
    </ScrollView>
  )
}

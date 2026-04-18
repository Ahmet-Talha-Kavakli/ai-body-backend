import React, { useEffect } from 'react'
import { View, ScrollView, Text, RefreshControl } from 'react-native'
import { useDashboardStore } from '../../store/dashboardStore'
import { useUserProfile } from '../../hooks/useUserProfile'
import { getAuthenticatedClient } from '../../api/client'
import { getDashboardCache, saveDashboardCache } from '../../db/dashboardCache'
import { Avatar } from '../../components/shared/Avatar'
import { Card } from '../../components/shared/Card'
import { StatCard } from '../../components/dashboard/StatCard'
import { QuickActionButton } from '../../components/dashboard/QuickActionButton'
import { LoadingSpinner } from '../../components/shared/LoadingSpinner'
import { getGreeting } from '../../utils/formatters'

export function HomeScreen({ navigation }: any) {
  const dashboardStore = useDashboardStore()
  const userProfile = useUserProfile(null)
  const [refreshing, setRefreshing] = React.useState(false)

  useEffect(() => {
    loadDashboard()
  }, [])

  async function loadDashboard() {
    try {
      dashboardStore.setLoading(true)

      // Try cache first
      const userId = userProfile.profile?.id
      if (userId) {
        const cached = await getDashboardCache(userId)
        if (cached) {
          dashboardStore.setStats(cached)
          return
        }
      }

      // Fetch from API
      const client = await getAuthenticatedClient()
      const response = await client.get('/api/dashboard/stats')

      dashboardStore.setStats(response.data)

      if (userId) {
        await saveDashboardCache(userId, response.data)
      }
    } catch (error) {
      console.error('Failed to load dashboard:', error)
    } finally {
      dashboardStore.setLoading(false)
    }
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await loadDashboard()
    setRefreshing(false)
  }

  const stats = dashboardStore.stats
  const greeting = getGreeting()

  if (dashboardStore.isLoading && !stats) {
    return <LoadingSpinner />
  }

  return (
    <ScrollView
      className="flex-1 bg-gray-50"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Header */}
      <View className="bg-blue-600 px-6 py-8 pt-12">
        <View className="mb-6 flex-row items-center justify-between">
          <View>
            <Text className="text-sm text-white">{greeting}</Text>
            <Text className="text-2xl font-bold text-white">
              {userProfile.profile?.name || 'User'}
            </Text>
          </View>
          <Avatar
            initials={(userProfile.profile?.name || 'U').slice(0, 2).toUpperCase()}
            url={userProfile.profile?.avatarUrl}
            size="md"
          />
        </View>
        <Text className="text-xs text-white/80">
          {new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
          })}
        </Text>
      </View>

      <View className="p-6">
        {/* Daily Stats */}
        {stats && (
          <>
            <StatCard
              title="Calories"
              current={stats.todayCalories || 0}
              goal={stats.calorieGoal || 2000}
              unit="kcal"
              icon="🔥"
            />
            <StatCard
              title="Water Intake"
              current={stats.todayWater || 0}
              goal={stats.waterGoal || 2000}
              unit="ml"
              icon="💧"
            />
            <StatCard
              title="Steps"
              current={stats.todaySteps || 0}
              goal={stats.stepsGoal || 10000}
              unit="steps"
              icon="👟"
            />
          </>
        )}

        {/* Quick Actions */}
        <Text className="mb-4 mt-6 text-lg font-bold">Quick Actions</Text>
        <View className="flex-row flex-wrap">
          <QuickActionButton
            label="Start Workout"
            icon="💪"
            onPress={() => navigation?.navigate('Workout')}
          />
          <QuickActionButton
            label="Log Meal"
            icon="🍎"
            onPress={() => navigation?.navigate('Nutrition')}
          />
          <QuickActionButton
            label="Add Water"
            icon="💧"
            onPress={() => navigation?.navigate('Water')}
          />
          <QuickActionButton
            label="View Stats"
            icon="📊"
            onPress={() => navigation?.navigate('Analytics')}
          />
        </View>

        {/* Recent Activity */}
        {stats?.recentWorkouts && stats.recentWorkouts.length > 0 && (
          <>
            <Text className="mb-4 mt-6 text-lg font-bold">Recent Activity</Text>
            {stats.recentWorkouts.slice(0, 3).map((workout: any) => (
              <Card key={workout.id} className="mb-3">
                <View className="flex-row items-center justify-between">
                  <View className="flex-1">
                    <Text className="font-semibold text-gray-800">{workout.name}</Text>
                    <Text className="text-xs text-gray-600">
                      {new Date(workout.completedAt).toLocaleDateString()}
                    </Text>
                  </View>
                  <Text className="text-sm font-bold text-blue-600">{workout.duration}m</Text>
                </View>
              </Card>
            ))}
          </>
        )}
      </View>
    </ScrollView>
  )
}

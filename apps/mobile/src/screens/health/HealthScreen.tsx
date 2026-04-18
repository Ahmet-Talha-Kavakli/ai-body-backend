import React, { useCallback, useEffect } from 'react'
import { View, ScrollView, Text, TouchableOpacity, RefreshControl } from 'react-native'
import { useHealthStore } from '../../store/healthStore'
import { HealthDashboardWidget } from '../../components/health/HealthDashboardWidget'
import { HealthSummaryCard } from '../../components/health/HealthSummaryCard'
import { PermissionRequestCard } from '../../components/health/PermissionRequestCard'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'

type HealthScreenNavigationProp = NativeStackNavigationProp<any, 'Health'>

interface HealthScreenProps {
  navigation: HealthScreenNavigationProp
  route: any
}

const TODAY = new Date().toISOString().split('T')[0]

export function HealthScreen({ navigation }: HealthScreenProps) {
  const [refreshing, setRefreshing] = React.useState(false)

  const {
    heartRateReadings,
    sleepSessions,
    stepData,
    energyData,
    getAverageHeartRate,
    getSleepDuration,
    getTotalSteps,
    getTotalEnergy,
  } = useHealthStore()

  const avgHeartRate = getAverageHeartRate(TODAY)
  const sleepMinutes = getSleepDuration(TODAY)
  const totalSteps = getTotalSteps(TODAY)
  const totalEnergy = getTotalEnergy(TODAY)

  const handleRefresh = useCallback(() => {
    setRefreshing(true)
    // In production, this would fetch fresh data from HealthKit
    setTimeout(() => setRefreshing(false), 1000)
  }, [])

  const hasData = heartRateReadings.length > 0 || sleepSessions.length > 0

  return (
    <ScrollView
      className="flex-1 bg-gray-50"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
    >
      <View className="flex flex-col gap-6 px-4 py-6">
        <View>
          <Text className="text-3xl font-bold text-gray-900">Health</Text>
          <Text className="text-sm text-gray-600">Your daily health summary</Text>
        </View>

        {hasData ? (
          <>
            {/* Today's Summary */}
            <HealthDashboardWidget
              avgHeartRate={avgHeartRate}
              sleepDuration={sleepMinutes}
              totalSteps={totalSteps}
              activeCalories={totalEnergy}
              onTap={() => {}}
            />

            {/* Heart Rate Section */}
            <View className="flex flex-col gap-2">
              <View className="flex flex-row items-center justify-between">
                <Text className="text-base font-semibold text-gray-900">Heart Rate</Text>
                <TouchableOpacity onPress={() => navigation.navigate('HeartRateDetail')}>
                  <Text className="text-sm font-medium text-blue-600">View Details</Text>
                </TouchableOpacity>
              </View>
              <HealthSummaryCard
                icon="heart"
                label="Average"
                value={avgHeartRate.toString()}
                unit="bpm"
                onTap={() => navigation.navigate('HeartRateDetail')}
              />
            </View>

            {/* Sleep Section */}
            <View className="flex flex-col gap-2">
              <View className="flex flex-row items-center justify-between">
                <Text className="text-base font-semibold text-gray-900">Sleep</Text>
                <TouchableOpacity onPress={() => navigation.navigate('SleepDetail')}>
                  <Text className="text-sm font-medium text-blue-600">View Details</Text>
                </TouchableOpacity>
              </View>
              <HealthSummaryCard
                icon="moon"
                label="Duration"
                value={(sleepMinutes / 60).toFixed(1)}
                unit="hours"
                onTap={() => navigation.navigate('SleepDetail')}
              />
            </View>

            {/* Steps Section */}
            <View className="flex flex-col gap-2">
              <View className="flex flex-row items-center justify-between">
                <Text className="text-base font-semibold text-gray-900">Activity</Text>
                <TouchableOpacity onPress={() => navigation.navigate('StepsDetail')}>
                  <Text className="text-sm font-medium text-blue-600">View Details</Text>
                </TouchableOpacity>
              </View>
              <HealthSummaryCard
                icon="activity"
                label="Steps"
                value={totalSteps.toLocaleString()}
                onTap={() => navigation.navigate('StepsDetail')}
              />
            </View>

            {/* Energy Section */}
            <View className="flex flex-col gap-2">
              <View className="flex flex-row items-center justify-between">
                <Text className="text-base font-semibold text-gray-900">Energy</Text>
                <TouchableOpacity onPress={() => navigation.navigate('EnergyDetail')}>
                  <Text className="text-sm font-medium text-blue-600">View Details</Text>
                </TouchableOpacity>
              </View>
              <HealthSummaryCard
                icon="flame"
                label="Active Calories"
                value={totalEnergy.toString()}
                unit="kcal"
                onTap={() => navigation.navigate('EnergyDetail')}
              />
            </View>
          </>
        ) : (
          <PermissionRequestCard
            icon="heart"
            title="No Health Data"
            description="Enable HealthKit access to see your health metrics"
            onAllow={() => navigation.navigate('HealthPermission')}
            onMaybeLater={() => {}}
          />
        )}
      </View>
    </ScrollView>
  )
}

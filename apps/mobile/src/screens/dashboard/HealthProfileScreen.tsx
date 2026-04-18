import React from 'react'
import { useUserProfile } from '../../hooks/useUserProfile'
import { TabView } from '../../components/shared/TabView'
import { OverviewTab } from './tabs/OverviewTab'
import { ActivityTab } from './tabs/ActivityTab'
import { BodyTab } from './tabs/BodyTab'
import { HealthTab } from './tabs/HealthTab'
import { SleepTab } from './tabs/SleepTab'
import { WaterTab } from './tabs/WaterTab'
import { LoadingSpinner } from '../../components/shared/LoadingSpinner'

export function HealthProfileScreen() {
  const userProfile = useUserProfile(null)

  if (userProfile.isLoading) return <LoadingSpinner />

  const tabs = [
    { label: 'Overview', content: <OverviewTab profile={userProfile.profile} /> },
    { label: 'Activity', content: <ActivityTab /> },
    { label: 'Body', content: <BodyTab /> },
    { label: 'Health', content: <HealthTab profile={userProfile.profile} /> },
    { label: 'Sleep', content: <SleepTab /> },
    { label: 'Water', content: <WaterTab /> },
  ]

  return <TabView tabs={tabs} />
}

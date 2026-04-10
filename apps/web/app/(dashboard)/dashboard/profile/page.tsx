'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { User, Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { BasicProfileCard } from '@/components/profile/BasicProfileCard'
import { HealthMetricsCard } from '@/components/profile/HealthMetricsCard'
import { TrainingHistoryCard } from '@/components/profile/TrainingHistoryCard'
import { NutritionMetricsCard } from '@/components/profile/NutritionMetricsCard'
import { CoachRecommendationCard } from '@/components/profile/CoachRecommendationCard'
import { DailyCheckInModal } from '@/components/profile/DailyCheckInModal'
import { useUserProfile } from '@/hooks/useUserProfile'

export default function ProfilePage() {
  const {
    basicProfile, healthMetrics, trainingHistory, nutritionMetrics,
    isLoading, fetchProfile,
    updateBasicProfile, updateHealthMetrics, updateTrainingHistory, updateNutritionMetrics,
  } = useUserProfile()

  const [checkInOpen, setCheckInOpen] = useState(false)

  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  if (isLoading) {
    return <div className="min-h-screen bg-gray-50 p-8">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">Profile</h1>
          <Button onClick={() => setCheckInOpen(true)}>
            <Bell className="mr-2" /> Daily Check-in
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2">
            {basicProfile && (
              <BasicProfileCard profile={basicProfile} onSave={updateBasicProfile} />
            )}
          </div>
          {healthMetrics && (
            <HealthMetricsCard metrics={healthMetrics} onSave={updateHealthMetrics} />
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {trainingHistory && (
            <TrainingHistoryCard history={trainingHistory} onSave={updateTrainingHistory} />
          )}
          {nutritionMetrics && (
            <NutritionMetricsCard metrics={nutritionMetrics} onSave={updateNutritionMetrics} />
          )}
        </div>

        {basicProfile && (
          <div className="mt-6">
            <CoachRecommendationCard />
          </div>
        )}

        <DailyCheckInModal open={checkInOpen} onClose={() => setCheckInOpen(false)} />
      </div>
    </div>
  )
}
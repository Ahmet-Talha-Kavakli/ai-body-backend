'use client'

import React, { useState, useEffect } from 'react'
import { formatDistanceToNow } from 'date-fns'

interface Activity {
  id: string
  userId: string
  activityType: string
  description: string
  createdAt: Date | string
  user?: { name?: string; avatarUrl?: string }
}

export function ActivityFeed() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const res = await fetch('/api/user/activity/feed')
        if (res.ok) {
          const data = await res.json()
          setActivities(data.activities || [])
        }
      } catch (error) {
        console.error('Error fetching activities:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchActivities()
  }, [])

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'workout_completed':
        return '🏋️'
      case 'pr_achieved':
        return '🏆'
      case 'streak_milestone':
        return '🔥'
      default:
        return '✨'
    }
  }

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'workout_completed':
        return 'border-blue-500 bg-blue-50'
      case 'pr_achieved':
        return 'border-yellow-500 bg-yellow-50'
      case 'streak_milestone':
        return 'border-red-500 bg-red-50'
      default:
        return 'border-slate-500 bg-slate-50'
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-20 bg-slate-200 rounded-lg animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {activities.length === 0 ? (
        <div className="text-center py-12 text-slate-500">
          <p className="text-lg">No activities yet</p>
          <p className="text-sm">Follow friends to see their achievements!</p>
        </div>
      ) : (
        activities.map((activity) => (
          <div
            key={activity.id}
            className={`p-4 rounded-lg border-l-4 transition-all duration-300 hover:shadow-lg hover:translate-x-1 ${getActivityColor(activity.activityType)}`}
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl">{getActivityIcon(activity.activityType)}</span>
              <div className="flex-1">
                <p className="font-semibold text-slate-900">{activity.user?.name || 'User'}</p>
                <p className="text-slate-700 mt-1">{activity.description}</p>
                <p className="text-xs text-slate-500 mt-2">
                  {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                </p>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  )
}

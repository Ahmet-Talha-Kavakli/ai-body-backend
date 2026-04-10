'use client'

import React from 'react'

interface MuscleGroup {
  name: string
  engagement: number // 0-100
  color: string
}

interface MuscleEngagementOverlayProps {
  muscles?: MuscleGroup[]
}

export function MuscleEngagementOverlay({ muscles = [] }: MuscleEngagementOverlayProps) {
  const defaultMuscles: MuscleGroup[] = [
    { name: 'Quads', engagement: 0, color: 'from-blue-400 to-blue-600' },
    { name: 'Hamstrings', engagement: 0, color: 'from-purple-400 to-purple-600' },
    { name: 'Glutes', engagement: 0, color: 'from-pink-400 to-pink-600' },
    { name: 'Core', engagement: 0, color: 'from-yellow-400 to-yellow-600' },
    { name: 'Chest', engagement: 0, color: 'from-red-400 to-red-600' },
    { name: 'Back', engagement: 0, color: 'from-green-400 to-green-600' },
    { name: 'Shoulders', engagement: 0, color: 'from-cyan-400 to-cyan-600' },
    { name: 'Arms', engagement: 0, color: 'from-indigo-400 to-indigo-600' },
  ]

  const muscleData = muscles.length > 0 ? muscles : defaultMuscles

  return (
    <div className="w-full bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl shadow-2xl p-8 text-white">
      <h3 className="text-2xl font-bold mb-8 flex items-center gap-2">
        <span className="text-2xl">💪</span> Muscle Engagement
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {muscleData.map((muscle) => (
          <div key={muscle.name} className="space-y-2">
            <div className="flex justify-between items-center">
              <p className="font-semibold text-lg">{muscle.name}</p>
              <p className="text-sm font-bold text-slate-300">{muscle.engagement}%</p>
            </div>

            <div className="w-full h-3 bg-slate-700 rounded-full overflow-hidden">
              <div
                className={`h-full bg-gradient-to-r ${muscle.color} transition-all duration-500 rounded-full`}
                style={{ width: `${muscle.engagement}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 p-4 bg-slate-700 rounded-lg border-l-4 border-blue-400">
        <p className="text-sm text-slate-200">
          <span className="font-semibold">💡 Tip:</span> Higher engagement = more muscle activation during exercise.
          Aim for balanced activation across muscle groups.
        </p>
      </div>
    </div>
  )
}

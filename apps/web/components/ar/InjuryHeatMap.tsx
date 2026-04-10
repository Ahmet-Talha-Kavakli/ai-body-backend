'use client'

import React, { useMemo } from 'react'
import type { UserHealthMetrics } from '@prisma/client'

interface InjuryHeatMapProps {
  injuries?: Array<{ bodyPart: string; severity: number }>
}

export function InjuryHeatMap({ injuries = [] }: InjuryHeatMapProps) {
  const bodyParts = [
    'Head',
    'Neck',
    'Shoulders',
    'Upper Back',
    'Lower Back',
    'Elbows',
    'Wrists',
    'Hips',
    'Knees',
    'Ankles',
  ]

  const injuryMap = useMemo(() => {
    const map: Record<string, number> = {}
    injuries.forEach((inj) => {
      map[inj.bodyPart] = inj.severity
    })
    return map
  }, [injuries])

  const getSeverityColor = (severity: number): string => {
    if (severity === 0) return 'bg-green-100 border-green-300 text-green-900'
    if (severity < 3) return 'bg-yellow-100 border-yellow-300 text-yellow-900'
    if (severity < 6) return 'bg-orange-100 border-orange-300 text-orange-900'
    return 'bg-red-100 border-red-300 text-red-900'
  }

  const getSeverityLabel = (severity: number): string => {
    if (severity === 0) return 'Healthy'
    if (severity < 3) return 'Caution'
    if (severity < 6) return 'Warning'
    return 'Critical'
  }

  return (
    <div className="w-full bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg shadow-lg border border-slate-200 p-6">
      <h3 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
        <span className="text-red-500">◉</span> Injury Heat Map
      </h3>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {bodyParts.map((part) => {
          const severity = injuryMap[part] || 0
          const color = getSeverityColor(severity)

          return (
            <div
              key={part}
              className={`p-3 rounded-lg border-2 transition-all duration-300 hover:shadow-lg hover:scale-105 cursor-default ${color}`}
            >
              <p className="font-semibold text-sm">{part}</p>
              <p className="text-xs mt-1 opacity-75">{getSeverityLabel(severity)}</p>
              {severity > 0 && <p className="text-lg font-bold mt-2">{severity}/10</p>}
            </div>
          )
        })}
      </div>

      <div className="mt-6 pt-4 border-t border-slate-300">
        <p className="text-xs text-slate-600">
          <span className="font-semibold">Legend:</span> Green = Healthy | Yellow = Caution | Orange = Warning | Red = Critical
        </p>
      </div>
    </div>
  )
}

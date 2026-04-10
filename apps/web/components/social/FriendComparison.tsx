'use client'

import React, { useState, useEffect } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

interface ComparisonData {
  metric: string
  you: number
  friend: number
}

interface FriendComparisonProps {
  friendId: string
  friendName?: string
}

export function FriendComparison({ friendId, friendName }: FriendComparisonProps) {
  const [data, setData] = useState<ComparisonData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchComparison = async () => {
      try {
        const res = await fetch(`/api/user/compare/${friendId}`)
        if (res.ok) {
          const result = await res.json()
          setData([
            {
              metric: 'Form Score',
              you: result.data?.yourFormScore || 0,
              friend: result.data?.friendFormScore || 0,
            },
            {
              metric: 'Consistency',
              you: result.data?.yourConsistency || 0,
              friend: result.data?.friendConsistency || 0,
            },
            {
              metric: 'Recovery',
              you: result.data?.yourRecovery || 0,
              friend: result.data?.friendRecovery || 0,
            },
          ])
        }
      } catch (error) {
        console.error('Error fetching comparison:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchComparison()
  }, [friendId])

  if (loading) {
    return <div className="h-96 bg-slate-200 rounded-lg animate-pulse" />
  }

  return (
    <div className="w-full bg-white rounded-lg shadow-lg p-6 border border-slate-200">
      <h3 className="text-2xl font-bold mb-6">Comparison with {friendName || 'Friend'}</h3>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={data}
          margin={{ top: 20, right: 30, left: 0, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="metric" />
          <YAxis />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1e293b',
              border: 'none',
              borderRadius: '8px',
              color: '#fff',
            }}
          />
          <Legend />
          <Bar dataKey="you" fill="#3b82f6" radius={[8, 8, 0, 0]} />
          <Bar dataKey="friend" fill="#ef4444" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>

      <div className="mt-6 grid grid-cols-3 gap-4">
        {data.map((item) => (
          <div key={item.metric} className="p-4 bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg">
            <p className="text-sm font-semibold text-slate-600">{item.metric}</p>
            <div className="flex gap-4 mt-2">
              <div>
                <p className="text-2xl font-bold text-blue-600">{item.you}</p>
                <p className="text-xs text-slate-600">You</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-red-600">{item.friend}</p>
                <p className="text-xs text-slate-600">Friend</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

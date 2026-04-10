'use client';
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export interface BalanceData {
  muscle: string;
  left: number;
  right: number;
  imbalance: number;
}

export function MuscleImbalanceTrend({
  data,
  title = 'Muscle Imbalance Trend (Left vs Right)',
}: {
  data: BalanceData[];
  title?: string;
}) {
  const chartData = data.map(d => ({
    muscle: d.muscle,
    'Left': d.left,
    'Right': d.right,
  }));

  return (
    <div className="w-full h-96 p-4 bg-white rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" />
          <YAxis dataKey="muscle" type="category" width={100} />
          <Tooltip contentStyle={{ backgroundColor: '#1a1a2e' }} />
          <Legend />
          <Bar dataKey="Left" fill="#3b82f6" />
          <Bar dataKey="Right" fill="#10b981" />
        </BarChart>
      </ResponsiveContainer>
      <p className="text-xs text-gray-600 mt-2">Alert if imbalance {">"} 15%</p>
    </div>
  );
}

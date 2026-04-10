'use client';
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export interface MuscleGroupData {
  week: string;
  quads?: number;
  hamstrings?: number;
  glutes?: number;
  core?: number;
  chest?: number;
  back?: number;
  shoulders?: number;
  arms?: number;
}

export function WeaknessTrajectory({
  data,
  title = 'Weakness Trajectory (30-Day Forecast)',
}: {
  data: MuscleGroupData[];
  title?: string;
}) {
  const colors: Record<string, string> = {
    quads: '#ef4444',
    hamstrings: '#f97316',
    glutes: '#eab308',
    core: '#84cc16',
    chest: '#22c55e',
    back: '#06b6d4',
    shoulders: '#3b82f6',
    arms: '#8b5cf6',
  };

  return (
    <div className="w-full h-96 p-4 bg-white rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="week" />
          <YAxis domain={[0, 100]} />
          <Tooltip contentStyle={{ backgroundColor: '#1a1a2e' }} />
          <Legend />
          {Object.keys(colors).map(muscle => (
            <Line key={muscle} type="monotone" dataKey={muscle} stroke={colors[muscle]} strokeWidth={2} connectNulls />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

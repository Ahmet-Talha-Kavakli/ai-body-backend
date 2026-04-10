'use client';
import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

export interface DailyRecoveryData {
  date: string;
  recoveryState: number;
}

export function RecoveryTimeline({
  data,
  title = 'Recovery State Timeline (30 Days)',
}: {
  data: DailyRecoveryData[];
  title?: string;
}) {
  const chartData = data.map(d => ({
    date: d.date,
    'Recovery': Math.round(d.recoveryState * 100),
  }));

  return (
    <div className="w-full h-96 p-4 bg-white rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id="colorRecovery" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis domain={[0, 100]} />
          <Tooltip formatter={(value) => `${value}%`} />
          <ReferenceLine y={40} stroke="#f59e0b" strokeDasharray="3 3" />
          <ReferenceLine y={70} stroke="#10b981" strokeDasharray="3 3" />
          <Area type="monotone" dataKey="Recovery" stroke="#3b82f6" fill="url(#colorRecovery)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

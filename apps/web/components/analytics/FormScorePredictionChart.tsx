'use client';
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export interface PredictionData {
  day: string;
  actualScore?: number;
  predictedScore: number;
  confidence: number;
}

export function FormScorePredictionChart({
  data,
  title = 'Form Score Prediction (Next 7 Days)',
}: {
  data: PredictionData[];
  title?: string;
}) {
  const chartData = data.map(d => ({
    day: d.day,
    'Actual': d.actualScore || null,
    'Predicted': Math.round(d.predictedScore * 100),
    'Confidence': Math.round(d.confidence * 100),
  }));

  return (
    <div className="w-full h-96 p-4 bg-white rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="day" />
          <YAxis domain={[0, 100]} />
          <Tooltip formatter={(value) => `${value}%`} />
          <Legend />
          <Line type="monotone" dataKey="Actual" stroke="#10b981" strokeWidth={2} connectNulls />
          <Line type="monotone" dataKey="Predicted" stroke="#3b82f6" strokeWidth={2} strokeDasharray="5 5" />
          <Line type="monotone" dataKey="Confidence" stroke="#f59e0b" strokeWidth={1} opacity={0.6} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

'use client';
import React, { useState, useEffect } from 'react';
import { FormScorePredictionChart } from '@/components/analytics/FormScorePredictionChart';
import { RecoveryCorrelationHeatmap } from '@/components/analytics/RecoveryCorrelationHeatmap';
import { WeaknessTrajectory } from '@/components/analytics/WeaknessTrajectory';
import { MuscleImbalanceTrend } from '@/components/analytics/MuscleImbalanceTrend';
import { RecoveryTimeline } from '@/components/analytics/RecoveryTimeline';

export default function AdvancedAnalytics() {
  const [predictions, setPredictions] = useState<any[]>([]);
  const [weeklyData, setWeeklyData] = useState<any[]>([]);
  const [recoveryData, setRecoveryData] = useState<any[]>([]);

  useEffect(() => {
    const fetchAnalytics = async () => {
      const res = await fetch('/api/user/analytics');
      if (res.ok) {
        const data = await res.json();
        setPredictions(data.data?.predictions || []);
        setWeeklyData(data.data?.weeklyMetrics || []);
        setRecoveryData(data.data?.recoveryTimeline || []);
      }
    };
    fetchAnalytics();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Advanced Analytics</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <FormScorePredictionChart data={predictions} />
          <RecoveryCorrelationHeatmap />
        </div>

        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <WeaknessTrajectory data={weeklyData} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <MuscleImbalanceTrend data={weeklyData} />
          <RecoveryTimeline data={recoveryData} />
        </div>
      </div>
    </div>
  );
}

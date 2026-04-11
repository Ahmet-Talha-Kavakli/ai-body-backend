'use client';
import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

const SkeletonViewer3D = dynamic(
  () => import('@/components/ar/SkeletonViewer3D').then(m => ({ default: m.SkeletonViewer3D })),
  {
    ssr: false,
    loading: () => <div className="animate-pulse bg-gray-800 rounded-lg h-96 w-full" />,
  }
);

const InjuryHeatMap = dynamic(
  () => import('@/components/ar/InjuryHeatMap').then(m => ({ default: m.InjuryHeatMap })),
  {
    ssr: false,
    loading: () => <div className="animate-pulse bg-gray-800 rounded-lg h-64 w-full" />,
  }
);

export default function ARDashboard() {
  const [poseResult, setPoseResult] = useState(null);
  const [injuries, setInjuries] = useState([]);

  useEffect(() => {
    // Initialize pose detection or fetch current pose
    const loadData = async () => {
      // Fetch user's health metrics
      const res = await fetch('/api/user/profile/health');
      if (res.ok) {
        const data = await res.json();
        setInjuries(data.data?.activeInjuries || []);
      }
    };
    loadData();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8">3D Skeleton & Injury Visualization</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-slate-800 rounded-lg overflow-hidden shadow-2xl">
              <SkeletonViewer3D
                poseResult={poseResult}
                injuries={injuries}
                width={800}
                height={600}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-lg font-bold mb-3">Active Injuries</h3>
              <div className="space-y-2">
                {injuries.map((injury: any, idx: number) => (
                  <div key={idx} className="p-2 bg-red-50 border border-red-200 rounded">
                    <p className="font-medium text-red-900">{injury.bodyPart}</p>
                    <p className="text-sm text-red-700">Severity: {injury.severity}/10</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-lg font-bold mb-3">Tips</h3>
              <ul className="text-sm space-y-1 text-gray-700">
                <li>• Rotate to view all angles</li>
                <li>• Red bones = critical injuries</li>
                <li>• Blue/green = healthy areas</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

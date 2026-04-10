'use client';
import React from 'react';

export function RecoveryCorrelationHeatmap({
  title = 'Recovery Factors Correlation',
}: {
  title?: string;
}) {
  const correlations = [
    { name: 'Sleep Impact', sleep: 0.85, stress: -0.6, protein: 0.4, soreness: -0.7 },
    { name: 'Stress Impact', sleep: -0.6, stress: -0.9, protein: -0.3, soreness: 0.8 },
    { name: 'Protein Impact', sleep: 0.4, stress: -0.3, protein: 0.85, soreness: -0.5 },
    { name: 'Soreness Impact', sleep: -0.7, stress: 0.8, protein: -0.5, soreness: -0.95 },
  ];

  const getColor = (value: number): string => {
    if (value < -0.5) return 'bg-blue-900';
    if (value < -0.3) return 'bg-blue-700';
    if (value < -0.1) return 'bg-blue-500';
    if (value < 0.1) return 'bg-gray-300';
    if (value < 0.3) return 'bg-red-500';
    if (value < 0.5) return 'bg-red-700';
    return 'bg-red-900';
  };

  return (
    <div className="w-full p-4 bg-white rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="p-2 text-left">Factor</th>
              <th className="p-2 text-center">Sleep</th>
              <th className="p-2 text-center">Stress</th>
              <th className="p-2 text-center">Protein</th>
              <th className="p-2 text-center">Soreness</th>
            </tr>
          </thead>
          <tbody>
            {correlations.map((row, idx) => (
              <tr key={idx} className="border-t">
                <td className="p-2 font-medium">{row.name}</td>
                <td className="p-2"><div className={`${getColor(row.sleep)} text-white rounded px-2 py-1 text-xs font-semibold text-center`}>{row.sleep.toFixed(2)}</div></td>
                <td className="p-2"><div className={`${getColor(row.stress)} text-white rounded px-2 py-1 text-xs font-semibold text-center`}>{row.stress.toFixed(2)}</div></td>
                <td className="p-2"><div className={`${getColor(row.protein)} text-white rounded px-2 py-1 text-xs font-semibold text-center`}>{row.protein.toFixed(2)}</div></td>
                <td className="p-2"><div className={`${getColor(row.soreness)} text-white rounded px-2 py-1 text-xs font-semibold text-center`}>{row.soreness.toFixed(2)}</div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-gray-600 mt-2">Red = positive, Blue = negative correlation</p>
    </div>
  );
}

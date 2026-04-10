'use client';

import React from 'react';

interface FormScoreDisplayProps {
  score: number;
  injuryRisk: number;
  errors: Array<{ cue: string; severity: string }>;
}

export function FormScoreDisplay({
  score,
  injuryRisk,
  errors,
}: FormScoreDisplayProps) {
  const getScoreColor = () => {
    if (score >= 85) return 'text-green-400';
    if (score >= 70) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getScoreBg = () => {
    if (score >= 85) return 'bg-green-500/10';
    if (score >= 70) return 'bg-yellow-500/10';
    return 'bg-red-500/10';
  };

  return (
    <div className={`${getScoreBg()} border border-opacity-20 rounded-xl p-4`}>
      <div className={`text-3xl font-bold ${getScoreColor()}`}>
        {Math.round(score)}/100
      </div>

      <div className="mt-2 text-sm text-gray-400">
        Yaralanma Riski: {injuryRisk}% ✅
      </div>

      {errors.length > 0 && (
        <div className="mt-3 space-y-1">
          <div className="text-xs text-gray-500 font-semibold">DÜZELTMELER:</div>
          {errors.slice(0, 2).map((err, i) => (
            <div key={i} className="text-xs text-gray-300">
              • {err.cue}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

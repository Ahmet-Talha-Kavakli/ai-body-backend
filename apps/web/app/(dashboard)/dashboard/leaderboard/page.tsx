'use client';
import { useState } from 'react';
import { LeaderboardView } from '@/components/social/LeaderboardView';

export default function LeaderboardPage() {
  const [type, setType] = useState('form_score');
  const [period, setPeriod] = useState('weekly');

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Leaderboards</h1>

        <div className="flex gap-4 mb-6">
          <select
            value={type}
            onChange={e => setType(e.target.value)}
            className="px-4 py-2 border rounded-lg"
          >
            <option value="form_score">Form Score</option>
            <option value="most_consistent">Consistency</option>
            <option value="strongest">Strongest</option>
            <option value="best_recovery">Best Recovery</option>
          </select>

          <select
            value={period}
            onChange={e => setPeriod(e.target.value)}
            className="px-4 py-2 border rounded-lg"
          >
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="all_time">All Time</option>
          </select>
        </div>

        <LeaderboardView type={type} period={period} />
      </div>
    </div>
  );
}

'use client';
import React, { useState, useEffect } from 'react';

export function LeaderboardView({ type = 'form_score', period = 'weekly' }: { type?: string; period?: string }) {
  const [entries, setEntries] = useState<Array<{ rank: number; username: string; score: number }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      const res = await fetch(`/api/user/leaderboard/${type}?period=${period}`);
      if (res.ok) {
        const data = await res.json();
        setEntries(data.data?.entries || []);
      }
      setLoading(false);
    };
    fetchLeaderboard();
  }, [type, period]);

  if (loading) return <div className="p-4">Loading leaderboard...</div>;

  return (
    <div className="w-full bg-white rounded-lg shadow p-4">
      <h2 className="text-xl font-bold mb-4 capitalize">{type.replace('_', ' ')} ({period})</h2>
      <div className="space-y-1">
        {entries.map((entry, idx) => (
          <div key={idx} className="flex items-center justify-between p-2 hover:bg-gray-50">
            <div className="flex items-center gap-2">
              <span className="font-bold text-gray-400 w-6">{idx + 1}</span>
              <span className="font-medium">{entry.username}</span>
            </div>
            <span className="font-bold text-blue-600">{entry.score}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

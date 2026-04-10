'use client';

import { useState } from 'react';

export default function CheckInPage() {
  const [sleepHours, setSleepHours] = useState('7');
  const [stressLevel, setStressLevel] = useState('5');

  const handleSubmit = async () => {
    await fetch('/api/daily-metrics', {
      method: 'POST',
      body: JSON.stringify({ sleepHours: parseFloat(sleepHours), stressLevel: parseInt(stressLevel) }),
    });
  };

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary p-8">
      <h1 className="text-3xl font-bold mb-6">Bugünün Kontrol Noktası</h1>
      <div className="bg-bg-surface rounded-lg p-6 border border-border-default max-w-md">
        <div className="mb-4">
          <label className="block text-text-secondary mb-2">Dün kaç saat uyudun?</label>
          <input type="number" value={sleepHours} onChange={(e) => setSleepHours(e.target.value)} className="w-full px-3 py-2 bg-bg-elevated rounded border border-border-default text-text-primary" />
        </div>
        <div className="mb-6">
          <label className="block text-text-secondary mb-2">Stres seviyesi (1-10)</label>
          <input type="range" min="1" max="10" value={stressLevel} onChange={(e) => setStressLevel(e.target.value)} className="w-full" />
          <p className="text-center text-text-secondary">{stressLevel}/10</p>
        </div>
        <button onClick={handleSubmit} className="w-full py-3 bg-accent-primary hover:bg-accent-primary-hover rounded font-semibold">
          Kaydet
        </button>
      </div>
    </div>
  );
}

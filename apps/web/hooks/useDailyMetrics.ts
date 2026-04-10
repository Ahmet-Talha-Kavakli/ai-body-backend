import { useState, useCallback } from 'react';

interface DailyMetrics {
  sleepHours: number;
  sleepQuality: number;
  stressLevel: number;
  proteinIntake: number;
  calorieIntake?: number;
  waterIntake: number;
  mood: string;
  energyLevel: number;
  soreness: number;
  injuryPain: number;
  notes?: string;
}

export function useDailyMetrics() {
  const [metrics, setMetrics] = useState<DailyMetrics[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = useCallback(async (days: number = 30) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/user/daily-metrics?days=${days}`);
      if (!response.ok) throw new Error('Failed to fetch metrics');

      const data = await response.json();
      setMetrics(data.data || []);
    } catch (err) {
      setError(String(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logMetrics = useCallback(async (data: DailyMetrics) => {
    try {
      const response = await fetch('/api/user/daily-metrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error('Failed to save metrics');

      const saved = await response.json();
      setMetrics(prev => [saved.data, ...prev]);
      return saved.data;
    } catch (err) {
      setError(String(err));
      throw err;
    }
  }, []);

  return {
    metrics,
    isLoading,
    error,
    fetchMetrics,
    logMetrics,
  };
}

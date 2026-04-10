import { useState, useCallback } from 'react';

export function useAnalytics() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [dailyMetrics, setDailyMetrics] = useState<any[]>([]);
  const [aggregates, setAggregates] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async (days: number = 56) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/user/analytics?days=${days}`);
      if (!response.ok) throw new Error('Failed to fetch analytics');

      const data = await response.json();
      setAnalytics(data.data.analytics || []);
      setDailyMetrics(data.data.dailyMetrics || []);
      setAggregates(data.data.aggregates || {});
    } catch (err) {
      setError(String(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    analytics,
    dailyMetrics,
    aggregates,
    isLoading,
    error,
    fetchAnalytics,
  };
}

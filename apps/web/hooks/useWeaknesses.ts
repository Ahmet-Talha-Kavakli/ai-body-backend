import { useState, useCallback } from 'react';

interface Weakness {
  id: string;
  muscleGroup: string;
  exerciseName: string;
  severity: number;
  discoveredDate: string;
  targetDate?: string;
}

export function useWeaknesses() {
  const [weaknesses, setWeaknesses] = useState<Weakness[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWeaknesses = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/user/weaknesses');
      if (!response.ok) throw new Error('Failed to fetch weaknesses');

      const data = await response.json();
      setWeaknesses(data.data || []);
    } catch (err) {
      setError(String(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addWeakness = useCallback(
    async (weakness: Omit<Weakness, 'id' | 'discoveredDate'>) => {
      try {
        const response = await fetch('/api/user/weaknesses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(weakness),
        });

        if (!response.ok) throw new Error('Failed to add weakness');

        const data = await response.json();
        setWeaknesses(prev => [data.data, ...prev]);
        return data.data;
      } catch (err) {
        setError(String(err));
        throw err;
      }
    },
    []
  );

  return {
    weaknesses,
    isLoading,
    error,
    fetchWeaknesses,
    addWeakness,
  };
}

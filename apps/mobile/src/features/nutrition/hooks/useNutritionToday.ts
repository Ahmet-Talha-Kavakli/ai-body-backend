import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '@clerk/expo';
import { fetchToday } from '../api/client';
import type { TodayResponse } from '../api/types';

const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1500;

export function useNutritionToday(date?: string) {
  const { getToken } = useAuth();
  const [data, setData] = useState<TodayResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const retriesRef = useRef(0);
  const getTokenRef = useRef(getToken);
  getTokenRef.current = getToken;

  const refresh = useCallback(
    async (silent = false) => {
      try {
        if (!silent) setLoading(true);
        const token = await getTokenRef.current();
        if (!token) throw new Error('Unauthorized');
        const res = await fetchToday(token, date);
        setData(res);
        setError(null);
        retriesRef.current = 0;
      } catch (e) {
        if (retriesRef.current < MAX_RETRIES) {
          retriesRef.current += 1;
          setTimeout(() => refresh(true), RETRY_DELAY_MS);
          return;
        }
        setError(e as Error);
        console.warn('[useNutritionToday]', (e as Error).message);
      } finally {
        setLoading(false);
      }
    },
    [date],
  );

  const removeMealOptimistic = useCallback((mealId: string) => {
    setData((prev) => {
      if (!prev) return prev;
      const types = ['breakfast', 'lunch', 'dinner', 'snack'] as const;
      const newMeals = { ...prev.meals } as typeof prev.meals;
      let removed: any = null;
      for (const t of types) {
        const list = newMeals[t] ?? [];
        const idx = list.findIndex((m) => m.id === mealId);
        if (idx >= 0) {
          removed = list[idx];
          newMeals[t] = [...list.slice(0, idx), ...list.slice(idx + 1)];
          break;
        }
      }
      if (!removed) return prev;
      const t = prev.totals;
      const m = (removed.totalMicros ?? {}) as Record<string, number>;
      const newTotals = {
        ...t,
        calories: t.calories - (removed.totalCalories ?? 0),
        protein: t.protein - (removed.totalProteinG ?? 0),
        carbs: t.carbs - (removed.totalCarbsG ?? 0),
        fat: t.fat - (removed.totalFatG ?? 0),
        fiber: t.fiber - (removed.totalFiberG ?? 0),
        sugar: t.sugar - (removed.totalSugarG ?? 0),
        addedSugar: t.addedSugar - (removed.totalAddedSugarG ?? 0),
        satFat: t.satFat - (removed.totalSatFatG ?? 0),
        transFat: t.transFat - (removed.totalTransFatG ?? 0),
        cholesterol: t.cholesterol - (removed.totalCholesterolMg ?? 0),
        sodium: t.sodium - (removed.totalSodiumMg ?? 0),
        alcohol: t.alcohol - (removed.totalAlcoholG ?? 0),
        micros: Object.fromEntries(
          Object.entries(t.micros).map(([k, v]) => [k, (v as number) - (Number(m[k]) || 0)]),
        ) as typeof t.micros,
      };
      return { ...prev, meals: newMeals, totals: newTotals };
    });
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { data, loading, error, refresh, removeMealOptimistic };
}

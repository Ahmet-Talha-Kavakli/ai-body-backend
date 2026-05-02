import { useCallback } from 'react';
import { useSession } from '@clerk/expo';
import { getReadableDrinkColor } from './drinkColor';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

export type DrinkSourceType = 'catalog' | 'custom';

export interface UserDrink {
  id: string;
  type: DrinkSourceType;
  nametr: string;
  nameen?: string | null;
  category: string;
  hydrationValue: number;
  caffeinePerServing: number | null;
  defaultServingMl: number;
  iconName: string;
  color: string;
  isVisible: boolean;
  sortOrder: number;
  isProtected?: boolean; // ana içecek (silinemez); backend göndermezse false varsayılır
}

export interface CreateCustomDrinkInput {
  nametr: string;
  nameen?: string;
  category: string;
  hydrationValue: number;
  caffeinePerServing?: number;
  defaultServingMl: number;
  iconName: string;
  color: string;
}

export interface UpdateDrinkInput {
  nametr?: string;
  nameen?: string;
  category?: string;
  hydrationValue?: number;
  caffeinePerServing?: number;
  defaultServingMl?: number;
  customSizeMl?: number;
  iconName?: string;
  color?: string;
  isVisible?: boolean;
}

export interface ReorderInput {
  orders: { id: string; type: DrinkSourceType; sortOrder: number }[];
}

// Beyaz/çok açık renkli içecekleri (süt, ayran, kefir, beyaz çay) UI'da görünür
// kılmak için render-time substitute. DB'deki orijinal renge dokunulmaz.
function normalizeDrink(d: UserDrink): UserDrink {
  return { ...d, color: getReadableDrinkColor(d.color) };
}

export function useDrinksApi() {
  const { session } = useSession();

  const authFetch = useCallback(
    async (path: string, options: RequestInit = {}) => {
      const token = (await session?.getToken()) ?? null;
      return fetch(`${API_URL}${path}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...((options.headers as Record<string, string>) ?? {}),
        },
      });
    },
    [session],
  );

  const listDrinks = useCallback(async (): Promise<UserDrink[]> => {
    const r = await authFetch('/api/water/drinks');
    if (!r.ok) return [];
    const d = (await r.json()) as { drinks: UserDrink[] };
    return (d.drinks ?? []).map(normalizeDrink);
  }, [authFetch]);

  const createDrink = useCallback(
    async (input: CreateCustomDrinkInput): Promise<UserDrink | null> => {
      const r = await authFetch('/api/water/drinks', {
        method: 'POST',
        body: JSON.stringify(input),
      });
      if (!r.ok) return null;
      const d = (await r.json()) as { drink: UserDrink };
      return normalizeDrink(d.drink);
    },
    [authFetch],
  );

  const updateDrink = useCallback(
    async (id: string, type: DrinkSourceType, input: UpdateDrinkInput): Promise<boolean> => {
      const r = await authFetch(`/api/water/drinks/${id}?type=${type}`, {
        method: 'PATCH',
        body: JSON.stringify(input),
      });
      return r.ok;
    },
    [authFetch],
  );

  const reorderDrinks = useCallback(
    async (input: ReorderInput): Promise<boolean> => {
      const r = await authFetch('/api/water/drinks/reorder', {
        method: 'POST',
        body: JSON.stringify(input),
      });
      return r.ok;
    },
    [authFetch],
  );

  const deleteDrink = useCallback(
    async (id: string, type: DrinkSourceType = 'custom'): Promise<boolean> => {
      const r = await authFetch(`/api/water/drinks/${id}?type=${type}`, {
        method: 'DELETE',
      });
      return r.ok;
    },
    [authFetch],
  );

  return { listDrinks, createDrink, updateDrink, reorderDrinks, deleteDrink };
}

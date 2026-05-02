import axios, { AxiosInstance } from 'axios';
import type { PantryItem, ScannedItem } from './types';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

function authClient(token: string): AxiosInstance {
  return axios.create({
    baseURL: BASE_URL,
    timeout: 30_000,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function fetchPantry(token: string): Promise<{ items: PantryItem[] }> {
  const c = authClient(token);
  const { data } = await c.get<{ items: PantryItem[] }>('/api/pantry/items');
  return data;
}

export type CreatePantryInput = {
  name: string;
  category?: string | null;
  quantity?: number | null;
  unit?: string | null;
  expiresAt?: string | null;
  photoUrl?: string | null;
  source?: string;
  notes?: string | null;
  isLowStock?: boolean;
};

export async function createPantryItem(
  token: string,
  input: CreatePantryInput,
): Promise<{ item: PantryItem }> {
  const c = authClient(token);
  const { data } = await c.post<{ item: PantryItem }>('/api/pantry/items', input);
  return data;
}

export async function bulkCreatePantryItems(
  token: string,
  items: Array<Partial<PantryItem>>,
  source = 'photo_scan',
): Promise<{ items: PantryItem[]; inserted: number }> {
  const c = authClient(token);
  const { data } = await c.post<{ items: PantryItem[]; inserted: number }>(
    '/api/pantry/items/bulk',
    { items, source },
  );
  return data;
}

export async function updatePantryItem(
  token: string,
  id: string,
  patch: Partial<CreatePantryInput>,
): Promise<{ item: PantryItem }> {
  const c = authClient(token);
  const { data } = await c.patch<{ item: PantryItem }>(`/api/pantry/items/${id}`, patch);
  return data;
}

export async function deletePantryItem(token: string, id: string): Promise<{ ok: true }> {
  const c = authClient(token);
  const { data } = await c.delete<{ ok: true }>(`/api/pantry/items/${id}`);
  return data;
}

export async function scanPantryPhoto(
  token: string,
  base64Image: string,
): Promise<{ items: ScannedItem[] }> {
  const c = authClient(token);
  const { data } = await c.post<{ items: ScannedItem[] }>('/api/pantry/scan', {
    image: base64Image,
  });
  return data;
}

import axios, { AxiosInstance } from 'axios';
import type {
  DietPreset,
  DietPresetDetail,
  DietPresetPreview,
  ActiveDietPlan,
  AiPlanPreferences,
} from './types';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

function authClient(token: string): AxiosInstance {
  return axios.create({
    baseURL: BASE_URL,
    timeout: 45_000,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
  });
}

export async function fetchPresets(token: string): Promise<{ presets: DietPreset[] }> {
  const { data } = await authClient(token).get('/api/diet/presets');
  return data;
}

export async function fetchPresetDetail(
  token: string,
  slug: string,
): Promise<{ preset: DietPresetDetail; preview: DietPresetPreview }> {
  const { data } = await authClient(token).get(`/api/diet/presets/${slug}`);
  return data;
}

export async function fetchActivePlan(token: string): Promise<{ plan: ActiveDietPlan | null }> {
  const { data } = await authClient(token).get('/api/diet/active');
  return data;
}

export async function startPresetPlan(
  token: string,
  presetSlug: string,
  durationDays: number,
): Promise<{ plan: ActiveDietPlan }> {
  const { data } = await authClient(token).post('/api/diet/start', { presetSlug, durationDays });
  return data;
}

export async function startAiPlan(
  token: string,
  aiPlan: any,
  durationDays: number,
): Promise<{ plan: ActiveDietPlan }> {
  const { data } = await authClient(token).post('/api/diet/start', { aiPlan, durationDays });
  return data;
}

export async function stopPlan(token: string): Promise<{ ok: boolean }> {
  const { data } = await authClient(token).post('/api/diet/stop', {});
  return data;
}

export async function applyMenu(token: string, menuId: string): Promise<{ mealLogId: string }> {
  const { data } = await authClient(token).post('/api/diet/apply', { menuId });
  return data;
}

export async function applyDay(token: string, date?: string): Promise<{ applied: number }> {
  const { data } = await authClient(token).post('/api/diet/apply-day', { date });
  return data;
}

export async function generateAiPlan(
  token: string,
  preferences: AiPlanPreferences,
): Promise<{ aiPlan: any }> {
  const { data } = await authClient(token).post('/api/diet/ai-generate', { preferences });
  return data;
}

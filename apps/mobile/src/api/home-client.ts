import { useAuth } from '@clerk/expo';
import axios from 'axios';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

export interface HomeGreeting {
  greeting: string;
  firstName: string;
  message: string;
  hour: number;
  stats: {
    waterMl: number;
    sleepHours: number | null;
    workoutCount: number;
  };
}

export interface PetData {
  id: string;
  name: string;
  mood: string;
  xp: number;
  level: number;
  daysAbsent: number;
  hasInjury: boolean;
}

export interface ReadinessData {
  score: number;
  reason: string;
  updatedAt: string;
}

export interface WaterDashboard {
  todayMl: number;
  goalMl: number;
  streak: number;
}

export interface DashboardStats {
  stats: {
    weeklyCalories: number;
    weeklyMinutes: number;
    weeklySessions: number;
    totalSessions: number;
  };
  todayNutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    goal: {
      dailyCalories: number;
      proteinG: number;
    };
  };
}

export function createAuthClient(token: string) {
  return axios.create({
    baseURL: BASE_URL,
    timeout: 15_000,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function fetchHomeGreeting(token: string): Promise<HomeGreeting> {
  const client = createAuthClient(token);
  const { data } = await client.get<HomeGreeting>('/api/home/greeting');
  return data;
}

export async function fetchPet(token: string): Promise<PetData> {
  const client = createAuthClient(token);
  const { data } = await client.get<PetData>('/api/pet');
  return data;
}

export async function fetchReadiness(token: string): Promise<ReadinessData> {
  const client = createAuthClient(token);
  const { data } = await client.get<ReadinessData>('/api/readiness');
  return data;
}

export async function fetchWaterDashboard(token: string): Promise<WaterDashboard> {
  const client = createAuthClient(token);
  const { data } = await client.get<WaterDashboard>('/api/water/dashboard');
  return data;
}

export async function fetchDashboardStats(token: string): Promise<DashboardStats> {
  const client = createAuthClient(token);
  const { data } = await client.get<DashboardStats>('/api/dashboard/stats');
  return data;
}

export async function fetchSleepDashboard(token: string) {
  const client = createAuthClient(token);
  const { data } = await client.get('/api/sleep/dashboard');
  return data as {
    latest: { duration: number; quality: number } | null;
    avgDurationMin: number;
    readinessScore: number | null;
  };
}

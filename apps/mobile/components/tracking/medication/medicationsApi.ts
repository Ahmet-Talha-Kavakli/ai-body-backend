import { useCallback } from 'react';
import { useSession } from '@clerk/expo';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

export type MedScheduleMode = 'fixed_times' | 'interval_hours' | 'as_needed';
export type MedType = 'tablet' | 'kapsul' | 'surup' | 'damla' | 'sprey' | 'igne' | 'krem' | 'toz';

export interface MedicationLog {
  id: string;
  takenAt: string;
  scheduledTime: string | null;
  skipped: boolean;
}

export interface Medication {
  id: string;
  name: string;
  dosage: string;
  unit: string;
  type: MedType;
  color: string;
  notes: string | null;
  scheduleMode: MedScheduleMode;
  scheduleTimes: string[];
  scheduleDays: number[];
  intervalHours: number | null;
  startDate: string;
  endDate: string | null;
  stockCount: number | null;
  refillThreshold: number | null;
  remindersOn: boolean;
  isActive: boolean;
  takenLogs: MedicationLog[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateMedicationInput {
  name: string;
  dosage: string;
  unit?: string;
  type?: MedType;
  color?: string;
  notes?: string;
  scheduleMode: MedScheduleMode;
  scheduleTimes?: string[];
  scheduleDays?: number[];
  intervalHours?: number;
  startDate?: string;
  endDate?: string;
  stockCount?: number;
  refillThreshold?: number;
  remindersOn?: boolean;
}

export interface UpdateMedicationInput extends Partial<CreateMedicationInput> {
  isActive?: boolean;
}

export function useMedicationsApi() {
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

  const listMedications = useCallback(
    async (date?: string): Promise<Medication[]> => {
      const q = date ? `?date=${date}` : '';
      const r = await authFetch(`/api/tracking/medications${q}`);
      if (!r.ok) return [];
      return (await r.json()) as Medication[];
    },
    [authFetch],
  );

  const createMedication = useCallback(
    async (input: CreateMedicationInput): Promise<Medication | null> => {
      const r = await authFetch('/api/tracking/medications', {
        method: 'POST',
        body: JSON.stringify(input),
      });
      if (!r.ok) return null;
      return (await r.json()) as Medication;
    },
    [authFetch],
  );

  const updateMedication = useCallback(
    async (id: string, input: UpdateMedicationInput): Promise<Medication | null> => {
      const r = await authFetch(`/api/tracking/medications/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(input),
      });
      if (!r.ok) return null;
      return (await r.json()) as Medication;
    },
    [authFetch],
  );

  const deleteMedication = useCallback(
    async (id: string): Promise<boolean> => {
      const r = await authFetch(`/api/tracking/medications/${id}`, { method: 'DELETE' });
      return r.ok;
    },
    [authFetch],
  );

  const logMedication = useCallback(
    async (
      id: string,
      input: { taken: boolean; date?: string; scheduledTime?: string; takenAt?: string },
    ): Promise<boolean> => {
      const r = await authFetch(`/api/tracking/medications/${id}/log`, {
        method: 'POST',
        body: JSON.stringify(input),
      });
      return r.ok;
    },
    [authFetch],
  );

  const unlogMedication = useCallback(
    async (id: string, date: string, scheduledTime?: string): Promise<boolean> => {
      const q = new URLSearchParams({ date, ...(scheduledTime ? { scheduledTime } : {}) });
      const r = await authFetch(`/api/tracking/medications/${id}/log?${q.toString()}`, {
        method: 'DELETE',
      });
      return r.ok;
    },
    [authFetch],
  );

  return {
    listMedications,
    createMedication,
    updateMedication,
    deleteMedication,
    logMedication,
    unlogMedication,
  };
}

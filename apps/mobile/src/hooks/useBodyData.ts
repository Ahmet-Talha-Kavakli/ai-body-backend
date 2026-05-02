import { useAuth } from '@clerk/expo';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRef } from 'react';
import {
  createAllergy,
  createBodyMark,
  createChildhoodIllness,
  createChronicCondition,
  createHealthEvent,
  createFamilyHistory,
  createSubstance,
  createSurgery,
  createVaccination,
  deleteAllergy,
  deleteBodyMark,
  deleteChronicCondition,
  deleteHealthEvent,
  deleteSubstance,
  deleteVaccination,
  fetchBodyProfile,
  sendBodyCommand,
  updateAllergy,
  updateBodyMark,
  updateChronicCondition,
  updateHealthEvent,
  updateSubstance,
  updateVaccination,
  upsertDentalHealth,
  upsertEmergencyInfo,
  upsertLifeState,
  upsertPhysicalProfile,
  upsertVisionHearing,
  fetchBloodWork,
  createBloodWork,
  deleteBloodWork,
  fetchCalendarEvents,
  type CalendarEvent,
  type CalendarEventType,
  type Allergy,
  type BodyMark,
  type ChildhoodIllnessItem,
  type ChronicCondition,
  type HealthEvent,
  type HealthEventType,
  type DentalHealth,
  type EmergencyInfo,
  type FamilyHistoryItem,
  type LifeState,
  type PhysicalProfile,
  type Substance,
  type Surgery,
  type Vaccination,
  type VisionHearing,
  type BloodWorkRecord,
  type BloodWorkAnalysis,
} from '../api/body-client';

const KEY = ['body', 'profile'] as const;

function useToken() {
  const { getToken, isSignedIn } = useAuth();
  return {
    isSignedIn: !!isSignedIn,
    getToken: async () => {
      const token = await getToken();
      if (!token) throw new Error('Not authenticated');
      return token;
    },
  };
}

export function useBodyProfile() {
  const { getToken, isSignedIn } = useToken();
  return useQuery({
    queryKey: KEY,
    queryFn: () => getToken().then(fetchBodyProfile),
    enabled: isSignedIn,
    staleTime: 60 * 1000,
    retry: 2,
  });
}

export function useCreateBodyMark() {
  const { getToken } = useToken();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Parameters<typeof createBodyMark>[1]) =>
      getToken().then((t) => createBodyMark(t, payload)),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteBodyMark() {
  const { getToken } = useToken();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => getToken().then((t) => deleteBodyMark(t, id)),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useCreateAllergy() {
  const { getToken } = useToken();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Omit<Allergy, 'id' | 'isActive'>) =>
      getToken().then((t) => createAllergy(t, payload)),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteAllergy() {
  const { getToken } = useToken();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => getToken().then((t) => deleteAllergy(t, id)),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useCreateChronicCondition() {
  const { getToken } = useToken();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (
      payload: Omit<ChronicCondition, 'id' | 'isActive' | 'photos'> & { photos?: string[] },
    ) => getToken().then((t) => createChronicCondition(t, payload)),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteChronicCondition() {
  const { getToken } = useToken();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => getToken().then((t) => deleteChronicCondition(t, id)),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useCreateVaccination() {
  const { getToken } = useToken();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Omit<Vaccination, 'id'>) =>
      getToken().then((t) => createVaccination(t, payload)),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteVaccination() {
  const { getToken } = useToken();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => getToken().then((t) => deleteVaccination(t, id)),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useCreateSubstance() {
  const { getToken } = useToken();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Parameters<typeof createSubstance>[1]) =>
      getToken().then((t) => createSubstance(t, payload)),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteSubstance() {
  const { getToken } = useToken();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => getToken().then((t) => deleteSubstance(t, id)),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateBodyMark() {
  const { getToken } = useToken();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { id: string; payload: Parameters<typeof updateBodyMark>[2] }) =>
      getToken().then((t) => updateBodyMark(t, args.id, args.payload)),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateAllergy() {
  const { getToken } = useToken();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { id: string; payload: Parameters<typeof updateAllergy>[2] }) =>
      getToken().then((t) => updateAllergy(t, args.id, args.payload)),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateChronicCondition() {
  const { getToken } = useToken();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { id: string; payload: Parameters<typeof updateChronicCondition>[2] }) =>
      getToken().then((t) => updateChronicCondition(t, args.id, args.payload)),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useCreateHealthEvent() {
  const { getToken } = useToken();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Parameters<typeof createHealthEvent>[1]) =>
      getToken().then((t) => createHealthEvent(t, payload)),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteHealthEvent() {
  const { getToken } = useToken();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => getToken().then((t) => deleteHealthEvent(t, id)),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateHealthEvent() {
  const { getToken } = useToken();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { id: string; payload: Parameters<typeof updateHealthEvent>[2] }) =>
      getToken().then((t) => updateHealthEvent(t, args.id, args.payload)),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateVaccination() {
  const { getToken } = useToken();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { id: string; payload: Parameters<typeof updateVaccination>[2] }) =>
      getToken().then((t) => updateVaccination(t, args.id, args.payload)),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateSubstance() {
  const { getToken } = useToken();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { id: string; payload: Parameters<typeof updateSubstance>[2] }) =>
      getToken().then((t) => updateSubstance(t, args.id, args.payload)),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpsertEmergencyInfo() {
  const { getToken } = useToken();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<EmergencyInfo>) =>
      getToken().then((t) => upsertEmergencyInfo(t, payload)),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useCreateSurgery() {
  const { getToken } = useToken();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Parameters<typeof createSurgery>[1]) =>
      getToken().then((t) => createSurgery(t, payload)),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useCreateFamilyHistory() {
  const { getToken } = useToken();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Parameters<typeof createFamilyHistory>[1]) =>
      getToken().then((t) => createFamilyHistory(t, payload)),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useCreateChildhoodIllness() {
  const { getToken } = useToken();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Parameters<typeof createChildhoodIllness>[1]) =>
      getToken().then((t) => createChildhoodIllness(t, payload)),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpsertVisionHearing() {
  const { getToken } = useToken();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<VisionHearing>) =>
      getToken().then((t) => upsertVisionHearing(t, payload)),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpsertDentalHealth() {
  const { getToken } = useToken();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<DentalHealth>) =>
      getToken().then((t) => upsertDentalHealth(t, payload)),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpsertLifeState() {
  const { getToken } = useToken();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<LifeState>) =>
      getToken().then((t) => upsertLifeState(t, payload)),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpsertPhysicalProfile() {
  const { getToken } = useToken();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<PhysicalProfile>) =>
      getToken().then((t) => upsertPhysicalProfile(t, payload)),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useBodyCommand() {
  const { getToken } = useToken();
  const qc = useQueryClient();
  // Aktif AbortController ref'i — kullanıcı yeni mesaj attığında öncekini iptal et.
  const activeControllerRef = useRef<AbortController | null>(null);

  return useMutation({
    mutationFn: async (args: {
      message: string;
      conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
    }) => {
      // Önceki çağrı varsa iptal et — kullanıcı hızlı 2 mesaj attıysa
      // sadece sonuncusunun cevabı gelsin.
      if (activeControllerRef.current) {
        activeControllerRef.current.abort();
      }
      const ac = new AbortController();
      activeControllerRef.current = ac;
      try {
        const token = await getToken();
        return await sendBodyCommand(token, args.message, args.conversationHistory, ac.signal);
      } finally {
        if (activeControllerRef.current === ac) {
          activeControllerRef.current = null;
        }
      }
    },
    // Geçici network hatası (timeout, 5xx) için 1 retry — abort'ta retry yapılmaz.
    retry: (failureCount, error: any) => {
      if (failureCount >= 1) return false;
      // Abort'ta retry yok
      if (error?.code === 'ERR_CANCELED' || error?.name === 'CanceledError') return false;
      return true;
    },
    retryDelay: 1500,
    onSuccess: (data) => {
      // AI bir şey eklediyse profili invalidate et
      if (data.action && data.action.type !== 'asked') {
        qc.invalidateQueries({ queryKey: KEY });
      }
    },
  });
}

// ─────────────── Blood Work ───────────────

const BLOOD_KEY = ['blood', 'work'] as const;

export function useBloodWork() {
  const { getToken, isSignedIn } = useToken();
  return useQuery({
    queryKey: BLOOD_KEY,
    enabled: isSignedIn,
    queryFn: async () => {
      const token = await getToken();
      return fetchBloodWork(token);
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateBloodWork() {
  const { getToken } = useToken();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { [key: string]: number | null | string | undefined }) => {
      const token = await getToken();
      return createBloodWork(token, payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: BLOOD_KEY });
    },
  });
}

export function useDeleteBloodWork() {
  const { getToken } = useToken();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const token = await getToken();
      return deleteBloodWork(token, id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: BLOOD_KEY });
    },
  });
}

// ─────────────── Calendar ───────────────

export function useCalendarEvents(from: string, to: string) {
  const { getToken, isSignedIn } = useToken();
  return useQuery({
    queryKey: ['calendar', 'events', from, to] as const,
    enabled: isSignedIn && !!from && !!to,
    queryFn: async () => {
      const token = await getToken();
      return fetchCalendarEvents(token, from, to);
    },
    staleTime: 60_000,
  });
}

// Re-export types for components
export type {
  CalendarEvent,
  CalendarEventType,
  Allergy,
  BodyMark,
  ChildhoodIllnessItem,
  ChronicCondition,
  HealthEvent,
  HealthEventType,
  DentalHealth,
  EmergencyInfo,
  FamilyHistoryItem,
  LifeState,
  PhysicalProfile,
  Substance,
  Surgery,
  Vaccination,
  VisionHearing,
  BloodWorkRecord,
  BloodWorkAnalysis,
};

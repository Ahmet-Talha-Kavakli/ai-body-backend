import axios from 'axios';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

function client(token: string, timeoutMs: number = 20_000) {
  return axios.create({
    baseURL: BASE_URL,
    timeout: timeoutMs,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });
}

// AI komut endpoint'i 2 OpenAI roundtrip yapabilir — backend total timeout 35s.
// Mobile axios timeout buffer dahil 40s olmalı ki backend graceful 200 cevabını
// alıp kullanıcıya gösterebilsin.
const AI_COMMAND_TIMEOUT_MS = 40_000;

// ─────────────── Types ───────────────

export type BloodType = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';

export type BodyMark = {
  id: string;
  region: string;
  side: 'left' | 'right' | null;
  type: 'injury' | 'pain' | 'scar' | 'missing' | 'surgery' | 'tightness' | 'chronic_region';
  severity: number;
  startDate: string;
  endDate: string | null;
  note: string;
  isActive: boolean;
  photos: string[];
};

export type Allergy = {
  id: string;
  name: string;
  category: 'drug' | 'food' | 'environmental' | 'contact' | 'insect' | 'other';
  severity: 'mild' | 'moderate' | 'severe' | 'anaphylactic';
  reactionType: string | null;
  diagnosedAt: string | null;
  hasEpiPen: boolean;
  isActive: boolean;
  note: string;
};

export type ChronicCondition = {
  id: string;
  name: string;
  category: string;
  severity: 'mild' | 'moderate' | 'severe';
  status: 'active' | 'remission' | 'resolved';
  region: string | null;
  diagnosedAt: string | null;
  doctorNote: string;
  nextCheckup: string | null;
  photos: string[];
  isActive: boolean;
};

export type Vaccination = {
  id: string;
  name: string;
  doseNumber: number;
  administeredAt: string;
  nextDoseAt: string | null;
  notes: string;
  batchNumber: string | null;
};

export type Surgery = {
  id: string;
  name: string;
  performedAt: string;
  region: string | null;
  hospital: string | null;
  surgeon: string | null;
  recoveryNotes: string;
  photos: string[];
  isActive: boolean;
};

export type SubstanceType =
  | 'smoking'
  | 'alcohol'
  | 'caffeine'
  | 'vape'
  | 'chewing_tobacco'
  | 'cannabis'
  | 'other';
export type SubstanceStatus = 'active' | 'quitting' | 'quit';
export type SubstanceFrequency = 'daily' | 'weekly' | 'occasional' | 'rarely';

export type Substance = {
  id: string;
  type: SubstanceType;
  status: SubstanceStatus;
  frequency: SubstanceFrequency | null;
  amountPerDay: number | null;
  unit: string | null;
  startedAt: string | null;
  quitDate: string | null;
  note: string;
  isActive: boolean;
};

export type EmergencyInfo = {
  bloodType: BloodType | null;
  isOrganDonor: boolean;
  lastBloodDonation: string | null;
  emergencyContactName: string | null;
  emergencyContactRelation: string | null;
  emergencyContactPhone: string | null;
  insuranceProvider: string | null;
  familyDoctor: string | null;
  nearestHospital: string | null;
};

export type FamilyHistoryItem = {
  id: string;
  relation: string;
  conditionName: string;
  ageAtDiagnosis: number | null;
  notes: string;
};

export type ChildhoodIllnessItem = {
  id: string;
  name: string;
  hadIllness: boolean;
  ageAtIllness: number | null;
  notes: string;
};

export type VisionHearing = {
  leftEyePower: number | null;
  rightEyePower: number | null;
  hasAstigmatism: boolean;
  usesContactLenses: boolean;
  lastEyeExam: string | null;
  hearingLossLeft: boolean;
  hearingLossRight: boolean;
  usesHearingAid: boolean;
  lastHearingExam: string | null;
};

export type DentalHealth = {
  hasImplants: boolean;
  hasFillings: boolean;
  hasRootCanal: boolean;
  hasOrthodontics: boolean;
  usesNightGuard: boolean;
  lastCheckup: string | null;
  notes: string;
};

export type LifeState = {
  isPregnant: boolean;
  pregnancyWeek: number | null;
  dueDate: string | null;
  isBreastfeeding: boolean;
  hasDisability: boolean;
  disabilityType: string | null;
  accessibilityModeEnabled: boolean;
};

export type PhysicalProfile = {
  somatotype: string | null;
  dominantHand: string | null;
  hasHypoglycemia: boolean;
  hypoglycemiaNotes: string;
  hasFaintingHistory: boolean;
  faintingNotes: string;
  peakFlowMlMin: number | null;
  medicationSensitivities: string[];
  notes: string;
};

export type HealthEventType =
  | 'diarrhea'
  | 'constipation'
  | 'migraine'
  | 'headache'
  | 'nausea'
  | 'fever'
  | 'cough'
  | 'dizziness'
  | 'flu'
  | 'stomachache'
  | 'back_pain_episode'
  | 'allergic_reaction'
  | 'fatigue'
  | 'other';

export type HealthEvent = {
  id: string;
  type: HealthEventType;
  customName?: string | null;
  severity: number;
  startDate: string;
  endDate?: string | null;
  triggers: string[];
  treatments: string[];
  note: string;
  isActive: boolean;
};

export type BodyProfile = {
  marks: BodyMark[];
  allergies: Allergy[];
  healthEvents: HealthEvent[];
  chronicConditions: ChronicCondition[];
  vaccinations: Vaccination[];
  surgeries: Surgery[];
  familyHistory: FamilyHistoryItem[];
  childhoodIllnesses: ChildhoodIllnessItem[];
  visionHearing: VisionHearing | null;
  dental: DentalHealth | null;
  lifeState: LifeState | null;
  physicalProfile: PhysicalProfile | null;
  emergencyInfo: EmergencyInfo | null;
  substances: Substance[];
};

export type BodyCommandResponse = {
  reply: string;
  action?: {
    type: 'added' | 'updated' | 'deleted' | 'asked';
    summary: string;
    recordId?: string;
  };
};

// ─────────────── Aggregate ───────────────

export async function fetchBodyProfile(token: string): Promise<BodyProfile> {
  const { data } = await client(token).get<BodyProfile>('/api/body/profile');
  return data;
}

// ─────────────── Body Marks ───────────────

export async function createBodyMark(
  token: string,
  payload: Omit<BodyMark, 'id' | 'isActive' | 'endDate' | 'photos'> & {
    photos?: string[];
  },
): Promise<BodyMark> {
  const { data } = await client(token).post<BodyMark>('/api/body/marks', payload);
  return data;
}

export async function deleteBodyMark(token: string, id: string): Promise<void> {
  await client(token).delete(`/api/body/marks/${id}`);
}

export async function updateBodyMark(
  token: string,
  id: string,
  payload: Partial<Omit<BodyMark, 'id'>>,
): Promise<BodyMark> {
  const { data } = await client(token).patch<{ mark: BodyMark }>(`/api/body/marks/${id}`, payload);
  return data.mark;
}

// ─────────────── Allergies ───────────────

export async function createAllergy(
  token: string,
  payload: Omit<Allergy, 'id' | 'isActive'>,
): Promise<Allergy> {
  const { data } = await client(token).post<Allergy>('/api/body/allergies', payload);
  return data;
}

export async function deleteAllergy(token: string, id: string): Promise<void> {
  await client(token).delete(`/api/body/allergies/${id}`);
}

export async function updateAllergy(
  token: string,
  id: string,
  payload: Partial<Omit<Allergy, 'id'>>,
): Promise<Allergy> {
  const { data } = await client(token).patch<{ allergy: Allergy }>(
    `/api/body/allergies/${id}`,
    payload,
  );
  return data.allergy;
}

// ─────────────── Health Events ───────────────

export async function createHealthEvent(
  token: string,
  payload: Omit<HealthEvent, 'id' | 'isActive'>,
): Promise<HealthEvent> {
  const { data } = await client(token).post<HealthEvent>('/api/body/health-events', payload);
  return data;
}

export async function deleteHealthEvent(token: string, id: string): Promise<void> {
  await client(token).delete(`/api/body/health-events/${id}`);
}

export async function updateHealthEvent(
  token: string,
  id: string,
  payload: Partial<Omit<HealthEvent, 'id'>>,
): Promise<HealthEvent> {
  const { data } = await client(token).patch<{ healthEvent: HealthEvent }>(
    `/api/body/health-events/${id}`,
    payload,
  );
  return data.healthEvent;
}

// ─────────────── Chronic Conditions ───────────────

export async function createChronicCondition(
  token: string,
  payload: Omit<ChronicCondition, 'id' | 'isActive' | 'photos'> & { photos?: string[] },
): Promise<ChronicCondition> {
  const { data } = await client(token).post<ChronicCondition>(
    '/api/body/chronic-conditions',
    payload,
  );
  return data;
}

export async function deleteChronicCondition(token: string, id: string): Promise<void> {
  await client(token).delete(`/api/body/chronic-conditions/${id}`);
}

export async function updateChronicCondition(
  token: string,
  id: string,
  payload: Partial<Omit<ChronicCondition, 'id'>>,
): Promise<ChronicCondition> {
  const { data } = await client(token).patch<{ condition: ChronicCondition }>(
    `/api/body/chronic-conditions/${id}`,
    payload,
  );
  return data.condition;
}

// ─────────────── Vaccinations ───────────────

export async function createVaccination(
  token: string,
  payload: Omit<Vaccination, 'id'>,
): Promise<Vaccination> {
  const { data } = await client(token).post<Vaccination>('/api/body/vaccinations', payload);
  return data;
}

export async function deleteVaccination(token: string, id: string): Promise<void> {
  await client(token).delete(`/api/body/vaccinations/${id}`);
}

export async function updateVaccination(
  token: string,
  id: string,
  payload: Partial<Omit<Vaccination, 'id'>>,
): Promise<Vaccination> {
  const { data } = await client(token).patch<{ vaccination: Vaccination }>(
    `/api/body/vaccinations/${id}`,
    payload,
  );
  return data.vaccination;
}

// ─────────────── Substances ───────────────

export async function createSubstance(
  token: string,
  payload: Omit<Substance, 'id' | 'isActive' | 'startedAt' | 'quitDate'> & {
    startedAt?: string | null;
    quitDate?: string | null;
  },
): Promise<Substance> {
  const { data } = await client(token).post<{ substance: Substance }>(
    '/api/body/substances',
    payload,
  );
  return data.substance;
}

export async function deleteSubstance(token: string, id: string): Promise<void> {
  await client(token).delete(`/api/body/substances/${id}`);
}

export async function updateSubstance(
  token: string,
  id: string,
  payload: Partial<Omit<Substance, 'id'>>,
): Promise<Substance> {
  const { data } = await client(token).patch<{ substance: Substance }>(
    `/api/body/substances/${id}`,
    payload,
  );
  return data.substance;
}

// ─────────────── Emergency Info (singleton, upsert) ───────────────

export async function upsertEmergencyInfo(
  token: string,
  payload: Partial<EmergencyInfo>,
): Promise<EmergencyInfo> {
  const { data } = await client(token).post<EmergencyInfo>('/api/body/emergency-info', payload);
  return data;
}

// ─────────────── Surgeries ───────────────

export async function createSurgery(
  token: string,
  payload: {
    name: string;
    performedAt: string;
    region?: string | null;
    hospital?: string | null;
    surgeon?: string | null;
    recoveryNotes?: string;
    photos?: string[];
  },
): Promise<Surgery> {
  const { data } = await client(token).post<{ surgery: Surgery }>('/api/body/surgeries', payload);
  return data.surgery;
}

// ─────────────── Family History ───────────────

export async function createFamilyHistory(
  token: string,
  payload: {
    relation: string;
    conditionName: string;
    ageAtDiagnosis?: number | null;
    notes?: string;
  },
): Promise<FamilyHistoryItem> {
  const { data } = await client(token).post<{ item: FamilyHistoryItem }>(
    '/api/body/family-history',
    payload,
  );
  return data.item;
}

// ─────────────── Childhood Illnesses ───────────────

export async function createChildhoodIllness(
  token: string,
  payload: {
    name: string;
    hadIllness?: boolean;
    ageAtIllness?: number | null;
    notes?: string;
  },
): Promise<ChildhoodIllnessItem> {
  const { data } = await client(token).post<{ item: ChildhoodIllnessItem }>(
    '/api/body/childhood-illnesses',
    payload,
  );
  return data.item;
}

// ─────────────── Vision & Hearing (singleton, upsert) ───────────────

export async function upsertVisionHearing(
  token: string,
  payload: Partial<VisionHearing>,
): Promise<VisionHearing> {
  const { data } = await client(token).post<{ data: VisionHearing }>(
    '/api/body/vision-hearing',
    payload,
  );
  return data.data;
}

// ─────────────── Dental Health (singleton, upsert) ───────────────

export async function upsertDentalHealth(
  token: string,
  payload: Partial<DentalHealth>,
): Promise<DentalHealth> {
  const { data } = await client(token).post<{ data: DentalHealth }>('/api/body/dental', payload);
  return data.data;
}

// ─────────────── Life State (singleton, upsert) ───────────────

export async function upsertLifeState(
  token: string,
  payload: Partial<LifeState>,
): Promise<LifeState> {
  const { data } = await client(token).post<{ data: LifeState }>('/api/body/life-state', payload);
  return data.data;
}

// ─────────────── Physical Profile (singleton, upsert) ───────────────

export async function upsertPhysicalProfile(
  token: string,
  payload: Partial<PhysicalProfile>,
): Promise<PhysicalProfile> {
  const { data } = await client(token).post<{ data: PhysicalProfile }>(
    '/api/body/physical-profile',
    payload,
  );
  return data.data;
}

// ─────────────── Blood Work ───────────────

export type BloodWorkParam = {
  key: string;
  label: string;
  value: number | null;
  unit: string;
  min?: number;
  max?: number;
};

export type BloodWorkAnalysis = {
  healthScore: number;
  alerts: string[];
  recommendations: string[];
};

export type BloodWorkRecord = {
  id: string;
  uploadedAt: string;
  results: Record<string, number | string>;
  analysis: BloodWorkAnalysis;
};

export async function fetchBloodWork(token: string): Promise<BloodWorkRecord[]> {
  const { data } = await client(token).get<{ records: BloodWorkRecord[] }>('/api/blood-work');
  return data.records;
}

export async function createBloodWork(
  token: string,
  payload: { [key: string]: number | null | string | undefined },
): Promise<{ id: string; analysis: BloodWorkAnalysis }> {
  const { data } = await client(token).post<{ id: string; analysis: BloodWorkAnalysis }>(
    '/api/blood-work',
    payload,
  );
  return data;
}

export async function deleteBloodWork(token: string, id: string): Promise<void> {
  await client(token).delete(`/api/blood-work?id=${id}`);
}

// ─────────────── Calendar ───────────────

export type CalendarEventType =
  | 'medication_dose'
  | 'illness'
  | 'chronic_checkup'
  | 'vaccine'
  | 'blood_test'
  | 'body_mark'
  | 'surgery';

export type CalendarEvent = {
  id: string;
  type: CalendarEventType;
  title: string;
  subtitle?: string;
  startDate: string;
  endDate?: string | null;
  timeOfDay?: string | null;
  color: string;
  icon: string;
  sourceType: string;
  sourceId: string;
  note?: string;
};

export async function fetchCalendarEvents(
  token: string,
  from: string,
  to: string,
): Promise<CalendarEvent[]> {
  const { data } = await client(token).get<{ events: CalendarEvent[] }>(`/api/calendar/events`, {
    params: { from, to },
  });
  return data.events ?? [];
}

// ─────────────── AI Body Command ───────────────

export async function sendBodyCommand(
  token: string,
  message: string,
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>,
  signal?: AbortSignal,
): Promise<BodyCommandResponse> {
  const { data } = await client(token, AI_COMMAND_TIMEOUT_MS).post<BodyCommandResponse>(
    '/api/ai/body-command',
    { message, conversationHistory },
    { signal },
  );
  return data;
}

// ─────────────── AI Nutrition Command ───────────────

export type NutritionCommandResponse = {
  reply: string;
  action?: {
    type: string; // tool name veya 'asked'
  };
};

export async function sendNutritionCommand(
  token: string,
  message: string,
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>,
  signal?: AbortSignal,
): Promise<NutritionCommandResponse> {
  const { data } = await client(token, AI_COMMAND_TIMEOUT_MS).post<NutritionCommandResponse>(
    '/api/ai/nutrition-command',
    { message, conversationHistory },
    { signal },
  );
  return data;
}

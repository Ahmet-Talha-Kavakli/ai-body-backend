// Local-only types for the Vücut/Tıbbi Profil sheets.
// Backend wiring happens later — names mirror schema fields.

export type Severity = 1 | 2 | 3 | 4;
export const SEVERITY_LABELS: Record<Severity, string> = {
  1: 'Hafif',
  2: 'Orta',
  3: 'Ciddi',
  4: 'Çok ciddi',
};

export const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', '0+', '0-'] as const;
export type BloodType = (typeof BLOOD_TYPES)[number];

export const ALLERGY_CATEGORIES = ['İlaç', 'Gıda', 'Çevresel', 'Temas', 'Böcek', 'Diğer'] as const;
export type AllergyCategory = (typeof ALLERGY_CATEGORIES)[number];

export const ALLERGY_SEVERITIES = ['Hafif', 'Orta', 'Ciddi', 'Anaflaktik'] as const;
export type AllergySeverity = (typeof ALLERGY_SEVERITIES)[number];

export type Allergy = {
  id: string;
  name: string;
  category: AllergyCategory;
  severity: AllergySeverity;
  hasEpipen: boolean;
  note?: string;
};

export type Vaccine = {
  id: string;
  name: string;
  administeredAt: string; // YYYY-MM-DD
  dose?: number;
  notes?: string;
};

export const CONDITION_CATEGORIES = [
  'Metabolik',
  'Kardiyovasküler',
  'Solunum',
  'Sindirim',
  'Kas-iskelet',
  'Nörolojik',
  'Otoimmün',
  'Hormonal',
  'Kan',
  'Mental',
  'Diğer',
] as const;
export type ConditionCategory = (typeof CONDITION_CATEGORIES)[number];

export const CONDITION_STATUSES = ['Aktif', 'Remisyon', 'İyileşti'] as const;
export type ConditionStatus = (typeof CONDITION_STATUSES)[number];

export type ChronicCondition = {
  id: string;
  name: string;
  category: ConditionCategory;
  severity: Severity;
  status: ConditionStatus;
  region?: string;
  note?: string;
};

export const REGION_MARK_TYPES = [
  { id: 'injury', label: 'Sakatlık' },
  { id: 'pain', label: 'Ağrı' },
  { id: 'scar', label: 'İz' },
  { id: 'missing', label: 'Eksik' },
  { id: 'surgery', label: 'Ameliyat' },
  { id: 'tightness', label: 'Kas tutulması' },
] as const;
export type RegionMarkType = (typeof REGION_MARK_TYPES)[number]['id'];

export type RegionMarkPayload = {
  type: RegionMarkType;
  severity: Severity;
  startDate: string;
  note?: string;
};

// ─── Substances / Bağımlılıklar ───────────────────────────────────────────
export const SUBSTANCE_TYPES = [
  { id: 'smoking', label: 'Sigara', icon: '🚬' },
  { id: 'alcohol', label: 'Alkol', icon: '🍷' },
  { id: 'caffeine', label: 'Kafein', icon: '☕️' },
  { id: 'vape', label: 'Vape', icon: '💨' },
  { id: 'chewing_tobacco', label: 'Çiğneme tütünü', icon: '🌿' },
  { id: 'cannabis', label: 'Esrar', icon: '🌱' },
  { id: 'other', label: 'Diğer', icon: '⚫️' },
] as const;
export type SubstanceTypeId = (typeof SUBSTANCE_TYPES)[number]['id'];

export const SUBSTANCE_STATUSES = ['Devam ediyor', 'Bırakıyor', 'Bıraktı'] as const;
export type SubstanceStatusLabel = (typeof SUBSTANCE_STATUSES)[number];

export const SUBSTANCE_FREQUENCIES = ['Günlük', 'Haftalık', 'Ara sıra', 'Nadiren'] as const;
export type SubstanceFrequencyLabel = (typeof SUBSTANCE_FREQUENCIES)[number];

export type SubstanceUI = {
  id: string;
  type: SubstanceTypeId;
  status: SubstanceStatusLabel;
  frequency?: SubstanceFrequencyLabel;
  amountPerDay?: number;
  unit?: string;
  note?: string;
};

// ─── Surgery ──────────────────────────────────────────────────────────────
export type SurgeryUI = {
  id: string;
  name: string;
  performedAt: string; // YYYY-MM-DD
  region?: string;
  hospital?: string;
  surgeon?: string;
  recoveryNotes?: string;
};

// ─── Family History ───────────────────────────────────────────────────────
export const FAMILY_RELATIONS = [
  { id: 'mother', label: 'Anne' },
  { id: 'father', label: 'Baba' },
  { id: 'sibling', label: 'Kardeş' },
  { id: 'maternal_grandmother', label: 'Anneanne' },
  { id: 'paternal_grandmother', label: 'Babaanne' },
  { id: 'grandfather', label: 'Dede' },
  { id: 'aunt_paternal', label: 'Hala' },
  { id: 'aunt_maternal', label: 'Teyze' },
  { id: 'uncle_paternal', label: 'Amca' },
  { id: 'uncle_maternal', label: 'Dayı' },
  { id: 'other', label: 'Diğer' },
] as const;
export type FamilyRelationId = (typeof FAMILY_RELATIONS)[number]['id'];

export type FamilyHistoryUI = {
  id: string;
  relation: FamilyRelationId;
  conditionName: string;
  ageAtDiagnosis?: number;
  notes?: string;
};

// ─── Vision & Hearing ─────────────────────────────────────────────────────
export type VisionHearingUI = {
  wearsGlasses: boolean;
  usesContactLenses: boolean;
  leftEyePower?: number;
  rightEyePower?: number;
  usesHearingAid: boolean;
  lastEyeExam?: string;
  notes?: string;
};

// ─── Dental Health ────────────────────────────────────────────────────────
export type DentalHealthUI = {
  lastCheckup?: string;
  hasOrthodontics: boolean;
  hasImplants: boolean;
  hasFillings: boolean;
  notes?: string;
};

// ─── Childhood Illness ────────────────────────────────────────────────────
export const CHILDHOOD_SEVERITIES = ['Hafif', 'Orta', 'Ciddi'] as const;
export type ChildhoodSeverityLabel = (typeof CHILDHOOD_SEVERITIES)[number];

export type ChildhoodIllnessUI = {
  id: string;
  name: string;
  ageAtIllness?: number;
  severity: ChildhoodSeverityLabel;
  hadComplications: boolean;
  notes?: string;
};

// ─── Life State ───────────────────────────────────────────────────────────
export type LifeStateUI = {
  isPregnant: boolean;
  pregnancyWeek?: number;
  isBreastfeeding: boolean;
  hasDisability: boolean;
  disabilityType?: string;
  notes?: string;
};

// ─── Physical Profile ─────────────────────────────────────────────────────
export const SOMATOTYPES = [
  { id: 'ectomorph', label: 'Ektomorf' },
  { id: 'mesomorph', label: 'Mezomorf' },
  { id: 'endomorph', label: 'Endomorf' },
  { id: 'unknown', label: 'Bilinmiyor' },
] as const;
export type SomatotypeId = (typeof SOMATOTYPES)[number]['id'];

export const DOMINANT_HANDS = [
  { id: 'right', label: 'Sağ' },
  { id: 'left', label: 'Sol' },
  { id: 'ambidextrous', label: 'İki elini de kullanır' },
] as const;
export type DominantHandId = (typeof DOMINANT_HANDS)[number]['id'];

export type PhysicalProfileUI = {
  somatotype: SomatotypeId;
  dominantHand: DominantHandId;
  sensitivities?: string;
  notes?: string;
};

export type QuickAddId =
  | 'blood'
  | 'emergency'
  | 'allergy'
  | 'medication'
  | 'vaccine'
  | 'condition'
  | 'substance'
  | 'surgery'
  | 'family'
  | 'vision'
  | 'dental'
  | 'childhood'
  | 'lifestate'
  | 'physical'
  | 'labwork'
  | 'illness';

export type CategoryRecord =
  | { kind: 'allergy'; data: Allergy }
  | { kind: 'vaccine'; data: Vaccine }
  | { kind: 'condition'; data: ChronicCondition };

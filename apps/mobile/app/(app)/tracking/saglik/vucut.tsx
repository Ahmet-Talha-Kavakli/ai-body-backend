import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Easing,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Body, { type ExtendedBodyPart, type Slug } from 'react-native-body-highlighter';
import {
  useBodyProfile,
  useCreateAllergy,
  useCreateBodyMark,
  useCreateChronicCondition,
  useCreateSubstance,
  useCreateVaccination,
  useDeleteAllergy,
  useDeleteBodyMark,
  useDeleteChronicCondition,
  useDeleteSubstance,
  useDeleteVaccination,
  useUpdateAllergy,
  useUpdateBodyMark,
  useUpdateChronicCondition,
  useUpdateSubstance,
  useUpdateVaccination,
  useUpsertEmergencyInfo,
  useCreateSurgery,
  useCreateFamilyHistory,
  useCreateChildhoodIllness,
  useUpsertVisionHearing,
  useUpsertDentalHealth,
  useUpsertLifeState,
  useUpsertPhysicalProfile,
  useBloodWork,
  useCreateBloodWork,
  useDeleteBloodWork,
  useCreateHealthEvent,
  useUpdateHealthEvent,
  useDeleteHealthEvent,
} from '../../../../src/hooks/useBodyData';
import type {
  Allergy as AllergyRecord,
  BodyMark as BodyMarkRecord,
  ChronicCondition as ChronicConditionRecord,
  Substance as SubstanceRecord,
  Vaccination as VaccinationRecord,
} from '../../../../src/api/body-client';
import { DetailEditSheet } from './components/DetailEditSheet';
import { RegionMarkSheet } from './components/RegionMarkSheet';
import {
  AllergyAddSheet,
  BloodTypeSheet,
  BloodWorkAddSheet,
  HealthEventAddSheet,
  ChildhoodIllnessAddSheet,
  ChronicConditionAddSheet,
  DentalHealthSheet,
  EmergencyInfoSheet,
  FamilyHistoryAddSheet,
  LifeStateSheet,
  MedicationAddSheet,
  PhysicalProfileSheet,
  SubstanceAddSheet,
  SurgeryAddSheet,
  VaccineAddSheet,
  VisionHearingSheet,
} from './components/QuickAddSheets';
import { useUserStore } from '../../../../src/store/userStore';
import { MedicalCategorySheet, type CategoryRow } from './components/MedicalCategorySheet';
import type { BloodType, QuickAddId, RegionMarkPayload } from './components/types';

// ─── Design tokens ───────────────────────────────────────────────────────────
const ACCENT = '#FF2D55';
const BG = '#F2F2F7';
const CARD = '#FFFFFF';
const TEXT = '#1C1C1E';
const SUBTEXT = '#8E8E93';
const SEP = 'rgba(60,60,67,0.12)';

const SEVERITY_COLORS = ['#FFD60A', '#FF9F0A', '#FF3B30', '#FF1744'] as const;

// ─── TR → EN maps ────────────────────────────────────────────────────────────
const ALLERGY_CAT_MAP: Record<string, string> = {
  İlaç: 'drug',
  Gıda: 'food',
  Çevresel: 'environmental',
  Temas: 'contact',
  Böcek: 'insect',
  Diğer: 'other',
};
const ALLERGY_SEV_MAP: Record<string, string> = {
  Hafif: 'mild',
  Orta: 'moderate',
  Ciddi: 'severe',
  Anaflaktik: 'anaphylactic',
};
const COND_CAT_MAP: Record<string, string> = {
  Metabolik: 'metabolic',
  Kardiyovasküler: 'cardiovascular',
  Solunum: 'respiratory',
  Sindirim: 'digestive',
  'Kas-iskelet': 'musculoskeletal',
  Nörolojik: 'neurological',
  Otoimmün: 'autoimmune',
  Hormonal: 'hormonal',
  Kan: 'blood',
  Mental: 'mental',
  Diğer: 'other',
};
const COND_STATUS_MAP: Record<string, 'active' | 'remission' | 'resolved'> = {
  Aktif: 'active',
  Remisyon: 'remission',
  İyileşti: 'resolved',
};
const SEV_BACKEND: Record<number, 'mild' | 'moderate' | 'severe'> = {
  1: 'mild',
  2: 'mild',
  3: 'moderate',
  4: 'severe',
};

const SUB_STATUS_MAP: Record<string, 'active' | 'quitting' | 'quit'> = {
  'Devam ediyor': 'active',
  Bırakıyor: 'quitting',
  Bıraktı: 'quit',
};
const SUB_FREQ_MAP: Record<string, 'daily' | 'weekly' | 'occasional' | 'rarely'> = {
  Günlük: 'daily',
  Haftalık: 'weekly',
  'Ara sıra': 'occasional',
  Nadiren: 'rarely',
};
const SUB_LABELS: Record<string, string> = {
  smoking: 'Sigara',
  alcohol: 'Alkol',
  caffeine: 'Kafein',
  vape: 'Vape',
  chewing_tobacco: 'Tütün',
  cannabis: 'Esrar',
  other: 'Diğer',
};
const SUB_STATUS_LABELS: Record<string, string> = {
  active: 'Devam ediyor',
  quitting: 'Bırakıyor',
  quit: 'Bıraktı',
};

// ─── Region labels ────────────────────────────────────────────────────────────
const REGION_TR: Record<Slug, string> = {
  head: 'Baş',
  hair: 'Saç',
  neck: 'Boyun',
  trapezius: 'Yamuk Kası',
  chest: 'Göğüs',
  deltoids: 'Omuz',
  biceps: 'Pazı',
  triceps: 'Arka Kol',
  forearm: 'Ön Kol',
  hands: 'El',
  abs: 'Karın',
  obliques: 'Yan Karın',
  'upper-back': 'Üst Sırt',
  'lower-back': 'Alt Sırt',
  gluteal: 'Kalça',
  adductors: 'İç Bacak',
  quadriceps: 'Ön Bacak',
  hamstring: 'Arka Bacak',
  knees: 'Diz',
  calves: 'Baldır',
  tibialis: 'Ön Baldır',
  ankles: 'Bilek',
  feet: 'Ayak',
};

// ─── Static data ──────────────────────────────────────────────────────────────
const QUICK_ADD = [
  { id: 'blood', label: 'Kan grubu', icon: '🩸', tint: '#FF3B30' },
  { id: 'allergy', label: 'Alerji', icon: '⚠️', tint: '#FF9F0A' },
  { id: 'medication', label: 'İlaç', icon: '💊', tint: '#34C759' },
  { id: 'vaccine', label: 'Aşı', icon: '💉', tint: '#5AC8FA' },
  { id: 'condition', label: 'Rahatsızlık', icon: '📋', tint: '#AF52DE' },
  { id: 'substance', label: 'Bağımlılık', icon: '🚬', tint: '#8E8E93' },
  { id: 'surgery', label: 'Ameliyat', icon: '🩺', tint: '#FF2D55' },
  { id: 'family', label: 'Aile Geçmişi', icon: '👪', tint: '#5856D6' },
  { id: 'childhood', label: 'Çocukluk', icon: '🧒', tint: '#FFD60A' },
  { id: 'vision', label: 'Görme', icon: '👓', tint: '#007AFF' },
  { id: 'dental', label: 'Diş', icon: '🦷', tint: '#64D2FF' },
  { id: 'lifestate', label: 'Yaşam', icon: '🤰', tint: '#FF6482' },
  { id: 'physical', label: 'Fiziksel', icon: '🧬', tint: '#30D158' },
] as const;

const MEDICAL_CATS = [
  {
    id: 'emergency',
    icon: '🆘',
    tint: '#FF3B30',
    title: 'Acil Bilgiler',
    sub: 'Kan grubu, iletişim, donör',
  },
  { id: 'allergies', icon: '⚠️', tint: '#FF9F0A', title: 'Alerjiler', sub: 'Henüz eklenmedi' },
  {
    id: 'chronic',
    icon: '📋',
    tint: '#AF52DE',
    title: 'Kronik Rahatsızlıklar',
    sub: 'Henüz eklenmedi',
  },
  {
    id: 'medications',
    icon: '💊',
    tint: '#34C759',
    title: 'İlaçlar',
    sub: 'İlaç sayfasında yönet',
  },
  { id: 'vaccines', icon: '💉', tint: '#5AC8FA', title: 'Aşılar', sub: 'Henüz eklenmedi' },
  {
    id: 'surgeries',
    icon: '🩺',
    tint: '#FF2D55',
    title: 'Ameliyat Geçmişi',
    sub: 'Henüz eklenmedi',
  },
  { id: 'family', icon: '👪', tint: '#5856D6', title: 'Aile Geçmişi', sub: 'Henüz eklenmedi' },
  { id: 'vision', icon: '👓', tint: '#007AFF', title: 'Görme & İşitme', sub: 'Henüz eklenmedi' },
  { id: 'dental', icon: '🦷', tint: '#64D2FF', title: 'Diş Sağlığı', sub: 'Henüz eklenmedi' },
  {
    id: 'childhood',
    icon: '🧒',
    tint: '#FFD60A',
    title: 'Çocukluk Hastalıkları',
    sub: 'Henüz eklenmedi',
  },
  {
    id: 'lifestate',
    icon: '🤰',
    tint: '#FF6482',
    title: 'Yaşam Durumu',
    sub: 'Hamilelik, emzirme, engellilik',
  },
  {
    id: 'physical',
    icon: '🧬',
    tint: '#30D158',
    title: 'Fiziksel Profil',
    sub: 'Vücut tipi, hassasiyetler',
  },
  {
    id: 'substances',
    icon: '🚬',
    tint: '#8E8E93',
    title: 'Bağımlılıklar',
    sub: 'Sigara, alkol, kafein…',
  },
  {
    id: 'labwork',
    icon: '🧪',
    tint: '#FF6914',
    title: 'Kan Değerleri',
    sub: 'Hemoglobin, kolesterol, glukoz…',
  },
  {
    id: 'illness',
    icon: '🌡️',
    tint: '#FF453A',
    title: 'Hastalıklar',
    sub: 'İshal, migren, ateş, üşütme…',
  },
] as const;

// ─── Types ────────────────────────────────────────────────────────────────────
type Side = 'front' | 'back';
type Segment = 'body' | 'medical';

type LocalMark = {
  id: string;
  slug: Slug;
  side?: 'left' | 'right';
  type: 'injury' | 'pain' | 'scar' | 'missing' | 'surgery' | 'tightness';
  severity: 1 | 2 | 3 | 4;
  note?: string;
};

type DetailKind = 'allergy' | 'condition' | 'vaccine' | 'substance' | 'mark';
type DetailTarget =
  | { kind: 'allergy'; record: AllergyRecord }
  | { kind: 'condition'; record: ChronicConditionRecord }
  | { kind: 'vaccine'; record: VaccinationRecord }
  | { kind: 'substance'; record: SubstanceRecord }
  | { kind: 'mark'; record: BodyMarkRecord };

type Sheet =
  | { type: 'region'; slug: Slug; side?: 'left' | 'right'; label: string }
  | { type: 'quick'; id: QuickAddId }
  | { type: 'cat'; id: string }
  | { type: 'detail'; target: DetailTarget }
  | null;

// ─── Main screen ─────────────────────────────────────────────────────────────
export default function VucutRoute() {
  const insets = useSafeAreaInsets();
  const [segment, setSegment] = useState<Segment>('body');
  const [side, setSide] = useState<Side>('front');
  const [search, setSearch] = useState('');
  const [sheet, setSheet] = useState<Sheet>(null);

  // ─── Geçiş animasyonları ──────────────────────────────────────────────────
  const EASE_SMOOTH = Easing.bezier(0.22, 1, 0.36, 1);
  const segAnim = useRef(new Animated.Value(0)).current; // 0=body, 1=medical
  const bodyFade = useRef(new Animated.Value(1)).current; // body silüet opacity
  const bodyScale = useRef(new Animated.Value(1)).current; // body silüet scale
  const [renderedSide, setRenderedSide] = useState<Side>('front');

  useEffect(() => {
    Animated.timing(segAnim, {
      toValue: segment === 'body' ? 0 : 1,
      duration: 280,
      easing: EASE_SMOOTH,
      useNativeDriver: true,
    }).start();
  }, [segment]);

  // Ön ↔ Arka: fade out → side değiştir → fade in
  useEffect(() => {
    if (renderedSide === side) return;
    Animated.parallel([
      Animated.timing(bodyFade, {
        toValue: 0,
        duration: 160,
        useNativeDriver: true,
        easing: EASE_SMOOTH,
      }),
      Animated.timing(bodyScale, {
        toValue: 0.97,
        duration: 160,
        useNativeDriver: true,
        easing: EASE_SMOOTH,
      }),
    ]).start(() => {
      setRenderedSide(side);
      Animated.parallel([
        Animated.timing(bodyFade, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
          easing: EASE_SMOOTH,
        }),
        Animated.timing(bodyScale, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
          easing: EASE_SMOOTH,
        }),
      ]).start();
    });
  }, [side]);

  const bodyOpacity = segAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 0, 0] });
  const bodyTransX = segAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -30] });
  const medOpacity = segAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 0, 1] });
  const medTransX = segAnim.interpolate({ inputRange: [0, 1], outputRange: [30, 0] });

  // Gender from user profile store — drives Body silüet
  const userProfile = useUserStore((s) => s.profile);
  const bodyGender: 'male' | 'female' = userProfile?.gender === 'male' ? 'male' : 'female';

  const profileQ = useBodyProfile();
  const profile = profileQ.data;
  const createMark = useCreateBodyMark();
  const deleteMark = useDeleteBodyMark();
  const updateMark = useUpdateBodyMark();
  const createAlg = useCreateAllergy();
  const updateAlg = useUpdateAllergy();
  const deleteAlg = useDeleteAllergy();
  const createVax = useCreateVaccination();
  const updateVax = useUpdateVaccination();
  const deleteVax = useDeleteVaccination();
  const createCond = useCreateChronicCondition();
  const updateCond = useUpdateChronicCondition();
  const deleteCond = useDeleteChronicCondition();
  const createSub = useCreateSubstance();
  const updateSub = useUpdateSubstance();
  const deleteSub = useDeleteSubstance();
  const upsertEmerg = useUpsertEmergencyInfo();
  const createSurg = useCreateSurgery();
  const createFam = useCreateFamilyHistory();
  const createChild = useCreateChildhoodIllness();
  const upsertVision = useUpsertVisionHearing();
  const upsertDental = useUpsertDentalHealth();
  const upsertLife = useUpsertLifeState();
  const upsertPhys = useUpsertPhysicalProfile();
  const bloodWorkQ = useBloodWork();
  const createBW = useCreateBloodWork();
  const deleteBW = useDeleteBloodWork();
  const createHealthEvt = useCreateHealthEvent();
  const updateHealthEvt = useUpdateHealthEvent();
  const deleteHealthEvt = useDeleteHealthEvent();

  const marks = useMemo<LocalMark[]>(
    () =>
      (profile?.marks ?? []).map((m) => ({
        id: m.id,
        slug: m.region as Slug,
        side: m.side ?? undefined,
        type: m.type as LocalMark['type'],
        severity: Math.min(Math.max(m.severity, 1), 4) as 1 | 2 | 3 | 4,
        note: m.note || undefined,
      })),
    [profile?.marks],
  );

  const emergencyInfo = profile?.emergencyInfo ?? null;
  const bloodType = emergencyInfo?.bloodType ?? undefined;
  const allergyCnt = profile?.allergies.length ?? 0;
  const vaccineCnt = profile?.vaccinations.length ?? 0;
  const conditionCnt = profile?.chronicConditions.length ?? 0;
  const substanceCnt = profile?.substances?.length ?? 0;
  const surgeryCnt = profile?.surgeries?.length ?? 0;
  const familyCnt = profile?.familyHistory?.length ?? 0;
  const childhoodCnt = profile?.childhoodIllnesses?.length ?? 0;
  const visionData = profile?.visionHearing ?? null;
  const dentalData = profile?.dental ?? null;
  const lifeStateData = profile?.lifeState ?? null;
  const physicalData = profile?.physicalProfile ?? null;
  const bloodWorkList = bloodWorkQ.data ?? [];
  const bloodWorkCnt = bloodWorkList.length;
  const healthEvents = profile?.healthEvents ?? [];
  const activeIllnessCnt = healthEvents.filter((e) => e.isActive && !e.endDate).length;
  const illnessCnt = healthEvents.length;

  const bodyData = useMemo<ExtendedBodyPart[]>(() => {
    const map = new Map<string, ExtendedBodyPart>();
    for (const m of marks) {
      const key = `${m.slug}-${m.side ?? 'both'}`;
      const existing = map.get(key);
      const intensity = Math.max(existing?.intensity ?? 0, m.severity);
      map.set(key, {
        slug: m.slug,
        side: m.side,
        intensity,
        color: SEVERITY_COLORS[Math.min(intensity - 1, 3)],
      });
    }
    return Array.from(map.values());
  }, [marks]);

  const catRows = useMemo<Record<string, CategoryRow[]>>(() => {
    const RELATION_TR: Record<string, string> = {
      mother: 'Anne',
      father: 'Baba',
      sibling: 'Kardeş',
      maternal_grandmother: 'Anneanne',
      paternal_grandmother: 'Babaanne',
      grandfather: 'Dede',
      aunt_paternal: 'Hala',
      aunt_maternal: 'Teyze',
      uncle_paternal: 'Amca',
      uncle_maternal: 'Dayı',
      other: 'Diğer',
    };
    return {
      allergies: (profile?.allergies ?? []).map((a) => ({
        id: a.id,
        title: a.name,
        subtitle: `${a.category} · ${a.severity}${a.hasEpiPen ? ' · EpiPen' : ''}`,
      })),
      vaccines: (profile?.vaccinations ?? []).map((v) => ({
        id: v.id,
        title: v.name,
        subtitle: `${v.administeredAt.slice(0, 10)}${v.doseNumber > 1 ? ` · Doz ${v.doseNumber}` : ''}`,
      })),
      chronic: (profile?.chronicConditions ?? []).map((c) => ({
        id: c.id,
        title: c.name,
        subtitle: `${c.category} · ${c.status}`,
      })),
      substances: (profile?.substances ?? []).map((su) => ({
        id: su.id,
        title: SUB_LABELS[su.type] ?? su.type,
        subtitle: `${SUB_STATUS_LABELS[su.status] ?? su.status}${su.amountPerDay ? ` · ${su.amountPerDay} ${su.unit ?? ''}/gün`.trim() : ''}`,
      })),
      surgeries: (profile?.surgeries ?? []).map((s) => ({
        id: s.id,
        title: s.name,
        subtitle: `${s.performedAt.slice(0, 10)}${s.hospital ? ` · ${s.hospital}` : ''}`,
      })),
      family: (profile?.familyHistory ?? []).map((f) => ({
        id: f.id,
        title: f.conditionName,
        subtitle: `${RELATION_TR[f.relation] ?? f.relation}${f.ageAtDiagnosis ? ` · Tanı: ${f.ageAtDiagnosis} yaş` : ''}`,
      })),
      childhood: (profile?.childhoodIllnesses ?? []).map((c) => ({
        id: c.id,
        title: c.name,
        subtitle: c.ageAtIllness ? `${c.ageAtIllness} yaşında` : '—',
      })),
      vision: visionData
        ? [
            {
              id: 'vision-current',
              title: 'Görme & İşitme',
              subtitle:
                [
                  visionData.leftEyePower != null ? `Sol ${visionData.leftEyePower}` : null,
                  visionData.rightEyePower != null ? `Sağ ${visionData.rightEyePower}` : null,
                  visionData.usesContactLenses ? 'Lens' : null,
                  visionData.usesHearingAid ? 'İşitme cihazı' : null,
                ]
                  .filter(Boolean)
                  .join(' · ') || 'Kayıtlı',
            },
          ]
        : [],
      dental: dentalData
        ? [
            {
              id: 'dental-current',
              title: 'Diş Sağlığı',
              subtitle:
                [
                  dentalData.lastCheckup
                    ? `Son kontrol: ${dentalData.lastCheckup.slice(0, 10)}`
                    : null,
                  dentalData.hasOrthodontics ? 'Tel' : null,
                  dentalData.hasImplants ? 'İmplant' : null,
                  dentalData.hasFillings ? 'Dolgu' : null,
                ]
                  .filter(Boolean)
                  .join(' · ') || 'Kayıtlı',
            },
          ]
        : [],
      lifestate: lifeStateData
        ? [
            {
              id: 'lifestate-current',
              title: 'Yaşam Durumu',
              subtitle:
                [
                  lifeStateData.isPregnant
                    ? `Hamile${lifeStateData.pregnancyWeek ? ` · ${lifeStateData.pregnancyWeek}. hafta` : ''}`
                    : null,
                  lifeStateData.isBreastfeeding ? 'Emziriyor' : null,
                  lifeStateData.hasDisability ? 'Engellilik' : null,
                ]
                  .filter(Boolean)
                  .join(' · ') || 'Kayıtlı',
            },
          ]
        : [],
      physical: physicalData
        ? [
            {
              id: 'physical-current',
              title: 'Fiziksel Profil',
              subtitle:
                [physicalData.somatotype, physicalData.dominantHand].filter(Boolean).join(' · ') ||
                'Kayıtlı',
            },
          ]
        : [],
      labwork: bloodWorkList.map((r) => ({
        id: r.id,
        title: `Tahlil — ${r.uploadedAt.slice(0, 10)}`,
        subtitle: `Sağlık Skoru: ${r.analysis?.healthScore ?? '—'}/100${r.analysis?.alerts?.length ? ` · ${r.analysis.alerts.length} uyarı` : ''}`,
      })),
      illness: healthEvents.map((e) => {
        const ILLNESS_TR: Record<string, string> = {
          diarrhea: 'İshal',
          constipation: 'Kabızlık',
          migraine: 'Migren',
          headache: 'Baş ağrısı',
          nausea: 'Mide bulantısı',
          fever: 'Ateş',
          cough: 'Öksürük',
          dizziness: 'Baş dönmesi',
          flu: 'Üşütme/Grip',
          stomachache: 'Mide ağrısı',
          back_pain_episode: 'Bel ağrısı krizi',
          allergic_reaction: 'Alerjik reaksiyon',
          fatigue: 'Halsizlik',
          other: 'Diğer',
        };
        const name =
          e.type === 'other' && e.customName ? e.customName : (ILLNESS_TR[e.type] ?? e.type);
        const start = new Date(e.startDate);
        const end = e.endDate ? new Date(e.endDate) : null;
        const isActive = e.isActive && !e.endDate;
        let durationStr = '';
        if (end) {
          const diffMs = end.getTime() - start.getTime();
          const diffH = Math.floor(diffMs / (1000 * 60 * 60));
          const diffD = Math.floor(diffH / 24);
          durationStr = diffD > 0 ? `${diffD} gün` : `${Math.max(diffH, 1)} saat`;
        }
        const dateStr = `${String(start.getDate()).padStart(2, '0')}.${String(start.getMonth() + 1).padStart(2, '0')}`;
        const subtitle = isActive
          ? `Aktif · ${dateStr}'den beri`
          : `${durationStr || '—'} · ${dateStr}`;
        return { id: e.id, title: name, subtitle };
      }),
    };
  }, [
    profile?.allergies,
    profile?.vaccinations,
    profile?.chronicConditions,
    profile?.substances,
    profile?.surgeries,
    profile?.familyHistory,
    profile?.childhoodIllnesses,
    visionData,
    dentalData,
    lifeStateData,
    physicalData,
    bloodWorkList,
    healthEvents,
  ]);

  const filtered = useMemo(() => {
    if (!search.trim()) return MEDICAL_CATS;
    const q = search.toLowerCase();
    return MEDICAL_CATS.filter(
      (c) => c.title.toLowerCase().includes(q) || c.sub.toLowerCase().includes(q),
    );
  }, [search]);

  const close = () => setSheet(null);

  const handleBodyPress = (part: ExtendedBodyPart, pressedSide?: 'left' | 'right') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const slug = part.slug as Slug | undefined;
    if (!slug) return;
    setSheet({ type: 'region', slug, side: pressedSide, label: REGION_TR[slug] ?? slug });
  };

  const handleRegionSave = (payload: RegionMarkPayload) => {
    if (!sheet || sheet.type !== 'region') return;
    createMark.mutate({
      region: sheet.slug,
      side: sheet.side ?? null,
      type: payload.type,
      severity: payload.severity,
      startDate: payload.startDate,
      note: payload.note ?? '',
    });
    close();
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1, backgroundColor: BG }}
    >
      {/* ── Header ─────────────────────────────────────────────────── */}
      <View style={{ paddingTop: insets.top + 6, paddingHorizontal: 16, paddingBottom: 10 }}>
        <EmergencyCard
          info={emergencyInfo}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setSheet({ type: 'quick', id: 'emergency' });
          }}
        />
        <View style={{ height: 10 }} />
        <SegPicker
          value={segment}
          onChange={(s) => {
            if (s === segment) return;
            Haptics.selectionAsync();
            setSegment(s);
          }}
        />
      </View>

      {/* ── Segment görüntüleme (yatay slide + crossfade) ───────────── */}
      <View style={{ flex: 1, position: 'relative' }}>
        {/* Body view */}
        <Animated.View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            opacity: bodyOpacity,
            transform: [{ translateX: bodyTransX }],
          }}
          pointerEvents={segment === 'body' ? 'auto' : 'none'}
        >
          <ScrollView
            contentContainerStyle={{ paddingBottom: 180 }}
            showsVerticalScrollIndicator={false}
          >
            {/* Silüet */}
            <View
              style={{
                alignItems: 'center',
                justifyContent: 'center',
                paddingTop: 4,
                paddingBottom: 16,
                minHeight: 380,
              }}
            >
              <Animated.View
                style={{
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: bodyFade,
                  transform: [{ scale: bodyScale }],
                }}
              >
                <Body
                  data={bodyData}
                  gender={bodyGender}
                  side={renderedSide}
                  scale={1.5}
                  colors={SEVERITY_COLORS as unknown as string[]}
                  onBodyPartPress={handleBodyPress}
                  border="#D6D6DC"
                  defaultFill="#F5E5DC"
                  defaultStroke="#D6D6DC"
                  defaultStrokeWidth={0.6}
                />
              </Animated.View>

              {/* Profil yüklenirken skeleton + spinner overlay */}
              {profileQ.isLoading && (
                <View style={S.loadingOverlay} pointerEvents="none">
                  <BodyLoading />
                </View>
              )}
            </View>

            {/* Ön / Arka — silüetin altında */}
            <View style={{ alignItems: 'center', marginTop: 4 }}>
              <SidePicker
                value={side}
                onChange={(s) => {
                  if (s === side) return;
                  Haptics.selectionAsync();
                  setSide(s);
                }}
              />
            </View>

            {/* Hızlı ekle */}
            <Text style={S.secLabel}>HIZLI EKLE</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 4, gap: 10 }}
            >
              {QUICK_ADD.map((q) => (
                <Chip
                  key={q.id}
                  icon={q.icon}
                  label={q.label}
                  tint={q.tint}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    setSheet({ type: 'quick', id: q.id as QuickAddId });
                  }}
                />
              ))}
            </ScrollView>

            {/* İşaretler — Apple inset grouped list */}
            {marks.length > 0 && (
              <>
                <Text
                  allowFontScaling={false}
                  style={[S.secLabel, { marginTop: 20, paddingHorizontal: 32 }]}
                >
                  İŞARETLER ({marks.length})
                </Text>
                <View style={S.markList}>
                  {marks.map((m, i) => (
                    <MarkRow
                      key={m.id}
                      mark={m}
                      isLast={i === marks.length - 1}
                      onPress={() => {
                        const rec = profile?.marks.find((x) => x.id === m.id);
                        if (!rec) return;
                        Haptics.selectionAsync();
                        setSheet({ type: 'detail', target: { kind: 'mark', record: rec } });
                      }}
                    />
                  ))}
                </View>
              </>
            )}
          </ScrollView>
        </Animated.View>

        {/* Medical view */}
        <Animated.View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            opacity: medOpacity,
            transform: [{ translateX: medTransX }],
          }}
          pointerEvents={segment === 'medical' ? 'auto' : 'none'}
        >
          <ScrollView
            contentContainerStyle={{ paddingBottom: 180 }}
            showsVerticalScrollIndicator={false}
          >
            {/* Arama */}
            <View style={{ paddingHorizontal: 16, marginTop: 4, marginBottom: 12 }}>
              <View style={S.searchRow}>
                <Text style={{ fontSize: 15, color: SUBTEXT, marginRight: 6 }}>🔍</Text>
                <TextInput
                  placeholder="Tıbbi profilde ara"
                  placeholderTextColor={SUBTEXT}
                  value={search}
                  onChangeText={setSearch}
                  style={{ flex: 1, fontSize: 15, color: TEXT }}
                  returnKeyType="search"
                  allowFontScaling={false}
                />
              </View>
            </View>

            {/* Kategori listesi */}
            <View style={{ paddingHorizontal: 16, gap: 8 }}>
              {filtered.map((c) => {
                const sub =
                  c.id === 'emergency'
                    ? bloodType
                      ? `Kan grubu: ${bloodType}`
                      : c.sub
                    : c.id === 'allergies'
                      ? allergyCnt
                        ? `${allergyCnt} kayıt`
                        : c.sub
                      : c.id === 'vaccines'
                        ? vaccineCnt
                          ? `${vaccineCnt} kayıt`
                          : c.sub
                        : c.id === 'chronic'
                          ? conditionCnt
                            ? `${conditionCnt} kayıt`
                            : c.sub
                          : c.id === 'substances'
                            ? substanceCnt
                              ? `${substanceCnt} kayıt`
                              : c.sub
                            : c.id === 'surgeries'
                              ? surgeryCnt
                                ? `${surgeryCnt} kayıt`
                                : c.sub
                              : c.id === 'family'
                                ? familyCnt
                                  ? `${familyCnt} kayıt`
                                  : c.sub
                                : c.id === 'childhood'
                                  ? childhoodCnt
                                    ? `${childhoodCnt} kayıt`
                                    : c.sub
                                  : c.id === 'vision'
                                    ? visionData
                                      ? 'Kayıtlı'
                                      : c.sub
                                    : c.id === 'dental'
                                      ? dentalData
                                        ? 'Kayıtlı'
                                        : c.sub
                                      : c.id === 'lifestate'
                                        ? lifeStateData
                                          ? 'Kayıtlı'
                                          : c.sub
                                        : c.id === 'physical'
                                          ? physicalData
                                            ? 'Kayıtlı'
                                            : c.sub
                                          : c.id === 'labwork'
                                            ? bloodWorkCnt
                                              ? `${bloodWorkCnt} tahlil`
                                              : c.sub
                                            : c.id === 'illness'
                                              ? illnessCnt
                                                ? activeIllnessCnt > 0
                                                  ? `${activeIllnessCnt} aktif · ${illnessCnt} kayıt`
                                                  : `${illnessCnt} kayıt`
                                                : c.sub
                                              : c.sub;
                return (
                  <CatCard
                    key={c.id}
                    icon={c.icon}
                    tint={c.tint}
                    title={c.title}
                    sub={sub}
                    onPress={() => {
                      Haptics.selectionAsync();
                      // Acil Bilgiler için tek sayfa profil — liste yerine direkt sheet aç
                      if (c.id === 'emergency') {
                        setSheet({ type: 'quick', id: 'emergency' });
                      } else {
                        setSheet({ type: 'cat', id: c.id });
                      }
                    }}
                  />
                );
              })}
              {filtered.length === 0 && (
                <Text style={{ color: SUBTEXT, textAlign: 'center', marginTop: 32, fontSize: 15 }}>
                  Sonuç bulunamadı
                </Text>
              )}
            </View>
          </ScrollView>
        </Animated.View>
      </View>

      {/* ── Sheets ─────────────────────────────────────────────────── */}
      {sheet?.type === 'region' && (
        <RegionMarkSheet
          visible
          regionLabel={sheet.label}
          side={sheet.side}
          onClose={close}
          onSave={handleRegionSave}
        />
      )}

      <BloodTypeSheet
        visible={sheet?.type === 'quick' && sheet.id === 'blood'}
        current={bloodType as BloodType | undefined}
        onClose={close}
        onSave={(b) => {
          upsertEmerg.mutate({ bloodType: b.replace(/^0/, 'O') as never });
          close();
        }}
      />
      <EmergencyInfoSheet
        visible={sheet?.type === 'quick' && sheet.id === 'emergency'}
        current={emergencyInfo}
        onClose={close}
        onSave={(payload) => {
          // Normalize blood type "0+" → "O+" (UI uses 0, schema uses O)
          const normalized: typeof payload = {
            ...payload,
            bloodType: payload.bloodType
              ? (String(payload.bloodType).replace(/^0/, 'O') as typeof payload.bloodType)
              : payload.bloodType,
          };
          upsertEmerg.mutate(normalized as never);
          close();
        }}
      />
      <AllergyAddSheet
        visible={sheet?.type === 'quick' && sheet.id === 'allergy'}
        onClose={close}
        onSave={(a) => {
          createAlg.mutate({
            name: a.name,
            category: (ALLERGY_CAT_MAP[a.category] ?? 'other') as never,
            severity: (ALLERGY_SEV_MAP[a.severity] ?? 'mild') as never,
            reactionType: null,
            diagnosedAt: null,
            hasEpiPen: a.hasEpipen,
            note: a.note ?? '',
          });
          close();
        }}
      />
      <MedicationAddSheet
        visible={sheet?.type === 'quick' && sheet.id === 'medication'}
        onClose={close}
      />
      <VaccineAddSheet
        visible={sheet?.type === 'quick' && sheet.id === 'vaccine'}
        onClose={close}
        onSave={(v) => {
          createVax.mutate({
            name: v.name,
            doseNumber: v.dose ?? 1,
            administeredAt: v.administeredAt,
            nextDoseAt: null,
            notes: v.notes ?? '',
            batchNumber: null,
          });
          close();
        }}
      />
      <ChronicConditionAddSheet
        visible={sheet?.type === 'quick' && sheet.id === 'condition'}
        onClose={close}
        onSave={(c) => {
          createCond.mutate({
            name: c.name,
            category: COND_CAT_MAP[c.category] ?? 'other',
            severity: SEV_BACKEND[c.severity] ?? 'mild',
            status: COND_STATUS_MAP[c.status] ?? 'active',
            region: c.region ?? null,
            diagnosedAt: null,
            doctorNote: c.note ?? '',
            nextCheckup: null,
          });
          close();
        }}
      />
      <SubstanceAddSheet
        visible={sheet?.type === 'quick' && sheet.id === 'substance'}
        onClose={close}
        onSave={(su) => {
          createSub.mutate({
            type: su.type,
            status: SUB_STATUS_MAP[su.status] ?? 'active',
            frequency: SUB_FREQ_MAP[su.frequency ?? 'Günlük'] ?? null,
            amountPerDay: su.amountPerDay ?? null,
            unit: su.unit ?? null,
            note: su.note ?? '',
          });
          close();
        }}
      />
      <SurgeryAddSheet
        visible={sheet?.type === 'quick' && sheet.id === 'surgery'}
        onClose={close}
        onSave={(s) => {
          createSurg.mutate({
            name: s.name,
            performedAt: s.performedAt,
            region: s.region ?? null,
            hospital: s.hospital ?? null,
            surgeon: s.surgeon ?? null,
            recoveryNotes: s.recoveryNotes ?? '',
          });
          close();
        }}
      />
      <FamilyHistoryAddSheet
        visible={sheet?.type === 'quick' && sheet.id === 'family'}
        onClose={close}
        onSave={(f) => {
          createFam.mutate({
            relation: f.relation,
            conditionName: f.conditionName,
            ageAtDiagnosis: f.ageAtDiagnosis ?? null,
            notes: f.notes ?? '',
          });
          close();
        }}
      />
      <ChildhoodIllnessAddSheet
        visible={sheet?.type === 'quick' && sheet.id === 'childhood'}
        onClose={close}
        onSave={(c) => {
          createChild.mutate({
            name: c.name,
            hadIllness: true,
            ageAtIllness: c.ageAtIllness ?? null,
            notes: [
              c.severity ? `Şiddet: ${c.severity}` : null,
              c.hadComplications ? 'Komplikasyon oldu' : null,
              c.notes ?? null,
            ]
              .filter(Boolean)
              .join(' · '),
          });
          close();
        }}
      />
      <VisionHearingSheet
        visible={sheet?.type === 'quick' && sheet.id === 'vision'}
        current={
          visionData
            ? {
                wearsGlasses: visionData.leftEyePower != null || visionData.rightEyePower != null,
                usesContactLenses: visionData.usesContactLenses,
                leftEyePower: visionData.leftEyePower ?? undefined,
                rightEyePower: visionData.rightEyePower ?? undefined,
                usesHearingAid: visionData.usesHearingAid,
                lastEyeExam: visionData.lastEyeExam
                  ? visionData.lastEyeExam.slice(0, 10)
                  : undefined,
              }
            : undefined
        }
        onClose={close}
        onSave={(v) => {
          upsertVision.mutate({
            leftEyePower: v.leftEyePower ?? null,
            rightEyePower: v.rightEyePower ?? null,
            usesContactLenses: v.usesContactLenses,
            usesHearingAid: v.usesHearingAid,
            lastEyeExam: v.lastEyeExam ?? null,
          });
          close();
        }}
      />
      <DentalHealthSheet
        visible={sheet?.type === 'quick' && sheet.id === 'dental'}
        current={
          dentalData
            ? {
                lastCheckup: dentalData.lastCheckup
                  ? dentalData.lastCheckup.slice(0, 10)
                  : undefined,
                hasOrthodontics: dentalData.hasOrthodontics,
                hasImplants: dentalData.hasImplants,
                hasFillings: dentalData.hasFillings,
                notes: dentalData.notes || undefined,
              }
            : undefined
        }
        onClose={close}
        onSave={(d) => {
          upsertDental.mutate({
            lastCheckup: d.lastCheckup ?? null,
            hasOrthodontics: d.hasOrthodontics,
            hasImplants: d.hasImplants,
            hasFillings: d.hasFillings,
            notes: d.notes ?? '',
          });
          close();
        }}
      />
      <LifeStateSheet
        visible={sheet?.type === 'quick' && sheet.id === 'lifestate'}
        current={
          lifeStateData
            ? {
                isPregnant: lifeStateData.isPregnant,
                pregnancyWeek: lifeStateData.pregnancyWeek ?? undefined,
                isBreastfeeding: lifeStateData.isBreastfeeding,
                hasDisability: lifeStateData.hasDisability,
                disabilityType: lifeStateData.disabilityType ?? undefined,
              }
            : undefined
        }
        onClose={close}
        onSave={(l) => {
          upsertLife.mutate({
            isPregnant: l.isPregnant,
            pregnancyWeek: l.pregnancyWeek ?? null,
            isBreastfeeding: l.isBreastfeeding,
            hasDisability: l.hasDisability,
            disabilityType: l.disabilityType ?? null,
          });
          close();
        }}
      />
      <PhysicalProfileSheet
        visible={sheet?.type === 'quick' && sheet.id === 'physical'}
        current={
          physicalData
            ? {
                somatotype: (physicalData.somatotype as never) ?? 'unknown',
                dominantHand: (physicalData.dominantHand as never) ?? 'right',
                sensitivities: physicalData.medicationSensitivities?.join(', ') || undefined,
                notes: physicalData.notes || undefined,
              }
            : undefined
        }
        onClose={close}
        onSave={(p) => {
          upsertPhys.mutate({
            somatotype: p.somatotype,
            dominantHand: p.dominantHand,
            medicationSensitivities: p.sensitivities
              ? p.sensitivities
                  .split(',')
                  .map((s) => s.trim())
                  .filter(Boolean)
              : [],
            notes: p.notes ?? '',
          });
          close();
        }}
      />

      <BloodWorkAddSheet
        visible={sheet?.type === 'quick' && sheet.id === 'labwork'}
        onClose={close}
        onSave={(values, testDate, lab) => {
          createBW.mutate(
            { ...values, testDate, laboratory: lab || undefined },
            { onSuccess: () => close() },
          );
        }}
      />
      <HealthEventAddSheet
        visible={sheet?.type === 'quick' && sheet.id === 'illness'}
        onClose={close}
        onSave={(payload) => {
          createHealthEvt.mutate(payload as Parameters<typeof createHealthEvt.mutate>[0], {
            onSuccess: () => close(),
          });
        }}
      />

      {sheet?.type === 'cat' &&
        (() => {
          const catId = sheet.id;
          const cat = MEDICAL_CATS.find((c) => c.id === catId);
          if (!cat) return null;
          const rows = catRows[catId] ?? [];
          const quickId: QuickAddId | null =
            catId === 'emergency'
              ? 'emergency'
              : catId === 'allergies'
                ? 'allergy'
                : catId === 'medications'
                  ? 'medication'
                  : catId === 'vaccines'
                    ? 'vaccine'
                    : catId === 'chronic'
                      ? 'condition'
                      : catId === 'substances'
                        ? 'substance'
                        : catId === 'surgeries'
                          ? 'surgery'
                          : catId === 'family'
                            ? 'family'
                            : catId === 'childhood'
                              ? 'childhood'
                              : catId === 'vision'
                                ? 'vision'
                                : catId === 'dental'
                                  ? 'dental'
                                  : catId === 'lifestate'
                                    ? 'lifestate'
                                    : catId === 'physical'
                                      ? 'physical'
                                      : catId === 'labwork'
                                        ? 'labwork'
                                        : catId === 'illness'
                                          ? 'illness'
                                          : null;

          if (catId === 'labwork') {
            return (
              <MedicalCategorySheet
                visible
                title={cat.title}
                icon={cat.icon}
                rows={rows}
                emptyLabel="tahlil"
                onClose={close}
                onAdd={() => setSheet({ type: 'quick', id: 'labwork' })}
                onPressRow={() => {}}
              />
            );
          }

          if (catId === 'illness') {
            return (
              <MedicalCategorySheet
                visible
                title={cat.title}
                icon={cat.icon}
                rows={rows}
                emptyLabel="hastalık"
                onClose={close}
                onAdd={() => setSheet({ type: 'quick', id: 'illness' })}
                onPressRow={(rowId) => {
                  const evt = healthEvents.find((e) => e.id === rowId);
                  if (!evt) return;
                  if (evt.isActive && !evt.endDate) {
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    updateHealthEvt.mutate({
                      id: rowId,
                      payload: { endDate: new Date().toISOString(), isActive: false },
                    });
                  } else {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    deleteHealthEvt.mutate(rowId);
                  }
                }}
              />
            );
          }

          return (
            <MedicalCategorySheet
              visible
              title={cat.title}
              icon={cat.icon}
              rows={rows}
              emptyLabel={cat.title.toLowerCase()}
              comingSoon={!quickId}
              onClose={close}
              onAdd={() => {
                if (quickId) {
                  setSheet({ type: 'quick', id: quickId });
                } else {
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                }
              }}
              onPressRow={(rowId) => {
                if (!profile) return;
                let target: DetailTarget | null = null;
                if (catId === 'allergies') {
                  const r = profile.allergies.find((x) => x.id === rowId);
                  if (r) target = { kind: 'allergy', record: r };
                } else if (catId === 'chronic') {
                  const r = profile.chronicConditions.find((x) => x.id === rowId);
                  if (r) target = { kind: 'condition', record: r };
                } else if (catId === 'vaccines') {
                  const r = profile.vaccinations.find((x) => x.id === rowId);
                  if (r) target = { kind: 'vaccine', record: r };
                } else if (catId === 'substances') {
                  const r = profile.substances.find((x) => x.id === rowId);
                  if (r) target = { kind: 'substance', record: r };
                }
                if (target) {
                  Haptics.selectionAsync();
                  setSheet({ type: 'detail', target });
                }
              }}
            />
          );
        })()}

      {sheet?.type === 'detail' &&
        (() => {
          const t = sheet.target;
          if (t.kind === 'allergy') {
            return (
              <DetailEditSheet
                kind="allergy"
                record={t.record}
                onClose={close}
                onSave={(id, payload) => updateAlg.mutate({ id, payload })}
                onDelete={(id) => deleteAlg.mutate(id)}
              />
            );
          }
          if (t.kind === 'condition') {
            return (
              <DetailEditSheet
                kind="condition"
                record={t.record}
                onClose={close}
                onSave={(id, payload) => updateCond.mutate({ id, payload })}
                onDelete={(id) => deleteCond.mutate(id)}
              />
            );
          }
          if (t.kind === 'vaccine') {
            return (
              <DetailEditSheet
                kind="vaccine"
                record={t.record}
                onClose={close}
                onSave={(id, payload) => updateVax.mutate({ id, payload })}
                onDelete={(id) => deleteVax.mutate(id)}
              />
            );
          }
          if (t.kind === 'substance') {
            return (
              <DetailEditSheet
                kind="substance"
                record={t.record}
                onClose={close}
                onSave={(id, payload) => updateSub.mutate({ id, payload })}
                onDelete={(id) => deleteSub.mutate(id)}
              />
            );
          }
          if (t.kind === 'mark') {
            return (
              <DetailEditSheet
                kind="mark"
                record={t.record}
                onClose={close}
                onSave={(id, payload) => updateMark.mutate({ id, payload })}
                onDelete={(id) => deleteMark.mutate(id)}
              />
            );
          }
          return null;
        })()}
    </KeyboardAvoidingView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

type EmergencyCardInfo = {
  bloodType?: string | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
} | null;

function EmergencyCard({ info, onPress }: { info: EmergencyCardInfo; onPress: () => void }) {
  const scaleRef = useRef(new Animated.Value(1)).current;
  const opacRef = useRef(new Animated.Value(1)).current;

  const pressIn = () => {
    Animated.parallel([
      Animated.timing(scaleRef, {
        toValue: 0.975,
        duration: 100,
        useNativeDriver: true,
        easing: Easing.bezier(0.4, 0, 0.2, 1),
      }),
      Animated.timing(opacRef, {
        toValue: 0.88,
        duration: 100,
        useNativeDriver: true,
        easing: Easing.bezier(0.4, 0, 0.2, 1),
      }),
    ]).start();
  };
  const pressOut = () => {
    Animated.parallel([
      Animated.timing(scaleRef, {
        toValue: 1,
        duration: 120,
        useNativeDriver: true,
        easing: Easing.bezier(0.16, 1, 0.3, 1),
      }),
      Animated.timing(opacRef, {
        toValue: 1,
        duration: 120,
        useNativeDriver: true,
        easing: Easing.bezier(0.16, 1, 0.3, 1),
      }),
    ]).start();
  };

  const bloodType = info?.bloodType ?? undefined;
  const contactName = info?.emergencyContactName ?? undefined;
  const contactPhone = info?.emergencyContactPhone ?? undefined;
  const filled = [bloodType, contactName, contactPhone].filter(Boolean).length;
  const total = 3;
  const complete = filled === total;
  const missing = total - filled;

  const title =
    filled === 0
      ? 'Kan grubunu ekleyerek başla'
      : complete
        ? 'Acil durum kartın hazır'
        : `${missing} bilgi eksik`;

  return (
    <Pressable onPress={onPress} onPressIn={pressIn} onPressOut={pressOut}>
      <Animated.View style={[S.emergCard, { transform: [{ scale: scaleRef }], opacity: opacRef }]}>
        <View
          style={[S.bloodBadge, complete && { backgroundColor: '#30D158', shadowColor: '#30D158' }]}
        >
          <Text
            allowFontScaling={false}
            style={{
              color: '#FFF',
              fontSize: complete ? 22 : bloodType ? 15 : 20,
              fontWeight: '800',
              letterSpacing: -0.5,
            }}
          >
            {complete ? '✓' : (bloodType ?? '?')}
          </Text>
        </View>
        <View style={{ flex: 1, marginLeft: 13 }}>
          <Text allowFontScaling={false} style={S.emergLabel}>
            ACİL DURUM KARTI
          </Text>
          <Text allowFontScaling={false} style={S.emergTitle}>
            {title}
          </Text>
        </View>
        <Text allowFontScaling={false} style={S.chevron}>
          ›
        </Text>
      </Animated.View>
    </Pressable>
  );
}

function SegPicker({ value, onChange }: { value: Segment; onChange: (s: Segment) => void }) {
  return (
    <View style={S.segWrap}>
      {(['body', 'medical'] as Segment[]).map((s) => {
        const active = value === s;
        return (
          <Pressable key={s} onPress={() => onChange(s)} style={{ flex: 1 }}>
            <View style={[S.segBtn, active && S.segBtnActive]}>
              <Text allowFontScaling={false} style={[S.segText, active && S.segTextActive]}>
                {s === 'body' ? 'Vücut' : 'Tıbbi Profil'}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

function SidePicker({ value, onChange }: { value: Side; onChange: (s: Side) => void }) {
  return (
    <View style={S.sideWrap}>
      {(['front', 'back'] as Side[]).map((s) => {
        const active = value === s;
        return (
          <Pressable key={s} onPress={() => onChange(s)}>
            <View style={[S.sideBtn, active && S.sideBtnActive]}>
              <Text allowFontScaling={false} style={[S.sideText, active && S.sideTextActive]}>
                {s === 'front' ? 'Ön' : 'Arka'}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

function Chip({
  icon,
  label,
  tint,
  onPress,
}: {
  icon: string;
  label: string;
  tint: string;
  onPress: () => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const opac = useRef(new Animated.Value(1)).current;

  const inn = () =>
    Animated.parallel([
      Animated.timing(scale, { toValue: 0.94, duration: 100, useNativeDriver: true }),
      Animated.timing(opac, { toValue: 0.82, duration: 100, useNativeDriver: true }),
    ]).start();
  const outt = () =>
    Animated.parallel([
      Animated.timing(scale, {
        toValue: 1,
        duration: 140,
        useNativeDriver: true,
        easing: Easing.bezier(0.16, 1, 0.3, 1),
      }),
      Animated.timing(opac, {
        toValue: 1,
        duration: 140,
        useNativeDriver: true,
        easing: Easing.bezier(0.16, 1, 0.3, 1),
      }),
    ]).start();

  return (
    <Pressable onPress={onPress} onPressIn={inn} onPressOut={outt}>
      <Animated.View style={[S.chip, { transform: [{ scale }], opacity: opac }]}>
        <View style={[S.chipIcon, { backgroundColor: tint + '22' }]}>
          <Text allowFontScaling={false} style={{ fontSize: 14, textAlign: 'center' }}>
            {icon}
          </Text>
        </View>
        <Text allowFontScaling={false} style={S.chipLabel}>
          {label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

function CatCard({
  icon,
  tint,
  title,
  sub,
  onPress,
}: {
  icon: string;
  tint: string;
  title: string;
  sub: string;
  onPress?: () => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const opac = useRef(new Animated.Value(1)).current;

  const inn = () =>
    Animated.parallel([
      Animated.timing(scale, { toValue: 0.975, duration: 100, useNativeDriver: true }),
      Animated.timing(opac, { toValue: 0.88, duration: 100, useNativeDriver: true }),
    ]).start();
  const outt = () =>
    Animated.parallel([
      Animated.timing(scale, {
        toValue: 1,
        duration: 140,
        useNativeDriver: true,
        easing: Easing.bezier(0.16, 1, 0.3, 1),
      }),
      Animated.timing(opac, {
        toValue: 1,
        duration: 140,
        useNativeDriver: true,
        easing: Easing.bezier(0.16, 1, 0.3, 1),
      }),
    ]).start();

  return (
    <Pressable onPress={onPress} onPressIn={inn} onPressOut={outt}>
      <Animated.View style={[S.catCard, { transform: [{ scale }], opacity: opac }]}>
        <View style={[S.catIcon, { backgroundColor: tint + '1E' }]}>
          <Text allowFontScaling={false} style={{ fontSize: 20, textAlign: 'center' }}>
            {icon}
          </Text>
        </View>
        <View style={{ flex: 1, marginLeft: 13 }}>
          <Text allowFontScaling={false} style={S.catTitle}>
            {title}
          </Text>
          <Text allowFontScaling={false} style={S.catSub}>
            {sub}
          </Text>
        </View>
        <Text allowFontScaling={false} style={S.chevron}>
          ›
        </Text>
      </Animated.View>
    </Pressable>
  );
}

// ─── Yüklenme animasyonu (silüet üzerinde Apple-style pulse) ─────────────────
function BodyLoading() {
  const pulse = useRef(new Animated.Value(0)).current;
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
          easing: Easing.bezier(0.4, 0, 0.6, 1),
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 900,
          useNativeDriver: true,
          easing: Easing.bezier(0.4, 0, 0.6, 1),
        }),
      ]),
    ).start();
    const make = (v: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(v, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.timing(v, { toValue: 0, duration: 400, useNativeDriver: true }),
          Animated.delay(400),
        ]),
      );
    const a = make(dot1, 0);
    const b = make(dot2, 180);
    const c = make(dot3, 360);
    a.start();
    b.start();
    c.start();
    return () => {
      a.stop();
      b.stop();
      c.stop();
    };
  }, [pulse, dot1, dot2, dot3]);

  const overlayOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.6, 0.95] });
  const dotStyle = (v: Animated.Value) => ({
    opacity: v.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }),
    transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1.15] }) }],
  });

  return (
    <Animated.View style={[S.loadingCard, { opacity: overlayOpacity }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Animated.View style={[S.loadingDot, dotStyle(dot1)]} />
        <Animated.View style={[S.loadingDot, dotStyle(dot2)]} />
        <Animated.View style={[S.loadingDot, dotStyle(dot3)]} />
      </View>
      <Text allowFontScaling={false} style={S.loadingText}>
        Yükleniyor
      </Text>
    </Animated.View>
  );
}

function MarkRow({
  mark,
  onPress,
  isLast,
}: {
  mark: LocalMark;
  onPress: () => void;
  isLast: boolean;
}) {
  const label = REGION_TR[mark.slug] ?? mark.slug;
  const side = mark.side === 'left' ? 'Sol ' : mark.side === 'right' ? 'Sağ ' : '';
  const typeLabel: Record<LocalMark['type'], string> = {
    injury: 'Sakatlık',
    pain: 'Ağrı',
    scar: 'İz',
    missing: 'Eksik uzuv',
    surgery: 'Ameliyat',
    tightness: 'Kas tutulması',
  };
  const dot = SEVERITY_COLORS[Math.min(mark.severity - 1, 3)];
  const fullLabel = `${side}${label}`;

  // Cell highlight (background) — useNativeDriver:false for bg color
  const hl = useRef(new Animated.Value(0)).current;
  const onIn = () => {
    Animated.timing(hl, {
      toValue: 1,
      duration: 80,
      useNativeDriver: false,
      easing: Easing.bezier(0.4, 0, 0.2, 1),
    }).start();
  };
  const onOut = () => {
    Animated.timing(hl, {
      toValue: 0,
      duration: 100,
      useNativeDriver: false,
      easing: Easing.bezier(0.16, 1, 0.3, 1),
    }).start();
  };
  const cellBg = hl.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(60,60,67,0)', 'rgba(60,60,67,0.06)'],
  });

  return (
    <Animated.View style={[S.markCell, { backgroundColor: cellBg }]}>
      <Pressable onPressIn={onIn} onPressOut={onOut} onPress={onPress} style={S.markCellInner}>
        <View style={[S.markDot, { backgroundColor: dot }]} />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text allowFontScaling={false} style={S.markTitle}>
            {fullLabel}
          </Text>
          <Text allowFontScaling={false} style={S.markSub}>
            {typeLabel[mark.type]}
          </Text>
        </View>
        <Text allowFontScaling={false} style={S.markChev}>
          ›
        </Text>
      </Pressable>
      {!isLast && <View style={S.markSep} />}
    </Animated.View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles — ONE place, fully typed
// ─────────────────────────────────────────────────────────────────────────────
const S = StyleSheet.create({
  // Emergency card
  emergCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CARD,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 14,
    shadowColor: '#000',
    shadowOpacity: 0.09,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 5 },
    elevation: 4,
  },
  bloodBadge: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: ACCENT,
    shadowOpacity: 0.4,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  emergLabel: { fontSize: 10, color: SUBTEXT, fontWeight: '700', letterSpacing: 0.5 },
  emergTitle: { fontSize: 15, color: TEXT, fontWeight: '600', letterSpacing: -0.24, marginTop: 3 },

  // Segment
  segWrap: {
    flexDirection: 'row',
    backgroundColor: 'rgba(118,118,128,0.16)',
    borderRadius: 10,
    padding: 3,
  },
  segBtn: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  segBtnActive: {
    backgroundColor: CARD,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  segText: { fontSize: 14, fontWeight: '500', color: SUBTEXT, letterSpacing: -0.24 },
  segTextActive: { fontSize: 14, fontWeight: '600', color: TEXT, letterSpacing: -0.24 },

  // Side picker
  sideWrap: {
    flexDirection: 'row',
    backgroundColor: 'rgba(118,118,128,0.13)',
    borderRadius: 24,
    padding: 3,
  },
  sideBtn: {
    paddingVertical: 8,
    paddingHorizontal: 32,
    borderRadius: 21,
    alignItems: 'center',
    minWidth: 88,
  },
  sideBtnActive: {
    backgroundColor: CARD,
    shadowColor: '#000',
    shadowOpacity: 0.14,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  sideText: { fontSize: 14, fontWeight: '500', color: SUBTEXT, letterSpacing: -0.24 },
  sideTextActive: { fontSize: 14, fontWeight: '600', color: TEXT, letterSpacing: -0.24 },

  // Loading overlay
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255,255,255,0.92)',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 18,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  loadingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: ACCENT,
  },
  loadingText: {
    fontSize: 13,
    fontWeight: '600',
    color: SUBTEXT,
    letterSpacing: -0.08,
    marginLeft: 2,
  },

  // Side overlay (silüetin üstünde)
  sideOverlay: {
    position: 'absolute',
    top: -12,
    alignSelf: 'center',
    zIndex: 10,
  },

  // Section label
  secLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: SUBTEXT,
    letterSpacing: 0.6,
    paddingHorizontal: 16,
    marginTop: 10,
    marginBottom: 8,
  },

  // Chip
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CARD,
    paddingVertical: 9,
    paddingLeft: 9,
    paddingRight: 16,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOpacity: 0.07,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  chipIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 9,
  },
  chipLabel: { fontSize: 14, fontWeight: '600', color: TEXT, letterSpacing: -0.24 },

  // Category card
  catCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CARD,
    borderRadius: 14,
    paddingVertical: 13,
    paddingHorizontal: 14,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  catIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catTitle: { fontSize: 15, fontWeight: '600', color: TEXT, letterSpacing: -0.24 },
  catSub: { fontSize: 12, color: SUBTEXT, marginTop: 2 },

  // Chevron (shared)
  chevron: { fontSize: 22, color: 'rgba(60,60,67,0.22)', fontWeight: '300', lineHeight: 26 },

  // Search
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(120,120,128,0.11)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 10 : 7,
  },

  // Marks — Apple inset grouped list
  markList: {
    marginHorizontal: 16,
    backgroundColor: CARD,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  markCell: {
    position: 'relative',
  },
  markCellInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  markSep: {
    position: 'absolute',
    left: 16,
    right: 0,
    bottom: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: SEP,
  },
  markDot: { width: 10, height: 10, borderRadius: 5 },
  markTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: TEXT,
    letterSpacing: -0.24,
  },
  markSub: {
    fontSize: 13,
    color: SUBTEXT,
    marginTop: 2,
    letterSpacing: -0.08,
  },
  markChev: {
    fontSize: 22,
    color: 'rgba(60,60,67,0.22)',
    fontWeight: '300',
    marginLeft: 8,
  },
});

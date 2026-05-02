import React, { useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Easing,
  LayoutAnimation,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { SheetShell, SHEET_TOKENS } from './SheetShell';
import {
  SheetBody,
  Section,
  TextField,
  MultilineTextField,
  PickerRow,
  ToggleRow,
  DateField,
} from './SheetPrimitives';
import {
  ALLERGY_CATEGORIES,
  ALLERGY_SEVERITIES,
  CONDITION_CATEGORIES,
  CONDITION_STATUSES,
  REGION_MARK_TYPES,
  SEVERITY_LABELS,
  SUBSTANCE_FREQUENCIES,
  SUBSTANCE_STATUSES,
  SUBSTANCE_TYPES,
  type AllergyCategory,
  type AllergySeverity,
  type ConditionCategory,
  type ConditionStatus,
  type RegionMarkType,
  type Severity,
  type SubstanceFrequencyLabel,
  type SubstanceStatusLabel,
  type SubstanceTypeId,
} from './types';
import type {
  Allergy,
  BodyMark,
  ChronicCondition,
  Substance,
  Vaccination,
} from '../../../../../src/api/body-client';

const { ACCENT, SUBTEXT, TEXT, BG } = SHEET_TOKENS;

// ─── TR ↔ EN maps (aynı vucut.tsx'tekiyle birebir) ───
const ALLERGY_CAT_TR_TO_EN: Record<AllergyCategory, Allergy['category']> = {
  İlaç: 'drug',
  Gıda: 'food',
  Çevresel: 'environmental',
  Temas: 'contact',
  Böcek: 'insect',
  Diğer: 'other',
};
const ALLERGY_CAT_EN_TO_TR: Record<Allergy['category'], AllergyCategory> = {
  drug: 'İlaç',
  food: 'Gıda',
  environmental: 'Çevresel',
  contact: 'Temas',
  insect: 'Böcek',
  other: 'Diğer',
};
const ALLERGY_SEV_TR_TO_EN: Record<AllergySeverity, Allergy['severity']> = {
  Hafif: 'mild',
  Orta: 'moderate',
  Ciddi: 'severe',
  Anaflaktik: 'anaphylactic',
};
const ALLERGY_SEV_EN_TO_TR: Record<Allergy['severity'], AllergySeverity> = {
  mild: 'Hafif',
  moderate: 'Orta',
  severe: 'Ciddi',
  anaphylactic: 'Anaflaktik',
};
const COND_CAT_TR_TO_EN: Record<ConditionCategory, string> = {
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
const COND_CAT_EN_TO_TR: Record<string, ConditionCategory> = {
  metabolic: 'Metabolik',
  cardiovascular: 'Kardiyovasküler',
  respiratory: 'Solunum',
  digestive: 'Sindirim',
  musculoskeletal: 'Kas-iskelet',
  neurological: 'Nörolojik',
  autoimmune: 'Otoimmün',
  hormonal: 'Hormonal',
  blood: 'Kan',
  mental: 'Mental',
  other: 'Diğer',
};
const COND_STATUS_TR_TO_EN: Record<ConditionStatus, ChronicCondition['status']> = {
  Aktif: 'active',
  Remisyon: 'remission',
  İyileşti: 'resolved',
};
const COND_STATUS_EN_TO_TR: Record<ChronicCondition['status'], ConditionStatus> = {
  active: 'Aktif',
  remission: 'Remisyon',
  resolved: 'İyileşti',
};
const SEV_BACKEND: Record<Severity, ChronicCondition['severity']> = {
  1: 'mild',
  2: 'mild',
  3: 'moderate',
  4: 'severe',
};
const SEV_FROM_BACKEND: Record<ChronicCondition['severity'], Severity> = {
  mild: 1,
  moderate: 2,
  severe: 3,
};

const SUB_STATUS_TR_TO_EN: Record<SubstanceStatusLabel, Substance['status']> = {
  'Devam ediyor': 'active',
  Bırakıyor: 'quitting',
  Bıraktı: 'quit',
};
const SUB_STATUS_EN_TO_TR: Record<Substance['status'], SubstanceStatusLabel> = {
  active: 'Devam ediyor',
  quitting: 'Bırakıyor',
  quit: 'Bıraktı',
};
const SUB_FREQ_TR_TO_EN: Record<SubstanceFrequencyLabel, NonNullable<Substance['frequency']>> = {
  Günlük: 'daily',
  Haftalık: 'weekly',
  'Ara sıra': 'occasional',
  Nadiren: 'rarely',
};
const SUB_FREQ_EN_TO_TR: Record<NonNullable<Substance['frequency']>, SubstanceFrequencyLabel> = {
  daily: 'Günlük',
  weekly: 'Haftalık',
  occasional: 'Ara sıra',
  rarely: 'Nadiren',
};

const MARK_TYPE_LABELS: Record<BodyMark['type'], string> = {
  injury: 'Sakatlık',
  pain: 'Ağrı',
  scar: 'İz',
  missing: 'Eksik uzuv',
  surgery: 'Ameliyat',
  tightness: 'Kas tutulması',
  chronic_region: 'Kronik bölge',
};

// ─── Date formatting ───
const MONTHS_TR_LONG = [
  'Ocak',
  'Şubat',
  'Mart',
  'Nisan',
  'Mayıs',
  'Haziran',
  'Temmuz',
  'Ağustos',
  'Eylül',
  'Ekim',
  'Kasım',
  'Aralık',
];
function formatDateLong(iso?: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return `${d.getDate()} ${MONTHS_TR_LONG[d.getMonth()]} ${d.getFullYear()}`;
}
function isoToDateOnly(iso?: string | null): string {
  if (!iso) return '';
  return iso.slice(0, 10);
}

// ─── Discriminated Props ───
export type DetailEditSheetProps =
  | {
      kind: 'allergy';
      record: Allergy;
      onClose: () => void;
      onSave: (id: string, payload: Partial<Allergy>) => void;
      onDelete: (id: string) => void;
    }
  | {
      kind: 'condition';
      record: ChronicCondition;
      onClose: () => void;
      onSave: (id: string, payload: Partial<ChronicCondition>) => void;
      onDelete: (id: string) => void;
    }
  | {
      kind: 'vaccine';
      record: Vaccination;
      onClose: () => void;
      onSave: (id: string, payload: Partial<Vaccination>) => void;
      onDelete: (id: string) => void;
    }
  | {
      kind: 'substance';
      record: Substance;
      onClose: () => void;
      onSave: (id: string, payload: Partial<Substance>) => void;
      onDelete: (id: string) => void;
    }
  | {
      kind: 'mark';
      record: BodyMark;
      onClose: () => void;
      onSave: (id: string, payload: Partial<BodyMark>) => void;
      onDelete: (id: string) => void;
    };

const TITLES: Record<DetailEditSheetProps['kind'], string> = {
  allergy: 'Alerji',
  condition: 'Rahatsızlık',
  vaccine: 'Aşı',
  substance: 'Bağımlılık',
  mark: 'İşaret',
};

const DELETE_LABELS: Record<DetailEditSheetProps['kind'], string> = {
  allergy: 'Bu alerji kalıcı olarak silinecek.',
  condition: 'Bu rahatsızlık kalıcı olarak silinecek.',
  vaccine: 'Bu aşı kaydı kalıcı olarak silinecek.',
  substance: 'Bu bağımlılık kaydı kalıcı olarak silinecek.',
  mark: 'Bu işaret kalıcı olarak silinecek.',
};

export function DetailEditSheet(props: DetailEditSheetProps) {
  const [mode, setMode] = useState<'view' | 'edit'>('view');
  const switchTo = (next: 'view' | 'edit') => {
    LayoutAnimation.configureNext({
      duration: next === 'edit' ? 240 : 200,
      create: {
        type: LayoutAnimation.Types.easeInEaseOut,
        property: LayoutAnimation.Properties.opacity,
      },
      update: { type: LayoutAnimation.Types.easeInEaseOut },
      delete: {
        type: LayoutAnimation.Types.easeInEaseOut,
        property: LayoutAnimation.Properties.opacity,
      },
    });
    Haptics.selectionAsync();
    setMode(next);
  };

  const askDelete = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert('Silinsin mi?', DELETE_LABELS[props.kind], [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          props.onDelete(props.record.id);
          props.onClose();
        },
      },
    ]);
  };

  return (
    <SheetShell
      visible
      title={TITLES[props.kind]}
      onClose={props.onClose}
      hideSave={mode === 'view'}
      // edit modunda right slot custom: "Kaydet" — view modunda "Düzenle"
      rightSlot={
        mode === 'view' ? (
          <Pressable
            onPress={() => switchTo('edit')}
            hitSlop={12}
            style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}
          >
            <Text style={[shellStyles.right, { color: ACCENT }]}>Düzenle</Text>
          </Pressable>
        ) : undefined
      }
    >
      <SheetBody>
        {mode === 'view' ? (
          <ViewMode {...props} onDelete={askDelete} />
        ) : (
          <EditMode {...props} onCancel={() => switchTo('view')} onSaved={() => switchTo('view')} />
        )}
      </SheetBody>
    </SheetShell>
  );
}

// ─── Read-only ROW (label + value) ───
function ReadRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={readStyles.row}>
      <Text allowFontScaling={false} style={readStyles.label}>
        {label}
      </Text>
      <Text allowFontScaling={false} style={readStyles.value} numberOfLines={3}>
        {value || '—'}
      </Text>
    </View>
  );
}

function DeleteButton({ label, onPress }: { label: string; onPress: () => void }) {
  const scale = useRef(new Animated.Value(1)).current;
  const inn = () =>
    Animated.timing(scale, {
      toValue: 0.97,
      duration: 100,
      useNativeDriver: true,
      easing: Easing.bezier(0.4, 0, 0.2, 1),
    }).start();
  const outt = () =>
    Animated.timing(scale, {
      toValue: 1,
      duration: 130,
      useNativeDriver: true,
      easing: Easing.bezier(0.16, 1, 0.3, 1),
    }).start();
  return (
    <Pressable onPress={onPress} onPressIn={inn} onPressOut={outt}>
      <Animated.View style={[delStyles.btn, { transform: [{ scale }] }]}>
        <Text allowFontScaling={false} style={delStyles.text}>
          {label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

// ─── VIEW MODE ─────────────────────────────────────────────────────────────
function ViewMode(props: DetailEditSheetProps & { onDelete: () => void }) {
  return (
    <ScrollView
      contentContainerStyle={{ paddingTop: 12, paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
    >
      {props.kind === 'allergy' && <AllergyView record={props.record} />}
      {props.kind === 'condition' && <ConditionView record={props.record} />}
      {props.kind === 'vaccine' && <VaccineView record={props.record} />}
      {props.kind === 'substance' && <SubstanceView record={props.record} />}
      {props.kind === 'mark' && <MarkView record={props.record} />}

      <View style={{ marginTop: 28, paddingHorizontal: 16 }}>
        <DeleteButton label="Sil" onPress={props.onDelete} />
      </View>
    </ScrollView>
  );
}

function AllergyView({ record }: { record: Allergy }) {
  return (
    <>
      <Section caption="GENEL" first>
        <ReadRow label="İsim" value={record.name} />
        <ReadRow
          label="Kategori"
          value={ALLERGY_CAT_EN_TO_TR[record.category] ?? record.category}
        />
        <ReadRow label="Şiddet" value={ALLERGY_SEV_EN_TO_TR[record.severity] ?? record.severity} />
        <ReadRow label="EpiPen" value={record.hasEpiPen ? 'Var' : 'Yok'} />
      </Section>
      <Section caption="TANI">
        <ReadRow label="Tanı tarihi" value={formatDateLong(record.diagnosedAt)} />
      </Section>
      {record.note ? (
        <Section caption="NOT">
          <ReadRow label="Not" value={record.note} />
        </Section>
      ) : null}
    </>
  );
}

function ConditionView({ record }: { record: ChronicCondition }) {
  return (
    <>
      <Section caption="GENEL" first>
        <ReadRow label="İsim" value={record.name} />
        <ReadRow label="Kategori" value={COND_CAT_EN_TO_TR[record.category] ?? record.category} />
        <ReadRow label="Şiddet" value={SEVERITY_LABELS[SEV_FROM_BACKEND[record.severity] ?? 1]} />
        <ReadRow label="Durum" value={COND_STATUS_EN_TO_TR[record.status] ?? record.status} />
      </Section>
      <Section caption="DETAY">
        <ReadRow label="Bölge" value={record.region ?? '—'} />
        <ReadRow label="Tanı tarihi" value={formatDateLong(record.diagnosedAt)} />
        <ReadRow label="Sonraki kontrol" value={formatDateLong(record.nextCheckup)} />
      </Section>
      {record.doctorNote ? (
        <Section caption="DOKTOR NOTU">
          <ReadRow label="Not" value={record.doctorNote} />
        </Section>
      ) : null}
    </>
  );
}

function VaccineView({ record }: { record: Vaccination }) {
  return (
    <>
      <Section caption="GENEL" first>
        <ReadRow label="İsim" value={record.name} />
        <ReadRow label="Doz" value={String(record.doseNumber)} />
        <ReadRow label="Yapıldı" value={formatDateLong(record.administeredAt)} />
        <ReadRow label="Sonraki doz" value={formatDateLong(record.nextDoseAt)} />
      </Section>
      {record.batchNumber ? (
        <Section caption="ÜRETİM">
          <ReadRow label="Lot" value={record.batchNumber} />
        </Section>
      ) : null}
      {record.notes ? (
        <Section caption="NOT">
          <ReadRow label="Not" value={record.notes} />
        </Section>
      ) : null}
    </>
  );
}

function SubstanceView({ record }: { record: Substance }) {
  const typeMeta = SUBSTANCE_TYPES.find((t) => t.id === record.type);
  return (
    <>
      <Section caption="GENEL" first>
        <ReadRow label="Tür" value={typeMeta?.label ?? record.type} />
        <ReadRow label="Durum" value={SUB_STATUS_EN_TO_TR[record.status] ?? record.status} />
        <ReadRow
          label="Sıklık"
          value={record.frequency ? (SUB_FREQ_EN_TO_TR[record.frequency] ?? record.frequency) : '—'}
        />
        <ReadRow
          label="Günde miktar"
          value={
            record.amountPerDay != null ? `${record.amountPerDay} ${record.unit ?? ''}`.trim() : '—'
          }
        />
      </Section>
      <Section caption="TARİHLER">
        <ReadRow label="Başladı" value={formatDateLong(record.startedAt)} />
        <ReadRow label="Bıraktı" value={formatDateLong(record.quitDate)} />
      </Section>
      {record.note ? (
        <Section caption="NOT">
          <ReadRow label="Not" value={record.note} />
        </Section>
      ) : null}
    </>
  );
}

function MarkView({ record }: { record: BodyMark }) {
  const sidePrefix = record.side === 'left' ? 'Sol ' : record.side === 'right' ? 'Sağ ' : '';
  const sevLabel = SEVERITY_LABELS[Math.min(Math.max(record.severity, 1), 4) as Severity];
  return (
    <>
      <Section caption="GENEL" first>
        <ReadRow label="Bölge" value={`${sidePrefix}${record.region}`.trim()} />
        <ReadRow label="Tür" value={MARK_TYPE_LABELS[record.type] ?? record.type} />
        <ReadRow label="Şiddet" value={sevLabel} />
      </Section>
      <Section caption="TARİHLER">
        <ReadRow label="Başlangıç" value={formatDateLong(record.startDate)} />
        <ReadRow label="Bitiş" value={formatDateLong(record.endDate)} />
      </Section>
      {record.note ? (
        <Section caption="NOT">
          <ReadRow label="Not" value={record.note} />
        </Section>
      ) : null}
    </>
  );
}

// ─── EDIT MODE ─────────────────────────────────────────────────────────────
type EditExtras = { onCancel: () => void; onSaved: () => void };

function EditMode(props: DetailEditSheetProps & EditExtras) {
  switch (props.kind) {
    case 'allergy':
      return (
        <AllergyEdit
          record={props.record}
          onSave={props.onSave}
          onSaved={props.onSaved}
          onCancel={props.onCancel}
        />
      );
    case 'condition':
      return (
        <ConditionEdit
          record={props.record}
          onSave={props.onSave}
          onSaved={props.onSaved}
          onCancel={props.onCancel}
        />
      );
    case 'vaccine':
      return (
        <VaccineEdit
          record={props.record}
          onSave={props.onSave}
          onSaved={props.onSaved}
          onCancel={props.onCancel}
        />
      );
    case 'substance':
      return (
        <SubstanceEdit
          record={props.record}
          onSave={props.onSave}
          onSaved={props.onSaved}
          onCancel={props.onCancel}
        />
      );
    case 'mark':
      return (
        <MarkEdit
          record={props.record}
          onSave={props.onSave}
          onSaved={props.onSaved}
          onCancel={props.onCancel}
        />
      );
  }
}

function EditFooter({
  onCancel,
  onSave,
  canSave,
}: {
  onCancel: () => void;
  onSave: () => void;
  canSave: boolean;
}) {
  return (
    <View style={editFooter.wrap}>
      <Pressable
        onPress={onCancel}
        style={({ pressed }) => [
          editFooter.btn,
          editFooter.btnGhost,
          { opacity: pressed ? 0.6 : 1 },
        ]}
      >
        <Text allowFontScaling={false} style={[editFooter.text, { color: SUBTEXT }]}>
          Vazgeç
        </Text>
      </Pressable>
      <Pressable
        onPress={onSave}
        disabled={!canSave}
        style={({ pressed }) => [
          editFooter.btn,
          editFooter.btnPrimary,
          { opacity: !canSave ? 0.4 : pressed ? 0.85 : 1 },
        ]}
      >
        <Text allowFontScaling={false} style={[editFooter.text, { color: '#FFF' }]}>
          Kaydet
        </Text>
      </Pressable>
    </View>
  );
}

function asOptions<T extends string>(values: readonly T[]): Array<{ value: T; label: string }> {
  return values.map((v) => ({ value: v, label: v }));
}

function AllergyEdit({
  record,
  onSave,
  onSaved,
  onCancel,
}: {
  record: Allergy;
  onSave: (id: string, payload: Partial<Allergy>) => void;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(record.name);
  const [category, setCategory] = useState<AllergyCategory>(
    ALLERGY_CAT_EN_TO_TR[record.category] ?? 'Diğer',
  );
  const [severity, setSeverity] = useState<AllergySeverity>(
    ALLERGY_SEV_EN_TO_TR[record.severity] ?? 'Hafif',
  );
  const [hasEpipen, setEpi] = useState(record.hasEpiPen);
  const [note, setNote] = useState(record.note ?? '');
  const [expanded, setExpanded] = useState<string | null>(null);
  const canSave = name.trim().length > 0;

  const handleSave = () => {
    if (!canSave) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onSave(record.id, {
      name: name.trim(),
      category: ALLERGY_CAT_TR_TO_EN[category],
      severity: ALLERGY_SEV_TR_TO_EN[severity],
      hasEpiPen: hasEpipen,
      note: note.trim(),
    });
    onSaved();
  };

  return (
    <ScrollView
      contentContainerStyle={editStyles.scroll}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <Section caption="İSİM" first>
        <TextField label="İsim" value={name} onChangeText={setName} />
      </Section>
      <Section caption="DETAY">
        <PickerRow
          label="Kategori"
          value={category}
          options={asOptions(ALLERGY_CATEGORIES)}
          onChange={setCategory}
          expanded={expanded === 'cat'}
          onToggle={() => setExpanded((p) => (p === 'cat' ? null : 'cat'))}
        />
        <PickerRow
          label="Şiddet"
          value={severity}
          options={asOptions(ALLERGY_SEVERITIES)}
          onChange={setSeverity}
          expanded={expanded === 'sev'}
          onToggle={() => setExpanded((p) => (p === 'sev' ? null : 'sev'))}
        />
        <ToggleRow label="EpiPen taşıyor" value={hasEpipen} onValueChange={setEpi} />
      </Section>
      <Section caption="NOT">
        <MultilineTextField value={note} onChangeText={setNote} placeholder="İsteğe bağlı not" />
      </Section>
      <EditFooter onCancel={onCancel} onSave={handleSave} canSave={canSave} />
    </ScrollView>
  );
}

function ConditionEdit({
  record,
  onSave,
  onSaved,
  onCancel,
}: {
  record: ChronicCondition;
  onSave: (id: string, payload: Partial<ChronicCondition>) => void;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const initialSev = SEV_FROM_BACKEND[record.severity] ?? 1;
  const [name, setName] = useState(record.name);
  const [category, setCategory] = useState<ConditionCategory>(
    COND_CAT_EN_TO_TR[record.category] ?? 'Diğer',
  );
  const [severity, setSeverity] = useState<Severity>(initialSev);
  const [status, setStatus] = useState<ConditionStatus>(
    COND_STATUS_EN_TO_TR[record.status] ?? 'Aktif',
  );
  const [region, setRegion] = useState(record.region ?? '');
  const [note, setNote] = useState(record.doctorNote ?? '');
  const [expanded, setExpanded] = useState<string | null>(null);
  const canSave = name.trim().length > 0;

  const sevOptions = useMemo(
    () =>
      ([1, 2, 3, 4] as Severity[]).map((lvl) => ({
        value: String(lvl) as `${Severity}`,
        label: SEVERITY_LABELS[lvl],
      })),
    [],
  );

  const handleSave = () => {
    if (!canSave) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onSave(record.id, {
      name: name.trim(),
      category: COND_CAT_TR_TO_EN[category] ?? 'other',
      severity: SEV_BACKEND[severity],
      status: COND_STATUS_TR_TO_EN[status],
      region: region.trim() || null,
      doctorNote: note.trim(),
    });
    onSaved();
  };

  return (
    <ScrollView
      contentContainerStyle={editStyles.scroll}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <Section caption="İSİM" first>
        <TextField label="İsim" value={name} onChangeText={setName} />
      </Section>
      <Section caption="DETAY">
        <PickerRow
          label="Kategori"
          value={category}
          options={asOptions(CONDITION_CATEGORIES)}
          onChange={setCategory}
          expanded={expanded === 'cat'}
          onToggle={() => setExpanded((p) => (p === 'cat' ? null : 'cat'))}
        />
        <PickerRow
          label="Şiddet"
          value={String(severity) as `${Severity}`}
          options={sevOptions}
          onChange={(v) => setSeverity(parseInt(v, 10) as Severity)}
          expanded={expanded === 'sev'}
          onToggle={() => setExpanded((p) => (p === 'sev' ? null : 'sev'))}
        />
        <PickerRow
          label="Durum"
          value={status}
          options={asOptions(CONDITION_STATUSES)}
          onChange={setStatus}
          expanded={expanded === 'st'}
          onToggle={() => setExpanded((p) => (p === 'st' ? null : 'st'))}
        />
      </Section>
      <Section caption="BÖLGE">
        <TextField
          label="Bölge"
          value={region}
          onChangeText={setRegion}
          placeholder="Örn. Sol diz"
        />
      </Section>
      <Section caption="DOKTOR NOTU">
        <MultilineTextField value={note} onChangeText={setNote} placeholder="İsteğe bağlı" />
      </Section>
      <EditFooter onCancel={onCancel} onSave={handleSave} canSave={canSave} />
    </ScrollView>
  );
}

function VaccineEdit({
  record,
  onSave,
  onSaved,
  onCancel,
}: {
  record: Vaccination;
  onSave: (id: string, payload: Partial<Vaccination>) => void;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(record.name);
  const [dose, setDose] = useState(String(record.doseNumber ?? 1));
  const [date, setDate] = useState(isoToDateOnly(record.administeredAt));
  const [notes, setNotes] = useState(record.notes ?? '');
  const canSave = name.trim().length > 0;

  const handleSave = () => {
    if (!canSave) return;
    const doseN = parseInt(dose, 10);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onSave(record.id, {
      name: name.trim(),
      doseNumber: Number.isFinite(doseN) && doseN > 0 ? doseN : 1,
      administeredAt: date || record.administeredAt,
      notes: notes.trim(),
    });
    onSaved();
  };

  return (
    <ScrollView
      contentContainerStyle={editStyles.scroll}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <Section caption="İSİM" first>
        <TextField label="İsim" value={name} onChangeText={setName} />
      </Section>
      <Section caption="DETAY">
        <DateField label="Yapıldı" value={date} onChangeText={setDate} />
        <TextField
          label="Doz"
          value={dose}
          onChangeText={(t) => setDose(t.replace(/[^0-9]/g, ''))}
          keyboardType="number-pad"
        />
      </Section>
      <Section caption="NOT">
        <MultilineTextField value={notes} onChangeText={setNotes} placeholder="İsteğe bağlı" />
      </Section>
      <EditFooter onCancel={onCancel} onSave={handleSave} canSave={canSave} />
    </ScrollView>
  );
}

function SubstanceEdit({
  record,
  onSave,
  onSaved,
  onCancel,
}: {
  record: Substance;
  onSave: (id: string, payload: Partial<Substance>) => void;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [type, setType] = useState<SubstanceTypeId>(record.type);
  const [status, setStatus] = useState<SubstanceStatusLabel>(
    SUB_STATUS_EN_TO_TR[record.status] ?? 'Devam ediyor',
  );
  const [freq, setFreq] = useState<SubstanceFrequencyLabel>(
    record.frequency ? (SUB_FREQ_EN_TO_TR[record.frequency] ?? 'Günlük') : 'Günlük',
  );
  const [amount, setAmount] = useState(
    record.amountPerDay != null ? String(record.amountPerDay) : '',
  );
  const [note, setNote] = useState(record.note ?? '');
  const [expanded, setExpanded] = useState<string | null>(null);

  const typeOptions = SUBSTANCE_TYPES.map((t) => ({ value: t.id, label: t.label, icon: t.icon }));

  const handleSave = () => {
    const amt = parseFloat(amount.replace(',', '.'));
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onSave(record.id, {
      type,
      status: SUB_STATUS_TR_TO_EN[status],
      frequency: SUB_FREQ_TR_TO_EN[freq],
      amountPerDay: Number.isFinite(amt) && amt > 0 ? amt : null,
      unit:
        type === 'smoking'
          ? 'pack'
          : type === 'alcohol'
            ? 'drink'
            : type === 'caffeine'
              ? 'cup'
              : record.unit,
      note: note.trim(),
    });
    onSaved();
  };

  return (
    <ScrollView
      contentContainerStyle={editStyles.scroll}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <Section caption="TÜR" first>
        <PickerRow
          label="Tür"
          value={type}
          options={typeOptions}
          onChange={setType}
          expanded={expanded === 'type'}
          onToggle={() => setExpanded((p) => (p === 'type' ? null : 'type'))}
        />
      </Section>
      <Section caption="DETAY">
        <PickerRow
          label="Durum"
          value={status}
          options={asOptions(SUBSTANCE_STATUSES)}
          onChange={setStatus}
          expanded={expanded === 'st'}
          onToggle={() => setExpanded((p) => (p === 'st' ? null : 'st'))}
        />
        <PickerRow
          label="Sıklık"
          value={freq}
          options={asOptions(SUBSTANCE_FREQUENCIES)}
          onChange={setFreq}
          expanded={expanded === 'fr'}
          onToggle={() => setExpanded((p) => (p === 'fr' ? null : 'fr'))}
        />
        <TextField
          label="Günde miktar"
          value={amount}
          onChangeText={(t) => setAmount(t.replace(/[^0-9.,]/g, ''))}
          keyboardType="decimal-pad"
        />
      </Section>
      <Section caption="NOT">
        <MultilineTextField value={note} onChangeText={setNote} placeholder="İsteğe bağlı" />
      </Section>
      <EditFooter onCancel={onCancel} onSave={handleSave} canSave={true} />
    </ScrollView>
  );
}

function MarkEdit({
  record,
  onSave,
  onSaved,
  onCancel,
}: {
  record: BodyMark;
  onSave: (id: string, payload: Partial<BodyMark>) => void;
  onSaved: () => void;
  onCancel: () => void;
}) {
  // BodyMark'ın type alanı 'chronic_region' içerebilir; UI'da 7 standart tür yok — fallback 'pain'
  const initialType: RegionMarkType =
    (REGION_MARK_TYPES.find((t) => t.id === record.type)?.id as RegionMarkType | undefined) ??
    'pain';
  const initialSev = Math.min(Math.max(record.severity, 1), 4) as Severity;

  const [type, setType] = useState<RegionMarkType>(initialType);
  const [severity, setSeverity] = useState<Severity>(initialSev);
  const [date, setDate] = useState(isoToDateOnly(record.startDate));
  const [note, setNote] = useState(record.note ?? '');
  const [expanded, setExpanded] = useState<string | null>(null);

  const typeOptions = REGION_MARK_TYPES.map((t) => ({ value: t.id, label: t.label }));
  const sevOptions = ([1, 2, 3, 4] as Severity[]).map((lvl) => ({
    value: String(lvl) as `${Severity}`,
    label: SEVERITY_LABELS[lvl],
  }));

  const handleSave = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onSave(record.id, {
      type: type as BodyMark['type'],
      severity,
      startDate: date || record.startDate,
      note: note.trim(),
    });
    onSaved();
  };

  return (
    <ScrollView
      contentContainerStyle={editStyles.scroll}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <Section caption="TÜR" first>
        <PickerRow
          label="Tür"
          value={type}
          options={typeOptions}
          onChange={setType}
          expanded={expanded === 'type'}
          onToggle={() => setExpanded((p) => (p === 'type' ? null : 'type'))}
        />
        <PickerRow
          label="Şiddet"
          value={String(severity) as `${Severity}`}
          options={sevOptions}
          onChange={(v) => setSeverity(parseInt(v, 10) as Severity)}
          expanded={expanded === 'sev'}
          onToggle={() => setExpanded((p) => (p === 'sev' ? null : 'sev'))}
        />
      </Section>
      <Section caption="TARİH">
        <DateField label="Başlangıç" value={date} onChangeText={setDate} />
      </Section>
      <Section caption="NOT">
        <MultilineTextField value={note} onChangeText={setNote} placeholder="İsteğe bağlı" />
      </Section>
      <EditFooter onCancel={onCancel} onSave={handleSave} canSave={true} />
    </ScrollView>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────
const shellStyles = StyleSheet.create({
  right: { fontSize: 17, fontWeight: '600' },
});

const readStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    minHeight: 44,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  label: {
    fontSize: 17,
    color: TEXT,
    letterSpacing: -0.4,
    fontWeight: '400',
    flexShrink: 0,
  },
  value: {
    fontSize: 17,
    color: SUBTEXT,
    letterSpacing: -0.4,
    marginLeft: 'auto',
    paddingLeft: 12,
    textAlign: 'right',
    flexShrink: 1,
    maxWidth: '70%',
  },
});

const delStyles = StyleSheet.create({
  btn: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: '#FF3B30',
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.4,
  },
});

const editStyles = StyleSheet.create({
  scroll: { paddingTop: 12, paddingBottom: 40 },
});

const editFooter = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    marginTop: 28,
  },
  btn: {
    flex: 1,
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnGhost: {
    backgroundColor: BG,
  },
  btnPrimary: {
    backgroundColor: ACCENT,
  },
  text: {
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
});

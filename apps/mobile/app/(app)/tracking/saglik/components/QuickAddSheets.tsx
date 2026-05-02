import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  LayoutAnimation,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { SheetShell, SHEET_TOKENS } from './SheetShell';
import type { EmergencyInfo } from '../../../../../src/api/body-client';
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
  BLOOD_TYPES,
  CHILDHOOD_SEVERITIES,
  CONDITION_CATEGORIES,
  CONDITION_STATUSES,
  DOMINANT_HANDS,
  FAMILY_RELATIONS,
  SEVERITY_LABELS,
  SOMATOTYPES,
  SUBSTANCE_FREQUENCIES,
  SUBSTANCE_STATUSES,
  SUBSTANCE_TYPES,
  type Allergy,
  type AllergyCategory,
  type AllergySeverity,
  type BloodType,
  type ChildhoodIllnessUI,
  type ChildhoodSeverityLabel,
  type ChronicCondition,
  type ConditionCategory,
  type ConditionStatus,
  type DentalHealthUI,
  type DominantHandId,
  type FamilyHistoryUI,
  type FamilyRelationId,
  type LifeStateUI,
  type PhysicalProfileUI,
  type Severity,
  type SomatotypeId,
  type SubstanceFrequencyLabel,
  type SubstanceStatusLabel,
  type SubstanceTypeId,
  type SubstanceUI,
  type SurgeryUI,
  type Vaccine,
  type VisionHearingUI,
} from './types';

const { ACCENT, TEXT, SUBTEXT, BG } = SHEET_TOKENS;

const EASE_SPRING = Easing.bezier(0.16, 1, 0.3, 1);
const EASE_MICRO = Easing.bezier(0.4, 0, 0.2, 1);

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}
function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// Build picker options from string-literal arrays
function asOptions<T extends string>(values: readonly T[]): Array<{ value: T; label: string }> {
  return values.map((v) => ({ value: v, label: v }));
}

// ──────────────────────────────────────────────────────────────────────────────
// 1. BloodTypeSheet — Apple-style 4×2 grid inside grouped section

function BloodCell({
  type,
  active,
  onPress,
}: {
  type: BloodType;
  active: boolean;
  onPress: () => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const inn = () =>
    Animated.timing(scale, {
      toValue: 0.94,
      duration: 90,
      useNativeDriver: true,
      easing: EASE_MICRO,
    }).start();
  const outt = () =>
    Animated.timing(scale, {
      toValue: 1,
      duration: 130,
      useNativeDriver: true,
      easing: EASE_SPRING,
    }).start();

  return (
    <Pressable onPress={onPress} onPressIn={inn} onPressOut={outt} style={{ width: '23%' }}>
      <Animated.View
        style={[bloodStyles.cell, active && bloodStyles.cellActive, { transform: [{ scale }] }]}
      >
        <Text allowFontScaling={false} style={[bloodStyles.text, active && { color: '#FFFFFF' }]}>
          {type}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

export function BloodTypeSheet({
  visible,
  current,
  onClose,
  onSave,
}: {
  visible: boolean;
  current?: BloodType;
  onClose: () => void;
  onSave: (b: BloodType) => void;
}) {
  const [picked, setPicked] = useState<BloodType | undefined>(current);

  const handleSave = () => {
    if (!picked) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onSave(picked);
  };

  return (
    <SheetShell
      visible={visible}
      title="Kan Grubu"
      onClose={onClose}
      onSave={handleSave}
      saveDisabled={!picked}
    >
      <SheetBody>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.section}>
            <Text allowFontScaling={false} style={styles.caption}>
              KAN GRUBU
            </Text>
            <View style={bloodStyles.grid}>
              {BLOOD_TYPES.map((b) => (
                <BloodCell
                  key={b}
                  type={b}
                  active={picked === b}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setPicked(b);
                  }}
                />
              ))}
            </View>
          </View>
        </ScrollView>
      </SheetBody>
    </SheetShell>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// 2. AllergyAddSheet

export function AllergyAddSheet({
  visible,
  onClose,
  onSave,
}: {
  visible: boolean;
  onClose: () => void;
  onSave: (a: Allergy) => void;
}) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<AllergyCategory>('İlaç');
  const [severity, setSeverity] = useState<AllergySeverity>('Hafif');
  const [hasEpipen, setHasEpipen] = useState(false);
  const [note, setNote] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);

  const reset = () => {
    setName('');
    setCategory('İlaç');
    setSeverity('Hafif');
    setHasEpipen(false);
    setNote('');
    setExpanded(null);
  };
  const close = () => {
    reset();
    onClose();
  };
  const canSave = name.trim().length > 0;

  const handleSave = () => {
    if (!canSave) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onSave({
      id: uid(),
      name: name.trim(),
      category,
      severity,
      hasEpipen,
      note: note.trim() || undefined,
    });
    reset();
  };

  const toggle = (k: string) => setExpanded((p) => (p === k ? null : k));

  return (
    <SheetShell
      visible={visible}
      title="Yeni Alerji"
      onClose={close}
      onSave={handleSave}
      saveDisabled={!canSave}
    >
      <SheetBody>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Section caption="İSİM" first>
            <TextField
              label="İsim"
              value={name}
              onChangeText={setName}
              placeholder="Örn. Penisilin"
            />
          </Section>

          <Section caption="DETAY">
            <PickerRow
              label="Kategori"
              value={category}
              options={asOptions(ALLERGY_CATEGORIES)}
              onChange={setCategory}
              expanded={expanded === 'category'}
              onToggle={() => toggle('category')}
            />
            <PickerRow
              label="Şiddet"
              value={severity}
              options={asOptions(ALLERGY_SEVERITIES)}
              onChange={setSeverity}
              expanded={expanded === 'severity'}
              onToggle={() => toggle('severity')}
            />
            <ToggleRow
              label="EpiPen taşıyor"
              description="Acil durumda kullanılabilir"
              value={hasEpipen}
              onValueChange={setHasEpipen}
            />
          </Section>

          <Section caption="NOT">
            <MultilineTextField
              value={note}
              onChangeText={setNote}
              placeholder="İsteğe bağlı not ekle"
            />
          </Section>
        </ScrollView>
      </SheetBody>
    </SheetShell>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// 3. MedicationAddSheet — placeholder (UNCHANGED)

export function MedicationAddSheet({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  return (
    <SheetShell visible={visible} title="İlaç Ekle" onClose={onClose} hideSave>
      <SheetBody>
        <View style={styles.placeholderWrap}>
          <Text style={{ fontSize: 48, marginBottom: 12 }}>💊</Text>
          <Text allowFontScaling={false} style={styles.placeholderTitle}>
            İlaçlar ayrı sayfada yönetilir
          </Text>
          <Text allowFontScaling={false} style={styles.placeholderBody}>
            Doz, saat, hatırlatıcı ve stok bilgileri için "İlaç" sekmesini aç.
          </Text>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              onClose();
            }}
            style={({ pressed }) => [
              styles.cta,
              { opacity: pressed ? 0.85 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] },
            ]}
          >
            <Text allowFontScaling={false} style={styles.ctaText}>
              Tamam
            </Text>
          </Pressable>
        </View>
      </SheetBody>
    </SheetShell>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// 4. VaccineAddSheet

export function VaccineAddSheet({
  visible,
  onClose,
  onSave,
}: {
  visible: boolean;
  onClose: () => void;
  onSave: (v: Vaccine) => void;
}) {
  const [name, setName] = useState('');
  const [administeredAt, setAdministeredAt] = useState(todayKey());
  const [doseStr, setDoseStr] = useState('');
  const [notes, setNotes] = useState('');

  const reset = () => {
    setName('');
    setAdministeredAt(todayKey());
    setDoseStr('');
    setNotes('');
  };
  const close = () => {
    reset();
    onClose();
  };
  const canSave = name.trim().length > 0;

  const handleSave = () => {
    if (!canSave) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const dose = parseInt(doseStr, 10);
    onSave({
      id: uid(),
      name: name.trim(),
      administeredAt,
      dose: Number.isFinite(dose) && dose > 0 ? dose : undefined,
      notes: notes.trim() || undefined,
    });
    reset();
  };

  return (
    <SheetShell
      visible={visible}
      title="Yeni Aşı"
      onClose={close}
      onSave={handleSave}
      saveDisabled={!canSave}
    >
      <SheetBody>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Section caption="İSİM" first>
            <TextField
              label="İsim"
              value={name}
              onChangeText={setName}
              placeholder="Örn. Tetanos"
            />
          </Section>

          <Section caption="DETAY">
            <DateField
              label="Yapıldığı tarih"
              value={administeredAt}
              onChangeText={setAdministeredAt}
            />
            <TextField
              label="Doz numarası"
              value={doseStr}
              onChangeText={(t) => setDoseStr(t.replace(/[^0-9]/g, ''))}
              placeholder="Örn. 1"
              keyboardType="number-pad"
            />
          </Section>

          <Section caption="NOT">
            <MultilineTextField
              value={notes}
              onChangeText={setNotes}
              placeholder="İsteğe bağlı not ekle"
            />
          </Section>
        </ScrollView>
      </SheetBody>
    </SheetShell>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// 5. ChronicConditionAddSheet

export function ChronicConditionAddSheet({
  visible,
  onClose,
  onSave,
}: {
  visible: boolean;
  onClose: () => void;
  onSave: (c: ChronicCondition) => void;
}) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<ConditionCategory>('Metabolik');
  const [severity, setSeverity] = useState<Severity>(1);
  const [status, setStatus] = useState<ConditionStatus>('Aktif');
  const [region, setRegion] = useState('');
  const [note, setNote] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);

  const reset = () => {
    setName('');
    setCategory('Metabolik');
    setSeverity(1);
    setStatus('Aktif');
    setRegion('');
    setNote('');
    setExpanded(null);
  };
  const close = () => {
    reset();
    onClose();
  };
  const canSave = name.trim().length > 0;

  const handleSave = () => {
    if (!canSave) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onSave({
      id: uid(),
      name: name.trim(),
      category,
      severity,
      status,
      region: region.trim() || undefined,
      note: note.trim() || undefined,
    });
    reset();
  };

  const toggle = (k: string) => setExpanded((p) => (p === k ? null : k));

  const severityOptions = ([1, 2, 3, 4] as Severity[]).map((lvl) => ({
    value: String(lvl) as `${Severity}`,
    label: SEVERITY_LABELS[lvl],
  }));

  return (
    <SheetShell
      visible={visible}
      title="Yeni Rahatsızlık"
      onClose={close}
      onSave={handleSave}
      saveDisabled={!canSave}
    >
      <SheetBody>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Section caption="İSİM" first>
            <TextField
              label="İsim"
              value={name}
              onChangeText={setName}
              placeholder="Örn. Tip 2 Diyabet"
            />
          </Section>

          <Section caption="DETAY">
            <PickerRow
              label="Kategori"
              value={category}
              options={asOptions(CONDITION_CATEGORIES)}
              onChange={setCategory}
              expanded={expanded === 'category'}
              onToggle={() => toggle('category')}
            />
            <PickerRow
              label="Şiddet"
              value={String(severity) as `${Severity}`}
              options={severityOptions}
              onChange={(v) => setSeverity(parseInt(v, 10) as Severity)}
              expanded={expanded === 'severity'}
              onToggle={() => toggle('severity')}
            />
            <PickerRow
              label="Durum"
              value={status}
              options={asOptions(CONDITION_STATUSES)}
              onChange={setStatus}
              expanded={expanded === 'status'}
              onToggle={() => toggle('status')}
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

          <Section caption="NOT">
            <MultilineTextField
              value={note}
              onChangeText={setNote}
              placeholder="İsteğe bağlı not ekle"
            />
          </Section>
        </ScrollView>
      </SheetBody>
    </SheetShell>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// 6. SubstanceAddSheet

export function SubstanceAddSheet({
  visible,
  onClose,
  onSave,
}: {
  visible: boolean;
  onClose: () => void;
  onSave: (s: SubstanceUI) => void;
}) {
  const [type, setType] = useState<SubstanceTypeId>('smoking');
  const [status, setStatus] = useState<SubstanceStatusLabel>('Devam ediyor');
  const [frequency, setFreq] = useState<SubstanceFrequencyLabel>('Günlük');
  const [amountStr, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);

  const reset = () => {
    setType('smoking');
    setStatus('Devam ediyor');
    setFreq('Günlük');
    setAmount('');
    setNote('');
    setExpanded(null);
  };
  const close = () => {
    reset();
    onClose();
  };

  const handleSave = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const amount = parseFloat(amountStr.replace(',', '.'));
    onSave({
      id: uid(),
      type,
      status,
      frequency,
      amountPerDay: Number.isFinite(amount) && amount > 0 ? amount : undefined,
      unit:
        type === 'smoking'
          ? 'pack'
          : type === 'alcohol'
            ? 'drink'
            : type === 'caffeine'
              ? 'cup'
              : undefined,
      note: note.trim() || undefined,
    });
    reset();
  };

  const toggle = (k: string) => setExpanded((p) => (p === k ? null : k));

  const typeOptions = SUBSTANCE_TYPES.map((t) => ({ value: t.id, label: t.label, icon: t.icon }));

  const amountPlaceholder =
    type === 'smoking'
      ? 'Örn. 1 (paket)'
      : type === 'alcohol'
        ? 'Örn. 2 (kadeh)'
        : type === 'caffeine'
          ? 'Örn. 3 (bardak)'
          : 'Miktar';

  return (
    <SheetShell visible={visible} title="Bağımlılık Ekle" onClose={close} onSave={handleSave}>
      <SheetBody>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
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
              onToggle={() => toggle('type')}
            />
          </Section>

          <Section caption="DETAY">
            <PickerRow
              label="Durum"
              value={status}
              options={asOptions(SUBSTANCE_STATUSES)}
              onChange={setStatus}
              expanded={expanded === 'status'}
              onToggle={() => toggle('status')}
            />
            <PickerRow
              label="Sıklık"
              value={frequency}
              options={asOptions(SUBSTANCE_FREQUENCIES)}
              onChange={setFreq}
              expanded={expanded === 'frequency'}
              onToggle={() => toggle('frequency')}
            />
            <TextField
              label="Günde miktar"
              value={amountStr}
              onChangeText={(t) => setAmount(t.replace(/[^0-9.,]/g, ''))}
              placeholder={amountPlaceholder}
              keyboardType="decimal-pad"
            />
          </Section>

          <Section caption="NOT">
            <MultilineTextField
              value={note}
              onChangeText={setNote}
              placeholder="İsteğe bağlı not ekle"
            />
          </Section>
        </ScrollView>
      </SheetBody>
    </SheetShell>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// 7. EmergencyInfoSheet — full emergency profile (blood + donor + contact + health)

export function EmergencyInfoSheet({
  visible,
  current,
  onClose,
  onSave,
}: {
  visible: boolean;
  current?: EmergencyInfo | null;
  onClose: () => void;
  onSave: (payload: Partial<EmergencyInfo>) => void;
}) {
  const [bloodType, setBloodType] = useState<BloodType | undefined>(undefined);
  const [isOrganDonor, setIsOrganDonor] = useState(false);
  const [lastBloodDonation, setLastBloodDonation] = useState<string>('');
  const [contactName, setContactName] = useState('');
  const [contactRelation, setContactRelation] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [insurance, setInsurance] = useState('');
  const [familyDoctor, setFamilyDoctor] = useState('');
  const [hospital, setHospital] = useState('');

  // Hydrate from current whenever sheet opens
  useEffect(() => {
    if (!visible) return;
    setBloodType((current?.bloodType as BloodType | null) ?? undefined);
    setIsOrganDonor(current?.isOrganDonor ?? false);
    setLastBloodDonation(current?.lastBloodDonation ?? '');
    setContactName(current?.emergencyContactName ?? '');
    setContactRelation(current?.emergencyContactRelation ?? '');
    setContactPhone(current?.emergencyContactPhone ?? '');
    setInsurance(current?.insuranceProvider ?? '');
    setFamilyDoctor(current?.familyDoctor ?? '');
    setHospital(current?.nearestHospital ?? '');
  }, [visible, current]);

  const handleSave = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const norm = (s: string) => {
      const t = s.trim();
      return t.length > 0 ? t : null;
    };
    onSave({
      bloodType: (bloodType ?? null) as EmergencyInfo['bloodType'],
      isOrganDonor,
      lastBloodDonation:
        lastBloodDonation && lastBloodDonation.length > 0 ? lastBloodDonation : null,
      emergencyContactName: norm(contactName),
      emergencyContactRelation: norm(contactRelation),
      emergencyContactPhone: norm(contactPhone),
      insuranceProvider: norm(insurance),
      familyDoctor: norm(familyDoctor),
      nearestHospital: norm(hospital),
    });
  };

  return (
    <SheetShell visible={visible} title="Acil Bilgiler" onClose={onClose} onSave={handleSave}>
      <SheetBody>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Kan grubu — embedded grid */}
          <View style={styles.section}>
            <Text allowFontScaling={false} style={styles.caption}>
              KAN GRUBU
            </Text>
            <View style={bloodStyles.grid}>
              {BLOOD_TYPES.map((b) => (
                <BloodCell
                  key={b}
                  type={b}
                  active={bloodType === b}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setBloodType(b);
                  }}
                />
              ))}
            </View>
          </View>

          {/* Donör */}
          <Section caption="DONÖR">
            <ToggleRow
              label="Organ donörü"
              description="Acil durumda organ bağışına izin"
              value={isOrganDonor}
              onValueChange={setIsOrganDonor}
            />
            <DateField
              label="Son kan bağışı"
              value={lastBloodDonation || todayKey()}
              onChangeText={setLastBloodDonation}
            />
          </Section>

          {/* Acil iletişim */}
          <Section caption="ACİL İLETİŞİM">
            <TextField
              label="Adı"
              value={contactName}
              onChangeText={setContactName}
              placeholder="Örn. Ayşe Çadırcıoğlu"
              autoCapitalize="words"
            />
            <TextField
              label="Yakınlık"
              value={contactRelation}
              onChangeText={setContactRelation}
              placeholder="Örn. Eş, Anne, Kardeş"
              autoCapitalize="words"
            />
            <TextField
              label="Telefon"
              value={contactPhone}
              onChangeText={setContactPhone}
              placeholder="+90 5xx xxx xx xx"
              keyboardType="phone-pad"
            />
          </Section>

          {/* Sağlık */}
          <Section caption="SAĞLIK">
            <TextField
              label="Sigorta şirketi"
              value={insurance}
              onChangeText={setInsurance}
              placeholder="Örn. SGK, Allianz"
              autoCapitalize="words"
            />
            <TextField
              label="Aile hekimi"
              value={familyDoctor}
              onChangeText={setFamilyDoctor}
              placeholder="Dr. Ad Soyad"
              autoCapitalize="words"
            />
            <TextField
              label="En yakın hastane"
              value={hospital}
              onChangeText={setHospital}
              placeholder="Örn. Acıbadem Maslak"
              autoCapitalize="words"
            />
          </Section>
        </ScrollView>
      </SheetBody>
    </SheetShell>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// 8. SurgeryAddSheet

export function SurgeryAddSheet({
  visible,
  onClose,
  onSave,
}: {
  visible: boolean;
  onClose: () => void;
  onSave: (s: SurgeryUI) => void;
}) {
  const [name, setName] = useState('');
  const [performedAt, setPerformedAt] = useState(todayKey());
  const [hospital, setHospital] = useState('');
  const [surgeon, setSurgeon] = useState('');
  const [region, setRegion] = useState('');
  const [recovery, setRecovery] = useState('');

  const reset = () => {
    setName('');
    setPerformedAt(todayKey());
    setHospital('');
    setSurgeon('');
    setRegion('');
    setRecovery('');
  };
  const close = () => {
    reset();
    onClose();
  };
  const canSave = name.trim().length > 0;

  const handleSave = () => {
    if (!canSave) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onSave({
      id: uid(),
      name: name.trim(),
      performedAt,
      hospital: hospital.trim() || undefined,
      surgeon: surgeon.trim() || undefined,
      region: region.trim() || undefined,
      recoveryNotes: recovery.trim() || undefined,
    });
    reset();
  };

  return (
    <SheetShell
      visible={visible}
      title="Yeni Ameliyat"
      onClose={close}
      onSave={handleSave}
      saveDisabled={!canSave}
    >
      <SheetBody>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Section caption="AMELİYAT" first>
            <TextField
              label="Ameliyat adı"
              value={name}
              onChangeText={setName}
              placeholder="Örn. Apandist"
            />
            <DateField label="Yapıldığı tarih" value={performedAt} onChangeText={setPerformedAt} />
          </Section>

          <Section caption="DETAY">
            <TextField
              label="Hastane"
              value={hospital}
              onChangeText={setHospital}
              placeholder="İsteğe bağlı"
            />
            <TextField
              label="Cerrah"
              value={surgeon}
              onChangeText={setSurgeon}
              placeholder="İsteğe bağlı"
            />
            <TextField
              label="Bölge"
              value={region}
              onChangeText={setRegion}
              placeholder="Örn. Sol diz"
            />
          </Section>

          <Section caption="TOPARLANMA NOTU">
            <MultilineTextField
              value={recovery}
              onChangeText={setRecovery}
              placeholder="İsteğe bağlı not ekle"
            />
          </Section>
        </ScrollView>
      </SheetBody>
    </SheetShell>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// 9. FamilyHistoryAddSheet

export function FamilyHistoryAddSheet({
  visible,
  onClose,
  onSave,
}: {
  visible: boolean;
  onClose: () => void;
  onSave: (f: FamilyHistoryUI) => void;
}) {
  const [relation, setRelation] = useState<FamilyRelationId>('mother');
  const [conditionName, setConditionName] = useState('');
  const [ageStr, setAgeStr] = useState('');
  const [notes, setNotes] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);

  const reset = () => {
    setRelation('mother');
    setConditionName('');
    setAgeStr('');
    setNotes('');
    setExpanded(null);
  };
  const close = () => {
    reset();
    onClose();
  };
  const canSave = conditionName.trim().length > 0;

  const handleSave = () => {
    if (!canSave) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const age = parseInt(ageStr, 10);
    onSave({
      id: uid(),
      relation,
      conditionName: conditionName.trim(),
      ageAtDiagnosis: Number.isFinite(age) && age > 0 ? age : undefined,
      notes: notes.trim() || undefined,
    });
    reset();
  };

  const toggle = (k: string) => setExpanded((p) => (p === k ? null : k));

  const relationOptions = FAMILY_RELATIONS.map((r) => ({ value: r.id, label: r.label }));

  return (
    <SheetShell
      visible={visible}
      title="Yeni Aile Üyesi"
      onClose={close}
      onSave={handleSave}
      saveDisabled={!canSave}
    >
      <SheetBody>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Section caption="YAKINLIK" first>
            <PickerRow
              label="Yakınlık"
              value={relation}
              options={relationOptions}
              onChange={setRelation}
              expanded={expanded === 'relation'}
              onToggle={() => toggle('relation')}
            />
          </Section>

          <Section caption="HASTALIK">
            <TextField
              label="Hastalık"
              value={conditionName}
              onChangeText={setConditionName}
              placeholder="Örn. Tip 2 Diyabet"
            />
            <TextField
              label="Tanı yaşı"
              value={ageStr}
              onChangeText={(t) => setAgeStr(t.replace(/[^0-9]/g, ''))}
              placeholder="İsteğe bağlı"
              keyboardType="number-pad"
            />
          </Section>

          <Section caption="NOT">
            <MultilineTextField
              value={notes}
              onChangeText={setNotes}
              placeholder="İsteğe bağlı not ekle"
            />
          </Section>
        </ScrollView>
      </SheetBody>
    </SheetShell>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// 10. VisionHearingSheet (singleton, upsert)

export function VisionHearingSheet({
  visible,
  current,
  onClose,
  onSave,
}: {
  visible: boolean;
  current?: VisionHearingUI;
  onClose: () => void;
  onSave: (v: VisionHearingUI) => void;
}) {
  const [wearsGlasses, setWearsGlasses] = useState(false);
  const [usesContactLenses, setUsesContacts] = useState(false);
  const [leftStr, setLeftStr] = useState('');
  const [rightStr, setRightStr] = useState('');
  const [usesHearingAid, setUsesHearingAid] = useState(false);
  const [lastEyeExam, setLastEyeExam] = useState(todayKey());
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!visible) return;
    setWearsGlasses(current?.wearsGlasses ?? false);
    setUsesContacts(current?.usesContactLenses ?? false);
    setLeftStr(current?.leftEyePower != null ? String(current.leftEyePower) : '');
    setRightStr(current?.rightEyePower != null ? String(current.rightEyePower) : '');
    setUsesHearingAid(current?.usesHearingAid ?? false);
    setLastEyeExam(current?.lastEyeExam ?? todayKey());
    setNotes(current?.notes ?? '');
  }, [visible, current]);

  const handleSave = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const left = parseFloat(leftStr.replace(',', '.'));
    const right = parseFloat(rightStr.replace(',', '.'));
    onSave({
      wearsGlasses,
      usesContactLenses,
      leftEyePower: Number.isFinite(left) ? left : undefined,
      rightEyePower: Number.isFinite(right) ? right : undefined,
      usesHearingAid,
      lastEyeExam,
      notes: notes.trim() || undefined,
    });
  };

  return (
    <SheetShell visible={visible} title="Görme & İşitme" onClose={onClose} onSave={handleSave}>
      <SheetBody>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Section caption="GÖRME" first>
            <ToggleRow
              label="Gözlük takıyor"
              value={wearsGlasses}
              onValueChange={setWearsGlasses}
            />
            <ToggleRow
              label="Lens takıyor"
              value={usesContactLenses}
              onValueChange={setUsesContacts}
            />
            <TextField
              label="Sol göz"
              value={leftStr}
              onChangeText={(t) => setLeftStr(t.replace(/[^0-9.,\-]/g, ''))}
              placeholder="Örn. -2.50"
              keyboardType="numbers-and-punctuation"
            />
            <TextField
              label="Sağ göz"
              value={rightStr}
              onChangeText={(t) => setRightStr(t.replace(/[^0-9.,\-]/g, ''))}
              placeholder="Örn. -1.75"
              keyboardType="numbers-and-punctuation"
            />
            <DateField
              label="Son göz muayenesi"
              value={lastEyeExam}
              onChangeText={setLastEyeExam}
            />
          </Section>

          <Section caption="İŞİTME">
            <ToggleRow
              label="İşitme cihazı kullanıyor"
              value={usesHearingAid}
              onValueChange={setUsesHearingAid}
            />
          </Section>

          <Section caption="NOT">
            <MultilineTextField
              value={notes}
              onChangeText={setNotes}
              placeholder="İsteğe bağlı not ekle"
            />
          </Section>
        </ScrollView>
      </SheetBody>
    </SheetShell>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// 11. DentalHealthSheet (singleton, upsert)

export function DentalHealthSheet({
  visible,
  current,
  onClose,
  onSave,
}: {
  visible: boolean;
  current?: DentalHealthUI;
  onClose: () => void;
  onSave: (d: DentalHealthUI) => void;
}) {
  const [lastCheckup, setLastCheckup] = useState(todayKey());
  const [hasOrthodontics, setHasOrthodontics] = useState(false);
  const [hasImplants, setHasImplants] = useState(false);
  const [hasFillings, setHasFillings] = useState(false);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!visible) return;
    setLastCheckup(current?.lastCheckup ?? todayKey());
    setHasOrthodontics(current?.hasOrthodontics ?? false);
    setHasImplants(current?.hasImplants ?? false);
    setHasFillings(current?.hasFillings ?? false);
    setNotes(current?.notes ?? '');
  }, [visible, current]);

  const handleSave = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onSave({
      lastCheckup,
      hasOrthodontics,
      hasImplants,
      hasFillings,
      notes: notes.trim() || undefined,
    });
  };

  return (
    <SheetShell visible={visible} title="Diş Sağlığı" onClose={onClose} onSave={handleSave}>
      <SheetBody>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Section caption="KONTROL" first>
            <DateField label="Son diş kontrolü" value={lastCheckup} onChangeText={setLastCheckup} />
          </Section>

          <Section caption="DURUM">
            <ToggleRow
              label="Tel takıyor"
              value={hasOrthodontics}
              onValueChange={setHasOrthodontics}
            />
            <ToggleRow label="İmplant var" value={hasImplants} onValueChange={setHasImplants} />
            <ToggleRow label="Dolgu var" value={hasFillings} onValueChange={setHasFillings} />
          </Section>

          <Section caption="NOT">
            <MultilineTextField
              value={notes}
              onChangeText={setNotes}
              placeholder="İsteğe bağlı not ekle"
            />
          </Section>
        </ScrollView>
      </SheetBody>
    </SheetShell>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// 12. ChildhoodIllnessAddSheet

export function ChildhoodIllnessAddSheet({
  visible,
  onClose,
  onSave,
}: {
  visible: boolean;
  onClose: () => void;
  onSave: (c: ChildhoodIllnessUI) => void;
}) {
  const [name, setName] = useState('');
  const [ageStr, setAgeStr] = useState('');
  const [severity, setSeverity] = useState<ChildhoodSeverityLabel>('Hafif');
  const [hadComplications, setHadComplications] = useState(false);
  const [notes, setNotes] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);

  const reset = () => {
    setName('');
    setAgeStr('');
    setSeverity('Hafif');
    setHadComplications(false);
    setNotes('');
    setExpanded(null);
  };
  const close = () => {
    reset();
    onClose();
  };
  const canSave = name.trim().length > 0;

  const handleSave = () => {
    if (!canSave) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const age = parseInt(ageStr, 10);
    onSave({
      id: uid(),
      name: name.trim(),
      ageAtIllness: Number.isFinite(age) && age > 0 ? age : undefined,
      severity,
      hadComplications,
      notes: notes.trim() || undefined,
    });
    reset();
  };

  const toggle = (k: string) => setExpanded((p) => (p === k ? null : k));

  return (
    <SheetShell
      visible={visible}
      title="Yeni Çocukluk Hastalığı"
      onClose={close}
      onSave={handleSave}
      saveDisabled={!canSave}
    >
      <SheetBody>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Section caption="HASTALIK" first>
            <TextField
              label="Hastalık"
              value={name}
              onChangeText={setName}
              placeholder="Örn. Suçiçeği"
            />
            <TextField
              label="Geçirildiği yaş"
              value={ageStr}
              onChangeText={(t) => setAgeStr(t.replace(/[^0-9]/g, ''))}
              placeholder="İsteğe bağlı"
              keyboardType="number-pad"
            />
          </Section>

          <Section caption="DETAY">
            <PickerRow
              label="Şiddet"
              value={severity}
              options={asOptions(CHILDHOOD_SEVERITIES)}
              onChange={setSeverity}
              expanded={expanded === 'severity'}
              onToggle={() => toggle('severity')}
            />
            <ToggleRow
              label="Komplikasyon oldu"
              value={hadComplications}
              onValueChange={setHadComplications}
            />
          </Section>

          <Section caption="NOT">
            <MultilineTextField
              value={notes}
              onChangeText={setNotes}
              placeholder="İsteğe bağlı not ekle"
            />
          </Section>
        </ScrollView>
      </SheetBody>
    </SheetShell>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// 13. LifeStateSheet (singleton, upsert)

export function LifeStateSheet({
  visible,
  current,
  onClose,
  onSave,
}: {
  visible: boolean;
  current?: LifeStateUI;
  onClose: () => void;
  onSave: (l: LifeStateUI) => void;
}) {
  const [isPregnant, setIsPregnant] = useState(false);
  const [pregWeekStr, setPregWeekStr] = useState('');
  const [isBreastfeeding, setIsBreastfeeding] = useState(false);
  const [hasDisability, setHasDisability] = useState(false);
  const [disabilityType, setDisabilityType] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!visible) return;
    setIsPregnant(current?.isPregnant ?? false);
    setPregWeekStr(current?.pregnancyWeek != null ? String(current.pregnancyWeek) : '');
    setIsBreastfeeding(current?.isBreastfeeding ?? false);
    setHasDisability(current?.hasDisability ?? false);
    setDisabilityType(current?.disabilityType ?? '');
    setNotes(current?.notes ?? '');
  }, [visible, current]);

  const handleSave = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const week = parseInt(pregWeekStr, 10);
    onSave({
      isPregnant,
      pregnancyWeek: isPregnant && Number.isFinite(week) && week > 0 ? week : undefined,
      isBreastfeeding,
      hasDisability,
      disabilityType: hasDisability ? disabilityType.trim() || undefined : undefined,
      notes: notes.trim() || undefined,
    });
  };

  return (
    <SheetShell visible={visible} title="Yaşam Durumu" onClose={onClose} onSave={handleSave}>
      <SheetBody>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Section caption="HAMİLELİK" first>
            <ToggleRow label="Hamilelik" value={isPregnant} onValueChange={setIsPregnant} />
            {isPregnant ? (
              <TextField
                label="Kaçıncı hafta"
                value={pregWeekStr}
                onChangeText={(t) => setPregWeekStr(t.replace(/[^0-9]/g, ''))}
                placeholder="Örn. 24"
                keyboardType="number-pad"
              />
            ) : null}
            <ToggleRow
              label="Emziriyor"
              value={isBreastfeeding}
              onValueChange={setIsBreastfeeding}
            />
          </Section>

          <Section caption="ENGELLİLİK">
            <ToggleRow
              label="Engellilik durumu"
              value={hasDisability}
              onValueChange={setHasDisability}
            />
            {hasDisability ? (
              <MultilineTextField
                value={disabilityType}
                onChangeText={setDisabilityType}
                placeholder="Engellilik notu"
              />
            ) : null}
          </Section>

          <Section caption="NOT">
            <MultilineTextField
              value={notes}
              onChangeText={setNotes}
              placeholder="İsteğe bağlı not ekle"
            />
          </Section>
        </ScrollView>
      </SheetBody>
    </SheetShell>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// 14. PhysicalProfileSheet (singleton, upsert)

export function PhysicalProfileSheet({
  visible,
  current,
  onClose,
  onSave,
}: {
  visible: boolean;
  current?: PhysicalProfileUI;
  onClose: () => void;
  onSave: (p: PhysicalProfileUI) => void;
}) {
  const [somatotype, setSomatotype] = useState<SomatotypeId>('unknown');
  const [dominantHand, setDominantHand] = useState<DominantHandId>('right');
  const [sensitivities, setSensitivities] = useState('');
  const [notes, setNotes] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    setSomatotype((current?.somatotype as SomatotypeId) ?? 'unknown');
    setDominantHand((current?.dominantHand as DominantHandId) ?? 'right');
    setSensitivities(current?.sensitivities ?? '');
    setNotes(current?.notes ?? '');
    setExpanded(null);
  }, [visible, current]);

  const handleSave = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onSave({
      somatotype,
      dominantHand,
      sensitivities: sensitivities.trim() || undefined,
      notes: notes.trim() || undefined,
    });
  };

  const toggle = (k: string) => setExpanded((p) => (p === k ? null : k));

  const somatotypeOptions = SOMATOTYPES.map((s) => ({ value: s.id, label: s.label }));
  const handOptions = DOMINANT_HANDS.map((h) => ({ value: h.id, label: h.label }));

  return (
    <SheetShell visible={visible} title="Fiziksel Profil" onClose={onClose} onSave={handleSave}>
      <SheetBody>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Section caption="VÜCUT" first>
            <PickerRow
              label="Vücut tipi"
              value={somatotype}
              options={somatotypeOptions}
              onChange={setSomatotype}
              expanded={expanded === 'somatotype'}
              onToggle={() => toggle('somatotype')}
            />
            <PickerRow
              label="Baskın el"
              value={dominantHand}
              options={handOptions}
              onChange={setDominantHand}
              expanded={expanded === 'hand'}
              onToggle={() => toggle('hand')}
            />
          </Section>

          <Section caption="HASSASİYETLER">
            <TextField
              label="Hassasiyetler"
              value={sensitivities}
              onChangeText={setSensitivities}
              placeholder="Örn. polen, toz"
            />
          </Section>

          <Section caption="NOT">
            <MultilineTextField
              value={notes}
              onChangeText={setNotes}
              placeholder="İsteğe bağlı not ekle"
            />
          </Section>
        </ScrollView>
      </SheetBody>
    </SheetShell>
  );
}

// ──────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  scrollContent: {
    paddingTop: 12,
    paddingBottom: 40,
  },
  section: {
    marginTop: 12,
  },
  caption: {
    fontSize: 11,
    fontWeight: '700',
    color: SUBTEXT,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginLeft: 32,
    marginRight: 32,
    marginBottom: 6,
  },
  // Placeholder (medication)
  placeholderWrap: {
    padding: 24,
    paddingTop: 32,
    alignItems: 'center',
    backgroundColor: BG,
    flex: 1,
  },
  placeholderTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: TEXT,
    textAlign: 'center',
    letterSpacing: -0.4,
  },
  placeholderBody: {
    fontSize: 14,
    color: SUBTEXT,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 12,
  },
  cta: {
    marginTop: 24,
    backgroundColor: ACCENT,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 32,
  },
  ctaText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
});

const bloodStyles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 12,
  },
  cell: {
    aspectRatio: 1.1,
    borderRadius: 14,
    backgroundColor: BG,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  cellActive: {
    backgroundColor: ACCENT,
    borderColor: ACCENT,
  },
  text: {
    fontSize: 19,
    fontWeight: '700',
    color: TEXT,
    letterSpacing: -0.4,
  },
});

// ──────────────────────────────────────────────────────────────────────────────
// BloodWorkAddSheet — Kan değerleri manuel giriş formu
// ──────────────────────────────────────────────────────────────────────────────

const BLOOD_GROUPS: Array<{
  caption: string;
  params: Array<{
    key: string;
    label: string;
    unit: string;
    min: number;
    max: number;
    placeholder: string;
  }>;
}> = [
  {
    caption: 'TAM KAN SAYIMI',
    params: [
      {
        key: 'hemoglobin',
        label: 'Hemoglobin',
        unit: 'g/dL',
        min: 13.5,
        max: 17.5,
        placeholder: '13.5–17.5',
      },
      { key: 'hematocrit', label: 'Hematokrit', unit: '%', min: 40, max: 52, placeholder: '40–52' },
      {
        key: 'whiteBloodCells',
        label: 'Akyuvar',
        unit: 'K/µL',
        min: 4,
        max: 11,
        placeholder: '4.0–11.0',
      },
      {
        key: 'platelets',
        label: 'Trombosit',
        unit: 'K/µL',
        min: 150,
        max: 400,
        placeholder: '150–400',
      },
    ],
  },
  {
    caption: 'METABOLİZMA',
    params: [
      { key: 'glucose', label: 'Glukoz', unit: 'mg/dL', min: 70, max: 100, placeholder: '70–100' },
      {
        key: 'creatinine',
        label: 'Kreatinin',
        unit: 'mg/dL',
        min: 0.6,
        max: 1.2,
        placeholder: '0.6–1.2',
      },
      { key: 'urea', label: 'Üre', unit: 'mg/dL', min: 7, max: 25, placeholder: '7–25' },
      { key: 'sodium', label: 'Sodyum', unit: 'mEq/L', min: 136, max: 145, placeholder: '136–145' },
      {
        key: 'potassium',
        label: 'Potasyum',
        unit: 'mEq/L',
        min: 3.5,
        max: 5.1,
        placeholder: '3.5–5.1',
      },
    ],
  },
  {
    caption: 'LİPİD PANELİ',
    params: [
      {
        key: 'cholesterol',
        label: 'Total Kolesterol',
        unit: 'mg/dL',
        min: 0,
        max: 200,
        placeholder: '<200',
      },
      { key: 'ldl', label: 'LDL', unit: 'mg/dL', min: 0, max: 100, placeholder: '<100' },
      { key: 'hdl', label: 'HDL', unit: 'mg/dL', min: 40, max: 60, placeholder: '>40' },
      {
        key: 'triglycerides',
        label: 'Trigliserit',
        unit: 'mg/dL',
        min: 0,
        max: 150,
        placeholder: '<150',
      },
    ],
  },
  {
    caption: 'KARACİĞER',
    params: [
      { key: 'alt', label: 'ALT (SGPT)', unit: 'U/L', min: 7, max: 40, placeholder: '7–40' },
      { key: 'ast', label: 'AST (SGOT)', unit: 'U/L', min: 10, max: 40, placeholder: '10–40' },
      { key: 'ggt', label: 'GGT', unit: 'U/L', min: 9, max: 48, placeholder: '9–48' },
      {
        key: 'bilirubin',
        label: 'Bilirubin',
        unit: 'mg/dL',
        min: 0.2,
        max: 1.2,
        placeholder: '0.2–1.2',
      },
    ],
  },
  {
    caption: 'DEMİR & MİNERAL',
    params: [
      { key: 'iron', label: 'Demir', unit: 'µg/dL', min: 60, max: 170, placeholder: '60–170' },
      {
        key: 'magnesium',
        label: 'Magnezyum',
        unit: 'mg/dL',
        min: 1.7,
        max: 2.2,
        placeholder: '1.7–2.2',
      },
      {
        key: 'calcium',
        label: 'Kalsiyum',
        unit: 'mg/dL',
        min: 8.5,
        max: 10.5,
        placeholder: '8.5–10.5',
      },
    ],
  },
];

function bwStatusColor(value: number, min: number, max: number): string {
  if (value < min) return (min - value) / min > 0.2 ? '#FF3B30' : '#FF9F0A';
  if (value > max) return (value - max) / max > 0.2 ? '#FF3B30' : '#FF9F0A';
  return '#34C759';
}

function StatusDot({ value, min, max }: { value: number; min: number; max: number }) {
  return (
    <View
      style={{
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: bwStatusColor(value, min, max),
        marginLeft: 6,
        flexShrink: 0,
      }}
    />
  );
}

export function BloodWorkAddSheet({
  visible,
  onClose,
  onSave,
}: {
  visible: boolean;
  onClose: () => void;
  onSave: (values: Record<string, number | null>, testDate: string, lab: string) => void;
}) {
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const [values, setValues] = useState<Record<string, string>>({});
  const [testDate, setTestDate] = useState(todayStr);
  const [lab, setLab] = useState('');

  const setVal = (key: string, v: string) => setValues((prev) => ({ ...prev, [key]: v }));

  const filledCount = Object.values(values).filter((v) => v.trim() !== '').length;
  const canSave = filledCount > 0;

  const handleSave = () => {
    const parsed: Record<string, number | null> = {};
    for (const group of BLOOD_GROUPS) {
      for (const p of group.params) {
        const raw = values[p.key]?.trim();
        parsed[p.key] = raw ? parseFloat(raw.replace(',', '.')) || null : null;
      }
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onSave(parsed, testDate, lab);
  };

  return (
    <SheetShell
      visible={visible}
      title="Kan Değerleri"
      onClose={onClose}
      onSave={handleSave}
      saveLabel="Kaydet"
      saveDisabled={!canSave}
    >
      <SheetBody>
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <Section caption="TAHLİL BİLGİSİ" first>
            <DateField label="Tarih" value={testDate} onChangeText={setTestDate} />
            <TextField
              label="Laboratuvar"
              value={lab}
              onChangeText={setLab}
              placeholder="İsteğe bağlı"
              autoCapitalize="words"
            />
          </Section>

          {BLOOD_GROUPS.map((group) => (
            <Section key={group.caption} caption={group.caption}>
              {group.params.map((p) => {
                const raw = values[p.key]?.trim() ?? '';
                const num = raw ? parseFloat(raw.replace(',', '.')) : null;
                const hasValue = num !== null && !isNaN(num);
                return (
                  <View key={p.key} style={bwS.row}>
                    <Text allowFontScaling={false} style={bwS.label}>
                      {p.label}
                    </Text>
                    <View style={bwS.right}>
                      <TextInput
                        value={values[p.key] ?? ''}
                        onChangeText={(v) => setVal(p.key, v)}
                        placeholder={p.placeholder}
                        placeholderTextColor="#C7C7CC"
                        keyboardType="decimal-pad"
                        allowFontScaling={false}
                        style={bwS.input}
                      />
                      <Text allowFontScaling={false} style={bwS.unit}>
                        {p.unit}
                      </Text>
                      {hasValue && <StatusDot value={num!} min={p.min} max={p.max} />}
                    </View>
                  </View>
                );
              })}
            </Section>
          ))}

          <View style={{ height: 40 }} />
        </ScrollView>
      </SheetBody>
    </SheetShell>
  );
}

const bwS = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  label: {
    fontSize: 15,
    color: TEXT,
    letterSpacing: -0.24,
    flex: 1,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  input: {
    fontSize: 15,
    color: TEXT,
    letterSpacing: -0.24,
    textAlign: 'right',
    minWidth: 72,
    paddingVertical: 0,
  },
  unit: {
    fontSize: 13,
    color: SUBTEXT,
    letterSpacing: -0.08,
    minWidth: 46,
    textAlign: 'left',
  },
});

// ──────────────────────────────────────────────────────────────────────────────
// HealthEventAddSheet — geçici/akut hastalıklar (migren, ishal, grip, vs.)
// ──────────────────────────────────────────────────────────────────────────────

const HEALTH_EVENT_TYPES: Array<{ id: string; label: string; icon: string }> = [
  { id: 'diarrhea', label: 'İshal', icon: '🚽' },
  { id: 'constipation', label: 'Kabızlık', icon: '🪨' },
  { id: 'migraine', label: 'Migren', icon: '🤕' },
  { id: 'headache', label: 'Baş ağrısı', icon: '🧠' },
  { id: 'nausea', label: 'Mide bulantısı', icon: '🤢' },
  { id: 'fever', label: 'Ateş', icon: '🌡️' },
  { id: 'cough', label: 'Öksürük', icon: '😷' },
  { id: 'dizziness', label: 'Baş dönmesi', icon: '💫' },
  { id: 'flu', label: 'Üşütme/Grip', icon: '🤧' },
  { id: 'stomachache', label: 'Mide ağrısı', icon: '🍽️' },
  { id: 'back_pain_episode', label: 'Bel ağrısı krizi', icon: '🦴' },
  { id: 'allergic_reaction', label: 'Alerjik', icon: '🚨' },
  { id: 'fatigue', label: 'Halsizlik', icon: '😴' },
  { id: 'other', label: 'Diğer', icon: '➕' },
];

const HEALTH_EVENT_TRIGGERS: Array<{ id: string; label: string; icon: string }> = [
  { id: 'food', label: 'Yemek', icon: '🍔' },
  { id: 'stress', label: 'Stres', icon: '😰' },
  { id: 'sleep', label: 'Uyku eksikliği', icon: '😴' },
  { id: 'weather', label: 'Hava değişimi', icon: '🌧️' },
  { id: 'menstruation', label: 'Regl', icon: '🩸' },
  { id: 'alcohol', label: 'Alkol', icon: '🍷' },
  { id: 'caffeine', label: 'Kafein', icon: '☕' },
  { id: 'medication', label: 'İlaç', icon: '💊' },
  { id: 'exercise', label: 'Egzersiz', icon: '🏃' },
  { id: 'unknown', label: 'Bilinmiyor', icon: '❓' },
];

const HEALTH_EVENT_TREATMENTS: Array<{ id: string; label: string; icon: string }> = [
  { id: 'paracetamol', label: 'Parol', icon: '💊' },
  { id: 'ibuprofen', label: 'İbuprofen', icon: '💊' },
  { id: 'antibiotic', label: 'Antibiyotik', icon: '💉' },
  { id: 'rest', label: 'Dinlendim', icon: '🛌' },
  { id: 'water', label: 'Su içtim', icon: '💧' },
  { id: 'hot_compress', label: 'Sıcak kompres', icon: '🔥' },
  { id: 'cold_compress', label: 'Soğuk kompres', icon: '🧊' },
  { id: 'probiotic', label: 'Probiyotik', icon: '🦠' },
  { id: 'doctor', label: 'Doktora gittim', icon: '👨‍⚕️' },
  { id: 'other', label: 'Diğer', icon: '📝' },
];

const SEVERITY_OPTIONS: Array<{ value: number; label: string; color: string }> = [
  { value: 1, label: 'Hafif', color: '#FFD60A' },
  { value: 2, label: 'Orta', color: '#FF9F0A' },
  { value: 3, label: 'Şiddetli', color: '#FF3B30' },
  { value: 4, label: 'Çok şiddetli', color: '#FF1744' },
];

const HE_LAYOUT_EXPAND = {
  duration: 240,
  create: {
    type: LayoutAnimation.Types.easeInEaseOut,
    property: LayoutAnimation.Properties.opacity,
  },
  update: { type: LayoutAnimation.Types.easeInEaseOut },
  delete: {
    type: LayoutAnimation.Types.easeInEaseOut,
    property: LayoutAnimation.Properties.opacity,
  },
} as const;

function nowIso() {
  return new Date().toISOString();
}

// ─── Single-select chip (TIP) ──────────────────────────────────────────────────
function HEPickChip({
  icon,
  label,
  active,
  onPress,
}: {
  icon: string;
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const inn = () =>
    Animated.timing(scale, {
      toValue: 0.94,
      duration: 90,
      useNativeDriver: true,
      easing: EASE_MICRO,
    }).start();
  const outt = () =>
    Animated.timing(scale, {
      toValue: 1,
      duration: 130,
      useNativeDriver: true,
      easing: EASE_SPRING,
    }).start();

  return (
    <Pressable onPress={onPress} onPressIn={inn} onPressOut={outt} style={heStyles.typeCellWrap}>
      <Animated.View
        style={[
          heStyles.typeCell,
          active && { backgroundColor: ACCENT + '14', borderColor: ACCENT },
          { transform: [{ scale }] },
        ]}
      >
        <Text allowFontScaling={false} style={heStyles.typeIcon}>
          {icon}
        </Text>
        <Text
          allowFontScaling={false}
          numberOfLines={1}
          style={[heStyles.typeLabel, active && { color: ACCENT, fontWeight: '600' }]}
        >
          {label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

// ─── Multi-select chip (TETİKLEYİCİ / ÖNLEM) ──────────────────────────────────
function HEMultiChip({
  icon,
  label,
  active,
  onPress,
}: {
  icon: string;
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const inn = () =>
    Animated.timing(scale, {
      toValue: 0.95,
      duration: 90,
      useNativeDriver: true,
      easing: EASE_MICRO,
    }).start();
  const outt = () =>
    Animated.timing(scale, {
      toValue: 1,
      duration: 130,
      useNativeDriver: true,
      easing: EASE_SPRING,
    }).start();

  return (
    <Pressable onPress={onPress} onPressIn={inn} onPressOut={outt}>
      <Animated.View
        style={[
          heStyles.multiChip,
          active && { backgroundColor: ACCENT + '14', borderColor: ACCENT },
          { transform: [{ scale }] },
        ]}
      >
        <Text allowFontScaling={false} style={heStyles.multiChipIcon}>
          {icon}
        </Text>
        <Text
          allowFontScaling={false}
          style={[heStyles.multiChipLabel, active && { color: ACCENT, fontWeight: '600' }]}
        >
          {label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

// ─── Severity segmented control ───────────────────────────────────────────────
function HESeveritySegment({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <View style={heStyles.segWrap}>
      {SEVERITY_OPTIONS.map((opt) => {
        const active = value === opt.value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => {
              Haptics.selectionAsync();
              onChange(opt.value);
            }}
            style={({ pressed }) => [
              heStyles.segCell,
              active && { backgroundColor: opt.color },
              { opacity: pressed ? 0.85 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] },
            ]}
          >
            <Text
              allowFontScaling={false}
              numberOfLines={1}
              style={[heStyles.segLabel, active && { color: '#FFFFFF', fontWeight: '700' }]}
            >
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function HealthEventAddSheet({
  visible,
  onClose,
  onSave,
}: {
  visible: boolean;
  onClose: () => void;
  onSave: (payload: {
    type: string;
    customName: string | null;
    severity: number;
    startDate: string;
    endDate: string | null;
    triggers: string[];
    treatments: string[];
    note: string;
  }) => void;
}) {
  const [type, setType] = useState<string>('');
  const [customName, setCustomName] = useState('');
  const [severity, setSeverity] = useState<number>(2);
  const [startDate, setStartDate] = useState<string>(nowIso());
  const [stillOngoing, setStillOngoing] = useState(true);
  const [endDate, setEndDate] = useState<string>(nowIso());
  const [triggers, setTriggers] = useState<string[]>([]);
  const [treatments, setTreatments] = useState<string[]>([]);
  const [note, setNote] = useState('');

  // Hydrate her açılışta
  useEffect(() => {
    if (!visible) return;
    setType('');
    setCustomName('');
    setSeverity(2);
    setStartDate(nowIso());
    setStillOngoing(true);
    setEndDate(nowIso());
    setTriggers([]);
    setTreatments([]);
    setNote('');
  }, [visible]);

  const canSave = !!type && (type !== 'other' || customName.trim().length > 0);

  const pickType = (id: string) => {
    LayoutAnimation.configureNext(HE_LAYOUT_EXPAND);
    Haptics.selectionAsync();
    setType(id);
    if (id !== 'other') setCustomName('');
  };

  const toggleInList = (list: string[], setList: (l: string[]) => void, id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (list.includes(id)) setList(list.filter((x) => x !== id));
    else setList([...list, id]);
  };

  const toggleOngoing = (v: boolean) => {
    LayoutAnimation.configureNext(HE_LAYOUT_EXPAND);
    Haptics.selectionAsync();
    setStillOngoing(v);
    if (!v) setEndDate(nowIso());
  };

  // DateField çalışmak için YYYY-MM-DD format gerekir; ISO -> date-only -> ISO köprüsü.
  const isoToDateKey = (iso: string) => {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return new Date().toISOString().slice(0, 10);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };
  const dateKeyToIso = (key: string) => {
    const [y, m, dd] = key.split('-').map((x) => parseInt(x, 10));
    if (!y || !m || !dd) return new Date().toISOString();
    const d = new Date(y, m - 1, dd, 12, 0, 0);
    return d.toISOString();
  };

  const handleSave = () => {
    if (!canSave) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onSave({
      type,
      customName: type === 'other' ? customName.trim() : null,
      severity,
      startDate,
      endDate: stillOngoing ? null : endDate,
      triggers,
      treatments,
      note: note.trim(),
    });
  };

  return (
    <SheetShell
      visible={visible}
      title="Hastalık Ekle"
      onClose={onClose}
      onSave={handleSave}
      saveDisabled={!canSave}
    >
      <SheetBody>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* TIP */}
          <View style={styles.section}>
            <Text allowFontScaling={false} style={styles.caption}>
              TİP
            </Text>
            <View style={heStyles.typeGridWrap}>
              <View style={heStyles.typeGrid}>
                {HEALTH_EVENT_TYPES.map((t) => (
                  <HEPickChip
                    key={t.id}
                    icon={t.icon}
                    label={t.label}
                    active={type === t.id}
                    onPress={() => pickType(t.id)}
                  />
                ))}
              </View>
              {type === 'other' ? (
                <View style={heStyles.customNameWrap}>
                  <TextInput
                    value={customName}
                    onChangeText={setCustomName}
                    placeholder="Hastalık adı"
                    placeholderTextColor="#C7C7CC"
                    allowFontScaling={false}
                    style={heStyles.customNameInput}
                  />
                </View>
              ) : null}
            </View>
          </View>

          {/* ŞİDDET */}
          <View style={styles.section}>
            <Text allowFontScaling={false} style={styles.caption}>
              ŞİDDET
            </Text>
            <View style={heStyles.segOuter}>
              <HESeveritySegment value={severity} onChange={setSeverity} />
            </View>
          </View>

          {/* TARİH */}
          <Section caption="TARİH">
            <DateField
              label="Başlangıç"
              value={isoToDateKey(startDate)}
              onChangeText={(k) => setStartDate(dateKeyToIso(k))}
            />
            <ToggleRow
              label="Hâlâ devam ediyor"
              value={stillOngoing}
              onValueChange={toggleOngoing}
            />
            {!stillOngoing ? (
              <DateField
                label="Bitiş"
                value={isoToDateKey(endDate)}
                onChangeText={(k) => setEndDate(dateKeyToIso(k))}
              />
            ) : null}
          </Section>

          {/* TETİKLEYİCİ */}
          <View style={styles.section}>
            <Text allowFontScaling={false} style={styles.caption}>
              TETİKLEYİCİ
            </Text>
            <View style={heStyles.multiWrap}>
              {HEALTH_EVENT_TRIGGERS.map((t) => (
                <HEMultiChip
                  key={t.id}
                  icon={t.icon}
                  label={t.label}
                  active={triggers.includes(t.id)}
                  onPress={() => toggleInList(triggers, setTriggers, t.id)}
                />
              ))}
            </View>
          </View>

          {/* ALDIĞIM ÖNLEM */}
          <View style={styles.section}>
            <Text allowFontScaling={false} style={styles.caption}>
              ALDIĞIM ÖNLEM
            </Text>
            <View style={heStyles.multiWrap}>
              {HEALTH_EVENT_TREATMENTS.map((t) => (
                <HEMultiChip
                  key={t.id}
                  icon={t.icon}
                  label={t.label}
                  active={treatments.includes(t.id)}
                  onPress={() => toggleInList(treatments, setTreatments, t.id)}
                />
              ))}
            </View>
          </View>

          {/* NOT */}
          <Section caption="NOT">
            <MultilineTextField
              value={note}
              onChangeText={setNote}
              placeholder="İsteğe bağlı not"
            />
          </Section>
        </ScrollView>
      </SheetBody>
    </SheetShell>
  );
}

const heStyles = StyleSheet.create({
  // TIP grid
  typeGridWrap: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 10,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  typeCellWrap: {
    width: '33.333%',
    padding: 4,
  },
  typeCell: {
    minHeight: 72,
    borderRadius: 12,
    backgroundColor: BG,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  typeIcon: {
    fontSize: 22,
    marginBottom: 4,
  },
  typeLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: TEXT,
    letterSpacing: -0.1,
    textAlign: 'center',
  },
  customNameWrap: {
    marginTop: 8,
    marginHorizontal: 4,
    backgroundColor: BG,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  customNameInput: {
    fontSize: 16,
    color: TEXT,
    letterSpacing: -0.3,
    padding: 0,
  },

  // Şiddet segment
  segOuter: {
    marginHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 6,
  },
  segWrap: {
    flexDirection: 'row',
    backgroundColor: BG,
    borderRadius: 9,
    padding: 2,
    gap: 2,
  },
  segCell: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  segLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: TEXT,
    letterSpacing: -0.1,
  },

  // Multi-select chip wrap
  multiWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 12,
  },
  multiChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 18,
    backgroundColor: BG,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  multiChipIcon: {
    fontSize: 14,
  },
  multiChipLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: TEXT,
    letterSpacing: -0.1,
  },
});

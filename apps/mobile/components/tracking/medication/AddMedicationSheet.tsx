import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { MedIcon, MED_ICON_NAMES, MED_ICON_LABELS_TR, type MedIconName } from './MedIcons';
import type { Medication, MedScheduleMode, CreateMedicationInput } from './medicationsApi';
import { WheelPicker } from '../water/WheelPicker';
import { ColorPickerSheet } from '../water/ColorPickerSheet';

const ACCENT = '#5E5CE6';
const { height: SCREEN_H } = Dimensions.get('window');

// Doz değerleri
const DOSE_AMOUNTS = [
  0.5, 1, 1.5, 2, 2.5, 3, 4, 5, 6, 7, 8, 10, 15, 20, 25, 30, 40, 50, 75, 100, 150, 200, 250, 500,
  1000,
];
const DOSE_UNITS = [
  'tablet',
  'kapsül',
  'ml',
  'mg',
  'damla',
  'sprey',
  'puf',
  'ölçek',
  'sachet',
  'ünite',
];

// Saat seçici için
const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

const DAYS_TR_SHORT = ['Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct', 'Pz'];

const EASE_OUT_SPRING = Easing.bezier(0.16, 1, 0.3, 1);
const EASE_IN_CLOSE = Easing.bezier(0.4, 0, 1, 1);

// "1 tablet" → { amount: 1, unit: 'tablet' }
function parseDosage(s: string): { amount: number; unit: string } {
  const m = s.trim().match(/^([\d.,]+)\s*(.*)$/);
  if (!m) return { amount: 1, unit: 'tablet' };
  const amount = parseFloat(m[1]!.replace(',', '.')) || 1;
  const unit = (m[2] || 'tablet').trim().toLowerCase();
  return { amount, unit };
}
function formatDosage(amount: number, unit: string): string {
  const a = amount % 1 === 0 ? `${amount}` : `${amount}`.replace('.', ',');
  return `${a} ${unit}`;
}
function pad2(n: number): string {
  return n.toString().padStart(2, '0');
}

interface Props {
  editing: Medication | null;
  onClose: () => void;
  onSave: (input: CreateMedicationInput, editId?: string) => Promise<void>;
}

export function AddMedicationSheet({ editing, onClose, onSave }: Props) {
  const slideAnim = useRef(new Animated.Value(800)).current;
  const opAnim = useRef(new Animated.Value(0)).current;

  const initialDose = editing ? parseDosage(editing.dosage) : { amount: 1, unit: 'tablet' };

  const [name, setName] = useState(editing?.name ?? '');
  const [doseAmount, setDoseAmount] = useState(initialDose.amount);
  const [doseUnit, setDoseUnit] = useState(initialDose.unit);
  const [type, setType] = useState<MedIconName>((editing?.type as MedIconName) ?? 'tablet');
  const [color, setColor] = useState(editing?.color ?? ACCENT);
  const [scheduleMode, setScheduleMode] = useState<MedScheduleMode>(
    editing?.scheduleMode ?? 'fixed_times',
  );
  const [scheduleTimes, setScheduleTimes] = useState<string[]>(editing?.scheduleTimes ?? ['08:00']);
  const [scheduleDays, setScheduleDays] = useState<number[]>(editing?.scheduleDays ?? []);
  const [notes, setNotes] = useState(editing?.notes ?? '');
  const [stockCount, setStockCount] = useState(editing?.stockCount?.toString() ?? '');
  const [remindersOn, setRemindersOn] = useState(editing?.remindersOn ?? true);
  const [saving, setSaving] = useState(false);

  // Açık picker'lar
  const [showDosePicker, setShowDosePicker] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [editingTimeIdx, setEditingTimeIdx] = useState<number | null>(null);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 520,
        useNativeDriver: true,
        easing: EASE_OUT_SPRING,
      }),
      Animated.timing(opAnim, { toValue: 1, duration: 380, useNativeDriver: true }),
    ]).start();
  }, []);

  const close = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 800,
        duration: 460,
        useNativeDriver: true,
        easing: EASE_IN_CLOSE,
      }),
      Animated.timing(opAnim, { toValue: 0, duration: 320, useNativeDriver: true }),
    ]).start(() => onClose());
  };

  const toggleDay = (day: number) => {
    Haptics.selectionAsync();
    setScheduleDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort(),
    );
  };

  const addTime = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newTime = '12:00';
    setScheduleTimes((prev) => {
      const next = [...prev, newTime];
      setEditingTimeIdx(next.length - 1);
      return next;
    });
  };
  const removeTime = (idx: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setScheduleTimes((prev) => prev.filter((_, i) => i !== idx));
  };
  const setTimeAt = (idx: number, hh: number, mm: number) => {
    setScheduleTimes((prev) => prev.map((t, i) => (i === idx ? `${pad2(hh)}:${pad2(mm)}` : t)));
  };

  const dosageStr = formatDosage(doseAmount, doseUnit);

  const canSave =
    name.trim().length > 0 &&
    !saving &&
    (scheduleMode !== 'fixed_times' || scheduleTimes.length > 0);

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const input: CreateMedicationInput = {
      name: name.trim(),
      dosage: dosageStr,
      type,
      color,
      scheduleMode,
      scheduleTimes: scheduleMode === 'fixed_times' ? scheduleTimes : [],
      scheduleDays,
      notes: notes.trim() || undefined,
      stockCount: stockCount ? parseInt(stockCount, 10) || undefined : undefined,
      remindersOn,
    };
    await onSave(input, editing?.id);
    setSaving(false);
  };

  // Saat parse et
  const editingTime = editingTimeIdx !== null ? scheduleTimes[editingTimeIdx] : null;
  const editingHM = editingTime
    ? { h: parseInt(editingTime.split(':')[0]!, 10), m: parseInt(editingTime.split(':')[1]!, 10) }
    : null;

  return (
    <Modal transparent animationType="none" visible onRequestClose={close}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <Animated.View
          style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.5)', opacity: opAnim }]}
        >
          <Pressable style={StyleSheet.absoluteFill} onPress={close} />
        </Animated.View>
        <Animated.View style={[s.sheet, { transform: [{ translateY: slideAnim }] }]}>
          {/* Nav bar */}
          <View style={s.navBar}>
            <Pressable onPress={close} hitSlop={10}>
              <Text style={s.navCancel}>İptal</Text>
            </Pressable>
            <Text style={s.navTitle}>{editing ? 'İlacı Düzenle' : 'Yeni İlaç'}</Text>
            <Pressable onPress={handleSave} disabled={!canSave} hitSlop={10}>
              <Text style={[s.navSave, { color: canSave ? color : '#C7C7CC' }]}>Kaydet</Text>
            </Pressable>
          </View>

          <ScrollView
            contentContainerStyle={{ paddingBottom: 40 }}
            showsVerticalScrollIndicator={false}
          >
            {/* Önizleme */}
            <View style={s.preview}>
              <View style={[s.previewIcon, { backgroundColor: color + '20' }]}>
                <MedIcon name={type} size={56} color={color} />
              </View>
              <Text style={s.previewName} numberOfLines={1}>
                {name || 'İlaç İsmi'}
              </Text>
              <Text style={s.previewDosage} numberOfLines={1}>
                {dosageStr}
              </Text>
            </View>

            {/* İsim */}
            <View style={s.section}>
              <Text style={s.label}>İsim</Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Aspirin, Concor, vb."
                placeholderTextColor="#C7C7CC"
                style={s.input}
              />
            </View>

            {/* Doz — wheel picker'a açılır */}
            <View style={s.section}>
              <Text style={s.label}>Doz</Text>
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setShowDosePicker(true);
                }}
                style={s.fieldBtn}
              >
                <Text style={s.fieldBtnTxt}>{dosageStr}</Text>
                <Ionicons name="chevron-forward" size={16} color="#C7C7CC" />
              </Pressable>
            </View>

            {/* Tip */}
            <View style={s.section}>
              <Text style={s.label}>Tip</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 10, paddingHorizontal: 4 }}
              >
                {MED_ICON_NAMES.map((n) => {
                  const sel = type === n;
                  return (
                    <Pressable
                      key={n}
                      onPress={() => {
                        Haptics.selectionAsync();
                        setType(n);
                      }}
                      style={[
                        s.typeCard,
                        sel && { borderColor: color, backgroundColor: color + '10' },
                      ]}
                    >
                      <MedIcon name={n} size={36} color={sel ? color : '#8E8E93'} />
                      <Text style={[s.typeLabel, sel && { color }]}>{MED_ICON_LABELS_TR[n]}</Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>

            {/* Renk — sheet'e açılır */}
            <View style={s.section}>
              <Text style={s.label}>Renk</Text>
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setShowColorPicker(true);
                }}
                style={s.fieldBtn}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View style={[s.colorPreview, { backgroundColor: color }]} />
                  <Text style={s.fieldBtnTxt}>{color.toUpperCase()}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#C7C7CC" />
              </Pressable>
            </View>

            {/* Sıklık modu */}
            <View style={s.section}>
              <Text style={s.label}>Sıklık</Text>
              <View style={s.modeRow}>
                {(
                  [
                    { key: 'fixed_times', label: 'Belirli Saatler', icon: 'time-outline' },
                    { key: 'as_needed', label: 'İhtiyaç Duyunca', icon: 'flash-outline' },
                  ] as const
                ).map((m) => {
                  const sel = scheduleMode === m.key;
                  return (
                    <Pressable
                      key={m.key}
                      onPress={() => {
                        Haptics.selectionAsync();
                        setScheduleMode(m.key);
                      }}
                      style={[
                        s.modeCard,
                        sel && { borderColor: color, backgroundColor: color + '10' },
                      ]}
                    >
                      <Ionicons name={m.icon as any} size={20} color={sel ? color : '#8E8E93'} />
                      <Text style={[s.modeLabel, sel && { color }]}>{m.label}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Saatler — fixed_times için */}
            {scheduleMode === 'fixed_times' && (
              <View style={s.section}>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 10,
                  }}
                >
                  <Text style={s.label}>Saatler</Text>
                  <Pressable
                    onPress={addTime}
                    hitSlop={8}
                    style={[s.addTimeBtn, { backgroundColor: color }]}
                  >
                    <Ionicons name="add" size={14} color="#fff" />
                    <Text style={s.addTimeBtnTxt}>Ekle</Text>
                  </Pressable>
                </View>
                <View style={{ gap: 8 }}>
                  {scheduleTimes.map((t, idx) => (
                    <View key={idx} style={s.timeRow}>
                      <Pressable
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          setEditingTimeIdx(idx);
                        }}
                        style={s.timeBtn}
                      >
                        <Ionicons name="time-outline" size={18} color={color} />
                        <Text style={s.timeBtnTxt}>{t}</Text>
                      </Pressable>
                      {scheduleTimes.length > 1 && (
                        <Pressable onPress={() => removeTime(idx)} hitSlop={8} style={s.removeBtn}>
                          <Ionicons name="close" size={16} color="#FF3B30" />
                        </Pressable>
                      )}
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Günler */}
            {scheduleMode === 'fixed_times' && (
              <View style={s.section}>
                <Text style={s.label}>
                  Günler {scheduleDays.length === 0 || scheduleDays.length === 7 ? '· Her gün' : ''}
                </Text>
                <View style={s.daysRow}>
                  {DAYS_TR_SHORT.map((d, i) => {
                    const day = i + 1;
                    const sel = scheduleDays.includes(day);
                    return (
                      <Pressable
                        key={d}
                        onPress={() => toggleDay(day)}
                        style={[s.dayChip, sel && { backgroundColor: color, borderColor: color }]}
                      >
                        <Text style={[s.dayChipTxt, sel && { color: '#fff' }]}>{d}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Stok */}
            <View style={s.section}>
              <Text style={s.label}>Kalan Stok (opsiyonel)</Text>
              <TextInput
                value={stockCount}
                onChangeText={setStockCount}
                placeholder="örn. 30"
                placeholderTextColor="#C7C7CC"
                keyboardType="number-pad"
                style={s.input}
              />
            </View>

            {/* Notlar */}
            <View style={s.section}>
              <Text style={s.label}>Notlar (opsiyonel)</Text>
              <TextInput
                value={notes}
                onChangeText={setNotes}
                placeholder="Yemekten sonra, doktor önerisi vb."
                placeholderTextColor="#C7C7CC"
                style={[s.input, { minHeight: 60 }]}
                multiline
              />
            </View>

            {/* Hatırlatıcı */}
            {scheduleMode === 'fixed_times' && (
              <View style={[s.section, s.toggleSection]}>
                <View style={{ flex: 1 }}>
                  <Text style={s.toggleTitle}>Hatırlatıcılar</Text>
                  <Text style={s.toggleSub}>İlaç saati geldiğinde bildirim al</Text>
                </View>
                <Pressable
                  onPress={() => {
                    Haptics.selectionAsync();
                    setRemindersOn((v) => !v);
                  }}
                  style={[s.toggle, remindersOn && { backgroundColor: color }]}
                >
                  <View
                    style={[s.toggleKnob, remindersOn && { transform: [{ translateX: 18 }] }]}
                  />
                </Pressable>
              </View>
            )}
          </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>

      {/* Doz Picker — iki yan yana wheel */}
      {showDosePicker && (
        <DozPickerSheet
          accent={color}
          amount={doseAmount}
          unit={doseUnit}
          onClose={() => setShowDosePicker(false)}
          onChange={(a, u) => {
            setDoseAmount(a);
            setDoseUnit(u);
          }}
        />
      )}

      {/* Saat Picker */}
      {editingTimeIdx !== null && editingHM && (
        <TimePickerSheet
          accent={color}
          hour={editingHM.h}
          minute={editingHM.m}
          onClose={() => setEditingTimeIdx(null)}
          onChange={(h, m) => setTimeAt(editingTimeIdx, h, m)}
        />
      )}

      {/* Renk Picker */}
      <ColorPickerSheet
        visible={showColorPicker}
        current={color}
        onClose={() => setShowColorPicker(false)}
        onSelect={(hex) => {
          setColor(hex);
          setShowColorPicker(false);
        }}
      />
    </Modal>
  );
}

// ─── Doz Picker (iki wheel: amount + unit) ────────────────────────────────────

function DozPickerSheet({
  accent,
  amount,
  unit,
  onClose,
  onChange,
}: {
  accent: string;
  amount: number;
  unit: string;
  onClose: () => void;
  onChange: (amount: number, unit: string) => void;
}) {
  const slideAnim = useRef(new Animated.Value(SCREEN_H)).current;
  const opAnim = useRef(new Animated.Value(0)).current;
  // Unit listesi index olarak yönetilsin (WheelPicker number alır)
  const initialUnitIdx = Math.max(0, DOSE_UNITS.indexOf(unit));
  const [localAmount, setLocalAmount] = useState(amount);
  const [localUnitIdx, setLocalUnitIdx] = useState(initialUnitIdx);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 520,
        useNativeDriver: true,
        easing: EASE_OUT_SPRING,
      }),
      Animated.timing(opAnim, { toValue: 1, duration: 380, useNativeDriver: true }),
    ]).start();
  }, []);

  const close = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: SCREEN_H,
        duration: 460,
        useNativeDriver: true,
        easing: EASE_IN_CLOSE,
      }),
      Animated.timing(opAnim, { toValue: 0, duration: 320, useNativeDriver: true }),
    ]).start(() => onClose());
  };

  const handleDone = () => {
    onChange(localAmount, DOSE_UNITS[localUnitIdx]!);
    close();
  };

  return (
    <Modal transparent animationType="none" visible onRequestClose={close}>
      <Animated.View
        style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.5)', opacity: opAnim }]}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={close} />
      </Animated.View>
      <Animated.View style={[ps.sheet, { transform: [{ translateY: slideAnim }] }]}>
        <View style={ps.handle} />
        <View style={ps.header}>
          <Pressable onPress={close} hitSlop={12}>
            <Text style={ps.headerCancel}>İptal</Text>
          </Pressable>
          <Text style={ps.title}>Doz</Text>
          <Pressable onPress={handleDone} hitSlop={12}>
            <Text style={[ps.headerDone, { color: accent }]}>Tamam</Text>
          </Pressable>
        </View>
        <View style={ps.dualWheelRow}>
          <View style={{ flex: 1 }}>
            <WheelPicker
              values={DOSE_AMOUNTS}
              current={localAmount}
              formatValue={(v) => (v % 1 === 0 ? `${v}` : `${v}`.replace('.', ','))}
              onChange={setLocalAmount}
              accent={accent}
            />
          </View>
          <View style={{ flex: 1.2 }}>
            <WheelPicker
              values={DOSE_UNITS.map((_, i) => i)}
              current={localUnitIdx}
              formatValue={(i) => DOSE_UNITS[i] ?? ''}
              onChange={setLocalUnitIdx}
              accent={accent}
            />
          </View>
        </View>
      </Animated.View>
    </Modal>
  );
}

// ─── Time Picker (iki wheel: saat + dakika) ───────────────────────────────────

function TimePickerSheet({
  accent,
  hour,
  minute,
  onClose,
  onChange,
}: {
  accent: string;
  hour: number;
  minute: number;
  onClose: () => void;
  onChange: (hour: number, minute: number) => void;
}) {
  const slideAnim = useRef(new Animated.Value(SCREEN_H)).current;
  const opAnim = useRef(new Animated.Value(0)).current;
  const [localH, setLocalH] = useState(hour);
  // Dakika 5 dakikalık adımlara snap
  const initialM = MINUTES.reduce(
    (best, m) => (Math.abs(m - minute) < Math.abs(best - minute) ? m : best),
    MINUTES[0]!,
  );
  const [localM, setLocalM] = useState(initialM);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 520,
        useNativeDriver: true,
        easing: EASE_OUT_SPRING,
      }),
      Animated.timing(opAnim, { toValue: 1, duration: 380, useNativeDriver: true }),
    ]).start();
  }, []);

  const close = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: SCREEN_H,
        duration: 460,
        useNativeDriver: true,
        easing: EASE_IN_CLOSE,
      }),
      Animated.timing(opAnim, { toValue: 0, duration: 320, useNativeDriver: true }),
    ]).start(() => onClose());
  };

  const handleDone = () => {
    onChange(localH, localM);
    close();
  };

  return (
    <Modal transparent animationType="none" visible onRequestClose={close}>
      <Animated.View
        style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.5)', opacity: opAnim }]}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={close} />
      </Animated.View>
      <Animated.View style={[ps.sheet, { transform: [{ translateY: slideAnim }] }]}>
        <View style={ps.handle} />
        <View style={ps.header}>
          <Pressable onPress={close} hitSlop={12}>
            <Text style={ps.headerCancel}>İptal</Text>
          </Pressable>
          <Text style={ps.title}>Saat</Text>
          <Pressable onPress={handleDone} hitSlop={12}>
            <Text style={[ps.headerDone, { color: accent }]}>Tamam</Text>
          </Pressable>
        </View>
        <View style={ps.dualWheelRow}>
          <View style={{ flex: 1 }}>
            <WheelPicker
              values={HOURS}
              current={localH}
              formatValue={(v) => pad2(v)}
              onChange={setLocalH}
              accent={accent}
            />
          </View>
          <View style={{ width: 24, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 28, fontWeight: '600', color: '#1C1C1E' }}>:</Text>
          </View>
          <View style={{ flex: 1 }}>
            <WheelPicker
              values={MINUTES}
              current={localM}
              formatValue={(v) => pad2(v)}
              onChange={setLocalM}
              accent={accent}
            />
          </View>
        </View>
      </Animated.View>
    </Modal>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#F2F2F7',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '92%',
    paddingBottom: 20,
    overflow: 'hidden',
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5EA',
  },
  navCancel: { fontSize: 16, color: '#8E8E93' },
  navTitle: { fontSize: 17, fontWeight: '700', color: '#1C1C1E', letterSpacing: -0.3 },
  navSave: { fontSize: 16, fontWeight: '700' },

  preview: { alignItems: 'center', paddingVertical: 24, paddingHorizontal: 20 },
  previewIcon: {
    width: 92,
    height: 92,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  previewName: { fontSize: 22, fontWeight: '800', color: '#1C1C1E', letterSpacing: -0.4 },
  previewDosage: { fontSize: 14, color: '#8E8E93', marginTop: 4 },

  section: { paddingHorizontal: 20, marginBottom: 20 },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#3A3A3C',
    marginBottom: 8,
    letterSpacing: -0.1,
  },

  input: {
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1C1C1E',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E5EA',
  },

  fieldBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E5EA',
  },
  fieldBtnTxt: { fontSize: 16, color: '#1C1C1E', fontWeight: '500' },
  colorPreview: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 2,
  },

  typeCard: {
    width: 84,
    height: 96,
    borderRadius: 16,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  typeLabel: { fontSize: 11, fontWeight: '600', color: '#3A3A3C' },

  modeRow: { flexDirection: 'row', gap: 10 },
  modeCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  modeLabel: { fontSize: 13, fontWeight: '700', color: '#3A3A3C' },

  addTimeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  addTimeBtnTxt: { fontSize: 12, fontWeight: '700', color: '#fff' },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  timeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E5EA',
  },
  timeBtnTxt: { fontSize: 16, fontWeight: '600', color: '#1C1C1E', letterSpacing: -0.2 },
  removeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFE5E3',
  },

  daysRow: { flexDirection: 'row', gap: 8, justifyContent: 'space-between' },
  dayChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#E5E5EA',
  },
  dayChipTxt: { fontSize: 13, fontWeight: '700', color: '#3A3A3C' },

  toggleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    marginBottom: 20,
  },
  toggleTitle: { fontSize: 15, fontWeight: '700', color: '#1C1C1E' },
  toggleSub: { fontSize: 12, color: '#8E8E93', marginTop: 2 },
  toggle: {
    width: 44,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#E5E5EA',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  toggleKnob: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
  },
});

const ps = StyleSheet.create({
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingBottom: 24,
  },
  handle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D1D1D6',
    marginTop: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  headerCancel: { fontSize: 15, fontWeight: '600', color: '#8E8E93' },
  headerDone: { fontSize: 15, fontWeight: '700' },
  title: { fontSize: 17, fontWeight: '700', color: '#1C1C1E' },
  dualWheelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 4,
  },
});

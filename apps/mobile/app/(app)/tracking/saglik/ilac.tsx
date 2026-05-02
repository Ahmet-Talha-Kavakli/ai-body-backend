import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Easing,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import {
  useMedicationsApi,
  type Medication,
} from '../../../../components/tracking/medication/medicationsApi';
import { MedIcon } from '../../../../components/tracking/medication/MedIcons';
import {
  cancelMedicationReminders,
  scheduleMedicationReminders,
} from '../../../../components/tracking/medication/medicationNotifications';
import { AddMedicationSheet } from '../../../../components/tracking/medication/AddMedicationSheet';
import { CalendarModal } from '../aktivite/_shared';

const ACCENT = '#FF2D55';

const TR_DAYS = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
const TR_MONTHS = [
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

function fmtDateLong(d: Date) {
  return `${TR_DAYS[d.getDay()]}, ${d.getDate()} ${TR_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}
function toDateKey(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
function isToday(d: Date) {
  const t = new Date();
  return (
    d.getFullYear() === t.getFullYear() &&
    d.getMonth() === t.getMonth() &&
    d.getDate() === t.getDate()
  );
}

// scheduleDays: 1=Pzt..7=Paz; boş = her gün
function scheduledOnDate(med: Medication, d: Date): boolean {
  if (med.scheduleMode === 'as_needed') return false;
  if (!med.scheduleDays || med.scheduleDays.length === 0 || med.scheduleDays.length === 7)
    return true;
  const dow = d.getDay() === 0 ? 7 : d.getDay(); // Pzt=1..Paz=7
  return med.scheduleDays.includes(dow);
}

// Sıradaki saat (alınmamış, geçmemiş) — countdown için
function nextUpcomingTime(med: Medication, now: Date, dateKey: string): string | null {
  if (med.scheduleMode !== 'fixed_times') return null;
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const upcoming = med.scheduleTimes
    .filter((t) => {
      const log = med.takenLogs.find((l) => l.scheduledTime === t);
      return !log;
    })
    .map((t) => {
      const [h, m] = t.split(':').map(Number);
      return { time: t, mins: (h ?? 0) * 60 + (m ?? 0) };
    })
    .filter((x) => x.mins >= nowMin)
    .sort((a, b) => a.mins - b.mins);
  return upcoming[0]?.time ?? null;
}

export default function IlacRoute() {
  const insets = useSafeAreaInsets();
  const api = useMedicationsApi();
  const [date, setDate] = useState<Date>(() => new Date());
  const [meds, setMeds] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editingMed, setEditingMed] = useState<Medication | null>(null);
  const [showCal, setShowCal] = useState(false);
  const [detailMed, setDetailMed] = useState<Medication | null>(null);
  const fabScale = useRef(new Animated.Value(1)).current;
  const pageOp = useRef(new Animated.Value(0)).current;

  const dateKey = toDateKey(date);
  const readOnly = date < new Date(new Date().setHours(0, 0, 0, 0));

  // api objesi her render'da yeni — ref'le sabitle, load() deps'ten çıkar
  const apiRef = useRef(api);
  apiRef.current = api;

  // Backend'e gönderilmiş ama henüz commit'i sonuçlanmamış toggle'lar.
  // load() backend'den eski state çekerse bu pending toggle'lar override edilmesin.
  // Key: `${medicationId}__${scheduledTime ?? 'null'}` → 'add' | 'remove'
  const pendingToggles = useRef<Map<string, 'add' | 'remove'>>(new Map());

  // Toggle aktif mi? Aktifken load() çağrıları SKIP edilsin.
  const togglingRef = useRef(false);

  const applyPendingToggles = useCallback((list: Medication[]): Medication[] => {
    if (pendingToggles.current.size === 0) return list;
    return list.map((m) => {
      let logs = m.takenLogs;
      let changed = false;
      for (const [key, action] of pendingToggles.current.entries()) {
        const sep = key.indexOf('__');
        if (sep < 0) continue;
        const medId = key.slice(0, sep);
        const st = key.slice(sep + 2);
        if (medId !== m.id) continue;
        const scheduledTime: string | null = st === 'null' ? null : st;
        const has = logs.some((l) => (l.scheduledTime ?? null) === scheduledTime);
        if (action === 'add' && !has) {
          logs = [
            ...logs,
            {
              id: `__optimistic_${key}`,
              scheduledTime,
              takenAt: new Date().toISOString(),
              skipped: false,
            },
          ];
          changed = true;
        } else if (action === 'remove' && has) {
          logs = logs.filter((l) => (l.scheduledTime ?? null) !== scheduledTime);
          changed = true;
        }
      }
      return changed ? { ...m, takenLogs: logs } : m;
    });
  }, []);

  const load = useCallback(async () => {
    if (togglingRef.current) {
      setLoading(false);
      return;
    }
    try {
      const list = await apiRef.current.listMedications(dateKey);
      if (togglingRef.current) return;
      setMeds(applyPendingToggles(list));
    } catch (err) {
      console.error('[ilac] load failed', err);
    } finally {
      setLoading(false);
      Animated.timing(pageOp, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
        easing: Easing.bezier(0.16, 1, 0.3, 1),
      }).start();
    }
  }, [dateKey, applyPendingToggles]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  // Sayfaya geri dönülünce yenile (sadece focus event, ilk mount değil)
  const isFirstFocus = useRef(true);
  useFocusEffect(
    useCallback(() => {
      if (isFirstFocus.current) {
        isFirstFocus.current = false;
        return;
      }
      load();
    }, [load]),
  );

  const goToPrev = () => {
    const d = new Date(date);
    d.setDate(d.getDate() - 1);
    setDate(d);
    pageOp.setValue(0);
  };
  const goToNext = () => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    if (date >= t) return;
    const d = new Date(date);
    d.setDate(d.getDate() + 1);
    setDate(d);
    pageOp.setValue(0);
  };

  // Asıl optimistic toggle — Alert sonrası ya da direkt çağrılır
  const performToggle = useCallback(
    async (med: Medication, scheduledTime: string | null, willBeTaken: boolean) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      togglingRef.current = true;
      const pendingKey = `${med.id}__${scheduledTime ?? 'null'}`;
      pendingToggles.current.set(pendingKey, willBeTaken ? 'add' : 'remove');

      setMeds((prev) =>
        prev.map((m) => {
          if (m.id !== med.id) return m;
          const filtered = m.takenLogs.filter((l) => (l.scheduledTime ?? null) !== scheduledTime);
          if (willBeTaken) {
            const optimisticLog = {
              id: `__optimistic_${Date.now()}`,
              scheduledTime,
              takenAt: new Date().toISOString(),
              skipped: false,
            };
            return { ...m, takenLogs: [...filtered, optimisticLog] };
          }
          return { ...m, takenLogs: filtered };
        }),
      );

      try {
        const ok = willBeTaken
          ? await apiRef.current.logMedication(med.id, {
              taken: true,
              date: dateKey,
              scheduledTime: scheduledTime ?? undefined,
            })
          : await apiRef.current.unlogMedication(med.id, dateKey, scheduledTime ?? undefined);
        if (!ok) throw new Error('failed');
      } catch {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setMeds((prev) => prev.map((m) => (m.id === med.id ? med : m)));
      } finally {
        // Pending ve toggling'i biraz gecikmeli temizle — DB commit'in mobile'a yansıması için pay bırak
        setTimeout(() => {
          pendingToggles.current.delete(pendingKey);
          togglingRef.current = false;
        }, 600);
      }
    },
    [dateKey],
  );

  // Toggle handler — tik KALDIRILIRKEN Alert onayı sorar
  const handleToggle = useCallback(
    async (med: Medication, scheduledTime: string | null) => {
      const existingLog = med.takenLogs.find((l) => (l.scheduledTime ?? null) === scheduledTime);
      const willBeTaken = !existingLog;

      if (!willBeTaken) {
        // Tik kaldırılıyor — onay sor
        Alert.alert(
          'İşareti kaldır?',
          scheduledTime
            ? `"${med.name}" — ${scheduledTime} dozunu alınmadı olarak işaretlemek istediğine emin misin?`
            : `"${med.name}" alımını geri almak istediğine emin misin?`,
          [
            { text: 'İptal', style: 'cancel' },
            {
              text: 'Geri Al',
              style: 'destructive',
              onPress: () => performToggle(med, scheduledTime, false),
            },
          ],
        );
        return;
      }
      // Tik ekleniyor — direkt geç
      performToggle(med, scheduledTime, true);
    },
    [performToggle],
  );

  // Optimistic save — sheet hemen kapanır, ilaç hemen listede gözükür
  const handleSave = useCallback(async (input: any, editId?: string) => {
    setShowAdd(false);
    setEditingMed(null);

    const tempId = `__optimistic_${Date.now()}`;

    // Background load() çağrılarını engelle — yeni ilaç DB'ye yansıyana kadar
    togglingRef.current = true;

    if (editId) {
      setMeds((prev) => prev.map((m) => (m.id === editId ? { ...m, ...input } : m)));
    } else {
      const optimisticMed: Medication = {
        id: tempId,
        name: input.name,
        dosage: input.dosage,
        unit: input.unit ?? 'tablet',
        type: input.type ?? 'tablet',
        color: input.color ?? '#5E5CE6',
        notes: input.notes ?? null,
        scheduleMode: input.scheduleMode,
        scheduleTimes: input.scheduleTimes ?? [],
        scheduleDays: input.scheduleDays ?? [],
        intervalHours: input.intervalHours ?? null,
        startDate: new Date().toISOString(),
        endDate: null,
        stockCount: input.stockCount ?? null,
        refillThreshold: input.refillThreshold ?? null,
        remindersOn: input.remindersOn ?? true,
        isActive: true,
        takenLogs: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setMeds((prev) => [...prev, optimisticMed]);
    }

    try {
      const med: Medication | null = editId
        ? await apiRef.current.updateMedication(editId, input)
        : await apiRef.current.createMedication(input);

      if (med) {
        if (!editId) {
          setMeds((prev) => prev.map((m) => (m.id === tempId ? { ...med, takenLogs: [] } : m)));
        }
        if (med.remindersOn && med.scheduleMode === 'fixed_times' && med.scheduleTimes.length > 0) {
          await scheduleMedicationReminders({
            medicationId: med.id,
            medicationName: med.name,
            dosage: med.dosage,
            scheduleTimes: med.scheduleTimes,
            scheduleDays: med.scheduleDays,
          });
        } else {
          await cancelMedicationReminders(med.id);
        }
      } else {
        throw new Error('save failed');
      }
    } catch {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      if (!editId) setMeds((prev) => prev.filter((m) => m.id !== tempId));
    } finally {
      // 800ms sonra background refresh'lere izin ver
      setTimeout(() => {
        togglingRef.current = false;
      }, 800);
    }
  }, []);

  // Optimistic delete — Alert onayı sonrası listeden çıkar
  const handleDelete = useCallback(
    (id: string) => {
      const med = meds.find((m) => m.id === id);
      Alert.alert(
        'İlacı sil?',
        med
          ? `"${med.name}" ilacını listeden silmek istediğine emin misin?`
          : 'Bu ilacı silmek istediğine emin misin?',
        [
          { text: 'İptal', style: 'cancel' },
          {
            text: 'Sil',
            style: 'destructive',
            onPress: async () => {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
              const snapshot = meds;
              togglingRef.current = true;
              setMeds((prev) => prev.filter((m) => m.id !== id));
              try {
                await cancelMedicationReminders(id);
                const ok = await apiRef.current.deleteMedication(id);
                if (!ok) throw new Error('failed');
              } catch {
                setMeds(snapshot);
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
              } finally {
                setTimeout(() => {
                  togglingRef.current = false;
                }, 600);
              }
            },
          },
        ],
      );
    },
    [meds],
  );

  // Bugün için zamanlanmış ilaçlar
  const scheduledToday = meds.filter((m) => scheduledOnDate(m, date));
  const asNeeded = meds.filter((m) => m.scheduleMode === 'as_needed');

  // İstatistik
  const totalDoses = scheduledToday.reduce((s, m) => s + (m.scheduleTimes.length || 1), 0);
  const takenDoses = scheduledToday.reduce(
    (s, m) => s + m.takenLogs.filter((l) => !l.skipped).length,
    0,
  );

  // Sıradaki ilaç
  const nextMed = (() => {
    if (!isToday(date)) return null;
    const now = new Date();
    let best: { med: Medication; time: string; mins: number } | null = null;
    for (const m of scheduledToday) {
      if (m.scheduleMode !== 'fixed_times') continue;
      const t = nextUpcomingTime(m, now, dateKey);
      if (!t) continue;
      const [h, mm] = t.split(':').map(Number);
      const mins = (h ?? 0) * 60 + (mm ?? 0);
      if (!best || mins < best.mins) best = { med: m, time: t, mins };
    }
    return best;
  })();

  const onAddPress = () => {
    Animated.sequence([
      Animated.timing(fabScale, { toValue: 0.92, duration: 80, useNativeDriver: true }),
      Animated.spring(fabScale, { toValue: 1, useNativeDriver: true, tension: 300, friction: 10 }),
    ]).start();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setEditingMed(null);
    setShowAdd(true);
  };

  return (
    <View style={[s.root, { paddingTop: insets.top + 12 }]}>
      {/* Date header — aktivite ile aynı pattern */}
      <View style={dh.wrap}>
        <View style={dh.sideBtn} />
        <View style={dh.center}>
          <DateArrowBtn name="chevron-back" onPress={goToPrev} />
          <DatePill
            label={fmtDateLong(date)}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowCal(true);
            }}
          />
          <DateArrowBtn name="chevron-forward" onPress={goToNext} disabled={isToday(date)} />
        </View>
        <View style={dh.sideBtn} />
      </View>

      {loading && meds.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={ACCENT} />
        </View>
      ) : (
        <Animated.View style={{ flex: 1, opacity: pageOp }}>
          <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
            {/* Hero / progress kart */}
            <View style={s.hero}>
              {scheduledToday.length === 0 && asNeeded.length === 0 ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                  <View style={[s.heroIconWrap, { backgroundColor: ACCENT + '15' }]}>
                    <Ionicons name="medkit" size={28} color={ACCENT} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.heroTitle}>İlaç eklenmedi</Text>
                    <Text style={s.heroSub}>+ ile ilk ilacını ekle</Text>
                  </View>
                </View>
              ) : nextMed ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                  <View style={[s.heroIconWrap, { backgroundColor: nextMed.med.color + '20' }]}>
                    <MedIcon name={nextMed.med.type} size={36} color={nextMed.med.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.heroLbl}>SIRADA</Text>
                    <Text style={s.heroTitle}>{nextMed.med.name}</Text>
                    <Text style={s.heroSub}>
                      {nextMed.time} · {nextMed.med.dosage}
                    </Text>
                  </View>
                  <View style={s.heroProgressPill}>
                    <Text style={s.heroProgressTxt}>
                      {takenDoses}/{totalDoses}
                    </Text>
                  </View>
                </View>
              ) : (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                  <View style={[s.heroIconWrap, { backgroundColor: '#30D15820' }]}>
                    <Ionicons name="checkmark-circle" size={32} color="#30D158" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.heroTitle}>
                      {takenDoses > 0 && takenDoses === totalDoses
                        ? 'Hepsini aldın!'
                        : isToday(date)
                          ? 'Bugün için kalmadı'
                          : 'Geçmiş gün'}
                    </Text>
                    <Text style={s.heroSub}>
                      {takenDoses}/{totalDoses} doz tamamlandı
                    </Text>
                  </View>
                </View>
              )}
            </View>

            {/* Aktif ilaçlarım — favoriler tarzı horizontal */}
            {meds.length > 0 && (
              <View style={s.activeSection}>
                <View style={s.sectionHeader}>
                  <Ionicons name="medkit" size={14} color={ACCENT} />
                  <Text style={[s.sectionHeaderTxt, { color: ACCENT }]}>Aktif İlaçlarım</Text>
                </View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: 10, paddingRight: 4 }}
                >
                  {meds.map((m) => (
                    <ActiveMedCard
                      key={m.id}
                      med={m}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setDetailMed(m);
                      }}
                    />
                  ))}
                </ScrollView>
              </View>
            )}

            {readOnly && (
              <View style={s.readOnlyBanner}>
                <Ionicons name="lock-closed-outline" size={14} color="#8E8E93" />
                <Text style={s.readOnlyTxt}>Geçmiş tarihlerde değişiklik yapılamaz</Text>
              </View>
            )}

            {/* Boş state */}
            {meds.length === 0 && (
              <View style={s.emptyBox}>
                <Ionicons name="medical-outline" size={48} color="#C7C7CC" />
                <Text style={s.emptyTitle}>İlaç eklenmedi</Text>
                <Text style={s.emptyTxt}>+ ile ilk ilacını ekle</Text>
              </View>
            )}

            {/* Bugünün programı — saatlere göre timeline */}
            {scheduledToday.length > 0 && (
              <View style={{ marginTop: 18 }}>
                <Text style={s.bigSectionTitle}>Bugünün Programı</Text>
                {scheduledToday.map((med, i) => (
                  <MedicationCard
                    key={med.id}
                    med={med}
                    index={i}
                    readOnly={readOnly}
                    onToggle={(time) => handleToggle(med, time)}
                    onEdit={() => {
                      setEditingMed(med);
                      setShowAdd(true);
                    }}
                    onDelete={() => handleDelete(med.id)}
                  />
                ))}
              </View>
            )}

            {/* İhtiyaç duyunca alınanlar */}
            {asNeeded.length > 0 && (
              <View style={{ marginTop: 18 }}>
                <Text style={s.bigSectionTitle}>İhtiyaç Duyunca</Text>
                {asNeeded.map((med, i) => (
                  <MedicationCard
                    key={med.id}
                    med={med}
                    index={i}
                    readOnly={readOnly}
                    onToggle={() => handleToggle(med, null)}
                    onEdit={() => {
                      setEditingMed(med);
                      setShowAdd(true);
                    }}
                    onDelete={() => handleDelete(med.id)}
                  />
                ))}
              </View>
            )}

            <View style={{ height: 120 }} />
          </ScrollView>
        </Animated.View>
      )}

      {/* FAB */}
      {!readOnly && (
        <Animated.View
          style={{
            position: 'absolute',
            right: 20,
            bottom: insets.bottom + 70,
            transform: [{ scale: fabScale }],
            zIndex: 100,
          }}
        >
          <Pressable onPress={onAddPress} style={s.fab} hitSlop={6}>
            <Ionicons name="add" size={30} color="#fff" />
          </Pressable>
        </Animated.View>
      )}

      {/* Add / Edit sheet */}
      {showAdd && (
        <AddMedicationSheet
          editing={editingMed}
          onClose={() => {
            setShowAdd(false);
            setEditingMed(null);
          }}
          onSave={handleSave}
        />
      )}

      {/* Calendar modal — aktivite ile aynı */}
      <CalendarModal
        visible={showCal}
        current={date}
        accent={ACCENT}
        onSelect={(d) => {
          setDate(d);
          pageOp.setValue(0);
          setShowCal(false);
        }}
        onClose={() => setShowCal(false)}
        fetchMonthly={async () => ({ days: {}, userCreatedAt: new Date(0).toISOString() })}
      />

      {/* Medication Detail sheet — Aktif İlaçlarım kartına tıklanınca */}
      <MedicationDetailSheet
        med={detailMed}
        visible={!!detailMed}
        onClose={() => setDetailMed(null)}
        onEdit={() => {
          if (detailMed) {
            setEditingMed(detailMed);
            setShowAdd(true);
          }
        }}
        onDelete={() => {
          if (detailMed) handleDelete(detailMed.id);
        }}
      />
    </View>
  );
}

// ─── Medication Card ──────────────────────────────────────────────────────────

// ─── DateArrowBtn / DatePill — aktivite tarzı tarih navigatörü ─────────────────

function DateArrowBtn({
  name,
  onPress,
  disabled,
}: {
  name: 'chevron-back' | 'chevron-forward';
  onPress: () => void;
  disabled?: boolean;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      onPressIn={
        disabled
          ? undefined
          : () =>
              Animated.spring(scale, {
                toValue: 0.75,
                useNativeDriver: true,
                tension: 400,
                friction: 15,
              }).start()
      }
      onPressOut={
        disabled
          ? undefined
          : () =>
              Animated.spring(scale, {
                toValue: 1,
                useNativeDriver: true,
                tension: 300,
                friction: 12,
              }).start()
      }
      hitSlop={16}
      style={dh.arrow}
    >
      <Animated.View style={{ transform: [{ scale }], opacity: disabled ? 0.2 : 1 }}>
        <Ionicons name={name} size={22} color="#1C1C1E" />
      </Animated.View>
    </Pressable>
  );
}

function DatePill({ label, onPress }: { label: string; onPress: () => void }) {
  const pill = useRef(new Animated.Value(1)).current;
  return (
    <Pressable
      onPress={onPress}
      onPressIn={() =>
        Animated.spring(pill, {
          toValue: 0.95,
          useNativeDriver: true,
          tension: 400,
          friction: 15,
        }).start()
      }
      onPressOut={() =>
        Animated.spring(pill, {
          toValue: 1,
          useNativeDriver: true,
          tension: 300,
          friction: 12,
        }).start()
      }
      hitSlop={8}
    >
      <Animated.View style={[dh.datePill, { transform: [{ scale: pill }] }]}>
        <Text style={dh.dateTxt}>{label}</Text>
        <Ionicons name="calendar-outline" size={14} color="#8E8E93" style={{ marginLeft: 6 }} />
      </Animated.View>
    </Pressable>
  );
}

// ─── ActiveMedCard — yatay scroll'daki tıklanabilir kart ─────────────────────

function ActiveMedCard({ med, onPress }: { med: Medication; onPress: () => void }) {
  const scale = useRef(new Animated.Value(1)).current;
  return (
    <Pressable
      onPress={onPress}
      onPressIn={() =>
        Animated.spring(scale, {
          toValue: 0.95,
          useNativeDriver: true,
          tension: 400,
          friction: 12,
        }).start()
      }
      onPressOut={() =>
        Animated.spring(scale, {
          toValue: 1,
          useNativeDriver: true,
          tension: 300,
          friction: 12,
        }).start()
      }
    >
      <Animated.View style={[s.activeCard, { transform: [{ scale }] }]}>
        <View style={[s.activeIcon, { backgroundColor: med.color + '18' }]}>
          <MedIcon name={med.type as any} size={40} color={med.color} />
        </View>
        <Text style={[s.activeName, { color: med.color }]} numberOfLines={1}>
          {med.name}
        </Text>
        <Text style={s.activeSub} numberOfLines={1}>
          {med.dosage}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

// ─── MedicationDetailSheet — ilaç detay bottom sheet ─────────────────────────

const SCREEN_H = Dimensions.get('window').height;

function MedicationDetailSheet({
  med,
  visible,
  onClose,
  onEdit,
  onDelete,
}: {
  med: Medication | null;
  visible: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const slideAnim = useRef(new Animated.Value(SCREEN_H)).current;
  const opAnim = useRef(new Animated.Value(0)).current;
  const contentOp = useRef(new Animated.Value(0)).current;
  const contentTy = useRef(new Animated.Value(20)).current;
  const [snap, setSnap] = useState<Medication | null>(null);
  const [mounted, setMounted] = useState(false);
  const [recentLogs, setRecentLogs] = useState<{ date: string; count: number }[]>([]);

  useEffect(() => {
    if (visible && med) {
      setSnap(med);
      setMounted(true);
      const today = new Date();
      const days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(today);
        d.setDate(today.getDate() - (6 - i));
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        const count =
          key === today.toISOString().slice(0, 10)
            ? med.takenLogs.filter((l) => !l.skipped).length
            : 0;
        return { date: key, count };
      });
      setRecentLogs(days);
      slideAnim.setValue(SCREEN_H);
      opAnim.setValue(0);
      contentOp.setValue(0);
      contentTy.setValue(20);
      requestAnimationFrame(() => {
        Animated.parallel([
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 520,
            useNativeDriver: true,
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
          Animated.timing(opAnim, { toValue: 1, duration: 380, useNativeDriver: true }),
        ]).start();
        setTimeout(
          () =>
            Animated.parallel([
              Animated.timing(contentOp, {
                toValue: 1,
                duration: 400,
                useNativeDriver: true,
                easing: Easing.bezier(0.16, 1, 0.3, 1),
              }),
              Animated.timing(contentTy, {
                toValue: 0,
                duration: 400,
                useNativeDriver: true,
                easing: Easing.bezier(0.16, 1, 0.3, 1),
              }),
            ]).start(),
          160,
        );
      });
    } else if (mounted) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: SCREEN_H,
          duration: 460,
          useNativeDriver: true,
          easing: Easing.bezier(0.4, 0, 1, 1),
        }),
        Animated.timing(opAnim, {
          toValue: 0,
          duration: 320,
          useNativeDriver: true,
          easing: Easing.bezier(0.4, 0, 1, 1),
        }),
      ]).start(({ finished }) => {
        if (finished) {
          setMounted(false);
          setSnap(null);
        }
      });
    }
  }, [visible]);

  if (!mounted || !snap) return null;

  const isFixed = snap.scheduleMode === 'fixed_times';
  const isAsNeeded = snap.scheduleMode === 'as_needed';
  const TR_DAYS_SHORT = ['Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct', 'Pz'];
  const daysLabel =
    !snap.scheduleDays || snap.scheduleDays.length === 0 || snap.scheduleDays.length === 7
      ? 'Her gün'
      : snap.scheduleDays.map((d) => TR_DAYS_SHORT[d - 1]).join(', ');

  const detailRows = [
    { label: 'Tip', val: snap.type, icon: 'medical-outline' as const, color: snap.color },
    { label: 'Doz', val: snap.dosage, icon: 'flask-outline' as const, color: '#FF9500' },
    ...(isFixed
      ? [
          {
            label: 'Saatler',
            val: snap.scheduleTimes.join(', ') || '—',
            icon: 'time-outline' as const,
            color: '#0A84FF',
          },
        ]
      : []),
    ...(isFixed
      ? [{ label: 'Günler', val: daysLabel, icon: 'calendar-outline' as const, color: '#5E5CE6' }]
      : []),
    ...(isAsNeeded
      ? [
          {
            label: 'Sıklık',
            val: 'İhtiyaç duyunca',
            icon: 'flash-outline' as const,
            color: '#FF9500',
          },
        ]
      : []),
    ...(snap.stockCount != null
      ? [
          {
            label: 'Kalan Stok',
            val: `${snap.stockCount} ${snap.unit}`,
            icon: 'archive-outline' as const,
            color: '#30D158',
          },
        ]
      : []),
    ...(snap.notes
      ? [
          {
            label: 'Notlar',
            val: snap.notes,
            icon: 'document-text-outline' as const,
            color: '#8E8E93',
          },
        ]
      : []),
    {
      label: 'Hatırlatıcı',
      val: snap.remindersOn && isFixed ? 'Açık' : 'Kapalı',
      icon: 'notifications-outline' as const,
      color: snap.remindersOn && isFixed ? '#30D158' : '#8E8E93',
    },
  ];

  return (
    <Modal transparent animationType="none" visible={mounted} onRequestClose={onClose}>
      <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: 'rgba(0,0,0,0.55)', opacity: opAnim },
          ]}
        >
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        </Animated.View>
        <Animated.View style={[ds.sheet, { transform: [{ translateY: slideAnim }] }]}>
          {/* Top Nav Bar — kapatma butonu sabit */}
          <View style={ds.navBar}>
            <Pressable onPress={onClose} hitSlop={12} style={ds.closeBtn}>
              <Ionicons name="close" size={20} color="#1C1C1E" />
            </Pressable>
            <Text style={ds.navTitle} numberOfLines={1}>
              {snap.name || 'İlaç'}
            </Text>
            <View style={{ width: 36 }} />
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            bounces={false}
            contentContainerStyle={{ paddingBottom: 40 }}
          >
            {/* Hero */}
            <View style={[ds.hero, { backgroundColor: snap.color }]}>
              <View style={[ds.glowOuter, { backgroundColor: 'rgba(255,255,255,0.08)' }]} />
              <View style={[ds.glowInner, { backgroundColor: 'rgba(255,255,255,0.12)' }]} />
              <View style={ds.iconWrap}>
                <View
                  style={[
                    ds.iconBg,
                    {
                      backgroundColor: 'rgba(255,255,255,0.18)',
                      borderWidth: 1,
                      borderColor: 'rgba(255,255,255,0.22)',
                    },
                  ]}
                >
                  <MedIcon name={snap.type as any} size={56} color="#fff" />
                </View>
              </View>
              <Text style={ds.heroName} numberOfLines={2}>
                {snap.name || '—'}
              </Text>
              <View style={ds.heroDosagePill}>
                <Text style={ds.heroDosage}>{snap.dosage}</Text>
              </View>
            </View>

            <Animated.View
              style={{
                opacity: contentOp,
                transform: [{ translateY: contentTy }],
                paddingHorizontal: 20,
                paddingTop: 20,
              }}
            >
              {/* Son 7 Gün */}
              {recentLogs.length > 0 && (
                <View style={ds.weekCard}>
                  <Text style={ds.weekTitle}>Son 7 Gün</Text>
                  <View style={ds.weekRow}>
                    {recentLogs.map((d) => {
                      const dayObj = new Date(d.date);
                      const dayLabel = TR_DAYS_SHORT[(dayObj.getDay() + 6) % 7];
                      const taken = d.count > 0;
                      return (
                        <View key={d.date} style={ds.weekDay}>
                          <View
                            style={[ds.weekDayCircle, taken && { backgroundColor: snap.color }]}
                          >
                            {taken && <Ionicons name="checkmark" size={14} color="#fff" />}
                          </View>
                          <Text style={ds.weekDayLabel}>{dayLabel}</Text>
                        </View>
                      );
                    })}
                  </View>
                </View>
              )}

              {/* Detail rows */}
              <View style={ds.detailList}>
                {detailRows.map((r, i) => (
                  <View
                    key={r.label + i}
                    style={[ds.detailRow, i < detailRows.length - 1 && ds.detailRowBorder]}
                  >
                    <View style={[ds.detailIcon, { backgroundColor: r.color + '18' }]}>
                      <Ionicons name={r.icon} size={17} color={r.color} />
                    </View>
                    <Text style={ds.detailLbl}>{r.label}</Text>
                    <Text style={[ds.detailVal, { color: r.color }]} numberOfLines={2}>
                      {r.val}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Action buttons — büyük pill butonlar */}
              <View style={ds.actionRow}>
                <Pressable
                  onPress={() => {
                    onClose();
                    setTimeout(onEdit, 360);
                  }}
                  style={({ pressed }) => [
                    ds.editBtn,
                    { borderColor: snap.color, opacity: pressed ? 0.7 : 1 },
                  ]}
                >
                  <Ionicons name="create-outline" size={18} color={snap.color} />
                  <Text style={[ds.editTxt, { color: snap.color }]}>Düzenle</Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    onClose();
                    setTimeout(onDelete, 360);
                  }}
                  style={({ pressed }) => [ds.delBtn, { opacity: pressed ? 0.7 : 1 }]}
                >
                  <Ionicons name="trash-outline" size={18} color="#fff" />
                  <Text style={ds.delTxt}>Sil</Text>
                </Pressable>
              </View>
            </Animated.View>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

// ─── TakeNowBtn — "Aldım" butonu (as-needed için spring) ─────────────────────

function TakeNowBtn({
  color,
  taken,
  onPress,
}: {
  color: string;
  taken: boolean;
  onPress: () => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const handlePress = () => {
    Animated.sequence([
      Animated.spring(scale, { toValue: 0.88, useNativeDriver: true, tension: 400, friction: 8 }),
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, tension: 200, friction: 8 }),
    ]).start();
    onPress();
  };
  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPress={handlePress}
        style={[
          mc.takeBtn,
          taken
            ? { backgroundColor: '#fff', borderWidth: 1.5, borderColor: color }
            : { backgroundColor: color },
        ]}
        hitSlop={8}
      >
        <Ionicons name="checkmark" size={16} color={taken ? color : '#fff'} />
        <Text style={[mc.takeBtnTxt, taken && { color }]}>{taken ? 'Alındı' : 'Aldım'}</Text>
      </Pressable>
    </Animated.View>
  );
}

// ─── TimePill — spring scale + tick animasyonu (supplement pattern) ──────────

function TimePill({
  time,
  taken,
  color,
  readOnly,
  onPress,
}: {
  time: string;
  taken: boolean;
  color: string;
  readOnly: boolean;
  onPress: () => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const tickScale = useRef(new Animated.Value(taken ? 1 : 0)).current;
  const tickOp = useRef(new Animated.Value(taken ? 1 : 0)).current;

  // Taken durumu değişince tick'i animate et
  useEffect(() => {
    Animated.parallel([
      Animated.spring(tickScale, {
        toValue: taken ? 1 : 0,
        useNativeDriver: true,
        tension: 300,
        friction: 10,
      }),
      Animated.timing(tickOp, {
        toValue: taken ? 1 : 0,
        duration: taken ? 220 : 140,
        useNativeDriver: true,
      }),
    ]).start();
  }, [taken]);

  const handlePress = () => {
    if (readOnly) return;
    Animated.sequence([
      Animated.spring(scale, { toValue: 0.85, useNativeDriver: true, tension: 400, friction: 8 }),
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, tension: 200, friction: 8 }),
    ]).start();
    onPress();
  };

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPress={handlePress}
        disabled={readOnly}
        style={[mc.timeChip, taken && { backgroundColor: color, borderColor: color }]}
      >
        <Animated.View
          style={{
            opacity: tickOp,
            transform: [{ scale: tickScale }],
            width: taken ? 16 : 0,
            overflow: 'hidden',
          }}
        >
          <Ionicons name="checkmark" size={12} color="#fff" />
        </Animated.View>
        <Text style={[mc.timeChipTxt, taken && { color: '#fff' }]}>{time}</Text>
      </Pressable>
    </Animated.View>
  );
}

function MedicationCard({
  med,
  readOnly,
  onToggle,
  onEdit,
  onDelete,
  index,
}: {
  med: Medication;
  readOnly: boolean;
  onToggle: (scheduledTime: string | null) => void;
  onEdit: () => void;
  onDelete: () => void;
  index: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const pressAnim = useRef(new Animated.Value(1)).current;
  const entryOp = useRef(new Animated.Value(0)).current;
  const entryTy = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    const t = setTimeout(
      () =>
        Animated.parallel([
          Animated.timing(entryOp, {
            toValue: 1,
            duration: 340,
            useNativeDriver: true,
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
          Animated.timing(entryTy, {
            toValue: 0,
            duration: 340,
            useNativeDriver: true,
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
        ]).start(),
      index * 40,
    );
    return () => clearTimeout(t);
  }, []);

  const isFixed = med.scheduleMode === 'fixed_times';
  const isAsNeeded = med.scheduleMode === 'as_needed';

  return (
    <Animated.View
      style={[
        mc.card,
        { opacity: entryOp, transform: [{ translateY: entryTy }, { scale: pressAnim }] },
      ]}
    >
      <Pressable
        onPress={() => setExpanded((e) => !e)}
        onPressIn={() =>
          Animated.timing(pressAnim, { toValue: 0.99, duration: 80, useNativeDriver: true }).start()
        }
        onPressOut={() =>
          Animated.spring(pressAnim, {
            toValue: 1,
            useNativeDriver: true,
            tension: 300,
            friction: 12,
          }).start()
        }
        style={mc.row}
      >
        <View style={[mc.iconBox, { backgroundColor: med.color + '18' }]}>
          <MedIcon name={med.type} size={32} color={med.color} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={mc.name}>{med.name}</Text>
          <Text style={mc.sub}>
            {med.dosage}
            {isFixed && med.scheduleTimes.length > 0 && ` · ${med.scheduleTimes.join(' · ')}`}
            {isAsNeeded && ' · İhtiyaç duyunca'}
          </Text>
        </View>
        {isAsNeeded ? (
          !readOnly && (
            <TakeNowBtn
              color={med.color}
              taken={med.takenLogs.some((l) => (l.scheduledTime ?? null) === null && !l.skipped)}
              onPress={() => onToggle(null)}
            />
          )
        ) : (
          <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color="#C7C7CC" />
        )}
      </Pressable>

      {/* Saat tickleri */}
      {expanded && isFixed && (
        <View style={mc.timesRow}>
          {med.scheduleTimes.map((t) => {
            const log = med.takenLogs.find((l) => l.scheduledTime === t);
            const taken = !!log;
            return (
              <TimePill
                key={t}
                time={t}
                taken={taken}
                color={med.color}
                readOnly={readOnly}
                onPress={() => onToggle(t)}
              />
            );
          })}
        </View>
      )}

      {/* Edit/Delete actions */}
      {expanded && !readOnly && (
        <View style={mc.actionsRow}>
          <Pressable onPress={onEdit} style={mc.actionBtn}>
            <Ionicons name="create-outline" size={14} color="#3A3A3C" />
            <Text style={mc.actionTxt}>Düzenle</Text>
          </Pressable>
          <Pressable onPress={onDelete} style={mc.actionBtn}>
            <Ionicons name="trash-outline" size={14} color="#FF3B30" />
            <Text style={[mc.actionTxt, { color: '#FF3B30' }]}>Sil</Text>
          </Pressable>
        </View>
      )}
    </Animated.View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F2F2F7' },
  content: { paddingHorizontal: 20, paddingBottom: 40 },
  hero: {
    backgroundColor: '#fff',
    borderRadius: 22,
    padding: 16,
    marginBottom: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
  },
  heroIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroLbl: {
    fontSize: 10,
    fontWeight: '800',
    color: '#8E8E93',
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  heroTitle: { fontSize: 18, fontWeight: '800', color: '#1C1C1E', letterSpacing: -0.4 },
  heroSub: { fontSize: 13, color: '#8E8E93', marginTop: 2 },
  heroProgressPill: {
    backgroundColor: ACCENT + '15',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  heroProgressTxt: { fontSize: 14, fontWeight: '800', color: ACCENT, letterSpacing: -0.2 },
  activeSection: { marginBottom: 8 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 10 },
  sectionHeaderTxt: { fontSize: 13, fontWeight: '700' },
  activeCard: {
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 10,
    width: 96,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  activeIcon: {
    width: 64,
    height: 64,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  activeName: { fontSize: 12, fontWeight: '700', textAlign: 'center' },
  activeSub: { fontSize: 10, color: '#8E8E93', marginTop: 2, textAlign: 'center' },
  readOnlyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    padding: 10,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  readOnlyTxt: { color: '#8E8E93', fontSize: 13 },
  emptyBox: { alignItems: 'center', paddingTop: 48, gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#1C1C1E' },
  emptyTxt: { fontSize: 13, color: '#8E8E93' },
  bigSectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1C1C1E',
    letterSpacing: -0.3,
    marginBottom: 12,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
  },
});

const mc = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    overflow: 'hidden',
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  iconBox: {
    width: 52,
    height: 52,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: { fontSize: 15, fontWeight: '700', color: '#1C1C1E' },
  sub: { fontSize: 12, color: '#8E8E93', marginTop: 3 },
  takeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  takeBtnTxt: { fontSize: 12, fontWeight: '700', color: '#fff' },
  timesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 14,
    paddingBottom: 12,
  },
  timeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: '#E5E5EA',
    backgroundColor: '#fff',
  },
  timeChipTxt: { fontSize: 13, fontWeight: '600', color: '#3A3A3C' },
  actionsRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 14, paddingBottom: 12 },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F2F2F7',
  },
  actionTxt: { fontSize: 12, fontWeight: '600', color: '#3A3A3C' },
});

const dh = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginBottom: 20 },
  sideBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  center: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 },
  arrow: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  datePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  dateTxt: { fontSize: 14, fontWeight: '700', color: '#1C1C1E' },
});

const ds = StyleSheet.create({
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#F2F2F7',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
    maxHeight: '92%',
  },
  // Nav bar — sabit üst, X kapatma + isim
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5EA',
    backgroundColor: '#fff',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1C1C1E',
    letterSpacing: -0.3,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 8,
  },

  hero: { paddingTop: 28, paddingBottom: 28, alignItems: 'center', overflow: 'hidden' },
  glowOuter: { position: 'absolute', width: 280, height: 280, borderRadius: 140, top: -80 },
  glowInner: { position: 'absolute', width: 180, height: 180, borderRadius: 90, top: -40 },
  iconWrap: {
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
  },
  iconBg: {
    width: 100,
    height: 100,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroName: {
    fontSize: 26,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.5,
    marginBottom: 10,
    textAlign: 'center',
    paddingHorizontal: 24,
    minHeight: 32,
  },
  heroDosagePill: {
    backgroundColor: 'rgba(0,0,0,0.18)',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  heroDosage: { fontSize: 13, color: '#fff', fontWeight: '700', letterSpacing: -0.1 },

  weekCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  weekTitle: { fontSize: 13, fontWeight: '700', color: '#3A3A3C', marginBottom: 12 },
  weekRow: { flexDirection: 'row', justifyContent: 'space-between' },
  weekDay: { alignItems: 'center', gap: 6 },
  weekDayCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekDayLabel: { fontSize: 11, fontWeight: '600', color: '#8E8E93' },

  detailList: { backgroundColor: '#fff', borderRadius: 18, overflow: 'hidden', marginBottom: 16 },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
  },
  detailRowBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#E5E5EA' },
  detailIcon: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailLbl: { flex: 1, fontSize: 14, fontWeight: '500', color: '#3A3A3C' },
  detailVal: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.2,
    textAlign: 'right',
    maxWidth: 200,
  },

  actionRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  editBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: '#fff',
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  editTxt: { fontSize: 16, fontWeight: '800', letterSpacing: -0.2 },
  delBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: '#FF3B30',
    shadowColor: '#FF3B30',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  delTxt: { fontSize: 16, fontWeight: '800', color: '#fff', letterSpacing: -0.2 },
});

import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  Animated,
  Easing,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  TextInput,
  Image,
  ActivityIndicator,
  Alert,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSession } from '@clerk/expo';

const ACCENT = '#FF6B35';
const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';
const { width: SW, height: SCREEN_H } = Dimensions.get('window');

// ─── Types ────────────────────────────────────────────────────────────────────
interface FitnessExercise {
  id: string;
  name: string;
  nametr: string | null;
  slug: string;
  muscleGroups: string[];
  equipment: string[];
  bodyPart: string | null;
  target: string | null;
  gifUrl: string | null;
  fitnessCategory: string | null;
}

interface SetEntry {
  id: string; // local uuid
  reps: string;
  weightKg: string;
  done: boolean;
}

interface ExerciseEntry {
  exercise: FitnessExercise;
  sets: SetEntry[];
}

// ─── API ──────────────────────────────────────────────────────────────────────
function useFitnessApi() {
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

  const fetchExercises = useCallback(
    async (category?: string, q?: string): Promise<FitnessExercise[]> => {
      const params = new URLSearchParams();
      if (category) params.set('category', category);
      if (q) params.set('q', q);
      const r = await authFetch(`/api/fitness/exercises?${params}`);
      if (!r.ok) return [];
      return r.json();
    },
    [authFetch],
  );

  const saveSession = useCallback(
    async (data: object) => {
      const r = await authFetch('/api/fitness/sessions', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      if (!r.ok) throw new Error('Save failed');
      return r.json();
    },
    [authFetch],
  );

  return { fetchExercises, saveSession };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
let localId = 0;
function uid() {
  return String(++localId);
}

function toDateString(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const CAT_LABELS: Record<string, string> = {
  evde: 'Evde',
  salonda: 'Salonda',
  outdoor: 'Outdoor',
};
const CAT_COLORS: Record<string, string> = {
  evde: '#30D158',
  salonda: '#0A84FF',
  outdoor: '#FF9500',
};

// ─── Exercise Search Modal ────────────────────────────────────────────────────
function ExerciseSearchModal({
  visible,
  onClose,
  onSelect,
  fetchExercises,
}: {
  visible: boolean;
  onClose: () => void;
  onSelect: (ex: FitnessExercise) => void;
  fetchExercises: (category?: string, q?: string) => Promise<FitnessExercise[]>;
}) {
  const [category, setCategory] = useState<string>('salonda');
  const [query, setQuery] = useState('');
  const [exercises, setExercises] = useState<FitnessExercise[]>([]);
  const [loading, setLoading] = useState(false);
  const slideAnim = useRef(new Animated.Value(SCREEN_H)).current;
  const opAnim = useRef(new Animated.Value(0)).current;
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      slideAnim.setValue(SCREEN_H);
      opAnim.setValue(0);
      requestAnimationFrame(() =>
        Animated.parallel([
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 520,
            useNativeDriver: true,
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
          Animated.timing(opAnim, {
            toValue: 1,
            duration: 380,
            useNativeDriver: true,
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
        ]).start(),
      );
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
        if (finished) setMounted(false);
      });
    }
  }, [visible]);

  useEffect(() => {
    if (!visible) return;
    setLoading(true);
    fetchExercises(category, query || undefined)
      .then(setExercises)
      .finally(() => setLoading(false));
  }, [category, query, visible]);

  if (!mounted) return null;

  const CATS = ['evde', 'salonda', 'outdoor'];

  return (
    <Modal visible transparent animationType="none" onRequestClose={onClose}>
      <Animated.View style={[sm.overlay, { opacity: opAnim }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <Animated.View style={[sm.sheet, { transform: [{ translateY: slideAnim }] }]}>
            <View style={sm.handle} />
            <Text style={sm.title}>Egzersiz Seç</Text>

            {/* Search */}
            <View style={sm.searchRow}>
              <Ionicons name="search" size={16} color="#8E8E93" style={{ marginRight: 8 }} />
              <TextInput
                style={sm.searchInput}
                placeholder="Egzersiz ara..."
                placeholderTextColor="#C7C7CC"
                value={query}
                onChangeText={setQuery}
                autoCorrect={false}
                autoCapitalize="none"
                clearButtonMode="while-editing"
              />
            </View>

            {/* Category pills */}
            <View style={sm.catRow}>
              {CATS.map((c) => {
                const active = category === c;
                const color = CAT_COLORS[c] ?? ACCENT;
                return (
                  <Pressable
                    key={c}
                    onPress={() => setCategory(c)}
                    style={[sm.catPill, active && { backgroundColor: color }]}
                  >
                    <Text style={[sm.catPillTxt, active && { color: '#fff' }]}>
                      {CAT_LABELS[c]}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* List */}
            {loading ? (
              <View style={{ height: 200, alignItems: 'center', justifyContent: 'center' }}>
                <ActivityIndicator color={ACCENT} />
              </View>
            ) : (
              <ScrollView
                showsVerticalScrollIndicator={false}
                style={{ maxHeight: SCREEN_H * 0.55 }}
                keyboardShouldPersistTaps="handled"
              >
                {exercises.map((ex, i) => {
                  const name = ex.nametr ?? ex.name;
                  const catColor = CAT_COLORS[ex.fitnessCategory ?? ''] ?? '#8E8E93';
                  const delay = i * 25;
                  return (
                    <Pressable
                      key={ex.id}
                      onPress={() => {
                        onSelect(ex);
                        onClose();
                      }}
                      style={({ pressed }) => [sm.exRow, pressed && { opacity: 0.6 }]}
                    >
                      <View style={sm.exGif}>
                        {ex.gifUrl ? (
                          <Image
                            source={{ uri: ex.gifUrl }}
                            style={{ width: 52, height: 52, borderRadius: 10 }}
                            resizeMode="cover"
                          />
                        ) : (
                          <View style={[sm.exGifPlaceholder, { backgroundColor: catColor + '20' }]}>
                            <Ionicons name="barbell-outline" size={22} color={catColor} />
                          </View>
                        )}
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={sm.exName} numberOfLines={1}>
                          {name}
                        </Text>
                        <Text style={sm.exMeta} numberOfLines={1}>
                          {ex.muscleGroups.join(', ') || ex.target || ex.bodyPart || ''}
                        </Text>
                      </View>
                      <View style={[sm.catTag, { backgroundColor: catColor + '18' }]}>
                        <Text style={[sm.catTagTxt, { color: catColor }]}>
                          {CAT_LABELS[ex.fitnessCategory ?? ''] ?? ''}
                        </Text>
                      </View>
                    </Pressable>
                  );
                })}
                <View style={{ height: 32 }} />
              </ScrollView>
            )}
          </Animated.View>
        </KeyboardAvoidingView>
      </Animated.View>
    </Modal>
  );
}

// ─── Set Row ──────────────────────────────────────────────────────────────────
function SetRow({
  set,
  setNumber,
  onChange,
  onDelete,
}: {
  set: SetEntry;
  setNumber: number;
  onChange: (updates: Partial<SetEntry>) => void;
  onDelete: () => void;
}) {
  const deleteScale = useRef(new Animated.Value(1)).current;

  const handleDone = () => {
    onChange({ done: !set.done });
    Animated.sequence([
      Animated.spring(deleteScale, {
        toValue: 1.15,
        useNativeDriver: true,
        tension: 300,
        friction: 8,
      }),
      Animated.spring(deleteScale, {
        toValue: 1,
        useNativeDriver: true,
        tension: 200,
        friction: 10,
      }),
    ]).start();
  };

  const rowBg = set.done ? '#F0FDF4' : '#F9F9FB';
  const checkColor = set.done ? '#30D158' : '#E5E5EA';

  return (
    <View style={[sr.row, { backgroundColor: rowBg }]}>
      <Text style={sr.num}>{setNumber}</Text>
      <TextInput
        style={sr.input}
        value={set.reps}
        onChangeText={(v) => onChange({ reps: v.replace(/[^0-9]/g, '') })}
        keyboardType="number-pad"
        placeholder="—"
        placeholderTextColor="#C7C7CC"
        maxLength={4}
      />
      <Text style={sr.x}>×</Text>
      <TextInput
        style={[sr.input, { minWidth: 72 }]}
        value={set.weightKg}
        onChangeText={(v) => onChange({ weightKg: v.replace(/[^0-9.]/g, '') })}
        keyboardType="decimal-pad"
        placeholder="kg"
        placeholderTextColor="#C7C7CC"
        maxLength={6}
      />
      <Pressable onPress={handleDone} style={{ padding: 4 }}>
        <Animated.View style={{ transform: [{ scale: deleteScale }] }}>
          <Ionicons
            name={set.done ? 'checkmark-circle' : 'checkmark-circle-outline'}
            size={26}
            color={checkColor}
          />
        </Animated.View>
      </Pressable>
      <Pressable onPress={onDelete} hitSlop={8} style={{ padding: 4 }}>
        <Ionicons name="trash-outline" size={18} color="#C7C7CC" />
      </Pressable>
    </View>
  );
}

// ─── Exercise Card ─────────────────────────────────────────────────────────────
function ExerciseCard({
  entry,
  onAddSet,
  onChangeSet,
  onDeleteSet,
  onDeleteExercise,
  index,
}: {
  entry: ExerciseEntry;
  onAddSet: () => void;
  onChangeSet: (setId: string, updates: Partial<SetEntry>) => void;
  onDeleteSet: (setId: string) => void;
  onDeleteExercise: () => void;
  index: number;
}) {
  const ex = entry.exercise;
  const name = ex.nametr ?? ex.name;
  const muscle = ex.muscleGroups[0] ?? ex.target ?? ex.bodyPart ?? '';
  const catColor = CAT_COLORS[ex.fitnessCategory ?? ''] ?? '#8E8E93';
  const entryAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(entryAnim, {
      toValue: 1,
      duration: 340,
      delay: index * 40,
      useNativeDriver: true,
      easing: Easing.bezier(0.16, 1, 0.3, 1),
    }).start();
  }, []);

  const completedSets = entry.sets.filter((s) => s.done).length;

  return (
    <Animated.View
      style={[
        ec.card,
        {
          opacity: entryAnim,
          transform: [
            { translateY: entryAnim.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) },
          ],
        },
      ]}
    >
      {/* Header */}
      <View style={ec.header}>
        <View style={ec.gifBox}>
          {ex.gifUrl ? (
            <Image
              source={{ uri: ex.gifUrl }}
              style={{ width: 52, height: 52, borderRadius: 10 }}
              resizeMode="cover"
            />
          ) : (
            <View style={[ec.gifPlaceholder, { backgroundColor: catColor + '20' }]}>
              <Ionicons name="barbell-outline" size={24} color={catColor} />
            </View>
          )}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={ec.name} numberOfLines={1}>
            {name}
          </Text>
          <Text style={ec.meta}>{muscle}</Text>
          <Text style={ec.progress}>
            {completedSets}/{entry.sets.length} set tamamlandı
          </Text>
        </View>
        <Pressable onPress={onDeleteExercise} hitSlop={8} style={ec.deleteBtn}>
          <Ionicons name="close-circle-outline" size={22} color="#C7C7CC" />
        </Pressable>
      </View>

      {/* Set header row */}
      <View style={ec.setHeader}>
        <Text style={[ec.setHeaderTxt, { width: 28 }]}>Set</Text>
        <Text style={ec.setHeaderTxt}>Tekrar</Text>
        <Text style={ec.setHeaderTxt}>Ağırlık</Text>
        <View style={{ width: 62 }} />
      </View>

      {/* Sets */}
      {entry.sets.map((s, si) => (
        <SetRow
          key={s.id}
          set={s}
          setNumber={si + 1}
          onChange={(updates) => onChangeSet(s.id, updates)}
          onDelete={() => onDeleteSet(s.id)}
        />
      ))}

      {/* Add set button */}
      <Pressable
        onPress={onAddSet}
        style={({ pressed }) => [ec.addSetBtn, pressed && { opacity: 0.6 }]}
      >
        <Ionicons name="add" size={16} color={catColor} />
        <Text style={[ec.addSetTxt, { color: catColor }]}>Set Ekle</Text>
      </Pressable>
    </Animated.View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function FitnessSessionScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{
    initialExerciseId?: string;
    date?: string;
    category?: string;
  }>();
  const { fetchExercises, saveSession } = useFitnessApi();

  const [entries, setEntries] = useState<ExerciseEntry[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const [saving, setSaving] = useState(false);
  const [startTime] = useState(() => Date.now());

  // Load initial exercise if provided
  useEffect(() => {
    if (params.initialExerciseId) {
      fetchExercises(undefined, undefined).then((all) => {
        const ex = all.find((e) => e.id === params.initialExerciseId);
        if (ex) addExercise(ex);
      });
    }
  }, []);

  const addExercise = useCallback((ex: FitnessExercise) => {
    setEntries((prev) => {
      if (prev.some((e) => e.exercise.id === ex.id)) return prev;
      const newEntry: ExerciseEntry = {
        exercise: ex,
        sets: [{ id: uid(), reps: '', weightKg: '', done: false }],
      };
      return [...prev, newEntry];
    });
  }, []);

  const addSet = useCallback((exerciseId: string) => {
    setEntries((prev) =>
      prev.map((e) => {
        if (e.exercise.id !== exerciseId) return e;
        const lastSet = e.sets[e.sets.length - 1];
        return {
          ...e,
          sets: [
            ...e.sets,
            {
              id: uid(),
              reps: lastSet?.reps ?? '',
              weightKg: lastSet?.weightKg ?? '',
              done: false,
            },
          ],
        };
      }),
    );
  }, []);

  const changeSet = useCallback((exerciseId: string, setId: string, updates: Partial<SetEntry>) => {
    setEntries((prev) =>
      prev.map((e) => {
        if (e.exercise.id !== exerciseId) return e;
        return { ...e, sets: e.sets.map((s) => (s.id === setId ? { ...s, ...updates } : s)) };
      }),
    );
  }, []);

  const deleteSet = useCallback((exerciseId: string, setId: string) => {
    setEntries((prev) =>
      prev.map((e) => {
        if (e.exercise.id !== exerciseId) return e;
        const newSets = e.sets.filter((s) => s.id !== setId);
        return { ...e, sets: newSets.length > 0 ? newSets : e.sets };
      }),
    );
  }, []);

  const deleteExercise = useCallback((exerciseId: string) => {
    setEntries((prev) => prev.filter((e) => e.exercise.id !== exerciseId));
  }, []);

  const handleFinish = async () => {
    if (entries.length === 0) {
      Alert.alert('Egzersiz Yok', 'En az 1 egzersiz eklemen gerekiyor.');
      return;
    }

    // Build sets payload
    const sets: object[] = [];
    for (const entry of entries) {
      entry.sets.forEach((s, i) => {
        sets.push({
          exerciseId: entry.exercise.id,
          setNumber: i + 1,
          reps: s.reps ? parseInt(s.reps) : undefined,
          weightKg: s.weightKg ? parseFloat(s.weightKg) : undefined,
        });
      });
    }

    if (sets.length === 0) {
      Alert.alert('Set Yok', 'En az 1 set girmen gerekiyor.');
      return;
    }

    const date = params.date ?? toDateString(new Date());
    const durationSeconds = Math.floor((Date.now() - startTime) / 1000);

    setSaving(true);
    try {
      await saveSession({ date, durationSeconds, sets });
      router.back();
    } catch {
      Alert.alert('Hata', 'Antrenman kaydedilemedi. Lütfen tekrar dene.');
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    if (entries.length === 0) {
      router.back();
      return;
    }
    Alert.alert('Antrenmanı Bitir', 'Kaydedilmemiş değişiklikler kaybolacak.', [
      { text: 'İptal', style: 'cancel' },
      { text: 'Çık', style: 'destructive', onPress: () => router.back() },
    ]);
  };

  const totalSets = entries.reduce((a, e) => a + e.sets.length, 0);
  const doneSets = entries.reduce((a, e) => a + e.sets.filter((s) => s.done).length, 0);
  const totalVol = entries.reduce(
    (a, e) =>
      a +
      e.sets.reduce((sa, s) => {
        const r = parseInt(s.reps) || 0;
        const w = parseFloat(s.weightKg) || 0;
        return sa + r * w;
      }, 0),
    0,
  );

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[ms.root, { paddingTop: insets.top }]}>
        {/* Header */}
        <View style={ms.header}>
          <Pressable onPress={handleBack} hitSlop={12} style={ms.headerBack}>
            <Ionicons name="chevron-back" size={24} color="#1C1C1E" />
          </Pressable>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={ms.headerTitle}>Antrenman</Text>
            {totalSets > 0 && (
              <Text style={ms.headerSub}>
                {doneSets}/{totalSets} set ·{' '}
                {totalVol > 0 ? `${totalVol.toLocaleString('tr')} kg` : ''}
              </Text>
            )}
          </View>
          <Pressable
            onPress={handleFinish}
            disabled={saving}
            style={[ms.finishBtn, saving && { opacity: 0.5 }]}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={ms.finishTxt}>Bitir</Text>
            )}
          </Pressable>
        </View>

        {/* Content */}
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {entries.length === 0 && (
            <View style={ms.empty}>
              <Ionicons name="barbell-outline" size={48} color="#D1D1D6" />
              <Text style={ms.emptyTitle}>Antrenmanını Kur</Text>
              <Text style={ms.emptySub}>Aşağıdaki butona basarak egzersiz ekle</Text>
            </View>
          )}

          {entries.map((entry, i) => (
            <ExerciseCard
              key={entry.exercise.id}
              entry={entry}
              index={i}
              onAddSet={() => addSet(entry.exercise.id)}
              onChangeSet={(sid, upd) => changeSet(entry.exercise.id, sid, upd)}
              onDeleteSet={(sid) => deleteSet(entry.exercise.id, sid)}
              onDeleteExercise={() => deleteExercise(entry.exercise.id)}
            />
          ))}
        </ScrollView>

        {/* Add exercise FAB */}
        <View style={[ms.fab, { bottom: insets.bottom + 20 }]}>
          <Pressable
            onPress={() => setShowSearch(true)}
            style={({ pressed }) => [
              ms.addExBtn,
              pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] },
            ]}
          >
            <Ionicons name="add" size={20} color="#fff" />
            <Text style={ms.addExTxt}>Egzersiz Ekle</Text>
          </Pressable>
        </View>
      </View>

      <ExerciseSearchModal
        visible={showSearch}
        onClose={() => setShowSearch(false)}
        onSelect={addExercise}
        fetchExercises={fetchExercises}
      />
    </>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const ms = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F2F2F7' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5EA',
  },
  headerBack: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#1C1C1E' },
  headerSub: { fontSize: 12, color: '#8E8E93', marginTop: 2 },
  finishBtn: {
    backgroundColor: ACCENT,
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 8,
  },
  finishTxt: { fontSize: 15, fontWeight: '700', color: '#fff' },
  empty: { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#1C1C1E' },
  emptySub: { fontSize: 14, color: '#8E8E93', textAlign: 'center' },
  fab: { position: 'absolute', left: 16, right: 16 },
  addExBtn: {
    backgroundColor: ACCENT,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
  },
  addExTxt: { fontSize: 16, fontWeight: '700', color: '#fff' },
});

const sm = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D1D1D6',
    alignSelf: 'center',
    marginBottom: 16,
  },
  title: { fontSize: 20, fontWeight: '800', color: '#1C1C1E', marginBottom: 14 },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 40,
    marginBottom: 12,
  },
  searchInput: { flex: 1, fontSize: 15, color: '#1C1C1E' },
  catRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  catPill: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
  },
  catPillTxt: { fontSize: 14, fontWeight: '600', color: '#1C1C1E' },
  exRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F2F2F7',
    gap: 12,
  },
  exGif: { width: 52, height: 52 },
  exGifPlaceholder: {
    width: 52,
    height: 52,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exName: { fontSize: 15, fontWeight: '600', color: '#1C1C1E' },
  exMeta: { fontSize: 12, color: '#8E8E93', marginTop: 2 },
  catTag: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  catTagTxt: { fontSize: 11, fontWeight: '700' },
});

const ec = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 10 },
  gifBox: { width: 52, height: 52 },
  gifPlaceholder: {
    width: 52,
    height: 52,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: { fontSize: 16, fontWeight: '700', color: '#1C1C1E' },
  meta: { fontSize: 12, color: '#8E8E93', marginTop: 1 },
  progress: { fontSize: 11, color: ACCENT, marginTop: 2, fontWeight: '600' },
  deleteBtn: { padding: 4 },
  setHeader: { flexDirection: 'row', paddingHorizontal: 4, marginBottom: 4, gap: 4 },
  setHeaderTxt: {
    flex: 1,
    fontSize: 11,
    fontWeight: '600',
    color: '#8E8E93',
    textTransform: 'uppercase',
  },
  addSetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: 10,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#F9F9FB',
  },
  addSetTxt: { fontSize: 14, fontWeight: '600' },
});

const sr = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderRadius: 10,
    marginBottom: 6,
    gap: 6,
  },
  num: { width: 24, fontSize: 14, fontWeight: '700', color: '#8E8E93', textAlign: 'center' },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 10,
    height: 40,
    paddingHorizontal: 10,
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    textAlign: 'center',
    backgroundColor: '#fff',
  },
  x: { fontSize: 16, fontWeight: '600', color: '#8E8E93' },
});

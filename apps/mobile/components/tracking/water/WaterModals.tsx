/**
 * AddModal — içecek ekleme bottom sheet (choose / pick / custom / form).
 * GoalModal — günlük hedef düzenleme.
 *
 * Mevcut su.tsx'ten ayıklandı, sadeleştirildi.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Easing,
  Image,
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
import { useRouter } from 'expo-router';

const ACCENT = '#32ADE6';
const { width: SW, height: SCREEN_H } = Dimensions.get('window');

// ─── Catalog Item Type ────────────────────────────────────────────────────────
export interface DrinkCatalogItem {
  id: string;
  nametr: string;
  nameen: string;
  category: string;
  defaultServingMl: number;
  iconName: string;
  color: string;
}

const DRINK_CAT_ORDER = [
  'water',
  'tea',
  'coffee',
  'herbal',
  'juice',
  'sports',
  'dairy',
  'smoothie',
  'soda',
  'alcohol',
];
const DRINK_CAT_LABELS: Record<string, string> = {
  water: 'Su',
  tea: 'Çay',
  coffee: 'Kahve',
  herbal: 'Bitki Çayı',
  juice: 'Meyve Suyu',
  sports: 'Spor',
  dairy: 'Süt & Protein',
  smoothie: 'Smoothie',
  soda: 'Gazlı',
  alcohol: 'Alkol',
};

const AD_GRID_COLS = 3;
const AD_GRID_GAP = 10;
const AD_GRID_PAD = 24;
const AD_GRID_CELL = Math.floor(
  (SW - AD_GRID_PAD * 2 - AD_GRID_GAP * (AD_GRID_COLS - 1)) / AD_GRID_COLS,
);
const AD_GRID_NAME_H = 30;
const AD_CELL_H = AD_GRID_CELL + 8 + AD_GRID_NAME_H;

type AddStep = 'choose' | 'pick' | 'custom' | 'form';

// ─── AddModal ──────────────────────────────────────────────────────────────────
export function AddModal({
  visible,
  onClose,
  onLog,
  fetchCatalog,
}: {
  visible: boolean;
  onClose: () => void;
  onLog: (ml: number, catalogId?: string, category?: string) => Promise<void>;
  fetchCatalog: (q?: string) => Promise<DrinkCatalogItem[]>;
}) {
  const router = useRouter();
  const [step, setStep] = useState<AddStep>('choose');
  const [catalog, setCatalog] = useState<DrinkCatalogItem[]>([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<DrinkCatalogItem | null>(null);
  const [customName, setCustomName] = useState('');
  const [ml, setMl] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const slideAnim = useRef(new Animated.Value(SCREEN_H)).current;
  const opAnim = useRef(new Animated.Value(0)).current;
  const stepOp = useRef(new Animated.Value(1)).current;
  const stepTx = useRef(new Animated.Value(0)).current;

  const animateStep = useCallback((forward: boolean, fn: () => void) => {
    Animated.parallel([
      Animated.timing(stepOp, {
        toValue: 0,
        duration: 120,
        useNativeDriver: true,
        easing: Easing.bezier(0.4, 0, 1, 1),
      }),
      Animated.timing(stepTx, {
        toValue: forward ? -24 : 24,
        duration: 120,
        useNativeDriver: true,
        easing: Easing.bezier(0.4, 0, 1, 1),
      }),
    ]).start(() => {
      stepTx.setValue(forward ? 24 : -24);
      fn();
      Animated.parallel([
        Animated.timing(stepOp, {
          toValue: 1,
          duration: 260,
          useNativeDriver: true,
          easing: Easing.bezier(0.16, 1, 0.3, 1),
        }),
        Animated.timing(stepTx, {
          toValue: 0,
          duration: 260,
          useNativeDriver: true,
          easing: Easing.bezier(0.16, 1, 0.3, 1),
        }),
      ]).start();
    });
  }, []);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      setStep('choose');
      setSelected(null);
      setSearch('');
      setCustomName('');
      setMl('');
      stepOp.setValue(1);
      stepTx.setValue(0);
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
    if (step === 'pick' && catalog.length === 0) {
      setLoading(true);
      fetchCatalog().then((items) => {
        setCatalog(items);
        setLoading(false);
      });
    }
  }, [step]);

  useEffect(() => {
    if (selected) setMl(String(selected.defaultServingMl));
  }, [selected]);

  const filtered =
    search.length > 1
      ? catalog.filter(
          (d) =>
            d.nametr.toLowerCase().includes(search.toLowerCase()) ||
            d.nameen.toLowerCase().includes(search.toLowerCase()),
        )
      : [];

  const grouped = catalog.reduce<Record<string, DrinkCatalogItem[]>>((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category]!.push(item);
    return acc;
  }, {});
  const groupedEntries = DRINK_CAT_ORDER.filter((c) => grouped[c]?.length)
    .map((c) => [c, grouped[c]!] as [string, DrinkCatalogItem[]])
    .concat(Object.entries(grouped).filter(([c]) => !DRINK_CAT_ORDER.includes(c)));

  const goCustomForm = () => {
    if (!customName.trim()) return;
    const customItem: DrinkCatalogItem = {
      id: '',
      nametr: customName.trim(),
      nameen: customName.trim(),
      category: 'other',
      defaultServingMl: 250,
      iconName: 'water-outline',
      color: ACCENT,
    };
    animateStep(true, () => {
      setSelected(customItem);
      setMl('250');
      setStep('form');
    });
  };

  const handleSave = () => {
    const amount = parseInt(ml);
    if (!amount || amount <= 0 || amount > 5000) return;
    onLog(amount, selected?.id, selected?.category).catch(() => {});
    onClose();
  };

  const goBarcode = () => {
    onClose();
    setTimeout(() => router.push('/(app)/tracking/su-barcode' as never), 300);
  };
  const goPhoto = () => {
    onClose();
    setTimeout(() => router.push('/(app)/tracking/su-photo' as never), 300);
  };

  if (!mounted) return null;
  return (
    <Modal visible transparent animationType="none" onRequestClose={onClose}>
      <Animated.View style={[ad.overlay, { opacity: opAnim }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <Animated.View style={[ad.sheet, { transform: [{ translateY: slideAnim }] }]}>
            <View style={ad.handle} />
            <Animated.View style={{ opacity: stepOp, transform: [{ translateX: stepTx }] }}>
              {step === 'choose' && (
                <>
                  <Text style={ad.title}>İçecek Ekle</Text>
                  <Text style={ad.sub}>Nasıl eklemek istersin?</Text>
                  <View style={{ gap: 10, marginTop: 20 }}>
                    {(
                      [
                        {
                          icon: 'barcode-outline' as const,
                          label: 'Barkod Tara',
                          sub: 'Ürün barkodunu okut',
                          onPress: goBarcode,
                        },
                        {
                          icon: 'camera-outline' as const,
                          label: 'Görsel ile Ekle',
                          sub: 'AI ile fotoğraf analizi',
                          onPress: goPhoto,
                        },
                        {
                          icon: 'add-circle-outline' as const,
                          label: 'Manuel Ekle',
                          sub: 'Kataloğdan içecek seç',
                          onPress: () => animateStep(true, () => setStep('pick')),
                        },
                      ] as const
                    ).map((opt) => (
                      <Pressable key={opt.label} onPress={opt.onPress}>
                        {({ pressed }) => (
                          <View style={[ad.optRow, pressed && { opacity: 0.7 }]}>
                            <View style={ad.optIcon}>
                              <Ionicons name={opt.icon} size={28} color={ACCENT} />
                            </View>
                            <View style={{ flex: 1 }}>
                              <Text style={ad.optLabel}>{opt.label}</Text>
                              <Text style={ad.optSub}>{opt.sub}</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={16} color="#C7C7CC" />
                          </View>
                        )}
                      </Pressable>
                    ))}
                  </View>
                </>
              )}

              {step === 'pick' && (
                <>
                  <View style={ad.subHeader}>
                    <Pressable
                      onPress={() =>
                        animateStep(false, () => {
                          setStep('choose');
                          setSearch('');
                        })
                      }
                      style={ad.subBackBtn}
                      hitSlop={12}
                    >
                      <Ionicons name="chevron-back" size={20} color="#1C1C1E" />
                    </Pressable>
                    <View>
                      <Text style={ad.subHeaderTitle}>Manuel Ekle</Text>
                      <Text style={ad.subHeaderSub}>Ne içtin?</Text>
                    </View>
                  </View>

                  <View style={ad.searchRow}>
                    <Ionicons name="search" size={16} color="#8E8E93" />
                    <TextInput
                      style={ad.searchInput}
                      placeholder="İçecek ara..."
                      placeholderTextColor="#C7C7CC"
                      value={search}
                      onChangeText={setSearch}
                      autoCapitalize="none"
                      returnKeyType="search"
                    />
                    {search.length > 0 && (
                      <Pressable onPress={() => setSearch('')} hitSlop={8}>
                        <Ionicons name="close-circle" size={16} color="#C7C7CC" />
                      </Pressable>
                    )}
                  </View>

                  {loading ? (
                    <View style={{ alignItems: 'center', paddingVertical: 50 }}>
                      <ActivityIndicator color={ACCENT} size="large" />
                    </View>
                  ) : (
                    <ScrollView
                      showsVerticalScrollIndicator={false}
                      style={{ maxHeight: SCREEN_H * 0.55 }}
                      keyboardShouldPersistTaps="handled"
                    >
                      {search.length > 1 ? (
                        <View style={{ marginTop: 16 }}>
                          {filtered.length === 0 ? (
                            <Text
                              style={{
                                color: '#8E8E93',
                                fontSize: 14,
                                textAlign: 'center',
                                marginTop: 20,
                              }}
                            >
                              Sonuç bulunamadı
                            </Text>
                          ) : (
                            <View style={ad.gridWrap}>
                              {filtered.map((item) => (
                                <Pressable
                                  key={item.id}
                                  style={({ pressed }) => [
                                    ad.gridCell,
                                    pressed && { opacity: 0.65 },
                                  ]}
                                  onPress={() =>
                                    animateStep(true, () => {
                                      setSelected(item);
                                      setStep('form');
                                    })
                                  }
                                >
                                  <View
                                    style={[ad.gridIconBox, { backgroundColor: item.color + '18' }]}
                                  >
                                    <Ionicons
                                      name={item.iconName as any}
                                      size={32}
                                      color={item.color}
                                    />
                                  </View>
                                  <Text style={ad.gridName} numberOfLines={2}>
                                    {item.nametr}
                                  </Text>
                                </Pressable>
                              ))}
                            </View>
                          )}
                        </View>
                      ) : (
                        groupedEntries.map(([cat, items]) => (
                          <View key={cat} style={{ marginTop: 22 }}>
                            <View style={ad.catHeaderRow}>
                              <View
                                style={[ad.catDot, { backgroundColor: items[0]?.color ?? ACCENT }]}
                              />
                              <Text style={ad.catLabel}>{DRINK_CAT_LABELS[cat] ?? cat}</Text>
                            </View>
                            <View style={ad.gridWrap}>
                              {items.map((item) => (
                                <Pressable
                                  key={item.id}
                                  style={({ pressed }) => [
                                    ad.gridCell,
                                    pressed && { opacity: 0.65 },
                                  ]}
                                  onPress={() =>
                                    animateStep(true, () => {
                                      setSelected(item);
                                      setStep('form');
                                    })
                                  }
                                >
                                  <View
                                    style={[ad.gridIconBox, { backgroundColor: item.color + '18' }]}
                                  >
                                    <Ionicons
                                      name={item.iconName as any}
                                      size={32}
                                      color={item.color}
                                    />
                                  </View>
                                  <Text style={ad.gridName} numberOfLines={2}>
                                    {item.nametr}
                                  </Text>
                                </Pressable>
                              ))}
                            </View>
                          </View>
                        ))
                      )}

                      {search.length <= 1 && (
                        <View style={{ marginTop: 22 }}>
                          <View style={ad.catHeaderRow}>
                            <View style={[ad.catDot, { backgroundColor: '#8E8E93' }]} />
                            <Text style={ad.catLabel}>Diğer</Text>
                          </View>
                          <View style={ad.gridWrap}>
                            <Pressable
                              style={({ pressed }) => [ad.gridCell, pressed && { opacity: 0.65 }]}
                              onPress={() =>
                                animateStep(true, () => {
                                  setCustomName('');
                                  setStep('custom');
                                })
                              }
                            >
                              <View style={[ad.gridIconBox, { backgroundColor: '#E5E5EA' }]}>
                                <Ionicons name="add-circle-outline" size={32} color="#636366" />
                              </View>
                              <Text style={ad.gridName} numberOfLines={2}>
                                Diğer
                              </Text>
                            </Pressable>
                          </View>
                        </View>
                      )}
                      <View style={{ height: 24 }} />
                    </ScrollView>
                  )}
                </>
              )}

              {step === 'custom' && (
                <>
                  <View style={ad.subHeader}>
                    <Pressable
                      onPress={() => animateStep(false, () => setStep('pick'))}
                      style={ad.subBackBtn}
                      hitSlop={12}
                    >
                      <Ionicons name="chevron-back" size={20} color="#1C1C1E" />
                    </Pressable>
                    <View>
                      <Text style={ad.subHeaderTitle}>Özel İçecek</Text>
                      <Text style={ad.subHeaderSub}>Kendi içeceğini ekle</Text>
                    </View>
                  </View>
                  <Text style={ad.fieldLabel}>İçecek Adı</Text>
                  <TextInput
                    style={ad.customInput}
                    placeholder="ör. Kefir, Bitki Suyu..."
                    placeholderTextColor="#C7C7CC"
                    value={customName}
                    onChangeText={setCustomName}
                    maxLength={40}
                    autoFocus
                    returnKeyType="done"
                    onSubmitEditing={goCustomForm}
                  />
                  <Pressable onPress={goCustomForm} style={{ marginTop: 20 }}>
                    {({ pressed }) => (
                      <View
                        style={[ad.saveBtn, { opacity: !customName.trim() || pressed ? 0.5 : 1 }]}
                      >
                        <Text style={ad.saveBtnTxt}>Devam</Text>
                      </View>
                    )}
                  </Pressable>
                </>
              )}

              {step === 'form' && selected && (
                <>
                  <View style={ad.subHeader}>
                    <Pressable
                      onPress={() => animateStep(false, () => setStep('pick'))}
                      style={ad.subBackBtn}
                      hitSlop={12}
                    >
                      <Ionicons name="chevron-back" size={20} color="#1C1C1E" />
                    </Pressable>
                    <View style={[ad.subHeaderIcon, { backgroundColor: selected.color + '18' }]}>
                      <Ionicons name={selected.iconName as any} size={26} color={selected.color} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={ad.subHeaderTitle}>{selected.nametr}</Text>
                      <Text style={ad.subHeaderSub}>Kaç ml içtin?</Text>
                    </View>
                  </View>

                  <Text style={ad.fieldLabel}>Miktar</Text>
                  <View style={ad.mlRow}>
                    <TextInput
                      style={ad.mlInput}
                      value={ml}
                      onChangeText={setMl}
                      keyboardType="number-pad"
                      maxLength={4}
                      autoFocus
                    />
                    <Text style={ad.mlUnit}>ml</Text>
                  </View>

                  <View style={ad.quickRow}>
                    {[100, 150, 200, 250, 330, 500].map((v) => (
                      <Pressable key={v} onPress={() => setMl(String(v))}>
                        {({ pressed }) => (
                          <View
                            style={[
                              ad.quickBtn,
                              ml === String(v) && ad.quickBtnActive,
                              pressed && { opacity: 0.7 },
                            ]}
                          >
                            <Text
                              style={[ad.quickBtnTxt, ml === String(v) && ad.quickBtnTxtActive]}
                            >
                              {v}
                            </Text>
                          </View>
                        )}
                      </Pressable>
                    ))}
                  </View>

                  <Pressable onPress={saving ? undefined : handleSave} style={{ marginTop: 20 }}>
                    {({ pressed }) => (
                      <View style={[ad.saveBtn, (pressed || saving) && { opacity: 0.8 }]}>
                        {saving ? (
                          <ActivityIndicator color="#fff" size="small" />
                        ) : (
                          <Text style={ad.saveBtnTxt}>Kaydet</Text>
                        )}
                      </View>
                    )}
                  </Pressable>
                </>
              )}
            </Animated.View>
          </Animated.View>
        </KeyboardAvoidingView>
      </Animated.View>
    </Modal>
  );
}

const ad = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 40,
    maxHeight: SCREEN_H * 0.92,
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: '#E5E5EA',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  title: { fontSize: 22, fontWeight: '800', color: '#1C1C1E', marginBottom: 4 },
  sub: { fontSize: 14, color: '#8E8E93' },
  optRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#F2F2F7',
    borderRadius: 16,
    padding: 16,
  },
  optIcon: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
  },
  optLabel: { fontSize: 15, fontWeight: '700', color: '#1C1C1E' },
  optSub: { fontSize: 13, color: '#8E8E93', marginTop: 2 },
  catHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  catDot: { width: 4, height: 14, borderRadius: 2, backgroundColor: ACCENT },
  catLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#3C3C43',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  gridWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: AD_GRID_GAP, rowGap: 16 },
  gridCell: {
    width: AD_GRID_CELL,
    height: AD_CELL_H,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  gridIconBox: {
    width: AD_GRID_CELL,
    height: AD_GRID_CELL,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridName: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1C1C1E',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 14,
    height: AD_GRID_NAME_H,
  },
  subHeader: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 20 },
  subBackBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  subHeaderIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subHeaderTitle: { fontSize: 20, fontWeight: '800', color: '#1C1C1E' },
  subHeaderSub: { fontSize: 13, color: '#8E8E93', marginTop: 1 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: '#636366', marginBottom: 8 },
  mlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    marginBottom: 16,
  },
  mlInput: { flex: 1, fontSize: 28, fontWeight: '700', color: '#1C1C1E' },
  mlUnit: { fontSize: 16, fontWeight: '600', color: '#8E8E93' },
  quickRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  quickBtn: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
  },
  quickBtnActive: { backgroundColor: ACCENT },
  quickBtnTxt: { fontSize: 13, fontWeight: '600', color: '#636366' },
  quickBtnTxtActive: { color: '#fff' },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 4,
  },
  searchInput: { flex: 1, fontSize: 15, color: '#1C1C1E' },
  customInput: {
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1C1C1E',
  },
  saveBtn: {
    backgroundColor: ACCENT,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
  },
  saveBtnTxt: { color: '#fff', fontSize: 16, fontWeight: '800' },
});

// ─── GoalModal ─────────────────────────────────────────────────────────────────
const GOAL_ML_OPTS = [1500, 2000, 2500, 3000, 3500, 4000];
const OPT_COLS = 3;
const OPT_CELL = (SW - 48 - 10 * (OPT_COLS - 1)) / OPT_COLS;

export function GoalModal({
  visible,
  currentGoal,
  onClose,
  onSave,
}: {
  visible: boolean;
  currentGoal: number;
  onClose: () => void;
  onSave: (ml: number) => void;
}) {
  const [selected, setSelected] = useState(currentGoal);
  const [customMode, setCustomMode] = useState(false);
  const [customInput, setCustomInput] = useState('');
  const [mounted, setMounted] = useState(false);
  const slideAnim = useRef(new Animated.Value(SCREEN_H)).current;
  const opAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setMounted(true);
      setSelected(currentGoal);
      setCustomMode(false);
      setCustomInput('');
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

  const handleSave = () => {
    let val = selected;
    if (customMode) {
      const parsed = parseInt(customInput);
      if (!parsed || parsed < 500) return;
      val = parsed;
    }
    onSave(val);
    onClose();
  };

  if (!mounted) return null;
  return (
    <Modal visible transparent animationType="none" onRequestClose={onClose}>
      <Animated.View style={[gm.overlay, { opacity: opAnim }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <Animated.View style={[gm.sheet, { transform: [{ translateY: slideAnim }] }]}>
          <View style={gm.handle} />
          <Text style={gm.title}>Günlük Su Hedefi</Text>
          <Text style={gm.sub}>Günde kaç ml su içmek istiyorsun?</Text>
          <View style={gm.optsWrap}>
            {GOAL_ML_OPTS.map((val) => {
              const sel = !customMode && selected === val;
              return (
                <Pressable
                  key={val}
                  style={[gm.opt, sel && gm.optActive]}
                  onPress={() => {
                    setSelected(val);
                    setCustomMode(false);
                    setCustomInput('');
                  }}
                >
                  <Text style={[gm.optVal, sel && gm.optValActive]}>
                    {val >= 1000 ? `${val / 1000}L` : `${val}`}
                  </Text>
                  <Text style={[gm.optUnit, sel && gm.optUnitActive]}>ml</Text>
                </Pressable>
              );
            })}
            <Pressable
              style={[gm.opt, customMode && gm.optActive]}
              onPress={() => {
                setCustomMode(true);
                setCustomInput('');
              }}
            >
              <Text style={[gm.optVal, customMode && gm.optValActive]}>Özel</Text>
              <Text style={[gm.optUnit, customMode && gm.optUnitActive]}>ml</Text>
            </Pressable>
          </View>
          {customMode && (
            <View style={gm.customRow}>
              <TextInput
                style={gm.customInput}
                placeholder="Hedef gir (ml)"
                placeholderTextColor="#8E8E93"
                keyboardType="number-pad"
                value={customInput}
                onChangeText={setCustomInput}
                autoFocus
                maxLength={5}
              />
              <Text style={gm.customUnit}>ml</Text>
            </View>
          )}
          <Pressable style={gm.saveBtn} onPress={handleSave}>
            <Text style={gm.saveTxt}>Kaydet</Text>
          </Pressable>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const gm = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 44,
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: '#E5E5EA',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  title: { fontSize: 22, fontWeight: '800', color: '#1C1C1E', marginBottom: 8 },
  sub: { fontSize: 14, color: '#8E8E93', marginBottom: 20 },
  optsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  opt: {
    width: OPT_CELL,
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: '#F2F2F7',
    borderWidth: 1.5,
    borderColor: 'transparent',
    alignItems: 'center',
  },
  optActive: { backgroundColor: ACCENT, borderColor: ACCENT },
  optVal: { fontSize: 18, fontWeight: '800', color: '#1C1C1E' },
  optValActive: { color: '#fff' },
  optUnit: { fontSize: 11, color: '#8E8E93', marginTop: 2 },
  optUnitActive: { color: 'rgba(255,255,255,0.8)' },
  customRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
    gap: 8,
  },
  customInput: { flex: 1, fontSize: 20, fontWeight: '700', color: '#1C1C1E' },
  customUnit: { fontSize: 14, fontWeight: '600', color: '#8E8E93' },
  saveBtn: {
    backgroundColor: ACCENT,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
  },
  saveTxt: { color: '#fff', fontSize: 16, fontWeight: '800' },
});

/**
 * IngredientPickerSheet — tarif için malzeme seçim sheet'i.
 *
 * 2 adım:
 *  1. Yemek ara (FoodItem / OFF / FatSecret / Custom)
 *  2. Miktar + birim seç (UIPickerView 3 sütun)
 *
 * Onaylanınca parent'a (CreateRecipeSheet) PickedIngredient döner.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
  Text,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { SymbolView } from 'expo-symbols';
import { Picker as NativePicker } from '@react-native-picker/picker';
import * as Haptics from 'expo-haptics';
import { useAuth } from '@clerk/expo';

import { N, font } from '../theme';
import { searchFoods } from '../api/client';
import type { CustomFood, FatSecretFood } from '../api/types';

const EASE_SPRING = Easing.bezier(0.16, 1, 0.3, 1);
const EASE_CLOSE = Easing.bezier(0.4, 0, 1, 1);

export type PickedIngredient = {
  foodId?: string;
  customFoodId?: string;
  name: string;
  quantity: number;
  unit: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
};

type FoodRow = {
  key: string;
  name: string;
  brand?: string;
  servingSize: number;
  servingUnit: string;
  caloriesPerServing: number;
  proteinPerServing: number;
  carbsPerServing: number;
  fatPerServing: number;
  source: 'fatsecret' | 'custom' | 'cached' | 'off' | 'usda';
  raw: any;
};

type Props = {
  visible: boolean;
  onClose: () => void;
  onPick: (ing: PickedIngredient) => void;
};

export function IngredientPickerSheet({ visible, onClose, onPick }: Props) {
  const insets = useSafeAreaInsets();
  const { getToken } = useAuth();

  const [step, setStep] = useState<'search' | 'quantity'>('search');
  const [q, setQ] = useState('');
  const [rows, setRows] = useState<FoodRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedFood, setSelectedFood] = useState<FoodRow | null>(null);
  const [whole, setWhole] = useState(1);
  const [fraction, setFraction] = useState(0);
  const [unitIdx, setUnitIdx] = useState(0);

  const slide = useRef(new Animated.Value(0)).current;
  const overlay = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setStep('search');
      setQ('');
      setRows([]);
      setSelectedFood(null);
      setWhole(1);
      setFraction(0);
      setUnitIdx(0);
      Animated.parallel([
        Animated.timing(slide, {
          toValue: 1,
          duration: 480,
          easing: EASE_SPRING,
          useNativeDriver: true,
        }),
        Animated.timing(overlay, {
          toValue: 1,
          duration: 380,
          easing: EASE_SPRING,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slide, {
          toValue: 0,
          duration: 380,
          easing: EASE_CLOSE,
          useNativeDriver: true,
        }),
        Animated.timing(overlay, {
          toValue: 0,
          duration: 320,
          easing: EASE_CLOSE,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, slide, overlay]);

  const translateY = slide.interpolate({ inputRange: [0, 1], outputRange: [800, 0] });
  const overlayOpacity = overlay.interpolate({ inputRange: [0, 1], outputRange: [0, 0.45] });

  // Arama
  useEffect(() => {
    if (!visible || step !== 'search') return;
    const trimmed = q.trim();
    if (trimmed.length < 2) {
      setRows([]);
      return;
    }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const token = await getToken();
        if (!token) return;
        const data = await searchFoods(token, trimmed, 'all');
        const r = data.results as any;
        const out: FoodRow[] = [];
        for (const f of (r?.custom ?? []) as CustomFood[]) {
          out.push({
            key: `c-${f.id}`,
            name: f.name,
            brand: f.brand ?? undefined,
            servingSize: f.servingSize,
            servingUnit: f.servingUnit,
            caloriesPerServing: f.calories,
            proteinPerServing: f.proteinG,
            carbsPerServing: f.carbsG,
            fatPerServing: f.fatG,
            source: 'custom',
            raw: f,
          });
        }
        for (const f of (r?.fatsecret ?? []) as FatSecretFood[]) {
          out.push({
            key: `fs-${f.fatSecretId}`,
            name: f.name,
            servingSize: f.servingSize,
            servingUnit: f.servingUnit,
            caloriesPerServing: f.calories,
            proteinPerServing: f.proteinG,
            carbsPerServing: f.carbsG,
            fatPerServing: f.fatG,
            source: 'fatsecret',
            raw: f,
          });
        }
        for (const f of (r?.openfoodfacts ?? []) as any[]) {
          out.push({
            key: `off-${f.offCode}`,
            name: f.name,
            brand: f.brand,
            servingSize: f.servingSize,
            servingUnit: f.servingUnit,
            caloriesPerServing: f.calories,
            proteinPerServing: f.proteinG,
            carbsPerServing: f.carbsG,
            fatPerServing: f.fatG,
            source: 'off',
            raw: f,
          });
        }
        for (const f of (r?.usda ?? []) as any[]) {
          out.push({
            key: `usda-${f.fdcId}`,
            name: f.name,
            brand: f.brand,
            servingSize: f.servingSize,
            servingUnit: f.servingUnit,
            caloriesPerServing: f.calories,
            proteinPerServing: f.proteinG,
            carbsPerServing: f.carbsG,
            fatPerServing: f.fatG,
            source: 'usda',
            raw: f,
          });
        }
        setRows(out);
      } catch (e) {
        console.warn('[ingredient search]', e);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [q, visible, step]);

  // Birim seçenekleri (seçilen yemek için)
  const units = useMemo(() => {
    if (!selectedFood) return [{ label: '100 g', size: 100, unit: 'g' }];
    const base = `${selectedFood.servingSize} ${selectedFood.servingUnit}`;
    const isLiquid = selectedFood.servingUnit === 'ml';
    const out: Array<{ label: string; size: number; unit: string }> = [
      {
        label: `Porsiyon (${base})`,
        size: selectedFood.servingSize,
        unit: selectedFood.servingUnit,
      },
    ];
    if (isLiquid) {
      out.push({ label: '100 ml', size: 100, unit: 'ml' });
      out.push({ label: '1 bardak (200 ml)', size: 200, unit: 'ml' });
    } else {
      out.push({ label: '100 g', size: 100, unit: 'g' });
      out.push({ label: '1 küçük porsiyon (100 g)', size: 100, unit: 'g' });
      out.push({ label: '1 orta porsiyon (200 g)', size: 200, unit: 'g' });
    }
    return out;
  }, [selectedFood]);

  const handleSelectFood = (row: FoodRow) => {
    Haptics.selectionAsync();
    setSelectedFood(row);
    setStep('quantity');
  };

  const handleConfirm = () => {
    if (!selectedFood) return;
    const quantity = whole + fraction;
    const unit = units[unitIdx];
    const ratio = (unit.size * quantity) / selectedFood.servingSize;

    const proteinG = selectedFood.proteinPerServing * ratio;
    const carbsG = selectedFood.carbsPerServing * ratio;
    const fatG = selectedFood.fatPerServing * ratio;
    const directCal = selectedFood.caloriesPerServing * ratio;
    const calories = directCal > 0 ? directCal : proteinG * 4 + carbsG * 4 + fatG * 9;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPick({
      foodId: selectedFood.source === 'cached' ? selectedFood.raw.id : undefined,
      customFoodId: selectedFood.source === 'custom' ? selectedFood.raw.id : undefined,
      name: selectedFood.name,
      quantity,
      unit: unit.unit,
      calories,
      proteinG,
      carbsG,
      fatG,
    });
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={{ flex: 1 }}>
        <Animated.View
          style={[StyleSheet.absoluteFill, { backgroundColor: '#000', opacity: overlayOpacity }]}
          pointerEvents="none"
        />
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

        <Animated.View
          style={[s.sheet, { transform: [{ translateY }], paddingBottom: insets.bottom }]}
        >
          <View style={s.handle} />

          <View style={s.navRow}>
            <Pressable
              onPress={() => {
                if (step === 'quantity') {
                  setStep('search');
                  setSelectedFood(null);
                } else {
                  onClose();
                }
              }}
              hitSlop={14}
              style={({ pressed }) => [
                s.navSide,
                { alignItems: 'flex-start' },
                pressed && { opacity: 0.5 },
              ]}
            >
              <Text style={s.navCancel}>{step === 'quantity' ? 'Geri' : 'İptal'}</Text>
            </Pressable>
            <Text style={s.navTitle}>
              {step === 'search' ? 'Malzeme Seç' : (selectedFood?.name ?? 'Miktar')}
            </Text>
            <View style={s.navSide}>
              {step === 'quantity' && (
                <Pressable
                  onPress={handleConfirm}
                  hitSlop={14}
                  style={({ pressed }) => [{ alignItems: 'flex-end' }, pressed && { opacity: 0.5 }]}
                >
                  <Text style={s.navSave}>Ekle</Text>
                </Pressable>
              )}
            </View>
          </View>

          {step === 'search' ? (
            <>
              <View style={s.searchWrap}>
                <SymbolView
                  name="magnifyingglass"
                  size={16}
                  tintColor={N.text.tertiary}
                  fallback={<Ionicons name="search" size={17} color={N.text.tertiary} />}
                />
                <TextInput
                  style={s.searchInput}
                  value={q}
                  onChangeText={setQ}
                  placeholder="Yemek ara…"
                  placeholderTextColor={N.text.tertiary}
                  autoFocus
                  autoCapitalize="none"
                  clearButtonMode="while-editing"
                />
              </View>

              <ScrollView
                style={{ flex: 1 }}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                {loading && (
                  <View style={{ paddingVertical: 32, alignItems: 'center' }}>
                    <ActivityIndicator color={N.accent.primary} />
                  </View>
                )}
                {!loading && rows.length === 0 && q.trim().length >= 2 && (
                  <Text style={s.emptyText}>Sonuç bulunamadı</Text>
                )}
                {!loading && q.trim().length < 2 && (
                  <Text style={s.emptyText}>En az 2 harf yaz</Text>
                )}
                {rows.length > 0 && (
                  <View style={[s.card, { marginTop: 12 }]}>
                    {rows.map((row, i) => (
                      <React.Fragment key={row.key}>
                        {i > 0 && <View style={s.divider} />}
                        <Pressable
                          onPress={() => handleSelectFood(row)}
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            paddingVertical: 11,
                          }}
                        >
                          <View style={{ flex: 1, minWidth: 0, marginRight: 12 }}>
                            <Text
                              style={{
                                fontSize: 15,
                                fontFamily: font.medium,
                                color: N.text.primary,
                                letterSpacing: -0.2,
                              }}
                              numberOfLines={1}
                            >
                              {row.name}
                            </Text>
                            <Text
                              style={{
                                fontSize: 12,
                                fontFamily: font.regular,
                                color: N.text.tertiary,
                                marginTop: 2,
                                letterSpacing: -0.1,
                              }}
                              numberOfLines={1}
                            >
                              {row.brand ? `${row.brand} · ` : ''}
                              {row.servingSize}
                              {row.servingUnit} · {Math.round(row.caloriesPerServing)} kcal
                            </Text>
                          </View>
                          <SymbolView
                            name="chevron.right"
                            size={12}
                            tintColor={N.text.quaternary}
                            fallback={
                              <Ionicons
                                name="chevron-forward"
                                size={14}
                                color={N.text.quaternary}
                              />
                            }
                          />
                        </Pressable>
                      </React.Fragment>
                    ))}
                  </View>
                )}
              </ScrollView>
            </>
          ) : (
            // Quantity step
            <View style={{ flex: 1 }}>
              {/* Hesaplanmış makro grid */}
              {selectedFood && (
                <View style={s.summaryCard}>
                  {(() => {
                    const quantity = whole + fraction;
                    const unit = units[unitIdx];
                    const ratio = (unit.size * quantity) / selectedFood.servingSize;
                    const prot = selectedFood.proteinPerServing * ratio;
                    const carb = selectedFood.carbsPerServing * ratio;
                    const fat = selectedFood.fatPerServing * ratio;
                    // Kalori 0 ise makrolardan hesapla (4-4-9 kuralı)
                    const directCal = selectedFood.caloriesPerServing * ratio;
                    const cal = directCal > 0 ? directCal : prot * 4 + carb * 4 + fat * 9;
                    return (
                      <View style={s.summaryGrid}>
                        <SummaryCell
                          value={Math.round(cal)}
                          unit="kcal"
                          label="Kalori"
                          color={N.accent.primary}
                        />
                        <View style={s.summarySep} />
                        <SummaryCell
                          value={prot}
                          unit="g"
                          label="Protein"
                          color={N.macro.protein}
                          decimals={1}
                        />
                        <View style={s.summarySep} />
                        <SummaryCell
                          value={carb}
                          unit="g"
                          label="Karb"
                          color={N.macro.carbs}
                          decimals={1}
                        />
                        <View style={s.summarySep} />
                        <SummaryCell
                          value={fat}
                          unit="g"
                          label="Yağ"
                          color={N.macro.fat}
                          decimals={1}
                        />
                      </View>
                    );
                  })()}
                </View>
              )}

              {/* 3 sütun UIPickerView */}
              <View style={s.pickerRow}>
                <NativePicker
                  style={s.nativePicker}
                  itemStyle={s.nativePickerItem}
                  selectedValue={whole}
                  onValueChange={(v) => {
                    Haptics.selectionAsync();
                    setWhole(Number(v));
                  }}
                >
                  {Array.from({ length: 50 }, (_, i) => i + 1).map((n) => (
                    <NativePicker.Item key={n} label={String(n)} value={n} />
                  ))}
                </NativePicker>

                <NativePicker
                  style={s.nativePicker}
                  itemStyle={s.nativePickerItem}
                  selectedValue={fraction}
                  onValueChange={(v) => {
                    Haptics.selectionAsync();
                    setFraction(Number(v));
                  }}
                >
                  {[
                    { label: '0', value: 0 },
                    { label: '⅛', value: 0.125 },
                    { label: '¼', value: 0.25 },
                    { label: '⅓', value: 0.333 },
                    { label: '½', value: 0.5 },
                    { label: '⅔', value: 0.667 },
                    { label: '¾', value: 0.75 },
                  ].map((f) => (
                    <NativePicker.Item key={f.label} label={f.label} value={f.value} />
                  ))}
                </NativePicker>

                <NativePicker
                  style={[s.nativePicker, { flex: 2 }]}
                  itemStyle={s.nativePickerItem}
                  selectedValue={unitIdx}
                  onValueChange={(v) => {
                    Haptics.selectionAsync();
                    setUnitIdx(Number(v));
                  }}
                >
                  {units.map((u, i) => (
                    <NativePicker.Item key={`${u.label}-${i}`} label={u.label} value={i} />
                  ))}
                </NativePicker>
              </View>
            </View>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}

function SummaryCell({
  value,
  unit,
  label,
  color,
  decimals = 0,
}: {
  value: number;
  unit: string;
  label: string;
  color: string;
  decimals?: number;
}) {
  const display = decimals > 0 ? value.toFixed(decimals) : Math.round(value).toString();
  return (
    <View style={{ flex: 1, alignItems: 'center', paddingHorizontal: 4 }}>
      <Text style={s.summaryValue}>{display}</Text>
      <Text style={s.summaryUnit}>{unit}</Text>
      <Text style={[s.summarySubLabel, { color }]}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '90%',
    backgroundColor: N.bg.page,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    shadowColor: '#000',
    shadowOpacity: 0.22,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: -6 },
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: N.border.hairline,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 4,
  },

  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
  },
  navSide: { minWidth: 72, justifyContent: 'center' },
  navTitle: { fontSize: 17, fontFamily: font.semibold, color: N.text.primary, letterSpacing: -0.3 },
  navCancel: { fontSize: 17, fontFamily: font.regular, color: N.text.secondary },
  navSave: { fontSize: 17, fontFamily: font.semibold, color: N.accent.primary },

  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: N.bg.well,
    marginHorizontal: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: font.regular,
    color: N.text.primary,
    letterSpacing: -0.2,
    padding: 0,
  },

  emptyText: {
    fontSize: 13,
    fontFamily: font.regular,
    color: N.text.tertiary,
    textAlign: 'center',
    marginTop: 32,
  },

  card: {
    backgroundColor: N.bg.card,
    marginHorizontal: 16,
    borderRadius: 14,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: N.border.hairline,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
  },
  rowName: {
    fontSize: 15,
    fontFamily: font.semibold,
    color: N.text.primary,
    letterSpacing: -0.2,
  },
  rowMeta: {
    fontSize: 12,
    fontFamily: font.regular,
    color: N.text.tertiary,
    marginTop: 2,
  },

  // Quantity step
  summaryCard: {
    backgroundColor: N.bg.card,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },
  summaryGrid: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summarySep: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: N.border.hairline,
    alignSelf: 'stretch',
    marginVertical: 4,
  },
  summaryValue: {
    fontSize: 18,
    fontFamily: font.extrabold,
    color: N.text.primary,
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.4,
  },
  summaryUnit: {
    fontSize: 10,
    fontFamily: font.regular,
    color: N.text.tertiary,
    marginTop: -2,
  },
  summarySubLabel: {
    fontSize: 10,
    fontFamily: font.semibold,
    marginTop: 4,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },

  pickerRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginTop: 16,
  },
  nativePicker: {
    flex: 1,
    height: 200,
  },
  nativePickerItem: {
    fontSize: 17,
    fontFamily: font.regular,
    color: N.text.primary,
    height: 200,
  },
});

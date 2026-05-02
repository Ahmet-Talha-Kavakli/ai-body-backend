/**
 * CreateRecipeSheet — Apple kalitesinde tarif oluşturma.
 *
 * Akış:
 *  - Üst: nav (İptal · Yeni Tarif · Kaydet)
 *  - İsim, açıklama, servis sayısı (UISegmentedControl)
 *  - Malzemeler listesi (her satırda yemek + miktar + birim + sil)
 *  - "+ Malzeme ekle" → mini search sheet (Yiyecekler aratır, FoodDetailSheet'in mantığıyla)
 *  - Özet kartı: toplam ve servis başı kalori
 *
 * Kurallar: Sora font, SF Symbols, native UISegmentedControl, native UISwitch yok bu sheet'te,
 * tek Pressable + inline style butonlar, EASE_SPRING/CLOSE.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  InputAccessoryView,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
  Text,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { SymbolView } from 'expo-symbols';
import SegmentedControl from '@react-native-segmented-control/segmented-control';
import * as Haptics from 'expo-haptics';
import { useAuth } from '@clerk/expo';

import { N, font } from '../theme';
import { createRecipe, type RecipeIngredient } from '../api/client';
import { IngredientPickerSheet, type PickedIngredient } from './IngredientPickerSheet';

const EASE_SPRING = Easing.bezier(0.16, 1, 0.3, 1);
const EASE_CLOSE = Easing.bezier(0.4, 0, 1, 1);
const ACCESSORY_ID = 'createRecipeAccessory';

const SERVING_OPTIONS = [1, 2, 4, 6, 8];

type Ing = Omit<RecipeIngredient, 'id' | 'order'>;

type Props = {
  visible: boolean;
  onClose: () => void;
  onSaved: () => void;
};

export function CreateRecipeSheet({ visible, onClose, onSaved }: Props) {
  const insets = useSafeAreaInsets();
  const { getToken } = useAuth();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [servingsIdx, setServingsIdx] = useState(2); // varsayılan 4 kişilik
  const [ingredients, setIngredients] = useState<Ing[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const slide = useRef(new Animated.Value(0)).current;
  const overlay = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setName('');
      setDescription('');
      setServingsIdx(2);
      setIngredients([]);
      setError(null);
      Animated.parallel([
        Animated.timing(slide, {
          toValue: 1,
          duration: 520,
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
          duration: 460,
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

  const totals = useMemo(() => {
    let cal = 0,
      prot = 0,
      carb = 0,
      fat = 0;
    for (const ing of ingredients) {
      cal += Number(ing.calories) || 0;
      prot += Number(ing.proteinG) || 0;
      carb += Number(ing.carbsG) || 0;
      fat += Number(ing.fatG) || 0;
    }
    return { cal, prot, carb, fat };
  }, [ingredients]);

  const servings = SERVING_OPTIONS[servingsIdx];
  const perServing = {
    cal: totals.cal / servings,
    prot: totals.prot / servings,
    carb: totals.carb / servings,
    fat: totals.fat / servings,
  };

  const canSave = name.trim() && ingredients.length > 0 && !submitting;

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Tarif adı zorunlu');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    if (ingredients.length === 0) {
      setError('En az bir malzeme ekle');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const token = await getToken();
      if (!token) throw new Error('Unauthorized');
      await createRecipe(token, {
        name: name.trim(),
        description: description.trim() || undefined,
        servings,
        ingredients,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onSaved();
    } catch (err) {
      console.warn('[createRecipe]', err);
      setError('Kayıt başarısız, tekrar dene');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddIngredient = (picked: PickedIngredient) => {
    setIngredients((curr) => [...curr, picked]);
    setPickerOpen(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleRemoveIngredient = (index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIngredients((curr) => curr.filter((_, i) => i !== index));
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

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={s.kvRoot}
          pointerEvents="box-none"
        >
          <Animated.View
            style={[s.sheet, { transform: [{ translateY }], paddingBottom: insets.bottom }]}
          >
            <View style={s.handle} />

            {/* Nav */}
            <View style={s.navRow}>
              <Pressable
                onPress={onClose}
                hitSlop={14}
                style={({ pressed }) => [
                  s.navSide,
                  { alignItems: 'flex-start' },
                  pressed && { opacity: 0.5 },
                ]}
              >
                <Text style={s.navCancel}>İptal</Text>
              </Pressable>
              <Text style={s.navTitle}>Yeni Tarif</Text>
              <Pressable
                onPress={handleSave}
                disabled={!canSave}
                hitSlop={14}
                style={({ pressed }) => [
                  s.navSide,
                  { alignItems: 'flex-end' },
                  pressed && { opacity: 0.5 },
                ]}
              >
                <Text style={[s.navSave, !canSave && { opacity: 0.35 }]}>
                  {submitting ? 'Kaydediliyor…' : 'Kaydet'}
                </Text>
              </Pressable>
            </View>

            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 32 }}
            >
              {error && (
                <View style={s.errorBanner}>
                  <SymbolView
                    name="exclamationmark.circle.fill"
                    size={16}
                    tintColor={N.semantic.danger}
                    fallback={<Ionicons name="alert-circle" size={16} color={N.semantic.danger} />}
                  />
                  <Text style={s.errorText}>{error}</Text>
                </View>
              )}

              {/* Bilgiler */}
              <SectionLabel>BİLGİLER</SectionLabel>
              <View style={s.card}>
                <View style={{ paddingVertical: 12 }}>
                  <Text style={s.fieldLabel}>
                    İsim<Text style={{ color: N.semantic.danger }}> *</Text>
                  </Text>
                  <TextInput
                    style={s.fieldInput}
                    value={name}
                    onChangeText={setName}
                    placeholder="örn. Mercimek çorbası"
                    placeholderTextColor={N.text.tertiary}
                    maxLength={60}
                    inputAccessoryViewID={Platform.OS === 'ios' ? ACCESSORY_ID : undefined}
                  />
                </View>
                <View style={s.divider} />
                <View style={{ paddingVertical: 12 }}>
                  <Text style={s.fieldLabel}>Açıklama</Text>
                  <TextInput
                    style={[s.fieldInput, { minHeight: 60, textAlignVertical: 'top' }]}
                    value={description}
                    onChangeText={setDescription}
                    placeholder="Tarif hakkında opsiyonel notlar (örn. zeytinyağlı, az tuzlu)"
                    placeholderTextColor={N.text.tertiary}
                    maxLength={200}
                    multiline
                    inputAccessoryViewID={Platform.OS === 'ios' ? ACCESSORY_ID : undefined}
                  />
                </View>
              </View>

              {/* Servis */}
              <SectionLabel>SERVİS SAYISI</SectionLabel>
              <View style={[s.card, { paddingVertical: 12, paddingHorizontal: 12 }]}>
                <SegmentedControl
                  values={SERVING_OPTIONS.map((n) => `${n}`)}
                  selectedIndex={servingsIdx}
                  onChange={(e) => {
                    Haptics.selectionAsync();
                    setServingsIdx(e.nativeEvent.selectedSegmentIndex);
                  }}
                  fontStyle={{ fontSize: 13, fontFamily: font.medium }}
                  activeFontStyle={{ fontSize: 13, fontFamily: font.semibold }}
                  style={{ height: 36 }}
                />
                <Text style={s.servingHint}>{servings} kişilik tarif</Text>
              </View>

              {/* Malzemeler */}
              <SectionLabel>MALZEMELER</SectionLabel>
              {ingredients.length === 0 ? (
                <Pressable
                  onPress={() => {
                    Haptics.selectionAsync();
                    setPickerOpen(true);
                  }}
                  style={{
                    backgroundColor: N.bg.card,
                    marginHorizontal: 16,
                    borderRadius: 14,
                    paddingVertical: 32,
                    paddingHorizontal: 24,
                    alignItems: 'center',
                    justifyContent: 'center',
                    shadowColor: '#000',
                    shadowOpacity: 0.04,
                    shadowRadius: 4,
                    shadowOffset: { width: 0, height: 1 },
                  }}
                >
                  <SymbolView
                    name="plus.circle.fill"
                    size={36}
                    tintColor={N.accent.primary}
                    fallback={<Ionicons name="add-circle" size={36} color={N.accent.primary} />}
                  />
                  <Text
                    style={{
                      fontSize: 16,
                      fontFamily: font.semibold,
                      color: N.text.primary,
                      marginTop: 12,
                      letterSpacing: -0.2,
                      textAlign: 'center',
                    }}
                  >
                    Malzeme ekle
                  </Text>
                  <Text
                    style={{
                      fontSize: 13,
                      fontFamily: font.regular,
                      color: N.text.tertiary,
                      marginTop: 4,
                      letterSpacing: -0.1,
                      textAlign: 'center',
                    }}
                  >
                    En az bir malzeme gerekli
                  </Text>
                </Pressable>
              ) : (
                <>
                  <View style={s.card}>
                    {ingredients.map((ing, i) => (
                      <React.Fragment key={`${ing.name}-${i}`}>
                        {i > 0 && <View style={s.divider} />}
                        <View style={[s.row, { paddingVertical: 12 }]}>
                          <View style={{ flex: 1, minWidth: 0 }}>
                            <Text style={s.ingName} numberOfLines={1}>
                              {ing.name}
                            </Text>
                            <Text style={s.ingMeta} numberOfLines={1}>
                              {ing.quantity} {ing.unit} · {Math.round(ing.calories)} kcal
                            </Text>
                          </View>
                          <Pressable
                            onPress={() => handleRemoveIngredient(i)}
                            hitSlop={10}
                            style={({ pressed }) => [{ padding: 4 }, pressed && { opacity: 0.5 }]}
                          >
                            <SymbolView
                              name="minus.circle.fill"
                              size={22}
                              tintColor={N.semantic.danger}
                              fallback={
                                <Ionicons
                                  name="remove-circle"
                                  size={22}
                                  color={N.semantic.danger}
                                />
                              }
                            />
                          </Pressable>
                        </View>
                      </React.Fragment>
                    ))}
                  </View>

                  <Pressable
                    onPress={() => {
                      Haptics.selectionAsync();
                      setPickerOpen(true);
                    }}
                    style={({ pressed }) => [s.addMoreBtn, pressed && { opacity: 0.6 }]}
                  >
                    <SymbolView
                      name="plus"
                      size={16}
                      tintColor={N.accent.primary}
                      fallback={<Ionicons name="add" size={18} color={N.accent.primary} />}
                    />
                    <Text style={s.addMoreText}>Malzeme ekle</Text>
                  </Pressable>
                </>
              )}

              {/* Özet */}
              {ingredients.length > 0 && (
                <>
                  <SectionLabel>ÖZET</SectionLabel>
                  <View style={s.summaryCard}>
                    <View style={s.summaryHeader}>
                      <Text style={s.summaryHeaderLabel}>Servis başına</Text>
                      <Text style={s.summaryHeaderRight}>{servings} kişilik</Text>
                    </View>
                    <View style={s.summaryGrid}>
                      <SummaryCell
                        value={Math.round(perServing.cal)}
                        unit="kcal"
                        label="Kalori"
                        color={N.accent.primary}
                      />
                      <View style={s.summarySep} />
                      <SummaryCell
                        value={perServing.prot}
                        unit="g"
                        label="Protein"
                        color={N.macro.protein}
                        decimals={1}
                      />
                      <View style={s.summarySep} />
                      <SummaryCell
                        value={perServing.carb}
                        unit="g"
                        label="Karb"
                        color={N.macro.carbs}
                        decimals={1}
                      />
                      <View style={s.summarySep} />
                      <SummaryCell
                        value={perServing.fat}
                        unit="g"
                        label="Yağ"
                        color={N.macro.fat}
                        decimals={1}
                      />
                    </View>
                    <View style={s.summaryFooter}>
                      <Text style={s.summaryFooterText}>
                        Toplam:{' '}
                        <Text style={{ fontFamily: font.bold, color: N.text.primary }}>
                          {Math.round(totals.cal)} kcal
                        </Text>
                      </Text>
                    </View>
                  </View>
                </>
              )}

              <Text style={s.footnote}>
                Tarif kütüphanene kaydedilir. Search → Tarifler tab'ından bulup tek tıkla 1 servis
                ekleyebilirsin.
              </Text>
            </ScrollView>
          </Animated.View>
        </KeyboardAvoidingView>

        {Platform.OS === 'ios' && (
          <InputAccessoryView nativeID={ACCESSORY_ID}>
            <View style={{ height: 0 }} />
          </InputAccessoryView>
        )}

        <IngredientPickerSheet
          visible={pickerOpen}
          onClose={() => setPickerOpen(false)}
          onPick={handleAddIngredient}
        />
      </View>
    </Modal>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <Text style={s.sectionLabel}>{children}</Text>;
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
  kvRoot: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: N.bg.page,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '94%',
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
    paddingBottom: 14,
  },
  navSide: { minWidth: 72, justifyContent: 'center' },
  navTitle: { fontSize: 17, fontFamily: font.semibold, color: N.text.primary, letterSpacing: -0.3 },
  navCancel: { fontSize: 17, fontFamily: font.regular, color: N.text.secondary },
  navSave: { fontSize: 17, fontFamily: font.semibold, color: N.accent.primary },

  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFF1F0',
    marginHorizontal: 16,
    marginTop: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFCCC7',
  },
  errorText: {
    fontSize: 13,
    fontFamily: font.medium,
    color: N.semantic.danger,
    letterSpacing: -0.1,
  },

  sectionLabel: {
    fontSize: 12,
    fontFamily: font.bold,
    color: N.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    paddingHorizontal: 22,
    marginTop: 22,
    marginBottom: 8,
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
  },
  rowLabel: {
    fontSize: 16,
    fontFamily: font.medium,
    color: N.text.primary,
    letterSpacing: -0.2,
    minWidth: 100,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: font.regular,
    color: N.text.primary,
    letterSpacing: -0.2,
    textAlign: 'right',
    padding: 0,
  },
  // Stacked field (label üstte, input altta — Apple Notes/Settings tarzı)
  fieldLabel: {
    fontSize: 12,
    fontFamily: font.semibold,
    color: N.text.tertiary,
    letterSpacing: -0.1,
    marginBottom: 6,
  },
  fieldInput: {
    fontSize: 16,
    fontFamily: font.regular,
    color: N.text.primary,
    letterSpacing: -0.2,
    padding: 0,
    margin: 0,
  },

  servingHint: {
    fontSize: 12,
    fontFamily: font.medium,
    color: N.text.tertiary,
    textAlign: 'center',
    marginTop: 10,
    letterSpacing: -0.1,
  },

  // Empty malzeme
  emptyAdd: {
    backgroundColor: N.bg.card,
    marginHorizontal: 16,
    borderRadius: 14,
    paddingVertical: 28,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },
  emptyAddText: {
    fontSize: 16,
    fontFamily: font.semibold,
    color: N.text.primary,
    marginTop: 10,
    letterSpacing: -0.2,
  },
  emptyAddSub: {
    fontSize: 13,
    fontFamily: font.regular,
    color: N.text.tertiary,
    marginTop: 4,
    letterSpacing: -0.1,
  },

  ingName: {
    fontSize: 15,
    fontFamily: font.semibold,
    color: N.text.primary,
    letterSpacing: -0.2,
  },
  ingMeta: {
    fontSize: 12,
    fontFamily: font.regular,
    color: N.text.tertiary,
    marginTop: 2,
    letterSpacing: -0.1,
  },

  addMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginHorizontal: 16,
    marginTop: 8,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(20,184,166,0.1)',
  },
  addMoreText: {
    fontSize: 14,
    fontFamily: font.semibold,
    color: N.accent.primary,
    letterSpacing: -0.1,
  },

  // Özet
  summaryCard: {
    backgroundColor: N.bg.card,
    marginHorizontal: 16,
    borderRadius: 16,
    paddingTop: 14,
    paddingBottom: 14,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 10,
  },
  summaryHeaderLabel: {
    fontSize: 11,
    fontFamily: font.bold,
    color: N.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  summaryHeaderRight: {
    fontSize: 12,
    fontFamily: font.semibold,
    color: N.text.secondary,
    letterSpacing: -0.1,
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
    fontSize: 19,
    fontFamily: font.extrabold,
    color: N.text.primary,
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.5,
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
  summaryFooter: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: N.border.hairline,
    alignItems: 'center',
  },
  summaryFooterText: {
    fontSize: 13,
    fontFamily: font.regular,
    color: N.text.secondary,
    letterSpacing: -0.1,
  },

  footnote: {
    fontSize: 12,
    fontFamily: font.regular,
    color: N.text.tertiary,
    textAlign: 'center',
    paddingHorizontal: 32,
    marginTop: 20,
    lineHeight: 18,
    letterSpacing: -0.1,
  },
});

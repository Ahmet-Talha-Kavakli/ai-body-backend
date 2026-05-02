/**
 * MealDetailSheet — Apple seviyesi öğün detay sayfası.
 *
 * - iOS native nav bar (Kapat / Başlık / Düzenle yer tutucu)
 * - Renkli hero: her öğüne özel soft gradient + büyük emoji + özet
 * - 4 makro hücresi (Apple Fitness ring tarzı)
 * - Swipe-to-delete + uzun basıp context menu (kayıt silme)
 * - Besin değerleri detaylı kart
 * - Floating "Daha ekle" CTA
 */

import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  Easing,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  Text,
  Alert,
} from 'react-native';
import { Swipeable, GestureHandlerRootView } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAuth } from '@clerk/expo';

import { N, font } from '../theme';
import { deleteMeal } from '../api/client';
import type { MealLog, MealType, MealItem } from '../api/types';

const EASE_SPRING = Easing.bezier(0.16, 1, 0.3, 1);
const EASE_CLOSE = Easing.bezier(0.4, 0, 1, 1);
const EASE_SMOOTH = Easing.bezier(0.22, 1, 0.36, 1);

const MEAL_THEME: Record<
  MealType,
  { tr: string; emoji: string; bg: string; bgEnd: string; chip: string; chipFg: string }
> = {
  breakfast: {
    tr: 'Kahvaltı',
    emoji: '☕',
    bg: '#FFF4E0',
    bgEnd: '#FFE3B8',
    chip: '#FFEAC2',
    chipFg: '#A86C0A',
  },
  lunch: {
    tr: 'Öğle',
    emoji: '🍝',
    bg: '#E6F7E9',
    bgEnd: '#C8ECCF',
    chip: '#D9F0DD',
    chipFg: '#1F7A36',
  },
  dinner: {
    tr: 'Akşam',
    emoji: '🥘',
    bg: '#EFE7FF',
    bgEnd: '#DCC9FF',
    chip: '#E5DAF7',
    chipFg: '#5B3DBF',
  },
  snack: {
    tr: 'Atıştırma',
    emoji: '🍎',
    bg: '#FFE6EC',
    bgEnd: '#FFCAD5',
    chip: '#FFD7DE',
    chipFg: '#B22A4A',
  },
};

type Props = {
  visible: boolean;
  mealType: MealType;
  meals: MealLog[];
  goalKcal?: number;
  onClose: () => void;
  onAddMore: () => void;
  onChanged: () => void;
  onOptimisticRemove?: (mealId: string) => void;
};

export function MealDetailSheet({
  visible,
  mealType,
  meals,
  goalKcal,
  onClose,
  onAddMore,
  onChanged,
  onOptimisticRemove,
}: Props) {
  const insets = useSafeAreaInsets();
  const { getToken } = useAuth();
  const theme = MEAL_THEME[mealType];

  const slide = useRef(new Animated.Value(0)).current;
  const overlay = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(overlay, {
        toValue: visible ? 1 : 0,
        duration: visible ? 380 : 320,
        useNativeDriver: true,
        easing: visible ? EASE_SPRING : EASE_CLOSE,
      }),
      Animated.timing(slide, {
        toValue: visible ? 1 : 0,
        duration: visible ? 480 : 380,
        useNativeDriver: true,
        easing: visible ? EASE_SPRING : EASE_CLOSE,
      }),
    ]).start();
  }, [visible, slide, overlay]);

  const totals = useMemo(
    () =>
      meals.reduce(
        (a, m) => ({
          kcal: a.kcal + m.totalCalories,
          p: a.p + m.totalProteinG,
          c: a.c + m.totalCarbsG,
          f: a.f + m.totalFatG,
          fiber: a.fiber + m.totalFiberG,
          sugar: a.sugar + m.totalSugarG,
          sat: a.sat + m.totalSatFatG,
          sodium: a.sodium + m.totalSodiumMg,
        }),
        { kcal: 0, p: 0, c: 0, f: 0, fiber: 0, sugar: 0, sat: 0, sodium: 0 },
      ),
    [meals],
  );

  const totalItemCount = useMemo(
    () => meals.reduce((s, m) => s + (Array.isArray(m.items) ? m.items.length : 0), 0),
    [meals],
  );

  const onDeleteMeal = useCallback(
    async (mealId: string) => {
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        onOptimisticRemove?.(mealId);
        const token = await getToken();
        if (!token) return;
        await deleteMeal(token, mealId);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onChanged();
      } catch (err) {
        console.error('[delete meal]', err);
        Alert.alert('Hata', 'Kayıt silinemedi. Tekrar dene.');
        onChanged();
      }
    },
    [getToken, onChanged, onOptimisticRemove],
  );

  const confirmDelete = useCallback(
    (mealId: string, name: string) => {
      Alert.alert(
        'Kaydı sil',
        `"${name}" silinsin mi?`,
        [
          { text: 'Vazgeç', style: 'cancel' },
          { text: 'Sil', style: 'destructive', onPress: () => onDeleteMeal(mealId) },
        ],
        { cancelable: true },
      );
    },
    [onDeleteMeal],
  );

  const photoUrl = meals.find((m) => m.photoUrl)?.photoUrl;
  const ty = slide.interpolate({ inputRange: [0, 1], outputRange: [800, 0] });

  const goal = goalKcal ?? Math.round((totals.kcal || 1) * 1.5);
  const ratio = goal > 0 ? Math.min(totals.kcal / goal, 1.2) : 0;

  return (
    <Modal
      transparent
      visible={visible}
      onRequestClose={onClose}
      animationType="none"
      statusBarTranslucent
    >
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Animated.View style={[styles.overlay, { opacity: overlay }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
          <Animated.View style={[styles.sheet, { transform: [{ translateY: ty }] }]}>
            {/* iOS native nav bar */}
            <View style={styles.handle} />
            <View style={styles.headerRow}>
              <View style={{ flex: 1, alignItems: 'flex-start' }}>
                <Pressable onPress={onClose} hitSlop={12}>
                  <Text style={styles.headerCancel}>Kapat</Text>
                </Pressable>
              </View>
              <Text style={styles.headerTitle}>{theme.tr}</Text>
              <View style={{ flex: 1, alignItems: 'flex-end' }}>
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    onAddMore();
                  }}
                  hitSlop={12}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: '#000000',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name="add" size={20} color="#FFFFFF" />
                </Pressable>
              </View>
            </View>

            <ScrollView
              contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
              showsVerticalScrollIndicator={false}
            >
              {/* Hero */}
              {photoUrl ? (
                <View style={styles.heroPhoto}>
                  <Image source={{ uri: photoUrl }} style={StyleSheet.absoluteFill} />
                  <View style={styles.heroPhotoOverlay} />
                  <View style={styles.heroPhotoContent}>
                    <Text style={styles.heroPhotoEmoji}>{theme.emoji}</Text>
                    <Text style={styles.heroPhotoSummary}>
                      {totalItemCount} öğe · {Math.round(totals.kcal)} kcal
                    </Text>
                  </View>
                </View>
              ) : (
                <View style={[styles.hero, { backgroundColor: theme.bgEnd }]}>
                  <View style={[styles.heroGradient, { backgroundColor: theme.bg }]} />
                  <Text style={styles.heroEmoji}>{theme.emoji}</Text>
                  <View style={[styles.heroChip, { backgroundColor: theme.chip }]}>
                    <Text style={[styles.heroChipText, { color: theme.chipFg }]}>
                      {totalItemCount > 0 ? `${totalItemCount} öğe` : 'Henüz boş'} ·{' '}
                      {Math.round(totals.kcal)} kcal
                    </Text>
                  </View>
                </View>
              )}

              {/* Macro grid — Apple Fitness rings */}
              <View style={styles.macroGrid}>
                <MacroCell
                  label="Kalori"
                  value={Math.round(totals.kcal)}
                  goal={goal}
                  unit="kcal"
                  color={theme.chipFg}
                />
                <View style={styles.macroSep} />
                <MacroCell
                  label="Karb"
                  value={Math.round(totals.c)}
                  goal={Math.round((goal * 0.4) / 4)}
                  unit="g"
                  color={N.macro.carbs}
                />
                <View style={styles.macroSep} />
                <MacroCell
                  label="Protein"
                  value={Math.round(totals.p)}
                  goal={Math.round((goal * 0.3) / 4)}
                  unit="g"
                  color={N.macro.protein}
                />
                <View style={styles.macroSep} />
                <MacroCell
                  label="Yağ"
                  value={Math.round(totals.f)}
                  goal={Math.round((goal * 0.3) / 9)}
                  unit="g"
                  color={N.macro.fat}
                />
              </View>

              {/* Items list */}
              <Text style={styles.section}>Yenen yemekler</Text>
              {totalItemCount === 0 ? (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyEmoji}>🍽️</Text>
                  <Text style={styles.emptyTitle}>Henüz bir şey eklenmedi</Text>
                  <Text style={styles.emptySub}>Aşağıdan "Daha ekle" ile başla</Text>
                </View>
              ) : (
                <View style={styles.itemsCard}>
                  {meals.map((m, mi) => (
                    <MealEntry
                      key={m.id}
                      meal={m}
                      onDelete={() =>
                        confirmDelete(m.id, (m.items?.[0] as MealItem)?.name ?? 'Bu kayıt')
                      }
                      isLast={mi === meals.length - 1}
                    />
                  ))}
                </View>
              )}

              {/* Nutrition facts */}
              {meals.length > 0 && (
                <>
                  <Text style={styles.section}>Besin değerleri</Text>
                  <View style={styles.factsCard}>
                    <FactsRow
                      label="Kalori"
                      v={Math.round(totals.kcal)}
                      g={goal}
                      unit="kcal"
                      color={theme.chipFg}
                    />
                    <View style={styles.factsDiv} />
                    <FactsRow
                      label="Karbonhidrat"
                      v={Math.round(totals.c)}
                      g={Math.round((goal * 0.4) / 4)}
                      unit="g"
                      color={N.macro.carbs}
                    />
                    <View style={styles.factsDiv} />
                    <FactsRow
                      label="Protein"
                      v={Math.round(totals.p)}
                      g={Math.round((goal * 0.3) / 4)}
                      unit="g"
                      color={N.macro.protein}
                    />
                    <View style={styles.factsDiv} />
                    <FactsRow
                      label="Yağ"
                      v={Math.round(totals.f)}
                      g={Math.round((goal * 0.3) / 9)}
                      unit="g"
                      color={N.macro.fat}
                    />
                    <View style={styles.factsDiv} />
                    <FactsRow
                      label="Lif"
                      v={Math.round(totals.fiber)}
                      g={6}
                      unit="g"
                      color={N.semantic.success}
                    />
                    <View style={styles.factsDiv} />
                    <FactsRow
                      label="Şeker"
                      v={Math.round(totals.sugar)}
                      g={12}
                      unit="g"
                      color={N.semantic.warning}
                      limit
                    />
                    <View style={styles.factsDiv} />
                    <FactsRow
                      label="Doymuş yağ"
                      v={Math.round(totals.sat)}
                      g={5}
                      unit="g"
                      color={N.semantic.warning}
                      limit
                    />
                    <View style={styles.factsDiv} />
                    <FactsRow
                      label="Sodyum"
                      v={Math.round(totals.sodium)}
                      g={500}
                      unit="mg"
                      color={N.semantic.warning}
                      limit
                    />
                  </View>
                </>
              )}
            </ScrollView>
          </Animated.View>
        </Animated.View>
      </GestureHandlerRootView>
    </Modal>
  );
}

function MealEntry({
  meal,
  onDelete,
  isLast,
}: {
  meal: MealLog;
  onDelete: () => void;
  isLast: boolean;
}) {
  const items = (meal.items as MealItem[]) ?? [];
  const ref = useRef<Swipeable>(null);

  const renderRightActions = (progress: any, dragX: any) => {
    const trans = dragX.interpolate({
      inputRange: [-100, 0],
      outputRange: [0, 100],
      extrapolate: 'clamp',
    });
    return (
      <View style={styles.swipeRightContainer}>
        <Animated.View style={[styles.swipeDelete, { transform: [{ translateX: trans }] }]}>
          <Pressable
            onPress={() => {
              ref.current?.close();
              onDelete();
            }}
            style={styles.swipeDeleteInner}
          >
            <Ionicons name="trash" size={20} color="#FFFFFF" />
            <Text style={styles.swipeDeleteText}>Sil</Text>
          </Pressable>
        </Animated.View>
      </View>
    );
  };

  return (
    <Swipeable
      ref={ref}
      renderRightActions={renderRightActions}
      friction={2}
      rightThreshold={40}
      overshootRight={false}
    >
      <Pressable
        onLongPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          onDelete();
        }}
        delayLongPress={400}
        style={({ pressed }) => [styles.itemBlock, pressed && { backgroundColor: N.bg.well }]}
      >
        {items.map((it, idx) => (
          <View key={`${meal.id}-${idx}`} style={[styles.itemRow, idx > 0 && styles.itemRowInner]}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <View style={styles.itemTitleRow}>
                <Text style={styles.itemName} numberOfLines={1}>
                  {it.name}
                </Text>
                {meal.aiAnalyzed && idx === 0 && (
                  <View style={styles.aiBadge}>
                    <Ionicons name="sparkles" size={9} color={N.ai.fg} />
                    <Text style={styles.aiText}>AI</Text>
                  </View>
                )}
              </View>
              <Text style={styles.itemMeta} numberOfLines={1}>
                {it.brand ? `${it.brand} · ` : ''}
                {it.servingSize}
                {it.servingUnit} × {it.quantity}
              </Text>
            </View>
            <Text style={styles.itemKcal}>{Math.round(it.calories * (it.quantity || 1))} kcal</Text>
          </View>
        ))}
        {!isLast && <View style={styles.itemDivider} />}
      </Pressable>
    </Swipeable>
  );
}

function MacroCell({
  label,
  value,
  goal,
  unit,
  color,
}: {
  label: string;
  value: number;
  goal: number;
  unit: string;
  color: string;
}) {
  const ratio = goal > 0 ? Math.min(value / goal, 1) : 0;
  const fill = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(fill, {
      toValue: ratio,
      duration: 1100,
      easing: EASE_SMOOTH,
      useNativeDriver: false,
    }).start();
  }, [ratio, fill]);
  const widthInterp = fill.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  return (
    <View style={styles.macroCell}>
      <Text style={styles.macroValue}>{value}</Text>
      <Text style={styles.macroUnit}>{unit}</Text>
      <Text style={styles.macroLabel}>{label}</Text>
      <View style={styles.macroTrack}>
        <Animated.View style={[styles.macroFill, { width: widthInterp, backgroundColor: color }]} />
      </View>
    </View>
  );
}

function FactsRow({
  label,
  v,
  g,
  unit,
  color,
  limit,
}: {
  label: string;
  v: number;
  g: number;
  unit: string;
  color: string;
  limit?: boolean;
}) {
  const ratio = g > 0 ? Math.min(v / g, 1.2) : 0;
  const fill = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(fill, {
      toValue: ratio,
      duration: 1100,
      easing: EASE_SMOOTH,
      useNativeDriver: false,
    }).start();
  }, [ratio, fill]);
  const widthInterp = fill.interpolate({ inputRange: [0, 1.2], outputRange: ['0%', '100%'] });
  const barColor = limit
    ? ratio > 1
      ? N.semantic.danger
      : ratio > 0.85
        ? N.semantic.warning
        : N.semantic.success
    : color;

  return (
    <View style={styles.factsRow}>
      <View style={styles.factsHeader}>
        <Text style={styles.factsLabel}>{label}</Text>
        <Text style={styles.factsValue}>
          <Text style={styles.factsValueStrong}>{v}</Text>
          <Text style={styles.factsValueGoal}> / {g} </Text>
          <Text style={styles.factsValueUnit}>{unit}</Text>
        </Text>
      </View>
      <View style={styles.factsTrack}>
        <Animated.View
          style={[styles.factsFill, { width: widthInterp, backgroundColor: barColor }]}
        />
      </View>
    </View>
  );
}

const HERO_H = 200;

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: N.bg.page,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    height: '92%',
    paddingTop: 8,
    overflow: 'hidden',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: N.border.strong,
    alignSelf: 'center',
    marginBottom: 6,
  },

  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: N.bg.page,
    zIndex: 2,
  },
  headerSide: { width: 60, alignItems: 'flex-start' },
  headerCancel: {
    fontSize: 17,
    color: N.text.secondary,
    fontFamily: font.regular,
    letterSpacing: -0.2,
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: font.semibold,
    color: N.text.primary,
    letterSpacing: -0.3,
    fontWeight: '600',
  },

  // Hero (no photo)
  hero: {
    height: HERO_H,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 20,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  heroGradient: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.6,
    top: 0,
    height: HERO_H * 0.6,
  },
  heroEmoji: { fontSize: 80, lineHeight: 96 },
  heroChip: {
    marginTop: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 100,
  },
  heroChipText: { fontSize: 13, fontFamily: font.semibold, letterSpacing: -0.1 },

  // Hero (with photo)
  heroPhoto: {
    height: HERO_H,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 20,
    borderRadius: 24,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  heroPhotoOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  heroPhotoContent: {
    padding: 18,
    alignItems: 'flex-start',
  },
  heroPhotoEmoji: { fontSize: 40, lineHeight: 48 },
  heroPhotoSummary: {
    fontSize: 14,
    color: '#FFFFFF',
    fontFamily: font.semibold,
    marginTop: 4,
    letterSpacing: -0.1,
  },

  // Macro grid
  macroGrid: {
    flexDirection: 'row',
    marginHorizontal: 16,
    paddingVertical: 16,
    paddingHorizontal: 4,
    backgroundColor: N.bg.card,
    borderRadius: 20,
    ...N.shadow.card,
  },
  macroCell: { flex: 1, alignItems: 'center', paddingHorizontal: 4 },
  macroSep: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: N.border.hairline,
    marginVertical: 8,
  },
  macroValue: {
    fontSize: 20,
    fontWeight: '800',
    fontFamily: font.extrabold,
    color: N.text.primary,
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.5,
  },
  macroUnit: { fontSize: 11, color: N.text.tertiary, marginTop: -2, fontFamily: font.regular },
  macroLabel: {
    fontSize: 11,
    color: N.text.secondary,
    marginTop: 4,
    fontFamily: font.medium,
    letterSpacing: -0.1,
  },
  macroTrack: {
    width: '70%',
    height: 3,
    backgroundColor: N.bg.well,
    borderRadius: 2,
    marginTop: 8,
    overflow: 'hidden',
  },
  macroFill: { height: '100%', borderRadius: 2 },

  // Section
  section: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: font.bold,
    color: N.text.primary,
    marginTop: 26,
    marginBottom: 12,
    paddingHorizontal: 16,
    letterSpacing: -0.3,
  },

  // Empty
  emptyCard: {
    backgroundColor: N.bg.card,
    borderRadius: 18,
    marginHorizontal: 16,
    paddingVertical: 32,
    paddingHorizontal: 16,
    alignItems: 'center',
    ...N.shadow.card,
  },
  emptyEmoji: { fontSize: 40 },
  emptyTitle: {
    fontSize: 15,
    fontFamily: font.semibold,
    color: N.text.primary,
    marginTop: 8,
    letterSpacing: -0.2,
  },
  emptySub: { fontSize: 13, color: N.text.tertiary, marginTop: 4, fontFamily: font.regular },

  // Items list
  itemsCard: {
    backgroundColor: N.bg.card,
    borderRadius: 18,
    marginHorizontal: 16,
    overflow: 'hidden',
    ...N.shadow.card,
  },
  itemBlock: {
    backgroundColor: N.bg.card,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  itemRowInner: {
    paddingTop: 4,
  },
  itemTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  itemName: {
    fontSize: 15,
    fontFamily: font.semibold,
    color: N.text.primary,
    letterSpacing: -0.2,
    flexShrink: 1,
  },
  itemMeta: { fontSize: 12, color: N.text.tertiary, marginTop: 2, fontFamily: font.regular },
  itemKcal: {
    fontSize: 14,
    color: N.text.secondary,
    fontFamily: font.semibold,
    fontVariant: ['tabular-nums'],
  },
  itemDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: N.border.hairline,
    marginLeft: 14,
  },
  aiBadge: {
    flexDirection: 'row',
    gap: 2,
    alignItems: 'center',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    backgroundColor: N.ai.bg,
  },
  aiText: { fontSize: 9, color: N.ai.fg, fontFamily: font.bold, fontWeight: '700' },

  // Swipe
  swipeRightContainer: {
    width: 100,
    flexDirection: 'row',
  },
  swipeDelete: {
    flex: 1,
    backgroundColor: N.semantic.danger,
    justifyContent: 'center',
    alignItems: 'center',
  },
  swipeDeleteInner: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  swipeDeleteText: { color: '#FFFFFF', fontSize: 13, fontFamily: font.semibold, marginTop: 2 },

  // Facts
  factsCard: {
    backgroundColor: N.bg.card,
    borderRadius: 18,
    marginHorizontal: 16,
    paddingHorizontal: 16,
    paddingVertical: 6,
    ...N.shadow.card,
  },
  factsRow: { paddingVertical: 10 },
  factsDiv: { height: StyleSheet.hairlineWidth, backgroundColor: N.border.hairline },
  factsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 6,
  },
  factsLabel: {
    fontSize: 14,
    color: N.text.secondary,
    fontFamily: font.medium,
    letterSpacing: -0.1,
  },
  factsValue: { fontSize: 13, fontVariant: ['tabular-nums'] },
  factsValueStrong: {
    fontSize: 14,
    color: N.text.primary,
    fontFamily: font.bold,
    fontWeight: '700',
  },
  factsValueGoal: { color: N.text.tertiary, fontFamily: font.medium },
  factsValueUnit: { color: N.text.tertiary, fontSize: 11, fontFamily: font.regular },
  factsTrack: { height: 4, backgroundColor: N.bg.well, borderRadius: 2, overflow: 'hidden' },
  factsFill: { height: '100%', borderRadius: 2 },

  // Bottom CTA
  bottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 10,
    backgroundColor: N.bg.page,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: N.border.hairline,
  },
  addMore: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: N.text.primary,
    borderRadius: 100,
    paddingVertical: 16,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  addMoreText: {
    fontSize: 16,
    fontFamily: font.bold,
    color: '#FFFFFF',
    fontWeight: '700',
    letterSpacing: -0.2,
  },
});

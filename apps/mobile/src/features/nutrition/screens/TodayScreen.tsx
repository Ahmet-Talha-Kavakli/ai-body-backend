/**
 * Bugün — Yazio + Apple Fitness benzeri light theme.
 * Kompakt öğün listesi, premium kartlar, renkli detayli makro/mineraller.
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  ActivityIndicator,
  Animated,
  DeviceEventEmitter,
  Easing,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
  Pressable,
  Text,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@clerk/expo';
import * as Haptics from 'expo-haptics';
import { fetchPantry } from '../../kitchen/api/client';

import { N, font } from '../theme';
import { CalorieRing } from '../components/CalorieRing';
import { MacroBar } from '../components/MacroBar';
import { MealRow } from '../components/MealRow';
import { DietBanner } from '../components/DietBanner';
import { GoalEditSheet } from '../sheets/GoalEditSheet';
import { useNutritionToday } from '../hooks/useNutritionToday';
import { getCurrentMealType } from '../utils/mealWindow';
import OnboardingScreen from './OnboardingScreen';
import type { MealType } from '../api/types';

const MEAL_ORDER: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];

const EASE_SPRING = Easing.bezier(0.16, 1, 0.3, 1);
const EASE_CLOSE = Easing.bezier(0.4, 0, 1, 1);
const EASE_SMOOTH = Easing.bezier(0.22, 1, 0.36, 1);

type Props = {
  onAddMeal: (mealType: MealType) => void;
  onMealPress: (mealType: MealType) => void;
  onOpenKitchen?: () => void;
  refreshRef?: React.MutableRefObject<(() => void) | null>;
  optimisticRemoveRef?: React.MutableRefObject<((id: string) => void) | null>;
};

export default function TodayScreen({
  onAddMeal,
  onMealPress,
  onOpenKitchen,
  refreshRef,
  optimisticRemoveRef,
}: Props) {
  const insets = useSafeAreaInsets();
  const { data, loading, error, refresh, removeMealOptimistic } = useNutritionToday();

  // Dışarıdan refresh tetiklenebilsin (NutritionHost'taki onAdded için)
  React.useEffect(() => {
    if (refreshRef) refreshRef.current = refresh;
    if (optimisticRemoveRef) optimisticRemoveRef.current = removeMealOptimistic;
  }, [refresh, refreshRef, removeMealOptimistic, optimisticRemoveRef]);
  const [refreshing, setRefreshing] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [microsExpanded, setMicrosExpanded] = useState(false);
  const [subMacrosExpanded, setSubMacrosExpanded] = useState(false);
  const [goalSheetVisible, setGoalSheetVisible] = useState(false);

  useEffect(() => {
    if (!loading && data && !data.goal) setShowOnboarding(true);
  }, [loading, data]);

  if (showOnboarding) {
    return (
      <OnboardingScreen
        onDone={() => {
          setShowOnboarding(false);
          refresh();
        }}
      />
    );
  }

  if (loading && !data) {
    return (
      <View style={styles.loadingRoot}>
        <ActivityIndicator color={N.accent.primary} />
      </View>
    );
  }

  if (error && !data) {
    return (
      <View style={styles.loadingRoot}>
        <Text
          style={{
            color: N.text.secondary,
            fontSize: 15,
            marginBottom: 12,
            fontFamily: font.regular,
          }}
        >
          Bağlantı zaman aşımı
        </Text>
        <Pressable onPress={() => refresh()} style={styles.retryBtn}>
          <Text style={styles.retryText}>Tekrar dene</Text>
        </Pressable>
      </View>
    );
  }

  if (!data) return null;

  const goal = data.goal;
  const totals = data.totals;
  const activeMealType = getCurrentMealType();

  const onRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  const today = new Date();
  const dateLabel = today.toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'long',
    weekday: 'long',
  });

  const activeMealLabel: Record<MealType, string> = {
    breakfast: 'Kahvaltı vakti',
    lunch: 'Öğle yemeği vakti',
    dinner: 'Akşam yemeği vakti',
    snack: 'Atıştırma zamanı',
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        style={[styles.root, { paddingTop: insets.top }]}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={N.accent.primary}
          />
        }
      >
        <View style={styles.header}>
          <Text style={styles.title}>Bugün</Text>
          <Text style={styles.dateLabel}>{dateLabel}</Text>
        </View>

        <DietBanner
          onDietChanged={() => {
            refresh();
          }}
        />

        <View style={styles.card}>
          <CalorieRing
            consumed={Math.round(Number(totals.calories))}
            goal={goal?.calories ?? 2200}
          />
          <Pressable
            onPress={() => {
              Haptics.selectionAsync();
              setGoalSheetVisible(true);
            }}
            style={{
              marginTop: 20,
              backgroundColor: '#000000',
              paddingHorizontal: 20,
              paddingVertical: 10,
              borderRadius: 100,
            }}
          >
            <Text style={{ color: '#FFFFFF', fontSize: 14, fontFamily: font.semibold }}>
              Hedef {goal?.calories ?? 2200} kcal ›
            </Text>
          </Pressable>
          <View style={styles.macroBars}>
            <MacroBar
              label="Protein"
              consumed={Math.round(totals.protein)}
              goal={Math.round(goal?.protein ?? 150)}
              color={N.macro.protein}
              trackColor={N.macro.proteinBg}
            />
            <MacroBar
              label="Karbonhidrat"
              consumed={Math.round(totals.carbs)}
              goal={Math.round(goal?.carbs ?? 250)}
              color={N.macro.carbs}
              trackColor={N.macro.carbsBg}
            />
            <MacroBar
              label="Yağ"
              consumed={Math.round(totals.fat)}
              goal={Math.round(goal?.fat ?? 70)}
              color={N.macro.fat}
              trackColor={N.macro.fatBg}
            />
          </View>
        </View>

        <ExpandSection
          title="Detaylı makro"
          expanded={subMacrosExpanded}
          onToggle={() => setSubMacrosExpanded((s) => !s)}
        >
          <DetailRow
            label="Lif"
            value={totals.fiber}
            goal={goal?.fiber ?? 25}
            unit="g"
            color={N.semantic.success}
          />
          <DetailRow label="Şeker" value={totals.sugar} goal={goal?.sugar ?? 50} unit="g" limit />
          <DetailRow
            label="İlave şeker"
            value={totals.addedSugar}
            goal={goal?.addedSugar ?? 25}
            unit="g"
            limit
          />
          <DetailRow
            label="Doymuş yağ"
            value={totals.satFat}
            goal={goal?.satFat ?? 20}
            unit="g"
            limit
          />
          <DetailRow
            label="Trans yağ"
            value={totals.transFat}
            goal={goal?.transFat ?? 2}
            unit="g"
            limit
            decimals={1}
          />
          <DetailRow
            label="Kolesterol"
            value={totals.cholesterol}
            goal={goal?.cholesterol ?? 300}
            unit="mg"
            limit
          />
          <DetailRow
            label="Sodyum"
            value={totals.sodium}
            goal={goal?.sodium ?? 2300}
            unit="mg"
            limit
          />
          <DetailRow
            label="Alkol"
            value={totals.alcohol}
            goal={0}
            unit="g"
            limit
            decimals={1}
            hideGoal
          />
        </ExpandSection>

        <ExpandSection
          title="Vitamin & mineral"
          expanded={microsExpanded}
          onToggle={() => setMicrosExpanded((s) => !s)}
        >
          <GroupTitle>Vitaminler</GroupTitle>
          <DetailRow
            label="A vitamini"
            value={totals.micros.vitA}
            unit="mcg"
            goal={900}
            color="#FF9F0A"
          />
          <DetailRow
            label="C vitamini"
            value={totals.micros.vitC}
            unit="mg"
            goal={90}
            color="#FF9F0A"
          />
          <DetailRow
            label="D vitamini"
            value={totals.micros.vitD}
            unit="mcg"
            goal={20}
            color="#FF9F0A"
          />
          <DetailRow
            label="E vitamini"
            value={totals.micros.vitE}
            unit="mg"
            goal={15}
            color="#FF9F0A"
          />
          <DetailRow
            label="K vitamini"
            value={totals.micros.vitK}
            unit="mcg"
            goal={120}
            color="#FF9F0A"
          />
          <DetailRow
            label="B1 (tiamin)"
            value={totals.micros.b1}
            unit="mg"
            goal={1.2}
            decimals={2}
            color="#FF9F0A"
          />
          <DetailRow
            label="B2 (riboflavin)"
            value={totals.micros.b2}
            unit="mg"
            goal={1.3}
            decimals={2}
            color="#FF9F0A"
          />
          <DetailRow
            label="B3 (niasin)"
            value={totals.micros.b3}
            unit="mg"
            goal={16}
            color="#FF9F0A"
          />
          <DetailRow
            label="B6"
            value={totals.micros.b6}
            unit="mg"
            goal={1.7}
            decimals={2}
            color="#FF9F0A"
          />
          <DetailRow
            label="B9 (folat)"
            value={totals.micros.b9}
            unit="mcg"
            goal={400}
            color="#FF9F0A"
          />
          <DetailRow
            label="B12"
            value={totals.micros.b12}
            unit="mcg"
            goal={2.4}
            decimals={2}
            color="#FF9F0A"
          />

          <GroupTitle>Mineraller</GroupTitle>
          <DetailRow
            label="Kalsiyum"
            value={totals.micros.Ca}
            unit="mg"
            goal={1000}
            color="#0A84FF"
          />
          <DetailRow label="Demir" value={totals.micros.Fe} unit="mg" goal={18} color="#0A84FF" />
          <DetailRow
            label="Magnezyum"
            value={totals.micros.Mg}
            unit="mg"
            goal={400}
            color="#0A84FF"
          />
          <DetailRow label="Fosfor" value={totals.micros.P} unit="mg" goal={700} color="#0A84FF" />
          <DetailRow
            label="Potasyum"
            value={totals.micros.K}
            unit="mg"
            goal={3500}
            color="#0A84FF"
          />
          <DetailRow label="Çinko" value={totals.micros.Zn} unit="mg" goal={11} color="#0A84FF" />
          <DetailRow
            label="Selenyum"
            value={totals.micros.Se}
            unit="mcg"
            goal={55}
            color="#0A84FF"
          />
          <DetailRow
            label="Bakır"
            value={totals.micros.Cu}
            unit="mg"
            goal={0.9}
            decimals={2}
            color="#0A84FF"
          />
          <DetailRow
            label="Manganez"
            value={totals.micros.Mn}
            unit="mg"
            goal={2.3}
            decimals={2}
            color="#0A84FF"
          />
        </ExpandSection>

        <Text style={[styles.sectionTitle, { marginTop: 20, marginBottom: 10 }]}>Öğünler</Text>
        <View style={styles.mealsCard}>
          {MEAL_ORDER.map((mt, idx) => (
            <React.Fragment key={mt}>
              <MealRow
                mealType={mt}
                meals={data.meals[mt] ?? []}
                goalKcal={
                  goal
                    ? Math.round(
                        goal.calories *
                          (mt === 'breakfast'
                            ? 0.25
                            : mt === 'lunch'
                              ? 0.35
                              : mt === 'dinner'
                                ? 0.3
                                : 0.1),
                      )
                    : undefined
                }
                active={activeMealType === mt}
                onAdd={() => onAddMeal(mt)}
                onPress={() => onMealPress(mt)}
              />
              {idx < MEAL_ORDER.length - 1 && <View style={styles.rowDivider} />}
            </React.Fragment>
          ))}
        </View>

        <Text style={[styles.sectionTitle, { marginTop: 28, marginBottom: 10 }]}>Mutfak</Text>
        <KitchenCard
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            onOpenKitchen?.();
          }}
        />
      </ScrollView>

      <GoalEditSheet
        visible={goalSheetVisible}
        currentGoal={
          goal
            ? { calories: goal.calories, protein: goal.protein, carbs: goal.carbs, fat: goal.fat }
            : null
        }
        onClose={() => setGoalSheetVisible(false)}
        onSaved={() => {
          setGoalSheetVisible(false);
          refresh();
        }}
      />
    </View>
  );
}

function KitchenCard({ onPress }: { onPress: () => void }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const { getToken } = useAuth();
  const [stats, setStats] = useState<{ total: number; soon: number; expired: number } | null>(null);

  const load = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) return;
      const { items } = await fetchPantry(token);
      const now = Date.now();
      const soonMs = 3 * 24 * 60 * 60 * 1000;
      let soon = 0;
      let expired = 0;
      for (const it of items) {
        if (!it.expiresAt) continue;
        const t = new Date(it.expiresAt).getTime();
        if (isNaN(t)) continue;
        const diff = t - now;
        if (diff < 0) expired++;
        else if (diff <= soonMs) soon++;
      }
      setStats({ total: items.length, soon, expired });
    } catch (e) {
      // sessizce geç — kart yine de tıklanabilir
    }
  }, [getToken]);

  useEffect(() => {
    load();
    const sub = DeviceEventEmitter.addListener('pantry:dirty', load);
    return () => sub.remove();
  }, [load]);

  const onPressIn = () => {
    Animated.timing(scaleAnim, {
      toValue: 0.975,
      duration: 120,
      useNativeDriver: true,
      easing: Easing.bezier(0.4, 0, 0.2, 1),
    }).start();
  };
  const onPressOut = () => {
    Animated.timing(scaleAnim, {
      toValue: 1,
      duration: 100,
      useNativeDriver: true,
      easing: Easing.bezier(0.4, 0, 0.2, 1),
    }).start();
  };

  return (
    <Animated.View style={[styles.kitchenOuter, { transform: [{ scale: scaleAnim }] }]}>
      <Pressable
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        style={{ overflow: 'hidden' }}
      >
        <View style={styles.kitchenBg}>
          <View style={styles.kitchenTopRow}>
            <View style={styles.kitchenBadge}>
              <View style={styles.kitchenBadgeDot} />
              <Text style={styles.kitchenBadgeText}>AI Destekli</Text>
            </View>
            <Text style={styles.kitchenBigEmoji}>🧊</Text>
          </View>
          <View style={styles.kitchenTitleBlock}>
            <Text style={styles.kitchenMainTitle}>Buzdolabım</Text>
            <Text style={styles.kitchenMainSub}>Stok takibi · Raf ömrü uyarısı · AI tarama</Text>
          </View>
          <View style={styles.kitchenStatsRow}>
            <View style={styles.kitchenStat}>
              <Text style={styles.kitchenStatValue}>{stats ? stats.total : '—'}</Text>
              <Text style={styles.kitchenStatLabel}>Toplam ürün</Text>
            </View>
            <View style={styles.kitchenStatDivider} />
            <View style={styles.kitchenStat}>
              <Text style={[styles.kitchenStatValue, { color: '#FF9F0A' }]}>
                {stats ? stats.soon : '—'}
              </Text>
              <Text style={styles.kitchenStatLabel}>Yakında biter</Text>
            </View>
            <View style={styles.kitchenStatDivider} />
            <View style={styles.kitchenStat}>
              <Text style={[styles.kitchenStatValue, { color: '#FF453A' }]}>
                {stats ? stats.expired : '—'}
              </Text>
              <Text style={styles.kitchenStatLabel}>Süresi doldu</Text>
            </View>
          </View>
        </View>
        <View style={styles.kitchenCtaRow}>
          <Text style={styles.kitchenCtaLabel}>Buzdolabını Tara</Text>
          <View style={styles.kitchenCtaChev}>
            <Ionicons name="chevron-forward" size={14} color="rgba(255,255,255,0.7)" />
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

function GroupTitle({ children }: { children: React.ReactNode }) {
  return <Text style={styles.groupTitle}>{children}</Text>;
}

function ExpandSection({
  title,
  expanded,
  onToggle,
  children,
}: {
  title: string;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  const rotate = useRef(new Animated.Value(expanded ? 1 : 0)).current;
  useEffect(() => {
    Animated.timing(rotate, {
      toValue: expanded ? 1 : 0,
      duration: expanded ? 220 : 180,
      easing: expanded ? EASE_SPRING : EASE_CLOSE,
      useNativeDriver: true,
    }).start();
  }, [expanded, rotate]);

  const rot = rotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });

  return (
    <View style={styles.expandCard}>
      <Pressable
        onPress={() => {
          Haptics.selectionAsync();
          onToggle();
        }}
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingVertical: 16,
        }}
      >
        <Text style={styles.expandTitle}>{title}</Text>
        <Animated.View style={{ transform: [{ rotate: rot }] }}>
          <Ionicons name="chevron-down" size={18} color={N.text.tertiary} />
        </Animated.View>
      </Pressable>
      {expanded && <View style={styles.expandBody}>{children}</View>}
    </View>
  );
}

function DetailRow({
  label,
  value,
  goal,
  unit,
  limit,
  decimals,
  hideGoal,
  color,
}: {
  label: string;
  value: number;
  goal: number;
  unit: string;
  limit?: boolean;
  decimals?: number;
  hideGoal?: boolean;
  color?: string;
}) {
  const fmt = (n: number) => (decimals ? n.toFixed(decimals) : Math.round(n).toString());
  const ratio = goal > 0 ? Math.min(value / goal, 1.2) : 0;

  const fillAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(fillAnim, {
      toValue: ratio,
      duration: 1100,
      easing: EASE_SMOOTH,
      useNativeDriver: false,
    }).start();
  }, [ratio, fillAnim]);

  const baseColor = color ?? N.accent.primary;
  const barColor = limit
    ? ratio > 1
      ? N.semantic.danger
      : ratio > 0.85
        ? N.semantic.warning
        : N.semantic.success
    : ratio >= 0.95
      ? N.semantic.success
      : baseColor;

  const widthInterp = fillAnim.interpolate({ inputRange: [0, 1.2], outputRange: ['0%', '100%'] });

  return (
    <View style={styles.detailRow}>
      <View style={styles.detailHeader}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue}>
          <Text style={styles.detailValueStrong}>{fmt(value)}</Text>
          {!hideGoal && <Text style={styles.detailGoal}> / {fmt(goal)} </Text>}
          <Text style={styles.detailUnit}>{unit}</Text>
        </Text>
      </View>
      {goal > 0 && (
        <View style={styles.detailTrack}>
          <Animated.View
            style={[styles.detailFill, { width: widthInterp, backgroundColor: barColor }]}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: N.bg.page },
  content: { paddingHorizontal: 16 },
  loadingRoot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: N.bg.page,
    padding: 24,
  },
  retryBtn: {
    backgroundColor: N.text.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  retryText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600', fontFamily: font.semibold },

  header: { paddingTop: 8, paddingBottom: 20 },
  title: {
    fontSize: 34,
    fontWeight: '800',
    fontFamily: font.extrabold,
    color: N.text.primary,
    letterSpacing: -1,
  },
  dateLabel: {
    fontSize: 15,
    color: N.text.tertiary,
    marginTop: 2,
    textTransform: 'capitalize',
    fontWeight: '500',
    fontFamily: font.medium,
  },

  card: {
    backgroundColor: N.bg.card,
    borderRadius: 24,
    paddingTop: 28,
    paddingBottom: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
    ...N.shadow.card,
  },
  macroBars: { width: '100%', marginTop: 16, gap: 14 },
  goalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 100,
    backgroundColor: '#1C1C1E',
    marginTop: 24,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  goalBtnText: { fontSize: 14, fontFamily: font.semibold, color: '#FFFFFF', letterSpacing: -0.2 },

  activeChipWrap: { alignItems: 'flex-start', marginTop: 16, marginBottom: 4 },
  activeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 100,
    backgroundColor: N.accent.soft,
  },
  activeDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: N.accent.primary },
  activeChipText: {
    fontSize: 13,
    color: N.accent.primaryDim,
    fontWeight: '600',
    fontFamily: font.semibold,
    letterSpacing: -0.1,
  },

  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    fontFamily: font.bold,
    color: N.text.primary,
    letterSpacing: -0.4,
  },

  mealsCard: {
    backgroundColor: N.bg.card,
    borderRadius: 18,
    overflow: 'hidden',
    ...N.shadow.card,
  },
  rowDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: N.border.hairline,
    marginLeft: 74,
  },
  kitchenOuter: {
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#007AFF',
    ...N.shadow.soft,
  },
  kitchenBg: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 0,
  },
  kitchenTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  kitchenBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(20,184,166,0.22)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 100,
  },
  kitchenBadgeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#2DD4BF' },
  kitchenBadgeText: {
    fontSize: 11,
    color: '#2DD4BF',
    fontWeight: '600',
    fontFamily: font.semibold,
    letterSpacing: 0.2,
  },
  kitchenBigEmoji: { fontSize: 64, lineHeight: 72, marginTop: -4 },
  kitchenTitleBlock: { marginTop: 12 },
  kitchenMainTitle: {
    fontSize: 20,
    fontWeight: '800',
    fontFamily: font.extrabold,
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  kitchenMainSub: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.55)',
    marginTop: 4,
    fontFamily: font.regular,
  },
  kitchenStatsRow: {
    flexDirection: 'row',
    marginTop: 18,
    gap: 1,
  },
  kitchenStat: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 4,
    alignItems: 'center',
  },
  kitchenStatDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginVertical: 10,
  },
  kitchenStatValue: {
    fontSize: 20,
    fontWeight: '800',
    fontFamily: font.extrabold,
    color: '#FFFFFF',
    letterSpacing: -0.4,
  },
  kitchenStatLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.45)',
    marginTop: 2,
    fontFamily: font.regular,
  },
  kitchenCtaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 20,
    paddingVertical: 14,
    marginTop: 4,
  },
  kitchenCtaLabel: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: font.semibold,
    color: 'rgba(255,255,255,0.85)',
    letterSpacing: -0.2,
  },
  kitchenCtaChev: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  expandCard: {
    backgroundColor: N.bg.card,
    borderRadius: 18,
    marginTop: 14,
    paddingHorizontal: 4,
    overflow: 'hidden',
    ...N.shadow.card,
  },
  expandHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  expandTitle: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: font.bold,
    color: N.text.primary,
    letterSpacing: -0.2,
  },
  expandBody: { paddingHorizontal: 16, paddingBottom: 18, paddingTop: 4 },

  groupTitle: {
    fontSize: 11,
    fontFamily: font.bold,
    color: N.text.tertiary,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginTop: 10,
    marginBottom: 8,
  },

  detailRow: { paddingVertical: 8 },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 6,
  },
  detailLabel: {
    fontSize: 14,
    color: N.text.secondary,
    fontWeight: '500',
    fontFamily: font.medium,
    letterSpacing: -0.1,
  },
  detailValue: { fontSize: 13, fontVariant: ['tabular-nums'], fontFamily: font.regular },
  detailValueStrong: {
    fontWeight: '700',
    fontFamily: font.bold,
    color: N.text.primary,
    fontSize: 14,
  },
  detailGoal: { color: N.text.tertiary, fontWeight: '500', fontFamily: font.medium },
  detailUnit: { color: N.text.tertiary, fontSize: 11, fontFamily: font.regular },
  detailTrack: { height: 5, backgroundColor: N.bg.well, borderRadius: 3, overflow: 'hidden' },
  detailFill: { height: '100%', borderRadius: 3 },
});

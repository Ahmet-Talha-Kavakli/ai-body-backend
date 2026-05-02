import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Animated,
  Easing,
  Alert,
  ActivityIndicator,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { N, font } from '../theme';
import { useActiveDiet } from '../../diet/hooks/useActiveDiet';
import type { DietDayMenu } from '../../diet/api/types';

const MEAL_LABELS: Record<string, string> = {
  breakfast: 'Kahvaltı',
  lunch: 'Öğle',
  dinner: 'Akşam',
  snack: 'Atıştırmalık',
};

type Props = {
  onDietChanged?: () => void;
};

export function DietBanner({ onDietChanged }: Props) {
  const { plan, loading, apply, applyAllDay, refresh } = useActiveDiet();
  const [applying, setApplying] = React.useState(false);
  const [applyingAll, setApplyingAll] = React.useState(false);
  const progAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!plan) return;
    Animated.timing(progAnim, {
      toValue: plan.progress.pct / 100,
      duration: 1100,
      useNativeDriver: false,
      easing: Easing.bezier(0.22, 1, 0.36, 1),
    }).start();
  }, [plan?.progress.pct]);

  if (loading || !plan || plan.status !== 'active') return null;

  const accent = plan.accentColor;
  const today = plan.dayMenus ?? [];
  const pending = today.filter((m) => !m.appliedAt);
  const applied = today.filter((m) => m.appliedAt);

  const handleApply = async (menu: DietDayMenu) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setApplying(true);
    try {
      await apply(menu.id);
      onDietChanged?.();
    } catch {
      Alert.alert('Hata', 'Öğün uygulanamadı.');
    } finally {
      setApplying(false);
    }
  };

  const handleApplyAll = () => {
    if (pending.length === 0) return;
    Alert.alert(
      'Tüm Günü Uygula',
      `Bugünün ${pending.length} öğünü plana göre günlüğüne kaydedilecek.`,
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Uygula',
          onPress: async () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            setApplyingAll(true);
            try {
              await applyAllDay();
              onDietChanged?.();
            } catch {
              Alert.alert('Hata', 'Günlük menü uygulanamadı.');
            } finally {
              setApplyingAll(false);
            }
          },
        },
      ],
    );
  };

  const width = progAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  return (
    <View style={[s.wrap, { backgroundColor: accent + '12' }]}>
      {/* Header: plan adı + gün */}
      <View style={s.header}>
        <View style={[s.iconWrap, { backgroundColor: accent }]}>
          <Text style={s.icon}>🥗</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.label}>Aktif Diyet Planı</Text>
          <Text style={s.name} numberOfLines={1}>
            {plan.name}
          </Text>
        </View>
        <View style={s.dayBadge}>
          <Text style={[s.dayNum, { color: accent }]}>{plan.progress.dayNumber}</Text>
          <Text style={s.dayLabel}>/ {plan.progress.totalDays}</Text>
        </View>
      </View>

      {/* Progress */}
      <View style={s.barTrack}>
        <Animated.View style={[s.barFill, { width, backgroundColor: accent }]} />
      </View>

      {/* Bugünün önerilen menüsü */}
      {today.length > 0 && (
        <>
          <View style={s.menuHeader}>
            <Text style={s.menuTitle}>Bugünün Önerilen Menüsü</Text>
            {pending.length > 0 && (
              <Pressable
                onPress={handleApplyAll}
                disabled={applyingAll}
                style={({ pressed }) => ({
                  backgroundColor: '#000',
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  borderRadius: 14,
                  opacity: pressed || applyingAll ? 0.8 : 1,
                  minHeight: 34,
                  alignItems: 'center',
                  justifyContent: 'center',
                })}
              >
                {applyingAll ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={{ fontFamily: font.bold, fontSize: 12, color: '#fff' }}>
                    Tümünü Uygula
                  </Text>
                )}
              </Pressable>
            )}
          </View>

          <View style={s.menuList}>
            {today.map((menu) => {
              const isApplied = !!menu.appliedAt;
              return (
                <View key={menu.id} style={s.menuRow}>
                  <View
                    style={[s.mealDot, { backgroundColor: isApplied ? accent : accent + '50' }]}
                  />
                  <View style={s.mealMid}>
                    <Text style={s.mealType}>{MEAL_LABELS[menu.mealType] ?? menu.mealType}</Text>
                    <Text
                      style={[
                        s.mealName,
                        isApplied && { textDecorationLine: 'line-through', color: N.text.tertiary },
                      ]}
                      numberOfLines={1}
                    >
                      {menu.items[0]?.name ?? '—'}
                    </Text>
                    <Text style={[s.mealCal, { color: accent }]}>{menu.totalCalories} kal</Text>
                  </View>
                  {isApplied ? (
                    <View style={[s.appliedBadge, { backgroundColor: accent + '22' }]}>
                      <Text style={[s.appliedText, { color: accent }]}>✓</Text>
                    </View>
                  ) : (
                    <Pressable
                      onPress={() => handleApply(menu)}
                      disabled={applying}
                      style={({ pressed }) => ({
                        backgroundColor: accent,
                        paddingHorizontal: 16,
                        paddingVertical: 9,
                        borderRadius: 14,
                        opacity: pressed || applying ? 0.8 : 1,
                        minWidth: 78,
                        alignItems: 'center',
                        justifyContent: 'center',
                      })}
                    >
                      <Text style={{ fontFamily: font.bold, fontSize: 13, color: '#fff' }}>
                        Uygula
                      </Text>
                    </Pressable>
                  )}
                </View>
              );
            })}
          </View>
        </>
      )}

      {applied.length === today.length && today.length > 0 && (
        <View style={[s.completeRow, { backgroundColor: accent + '20' }]}>
          <Text style={[s.completeText, { color: accent }]}>
            🎉 Bugün tamamlandı! Harika gidiyorsun.
          </Text>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  wrap: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 20,
    padding: 16,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: { fontSize: 22 },
  label: {
    fontFamily: font.medium,
    fontSize: 11,
    color: N.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  name: { fontFamily: font.bold, fontSize: 16, color: N.text.primary, marginTop: 1 },
  dayBadge: { flexDirection: 'row', alignItems: 'baseline' },
  dayNum: { fontFamily: font.extrabold, fontSize: 22, letterSpacing: -0.5 },
  dayLabel: { fontFamily: font.medium, fontSize: 13, color: N.text.tertiary, marginLeft: 2 },

  barTrack: {
    height: 6,
    backgroundColor: 'rgba(0,0,0,0.06)',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 14,
  },
  barFill: { height: 6, borderRadius: 3 },

  menuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  menuTitle: { fontFamily: font.bold, fontSize: 13, color: N.text.primary },
  applyAllBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 14,
    minHeight: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyAllText: { fontFamily: font.bold, fontSize: 12, color: '#fff' },

  menuList: { gap: 8 },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    gap: 10,
  },
  mealDot: { width: 8, height: 8, borderRadius: 4 },
  mealMid: { flex: 1 },
  mealType: {
    fontFamily: font.semibold,
    fontSize: 10,
    color: N.text.tertiary,
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  mealName: { fontFamily: font.medium, fontSize: 14, color: N.text.primary, marginBottom: 2 },
  mealCal: { fontFamily: font.bold, fontSize: 12 },
  appliedBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  appliedText: { fontFamily: font.bold, fontSize: 13 },
  applyBtnText: { fontFamily: font.bold, fontSize: 12, color: '#fff' },

  completeRow: { borderRadius: 14, padding: 12, marginTop: 12, alignItems: 'center' },
  completeText: { fontFamily: font.semibold, fontSize: 13 },
});

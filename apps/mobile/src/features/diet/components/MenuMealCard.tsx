import React, { useRef } from 'react';
import { View, Text, Pressable, StyleSheet, Animated } from 'react-native';
import * as Haptics from 'expo-haptics';
import { font, palette as N } from '../../nutrition/theme';
import type { DietDayMenu } from '../api/types';

const MEAL_LABELS: Record<string, string> = {
  breakfast: 'Kahvaltı',
  lunch: 'Öğle',
  dinner: 'Akşam',
  snack: 'Atıştırmalık',
};

type Props = {
  menu: DietDayMenu;
  accentColor: string;
  onApply: (menuId: string) => Promise<void>;
};

export function MenuMealCard({ menu, accentColor, onApply }: Props) {
  const applied = !!menu.appliedAt;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handleApply = async () => {
    if (applied) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.96, duration: 80, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 120, useNativeDriver: true }),
    ]).start();
    await onApply(menu.id);
  };

  return (
    <Animated.View style={[styles.card, { transform: [{ scale: scaleAnim }] }]}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.mealType}>{MEAL_LABELS[menu.mealType] ?? menu.mealType}</Text>
          <Text style={styles.mealName} numberOfLines={1}>
            {menu.items[0]?.name ?? '—'}
          </Text>
        </View>
        <Text style={[styles.cal, { color: accentColor }]}>{menu.totalCalories} kal</Text>
      </View>

      <View style={styles.items}>
        {menu.items.slice(0, 3).map((it, i) => (
          <Text key={i} style={styles.item} numberOfLines={1}>
            · {it.name}
            {it.quantity > 1 ? ` ×${it.quantity}` : ''}
          </Text>
        ))}
        {menu.items.length > 3 && <Text style={styles.more}>+{menu.items.length - 3} daha</Text>}
      </View>

      <View style={styles.footer}>
        <View style={styles.macros}>
          <Text style={styles.macro}>P {menu.totalProteinG}g</Text>
          <Text style={styles.macro}>K {menu.totalCarbsG}g</Text>
          <Text style={styles.macro}>Y {menu.totalFatG}g</Text>
        </View>
        {applied ? (
          <View style={[styles.appliedBadge, { backgroundColor: accentColor + '22' }]}>
            <Text style={[styles.appliedText, { color: accentColor }]}>Uygulandı ✓</Text>
          </View>
        ) : (
          <Pressable
            onPress={handleApply}
            style={({ pressed }) => [
              styles.applyBtn,
              { backgroundColor: accentColor, opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <Text style={styles.applyBtnText}>Uygula</Text>
          </Pressable>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    marginHorizontal: 16,
    marginBottom: 10,
    shadowColor: '#0F172A',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  headerLeft: { flex: 1, marginRight: 8 },
  mealType: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 11,
    color: N.text.tertiary,
    marginBottom: 2,
  },
  mealName: { fontFamily: 'Sora_700Bold', fontSize: 15, color: N.text.primary },
  cal: { fontFamily: 'Sora_700Bold', fontSize: 16 },
  items: { marginBottom: 10 },
  item: { fontFamily: font.regular, fontSize: 12, color: N.text.secondary, lineHeight: 19 },
  more: { fontFamily: font.regular, fontSize: 11, color: N.text.tertiary, marginTop: 2 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  macros: { flexDirection: 'row', gap: 8 },
  macro: { fontFamily: font.medium, fontSize: 11, color: N.text.tertiary },
  applyBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  applyBtnText: { fontFamily: font.semibold, fontSize: 13, color: '#fff' },
  appliedBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  appliedText: { fontFamily: font.semibold, fontSize: 12 },
});

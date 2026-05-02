import React from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, SafeAreaView, Alert } from 'react-native';
import * as Haptics from 'expo-haptics';
import { font, palette as N } from '../../nutrition/theme';
import { PlanProgressHeader } from '../components/PlanProgressHeader';
import { MenuMealCard } from '../components/MenuMealCard';
import type { ActiveDietPlan } from '../api/types';

type Props = {
  plan: ActiveDietPlan;
  onStop: () => void;
  onApply: (menuId: string) => Promise<any>;
  onStopConfirm: () => Promise<void>;
};

export function ActiveDietScreen({ plan, onStop, onApply, onStopConfirm }: Props) {
  const handleStop = () => {
    Alert.alert('Planı Durdur', 'Aktif diyet planını durdurmak istediğinden emin misin?', [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Durdur',
        style: 'destructive',
        onPress: async () => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          await onStopConfirm();
          onStop();
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.navRow}>
        <Text style={styles.navTitle}>Diyet Planım</Text>
        <Pressable onPress={handleStop} style={styles.stopBtn} hitSlop={8}>
          <Text style={styles.stopBtnText}>Durdur</Text>
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <PlanProgressHeader plan={plan} />

        <Text style={styles.sectionLabel}>Bugünün Menüsü</Text>
        {plan.dayMenus.length === 0 ? (
          <Text style={styles.emptyText}>Bugün için menü oluşturulamadı.</Text>
        ) : (
          plan.dayMenus.map((menu) => (
            <MenuMealCard
              key={menu.id}
              menu={menu}
              accentColor={plan.accentColor}
              onApply={onApply}
            />
          ))
        )}

        {plan.rules?.tips?.length > 0 && (
          <View style={styles.tipsCard}>
            <Text style={styles.tipsTitle}>💡 İpuçları</Text>
            {plan.rules.tips.map((tip, i) => (
              <Text key={i} style={styles.tip}>
                {tip}
              </Text>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: N.bg.page },
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  navTitle: { fontFamily: font.bold, fontSize: 24, color: N.text.primary },
  stopBtn: { paddingHorizontal: 12, paddingVertical: 6 },
  stopBtnText: { fontFamily: font.semibold, fontSize: 15, color: N.semantic.danger },
  sectionLabel: {
    fontFamily: font.semibold,
    fontSize: 13,
    color: N.text.tertiary,
    marginHorizontal: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontFamily: font.regular,
    fontSize: 14,
    color: N.text.tertiary,
    textAlign: 'center',
    marginTop: 40,
  },
  tipsCard: { margin: 16, backgroundColor: '#FFF9E6', borderRadius: 14, padding: 14 },
  tipsTitle: {
    fontFamily: font.semibold,
    fontSize: 13,
    color: N.semantic.warning,
    marginBottom: 8,
  },
  tip: {
    fontFamily: font.regular,
    fontSize: 13,
    color: N.text.secondary,
    lineHeight: 20,
    marginBottom: 4,
  },
});

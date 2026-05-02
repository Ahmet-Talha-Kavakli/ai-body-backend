import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { OnboardingData } from '../index';

const TEAL = '#2DD4BF';
const LEVELS = [
  { value: 'sedentary', label: 'Sedanter', sub: 'Haftada 0-1 gün', emoji: '🛋️', days: 0 },
  { value: 'lightly_active', label: 'Hafif Aktif', sub: 'Haftada 2-3 gün', emoji: '🚶', days: 2 },
  { value: 'moderately_active', label: 'Orta Aktif', sub: 'Haftada 3-4 gün', emoji: '🏋️', days: 3 },
  { value: 'very_active', label: 'Çok Aktif', sub: 'Haftada 5+ gün', emoji: '🔥', days: 5 },
];

interface Props {
  data: OnboardingData;
  onChange: (d: Partial<OnboardingData>) => void;
}

export function Step5Activity({ data, onChange }: Props) {
  return (
    <View style={styles.root}>
      <Text style={styles.title}>Aktivite{'\n'}Seviyeniz</Text>
      <Text style={styles.subtitle}>Şu anki rutininizi seçin.</Text>

      <View style={styles.list}>
        {LEVELS.map((l) => {
          const active = data.fitnessLevel === l.value;
          return (
            <TouchableOpacity
              key={l.value}
              style={[styles.card, active && styles.cardActive]}
              onPress={() => onChange({ fitnessLevel: l.value, trainingDaysPerWeek: l.days })}
              activeOpacity={0.75}
            >
              <Text style={styles.emoji}>{l.emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.label, active && { color: TEAL }]}>{l.label}</Text>
                <Text style={styles.sub}>{l.sub}</Text>
              </View>
              {active && <Ionicons name="checkmark-circle" size={22} color={TEAL} />}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingTop: 8 },
  title: {
    color: '#1A1A2E',
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.8,
    lineHeight: 36,
    marginBottom: 8,
  },
  subtitle: { color: '#94A3B8', fontSize: 15, marginBottom: 28 },
  list: { gap: 10 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 18,
  },
  cardActive: { borderColor: TEAL, backgroundColor: TEAL + '10' },
  emoji: { fontSize: 26 },
  label: { color: '#1A1A2E', fontSize: 16, fontWeight: '700', marginBottom: 2 },
  sub: { color: '#94A3B8', fontSize: 13 },
});

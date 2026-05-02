import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { OnboardingData } from '../index';

const TEAL = '#2DD4BF';

const CONDITIONS = [
  { value: 'diabetes', label: 'Diyabet' },
  { value: 'heart_disease', label: 'Kalp Hastalığı' },
  { value: 'hypertension', label: 'Hipertansiyon' },
  { value: 'joint_problems', label: 'Eklem Sorunları' },
  { value: 'back_pain', label: 'Sırt Ağrısı' },
];

const BODY_PARTS = ['Diz', 'Omuz', 'Bel', 'Boyun', 'Bilek', 'Dirsek', 'Kalça', 'Ayak Bileği'];

interface Props {
  data: OnboardingData;
  onChange: (d: Partial<OnboardingData>) => void;
}

export function Step6Health({ data, onChange }: Props) {
  const toggleCondition = (v: string) => {
    const curr = data.medicalRestrictions;
    onChange({
      medicalRestrictions: curr.includes(v) ? curr.filter((c) => c !== v) : [...curr, v],
    });
  };

  const toggleInjury = (v: string) => {
    const curr = data.activeInjuries;
    onChange({ activeInjuries: curr.includes(v) ? curr.filter((c) => c !== v) : [...curr, v] });
  };

  return (
    <ScrollView style={styles.root} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Sağlık{'\n'}Durumun</Text>
      <Text style={styles.subtitle}>AI koçun seni güvende tutsun.</Text>

      <Text style={styles.sectionTitle}>Sağlık Durumları</Text>
      <View style={styles.chipRow}>
        {CONDITIONS.map((c) => {
          const active = data.medicalRestrictions.includes(c.value);
          return (
            <TouchableOpacity
              key={c.value}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => toggleCondition(c.value)}
              activeOpacity={0.75}
            >
              {active && <Ionicons name="checkmark" size={13} color={TEAL} />}
              <Text style={[styles.chipText, active && { color: TEAL }]}>{c.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={[styles.sectionTitle, { marginTop: 28 }]}>Aktif Sakatlıklar</Text>
      <View style={styles.chipRow}>
        {BODY_PARTS.map((p) => {
          const active = data.activeInjuries.includes(p);
          return (
            <TouchableOpacity
              key={p}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => toggleInjury(p)}
              activeOpacity={0.75}
            >
              {active && <Ionicons name="checkmark" size={13} color={TEAL} />}
              <Text style={[styles.chipText, active && { color: TEAL }]}>{p}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  title: {
    color: '#1A1A2E',
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.8,
    lineHeight: 36,
    marginBottom: 8,
    marginTop: 8,
  },
  subtitle: { color: '#94A3B8', fontSize: 15, marginBottom: 28 },
  sectionTitle: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  chipActive: { borderColor: TEAL, backgroundColor: TEAL + '12' },
  chipText: { color: '#475569', fontSize: 14, fontWeight: '500' },
});

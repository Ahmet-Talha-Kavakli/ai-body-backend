import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { OnboardingData } from '../index';

const TEAL = '#2DD4BF';

const GOALS = [
  { value: 'weight_loss', label: 'Kilo Vermek', emoji: '🔥', desc: 'Yağ yak, fit ol' },
  { value: 'muscle_gain', label: 'Kas Yapmak', emoji: '💪', desc: 'Güç ve hacim kazan' },
  {
    value: 'healthy_lifestyle',
    label: 'Sağlıklı Yaşam',
    emoji: '🏃',
    desc: 'Genel sağlığını iyileştir',
  },
  {
    value: 'disease_management',
    label: 'Hastalık Yönetimi',
    emoji: '🏥',
    desc: 'Sağlık durumunu yönet',
  },
  {
    value: 'performance',
    label: 'Performans Artırmak',
    emoji: '⚡',
    desc: 'Spor performansını geliştir',
  },
  { value: 'mental_health', label: 'Zihinsel Sağlık', emoji: '🧘', desc: 'Stres azalt, odaklan' },
];

interface Props {
  data: OnboardingData;
  onChange: (d: Partial<OnboardingData>) => void;
}

export function Step2Goal({ data, onChange }: Props) {
  return (
    <View style={styles.root}>
      <Text style={styles.title}>Ana hedefiniz{'\n'}ne?</Text>
      <Text style={styles.subtitle}>Sana en uygun planı oluşturalım.</Text>

      <View style={styles.grid}>
        {GOALS.map((g) => {
          const active = data.primaryGoal === g.value;
          return (
            <TouchableOpacity
              key={g.value}
              style={[styles.card, active && styles.cardActive]}
              onPress={() => onChange({ primaryGoal: g.value })}
              activeOpacity={0.75}
            >
              <Text style={styles.emoji}>{g.emoji}</Text>
              <Text style={[styles.label, active && styles.labelActive]}>{g.label}</Text>
              <Text style={styles.desc}>{g.desc}</Text>
              {active && (
                <View style={styles.check}>
                  <Ionicons name="checkmark" size={12} color="#000" />
                </View>
              )}
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
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  card: {
    width: '47.5%',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    position: 'relative',
  },
  cardActive: { borderColor: TEAL, backgroundColor: TEAL + '12' },
  emoji: { fontSize: 28, marginBottom: 10 },
  label: { color: '#1A1A2E', fontSize: 14, fontWeight: '700', marginBottom: 4 },
  labelActive: { color: TEAL },
  desc: { color: '#94A3B8', fontSize: 12, lineHeight: 16 },
  check: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: TEAL,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

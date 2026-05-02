import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { OnboardingData } from '../index';

const TEAL = '#2DD4BF';
const DIETS = [
  { value: 'omnivore', label: 'Her şey yiyorum', emoji: '🥩' },
  { value: 'vegetarian', label: 'Vejetaryen', emoji: '🥗' },
  { value: 'vegan', label: 'Vegan', emoji: '🌱' },
  { value: 'keto', label: 'Ketojenik', emoji: '🥚' },
  { value: 'gluten_free', label: 'Glutensiz', emoji: '🌾' },
  { value: 'other', label: 'Diğer', emoji: '🍽️' },
];

interface Props {
  data: OnboardingData;
  onChange: (d: Partial<OnboardingData>) => void;
}

export function Step7Diet({ data, onChange }: Props) {
  return (
    <View style={styles.root}>
      <Text style={styles.title}>Beslenme{'\n'}Tarzın</Text>
      <Text style={styles.subtitle}>Sana uygun öğün önerileri sunalım.</Text>

      <View style={styles.grid}>
        {DIETS.map((d) => {
          const active = data.dietType === d.value;
          return (
            <TouchableOpacity
              key={d.value}
              style={[styles.card, active && styles.cardActive]}
              onPress={() => onChange({ dietType: d.value })}
              activeOpacity={0.75}
            >
              <Text style={styles.emoji}>{d.emoji}</Text>
              <Text style={[styles.label, active && { color: TEAL }]}>{d.label}</Text>
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
    padding: 18,
    alignItems: 'center',
    position: 'relative',
  },
  cardActive: { borderColor: TEAL, backgroundColor: TEAL + '12' },
  emoji: { fontSize: 32, marginBottom: 10 },
  label: { color: '#1A1A2E', fontSize: 14, fontWeight: '600', textAlign: 'center' },
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

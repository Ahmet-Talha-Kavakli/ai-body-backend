import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import type { OnboardingData } from '../index';

const TEAL = '#2DD4BF';
const SUGGESTIONS = ['Pamuk', 'Minik', 'Karamel', 'Boncuk', 'Şeker', 'Turuncu'];

interface Props {
  data: OnboardingData;
  onChange: (d: Partial<OnboardingData>) => void;
}

export function Step9Pet({ data, onChange }: Props) {
  return (
    <View style={styles.root}>
      <Text style={styles.catEmoji}>🐱</Text>
      <Text style={styles.title}>AI Twin'ine{'\n'}İsim Ver</Text>
      <Text style={styles.subtitle}>
        Fitness yolculuğunda sana eşlik edecek kişisel AI kediyi tanıştır. Sağlığına göre ruh hali
        değişir!
      </Text>

      <View style={styles.inputWrap}>
        <TextInput
          placeholder="Kedi ismini gir..."
          placeholderTextColor="#475569"
          value={data.petName}
          onChangeText={(v) => onChange({ petName: v })}
          style={styles.input}
          autoCapitalize="words"
          maxLength={20}
        />
      </View>

      <Text style={styles.suggestLabel}>Öneriler</Text>
      <View style={styles.suggestions}>
        {SUGGESTIONS.map((s) => (
          <TouchableOpacity
            key={s}
            style={[styles.chip, data.petName === s && styles.chipActive]}
            onPress={() => onChange({ petName: s })}
            activeOpacity={0.75}
          >
            <Text style={[styles.chipText, data.petName === s && { color: TEAL }]}>{s}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingTop: 8 },
  catEmoji: { fontSize: 64, marginBottom: 16 },
  title: {
    color: '#1A1A2E',
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.8,
    lineHeight: 36,
    marginBottom: 8,
  },
  subtitle: { color: '#94A3B8', fontSize: 15, lineHeight: 22, marginBottom: 28 },
  inputWrap: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 0.5,
    borderColor: '#E2E8F0',
    paddingHorizontal: 18,
    marginBottom: 24,
  },
  input: { color: '#1A1A2E', fontSize: 18, fontWeight: '600', paddingVertical: 16 },
  suggestLabel: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  suggestions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
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

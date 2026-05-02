import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import type { OnboardingData } from '../index';

const TEAL = '#2DD4BF';
const GENDERS = [
  { value: 'male', label: 'Erkek', emoji: '♂️' },
  { value: 'female', label: 'Kadın', emoji: '♀️' },
  { value: 'prefer_not_to_say', label: 'Belirtmek İstemiyorum', emoji: '🤐' },
];

interface Props {
  data: OnboardingData;
  onChange: (d: Partial<OnboardingData>) => void;
}

export function Step3Personal({ data, onChange }: Props) {
  return (
    <View style={styles.root}>
      <Text style={styles.title}>Seni tanıyalım</Text>
      <Text style={styles.subtitle}>Bu bilgiler tamamen gizli kalır.</Text>

      <Text style={styles.label}>Adın</Text>
      <View style={styles.inputWrap}>
        <TextInput
          placeholder="Adın"
          placeholderTextColor="#475569"
          value={data.name}
          onChangeText={(v) => onChange({ name: v })}
          style={styles.input}
          autoCapitalize="words"
        />
      </View>

      <Text style={styles.label}>Yaşın</Text>
      <View style={styles.inputWrap}>
        <TextInput
          placeholder="Örn: 25"
          placeholderTextColor="#475569"
          value={data.age !== undefined ? String(data.age) : ''}
          onChangeText={(v) => onChange({ age: parseInt(v) || undefined })}
          style={styles.input}
          keyboardType="number-pad"
          maxLength={3}
        />
      </View>

      <Text style={styles.label}>Cinsiyet</Text>
      <View style={styles.genderRow}>
        {GENDERS.map((g) => {
          const active = data.gender === g.value;
          return (
            <TouchableOpacity
              key={g.value}
              style={[styles.genderBtn, active && styles.genderBtnActive]}
              onPress={() => onChange({ gender: g.value })}
              activeOpacity={0.75}
            >
              <Text style={styles.genderEmoji}>{g.emoji}</Text>
              <Text style={[styles.genderLabel, active && { color: TEAL }]}>{g.label}</Text>
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
    marginBottom: 8,
  },
  subtitle: { color: '#94A3B8', fontSize: 15, marginBottom: 32 },
  label: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputWrap: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 0.5,
    borderColor: '#E2E8F0',
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  input: { color: '#1A1A2E', fontSize: 16, paddingVertical: 16 },
  genderRow: { flexDirection: 'row', gap: 10 },
  genderBtn: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    alignItems: 'center',
    gap: 6,
  },
  genderBtnActive: { borderColor: TEAL, backgroundColor: TEAL + '12' },
  genderEmoji: { fontSize: 22 },
  genderLabel: { color: '#475569', fontSize: 12, fontWeight: '600', textAlign: 'center' },
});

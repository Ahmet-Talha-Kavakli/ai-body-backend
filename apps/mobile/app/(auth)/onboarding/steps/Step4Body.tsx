import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import type { OnboardingData } from '../index';

interface Props {
  data: OnboardingData;
  onChange: (d: Partial<OnboardingData>) => void;
}

function NumInput({
  label,
  unit,
  value,
  onChangeText,
  placeholder,
}: {
  label: string;
  unit: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder: string;
}) {
  return (
    <View style={styles.fieldWrap}>
      <View style={styles.fieldHeader}>
        <Text style={styles.fieldLabel}>{label}</Text>
        <Text style={styles.fieldUnit}>{unit}</Text>
      </View>
      <View style={styles.inputWrap}>
        <TextInput
          placeholder={placeholder}
          placeholderTextColor="#475569"
          value={value}
          onChangeText={onChangeText}
          style={styles.input}
          keyboardType="decimal-pad"
          maxLength={6}
        />
      </View>
    </View>
  );
}

export function Step4Body({ data, onChange }: Props) {
  return (
    <View style={styles.root}>
      <Text style={styles.title}>Vücut{'\n'}Ölçülerin</Text>
      <Text style={styles.subtitle}>AI programını buna göre ayarlayacak.</Text>

      <NumInput
        label="Boy"
        unit="cm"
        value={data.height !== undefined ? String(data.height) : ''}
        onChangeText={(v) => onChange({ height: parseFloat(v) || undefined })}
        placeholder="Örn: 175"
      />
      <NumInput
        label="Mevcut Kilo"
        unit="kg"
        value={data.weight !== undefined ? String(data.weight) : ''}
        onChangeText={(v) => onChange({ weight: parseFloat(v) || undefined })}
        placeholder="Örn: 75"
      />
      <NumInput
        label="Hedef Kilo"
        unit="kg"
        value={data.targetWeight !== undefined ? String(data.targetWeight) : ''}
        onChangeText={(v) => onChange({ targetWeight: parseFloat(v) || undefined })}
        placeholder="Örn: 70"
      />
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
  subtitle: { color: '#94A3B8', fontSize: 15, marginBottom: 32 },
  fieldWrap: { marginBottom: 20 },
  fieldHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  fieldLabel: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  fieldUnit: { color: '#94A3B8', fontSize: 13, fontWeight: '500' },
  inputWrap: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 0.5,
    borderColor: '#E2E8F0',
    paddingHorizontal: 16,
  },
  input: { color: '#1A1A2E', fontSize: 18, fontWeight: '600', paddingVertical: 16 },
});

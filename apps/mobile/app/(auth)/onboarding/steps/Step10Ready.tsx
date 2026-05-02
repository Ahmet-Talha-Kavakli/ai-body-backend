import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { OnboardingData } from '../index';

const TEAL = '#2DD4BF';

interface Props {
  data: OnboardingData;
  submitting: boolean;
  onSubmit: () => void;
}

export function Step10Ready({ data, submitting, onSubmit }: Props) {
  return (
    <View style={styles.root}>
      <View style={styles.iconWrap}>
        <Ionicons name="checkmark-circle" size={56} color={TEAL} />
      </View>

      <Text style={styles.title}>Hazırsın{data.name ? `, ${data.name}` : ''}! 🎉</Text>
      <Text style={styles.subtitle}>
        AI koçun seni bekliyor. Kişiselleştirilmiş planın hazırlanıyor.
      </Text>

      <View style={styles.summary}>
        {[
          { icon: 'flag-outline', label: 'Hedef', value: data.primaryGoal || '—' },
          { icon: 'fitness-outline', label: 'Seviye', value: data.fitnessLevel || '—' },
          { icon: 'nutrition-outline', label: 'Beslenme', value: data.dietType || '—' },
          { icon: 'paw-outline', label: 'Kedi', value: data.petName || '—' },
        ].map((row) => (
          <View key={row.label} style={styles.summaryRow}>
            <Ionicons name={row.icon as never} size={16} color={TEAL} />
            <Text style={styles.summaryLabel}>{row.label}</Text>
            <Text style={styles.summaryValue}>{row.value}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity
        style={[styles.btn, submitting && styles.btnDisabled]}
        onPress={onSubmit}
        disabled={submitting}
        activeOpacity={0.85}
      >
        {submitting ? (
          <ActivityIndicator color="#000" />
        ) : (
          <>
            <Text style={styles.btnText}>Hadi Başlayalım!</Text>
            <Ionicons name="arrow-forward" size={18} color="#000" />
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'center', paddingTop: 8 },
  iconWrap: {
    width: 96,
    height: 96,
    borderRadius: 28,
    backgroundColor: TEAL + '15',
    borderWidth: 1,
    borderColor: TEAL + '30',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  title: { color: '#1A1A2E', fontSize: 32, fontWeight: '800', letterSpacing: -1, marginBottom: 12 },
  subtitle: { color: '#64748B', fontSize: 16, lineHeight: 24, marginBottom: 36 },
  summary: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 0.5,
    borderColor: '#E2E8F0',
    padding: 20,
    gap: 14,
    marginBottom: 36,
  },
  summaryRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  summaryLabel: { color: '#94A3B8', fontSize: 14, flex: 1 },
  summaryValue: { color: '#1A1A2E', fontSize: 14, fontWeight: '600', textTransform: 'capitalize' },
  btn: {
    backgroundColor: TEAL,
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: TEAL,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#000', fontSize: 16, fontWeight: '700' },
});

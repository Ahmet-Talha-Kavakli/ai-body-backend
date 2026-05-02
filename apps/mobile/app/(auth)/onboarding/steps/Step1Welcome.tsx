import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { OnboardingData } from '../index';

const TEAL = '#2DD4BF';

interface Props {
  data: OnboardingData;
  onChange: (d: Partial<OnboardingData>) => void;
  onNext: () => void;
}

export function Step1Welcome({ onNext }: Props) {
  return (
    <View style={styles.root}>
      <View style={styles.iconWrap}>
        <Ionicons name="flash" size={48} color={TEAL} />
      </View>

      <Text style={styles.title}>FitAI'ye{'\n'}Hoş Geldin 👋</Text>
      <Text style={styles.subtitle}>
        Sana özel bir sağlık ve fitness deneyimi oluşturmak için birkaç sorumuz var.
        {'\n\n'}Sadece 2 dakika sürer.
      </Text>

      <View style={styles.features}>
        {[
          { icon: 'analytics-outline', text: 'Kişiselleştirilmiş AI koç' },
          { icon: 'trophy-outline', text: 'Başarım ve rozet sistemi' },
          { icon: 'paw-outline', text: 'Sana özel AI Twin kedi' },
        ].map((f) => (
          <View key={f.text} style={styles.featureRow}>
            <View style={styles.featureIcon}>
              <Ionicons name={f.icon as never} size={18} color={TEAL} />
            </View>
            <Text style={styles.featureText}>{f.text}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity style={styles.btn} onPress={onNext} activeOpacity={0.85}>
        <Text style={styles.btnText}>Başlayalım</Text>
        <Ionicons name="arrow-forward" size={18} color="#000" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'center' },
  iconWrap: {
    width: 96,
    height: 96,
    borderRadius: 28,
    backgroundColor: TEAL + '18',
    borderWidth: 1,
    borderColor: TEAL + '30',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  title: {
    color: '#1A1A2E',
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: -1,
    lineHeight: 42,
    marginBottom: 16,
  },
  subtitle: { color: '#64748B', fontSize: 16, lineHeight: 24, marginBottom: 40 },
  features: { gap: 14, marginBottom: 48 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: TEAL + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: { color: '#334155', fontSize: 15, fontWeight: '500' },
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
  btnText: { color: '#000', fontSize: 16, fontWeight: '700' },
});

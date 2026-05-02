import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Slider from '@react-native-community/slider';
import type { OnboardingData } from '../index';

const TEAL = '#2DD4BF';

interface SliderRowProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  displayValue: string;
  color?: string;
  onValueChange: (v: number) => void;
}

function SliderRow({
  label,
  value,
  min,
  max,
  step,
  displayValue,
  color = TEAL,
  onValueChange,
}: SliderRowProps) {
  return (
    <View style={styles.sliderWrap}>
      <View style={styles.sliderHeader}>
        <Text style={styles.sliderLabel}>{label}</Text>
        <Text style={[styles.sliderValue, { color }]}>{displayValue}</Text>
      </View>
      <Slider
        value={value}
        minimumValue={min}
        maximumValue={max}
        step={step}
        onValueChange={onValueChange}
        minimumTrackTintColor={color}
        maximumTrackTintColor="rgba(255,255,255,0.1)"
        thumbTintColor={color}
        style={{ height: 40 }}
      />
      <View style={styles.sliderRange}>
        <Text style={styles.rangeText}>{min}</Text>
        <Text style={styles.rangeText}>{max}</Text>
      </View>
    </View>
  );
}

interface Props {
  data: OnboardingData;
  onChange: (d: Partial<OnboardingData>) => void;
}

export function Step8Sleep({ data, onChange }: Props) {
  return (
    <View style={styles.root}>
      <Text style={styles.title}>Uyku &{'\n'}Stres</Text>
      <Text style={styles.subtitle}>İyileşme planını optimize edelim.</Text>

      <SliderRow
        label="Ortalama uyku saati"
        value={data.avgSleepHours}
        min={4}
        max={12}
        step={0.5}
        displayValue={`${data.avgSleepHours} saat`}
        onValueChange={(v) => onChange({ avgSleepHours: v })}
      />

      <SliderRow
        label="Stres seviyesi"
        value={data.stressLevel}
        min={1}
        max={10}
        step={1}
        displayValue={`${data.stressLevel} / 10`}
        color="#F472B6"
        onValueChange={(v) => onChange({ stressLevel: v })}
      />

      <SliderRow
        label="Günlük su hedefi"
        value={data.waterGoalLiters}
        min={1}
        max={5}
        step={0.25}
        displayValue={`${data.waterGoalLiters} L`}
        color="#60A5FA"
        onValueChange={(v) => onChange({ waterGoalLiters: v })}
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
  sliderWrap: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 0.5,
    borderColor: '#E2E8F0',
    padding: 20,
    marginBottom: 14,
  },
  sliderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  sliderLabel: { color: '#475569', fontSize: 14, fontWeight: '600' },
  sliderValue: { fontSize: 16, fontWeight: '700' },
  sliderRange: { flexDirection: 'row', justifyContent: 'space-between', marginTop: -4 },
  rangeText: { color: '#CBD5E1', fontSize: 11 },
});

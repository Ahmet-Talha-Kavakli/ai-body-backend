import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Modal,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  TextInput,
  Animated,
  Easing,
} from 'react-native';
import { useAuth } from '@clerk/expo';
import * as Haptics from 'expo-haptics';
import { font, palette as N } from '../../nutrition/theme';
import { generateAiPlan, startAiPlan } from '../api/client';
import type { AiPlanPreferences } from '../api/types';

type Props = {
  visible: boolean;
  onClose: () => void;
  onStarted: () => void;
};

const GOALS = [
  { key: 'weight_loss', label: 'Kilo Ver', icon: '📉' },
  { key: 'muscle_gain', label: 'Kas Kazan', icon: '💪' },
  { key: 'maintenance', label: 'Kilonu Koru', icon: '⚖️' },
  { key: 'health', label: 'Sağlıklı Yaşa', icon: '🌿' },
  { key: 'energy', label: 'Enerji Artır', icon: '⚡' },
];

const RESTRICTIONS = [
  { key: 'vegetarian', label: 'Vejetaryen' },
  { key: 'vegan', label: 'Vegan' },
  { key: 'gluten_free', label: 'Glutensiz' },
  { key: 'lactose_free', label: 'Laktozsuz' },
  { key: 'halal', label: 'Helal' },
  { key: 'low_carb', label: 'Düşük Karbonhidrat' },
  { key: 'low_fat', label: 'Düşük Yağ' },
];

const CUISINES = [
  { key: 'turkish', label: 'Türk' },
  { key: 'mediterranean', label: 'Akdeniz' },
  { key: 'asian', label: 'Asya' },
  { key: 'american', label: 'Amerikan' },
  { key: 'italian', label: 'İtalyan' },
];

const DURATIONS = [14, 30, 60, 90];
const MEALS_PER_DAY = [3, 4, 5];

const STEPS = ['Hedef', 'Kısıtlamalar', 'Tercihler', 'Süre'];

export function AiPlanWizardScreen({ visible, onClose, onStarted }: Props) {
  const { getToken } = useAuth();
  const [step, setStep] = useState(0);
  const [goal, setGoal] = useState('');
  const [restrictions, setRestrictions] = useState<string[]>([]);
  const [cuisines, setCuisines] = useState<string[]>([]);
  const [mealsPerDay, setMealsPerDay] = useState(4);
  const [duration, setDuration] = useState(30);
  const [generating, setGenerating] = useState(false);

  const slideAnim = useRef(new Animated.Value(0)).current;

  const animateStep = (dir: 1 | -1) => {
    Animated.sequence([
      Animated.timing(slideAnim, { toValue: -dir * 20, duration: 0, useNativeDriver: true }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 340,
        easing: Easing.bezier(0.16, 1, 0.3, 1),
        useNativeDriver: true,
      }),
    ]).start();
  };

  const goNext = () => {
    if (step === 0 && !goal) {
      Alert.alert('', 'Lütfen bir hedef seç.');
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    animateStep(1);
    setStep((s) => s + 1);
  };

  const goBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    animateStep(-1);
    setStep((s) => s - 1);
  };

  const toggleRestriction = (key: string) => {
    setRestrictions((prev) =>
      prev.includes(key) ? prev.filter((r) => r !== key) : [...prev, key],
    );
  };

  const toggleCuisine = (key: string) => {
    setCuisines((prev) => (prev.includes(key) ? prev.filter((c) => c !== key) : [...prev, key]));
  };

  const handleGenerate = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setGenerating(true);
    try {
      const token = await getToken();
      if (!token) return;

      const preferences: AiPlanPreferences = {
        goal,
        restrictions,
        mealsPerDay,
        cuisinePreferences: cuisines,
        durationDays: duration,
      };

      const { aiPlan } = await generateAiPlan(token, preferences);
      await startAiPlan(token, aiPlan, duration);
      onStarted();
      onClose();
    } catch {
      Alert.alert('Hata', 'Plan oluşturulamadı, tekrar dene.');
    } finally {
      setGenerating(false);
    }
  };

  const reset = () => {
    setStep(0);
    setGoal('');
    setRestrictions([]);
    setCuisines([]);
    setMealsPerDay(4);
    setDuration(30);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <SafeAreaView style={styles.safe}>
        {/* Nav */}
        <View style={styles.nav}>
          {step > 0 ? (
            <Pressable onPress={goBack} style={styles.navBtn}>
              <Text style={styles.navBack}>‹ Geri</Text>
            </Pressable>
          ) : (
            <Pressable onPress={handleClose} style={styles.navBtn}>
              <Text style={styles.navCancel}>İptal</Text>
            </Pressable>
          )}
          <Text style={styles.navTitle}>AI Plan</Text>
          <View style={styles.navBtn} />
        </View>

        {/* Progress dots */}
        <View style={styles.dots}>
          {STEPS.map((s, i) => (
            <View
              key={i}
              style={[styles.dot, i === step && styles.dotActive, i < step && styles.dotDone]}
            />
          ))}
        </View>

        <Animated.View style={[styles.stepWrap, { transform: [{ translateX: slideAnim }] }]}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 120 }}
          >
            {step === 0 && (
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Hedefin ne?</Text>
                <Text style={styles.stepSub}>Sana en uygun planı oluşturalım.</Text>
                <View style={styles.goalGrid}>
                  {GOALS.map((g) => (
                    <Pressable
                      key={g.key}
                      onPress={() => setGoal(g.key)}
                      style={[styles.goalCard, goal === g.key && styles.goalCardActive]}
                    >
                      <Text style={styles.goalIcon}>{g.icon}</Text>
                      <Text style={[styles.goalLabel, goal === g.key && styles.goalLabelActive]}>
                        {g.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}

            {step === 1 && (
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Beslenme kısıtlamaların?</Text>
                <Text style={styles.stepSub}>Birden fazla seçebilirsin. Yoksa geç.</Text>
                <View style={styles.chipRow}>
                  {RESTRICTIONS.map((r) => (
                    <Pressable
                      key={r.key}
                      onPress={() => toggleRestriction(r.key)}
                      style={[styles.chip, restrictions.includes(r.key) && styles.chipActive]}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          restrictions.includes(r.key) && styles.chipTextActive,
                        ]}
                      >
                        {r.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}

            {step === 2 && (
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Mutfak tercihler?</Text>
                <Text style={styles.stepSub}>Hangi tür yemekleri seversin?</Text>
                <View style={styles.chipRow}>
                  {CUISINES.map((c) => (
                    <Pressable
                      key={c.key}
                      onPress={() => toggleCuisine(c.key)}
                      style={[styles.chip, cuisines.includes(c.key) && styles.chipActive]}
                    >
                      <Text
                        style={[styles.chipText, cuisines.includes(c.key) && styles.chipTextActive]}
                      >
                        {c.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                <Text style={[styles.stepTitle, { marginTop: 28, fontSize: 17 }]}>
                  Günlük öğün sayısı
                </Text>
                <View style={styles.chipRow}>
                  {MEALS_PER_DAY.map((m) => (
                    <Pressable
                      key={m}
                      onPress={() => setMealsPerDay(m)}
                      style={[styles.chip, mealsPerDay === m && styles.chipActive]}
                    >
                      <Text style={[styles.chipText, mealsPerDay === m && styles.chipTextActive]}>
                        {m} öğün
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}

            {step === 3 && (
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Plan süresi?</Text>
                <Text style={styles.stepSub}>Ne kadar süre uygulayacaksın?</Text>
                <View style={styles.durationGrid}>
                  {DURATIONS.map((d) => (
                    <Pressable
                      key={d}
                      onPress={() => setDuration(d)}
                      style={[styles.durationCard, duration === d && styles.durationCardActive]}
                    >
                      <Text style={[styles.durationNum, duration === d && { color: '#fff' }]}>
                        {d}
                      </Text>
                      <Text
                        style={[
                          styles.durationUnit,
                          duration === d && { color: 'rgba(255,255,255,0.8)' },
                        ]}
                      >
                        gün
                      </Text>
                    </Pressable>
                  ))}
                </View>

                <View style={styles.summaryCard}>
                  <Text style={styles.summaryTitle}>Özetin</Text>
                  <Text style={styles.summaryRow}>
                    🎯 {GOALS.find((g) => g.key === goal)?.label}
                  </Text>
                  {restrictions.length > 0 && (
                    <Text style={styles.summaryRow}>
                      🚫{' '}
                      {RESTRICTIONS.filter((r) => restrictions.includes(r.key))
                        .map((r) => r.label)
                        .join(', ')}
                    </Text>
                  )}
                  {cuisines.length > 0 && (
                    <Text style={styles.summaryRow}>
                      🍽{' '}
                      {CUISINES.filter((c) => cuisines.includes(c.key))
                        .map((c) => c.label)
                        .join(', ')}
                    </Text>
                  )}
                  <Text style={styles.summaryRow}>🥗 Günde {mealsPerDay} öğün</Text>
                  <Text style={styles.summaryRow}>📅 {duration} gün</Text>
                </View>
              </View>
            )}
          </ScrollView>
        </Animated.View>

        {/* CTA */}
        <View style={styles.cta}>
          {step < 3 ? (
            <Pressable
              onPress={goNext}
              style={({ pressed }) => [styles.nextBtn, { opacity: pressed ? 0.85 : 1 }]}
            >
              <Text style={styles.nextBtnText}>Devam Et</Text>
            </Pressable>
          ) : (
            <Pressable
              onPress={handleGenerate}
              disabled={generating}
              style={({ pressed }) => [
                styles.generateBtn,
                { opacity: pressed || generating ? 0.85 : 1 },
              ]}
            >
              {generating ? (
                <View style={styles.generatingRow}>
                  <ActivityIndicator color="#fff" />
                  <Text style={styles.generateBtnText}>Plan Oluşturuluyor...</Text>
                </View>
              ) : (
                <Text style={styles.generateBtnText}>✦ Planımı Oluştur</Text>
              )}
            </Pressable>
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: N.bg.page },
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: N.border.hairline,
  },
  navBtn: { width: 60 },
  navBack: { fontFamily: font.regular, fontSize: 17, color: '#007AFF' },
  navCancel: { fontFamily: font.regular, fontSize: 17, color: '#007AFF' },
  navTitle: {
    flex: 1,
    textAlign: 'center',
    fontFamily: font.semibold,
    fontSize: 17,
    color: N.text.primary,
  },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, paddingVertical: 12 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: N.border.hairline },
  dotActive: { width: 20, backgroundColor: '#007AFF' },
  dotDone: { backgroundColor: '#34C759' },
  stepWrap: { flex: 1 },
  stepContent: { paddingHorizontal: 20, paddingTop: 8 },
  stepTitle: { fontFamily: font.bold, fontSize: 22, color: N.text.primary, marginBottom: 6 },
  stepSub: {
    fontFamily: font.regular,
    fontSize: 14,
    color: N.text.tertiary,
    marginBottom: 24,
    lineHeight: 20,
  },
  goalGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  goalCard: {
    width: '47%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    gap: 8,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#0F172A',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  goalCardActive: { borderColor: '#007AFF', backgroundColor: '#EFF6FF' },
  goalIcon: { fontSize: 32 },
  goalLabel: {
    fontFamily: font.semibold,
    fontSize: 14,
    color: N.text.secondary,
    textAlign: 'center',
  },
  goalLabelActive: { color: '#007AFF' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: N.border.hairline,
  },
  chipActive: { backgroundColor: '#007AFF', borderColor: '#007AFF' },
  chipText: { fontFamily: font.medium, fontSize: 14, color: N.text.secondary },
  chipTextActive: { color: '#fff' },
  durationGrid: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  durationCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#0F172A',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  durationCardActive: { backgroundColor: '#007AFF', borderColor: '#007AFF' },
  durationNum: { fontFamily: font.extrabold, fontSize: 28, color: N.text.primary },
  durationUnit: { fontFamily: font.medium, fontSize: 12, color: N.text.tertiary, marginTop: 2 },
  summaryCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, gap: 8 },
  summaryTitle: { fontFamily: font.bold, fontSize: 15, color: N.text.primary, marginBottom: 4 },
  summaryRow: { fontFamily: font.regular, fontSize: 14, color: N.text.secondary, lineHeight: 20 },
  cta: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: N.bg.page,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: N.border.hairline,
  },
  nextBtn: {
    backgroundColor: '#007AFF',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  nextBtnText: { fontFamily: font.bold, fontSize: 17, color: '#fff' },
  generateBtn: {
    backgroundColor: '#7C3AED',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  generatingRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  generateBtnText: { fontFamily: font.bold, fontSize: 17, color: '#fff' },
});

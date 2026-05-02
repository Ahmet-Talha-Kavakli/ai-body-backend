/**
 * Beslenme Onboarding — Yazio tarzı 7 adımlı flow.
 *
 * Adımlar:
 *  0. Welcome
 *  1. Cinsiyet
 *  2. Yaş + boy
 *  3. Kilo + hedef kilo
 *  4. Hedef tipi (kilo ver/koru/al/kütle)
 *  5. Aktivite seviyesi
 *  6. Diyet modu (macro split)
 *  7. Alerji / yemediklerin (multi-chip)
 *  8. Loading
 *  9. Sonuç + Plana Başla
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@clerk/expo';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { Text } from 'react-native';
import { Box } from '../../../design-system/primitives/Box';
import { N } from '../theme';
import {
  generateNutritionPlan,
  ACTIVITY_LABELS_TR,
  GOAL_LABELS_TR,
  DIET_LABELS_TR,
} from '../utils/calculator';
import type { ActivityLevel, DietMode, GoalType } from '../api/types';
import { saveGoal } from '../api/client';

const TEAL = N.accent.primary;
const TOTAL = 9; // welcome + 8 question + result

const EASE_SPRING = Easing.bezier(0.16, 1, 0.3, 1);
const EASE_CLOSE = Easing.bezier(0.4, 0, 1, 1);
const EASE_SMOOTH = Easing.bezier(0.22, 1, 0.36, 1);

type State = {
  gender: 'male' | 'female' | null;
  age: number | null;
  heightCm: number | null;
  weightKg: number | null;
  targetWeightKg: number | null;
  goal: GoalType | null;
  activity: ActivityLevel | null;
  diet: DietMode | null;
  allergies: string[];
};

const ALLERGIES = [
  'Gluten',
  'Laktoz',
  'Yumurta',
  'Fıstık',
  'Süt',
  'Soya',
  'Deniz ürünü',
  'Balık',
  'Kabuklu yemiş',
  'Domuz',
  'Alkol',
];

type Props = { onDone: () => void };

export default function OnboardingScreen({ onDone }: Props) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { getToken } = useAuth();

  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState<'next' | 'prev'>('next');
  const [submitting, setSubmitting] = useState(false);

  const [state, setState] = useState<State>({
    gender: null,
    age: null,
    heightCm: null,
    weightKg: null,
    targetWeightKg: null,
    goal: null,
    activity: null,
    diet: null,
    allergies: [],
  });

  // Progress bar animation
  const progressAnim = useRef(new Animated.Value(1 / TOTAL)).current;
  // Slide animation
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: (step + 1) / TOTAL,
      duration: 1100,
      easing: EASE_SMOOTH,
      useNativeDriver: false,
    }).start();
  }, [step, progressAnim]);

  useEffect(() => {
    slideAnim.setValue(direction === 'next' ? width : -width);
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 380,
      easing: EASE_SPRING,
      useNativeDriver: true,
    }).start();
  }, [step, direction, slideAnim, width]);

  const canProceed = useMemo(() => {
    switch (step) {
      case 0:
        return true;
      case 1:
        return state.gender !== null;
      case 2:
        return (
          state.age !== null &&
          state.age >= 13 &&
          state.age <= 100 &&
          state.heightCm !== null &&
          state.heightCm >= 100 &&
          state.heightCm <= 250
        );
      case 3:
        return state.weightKg !== null && state.weightKg >= 30 && state.weightKg <= 300;
      case 4:
        return state.goal !== null;
      case 5:
        return state.activity !== null;
      case 6:
        return state.diet !== null;
      case 7:
        return true;
      default:
        return true;
    }
  }, [step, state]);

  const haptic = () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

  const next = () => {
    if (!canProceed) return;
    haptic();
    if (step === 7) {
      // Loading + finalize
      setStep(8);
      finalize();
      return;
    }
    setDirection('next');
    setStep((s) => s + 1);
  };

  const prev = () => {
    if (step === 0) return;
    haptic();
    setDirection('prev');
    setStep((s) => s - 1);
  };

  const finalize = async () => {
    try {
      setSubmitting(true);
      const token = await getToken();
      if (!token) throw new Error('Token alınamadı');

      const plan = generateNutritionPlan({
        gender: state.gender!,
        age: state.age!,
        heightCm: state.heightCm!,
        weightKg: state.weightKg!,
        activity: state.activity!,
        goal: state.goal!,
        diet: state.diet!,
      });

      await saveGoal(token, {
        dailyCalories: plan.calories,
        proteinG: plan.proteinG,
        carbsG: plan.carbsG,
        fatG: plan.fatG,
        fiberG: plan.fiberG,
        sugarG: plan.sugarG,
        saturatedFatG: plan.saturatedFatG,
        sodiumMg: plan.sodiumMg,
        bmr: plan.bmr,
        tdee: plan.tdee,
        goalType: state.goal!,
        activityLevel: state.activity!,
        macroSplit: state.diet!,
        targetWeightKg: state.targetWeightKg ?? undefined,
      });

      // Bekle, gösterim için
      await new Promise((r) => setTimeout(r, 1200));
      setSubmitting(false);
      setStep(9); // sonuç ekranı
    } catch (err) {
      console.error('[onboarding finalize]', err);
      setSubmitting(false);
      // TODO: hata sheet
    }
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Header: back + progress bar */}
      <View style={styles.header}>
        {step > 0 && step < 8 ? (
          <Pressable onPress={prev} hitSlop={16} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={28} color={N.text.primary} />
          </Pressable>
        ) : (
          <View style={styles.backBtn} />
        )}
        <View style={styles.progressTrack}>
          <Animated.View
            style={[
              styles.progressFill,
              {
                width: progressAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
              },
            ]}
          />
        </View>
        <View style={styles.backBtn} />
      </View>

      <Animated.View style={[styles.body, { transform: [{ translateX: slideAnim }] }]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {step === 0 && <StepWelcome />}
            {step === 1 && (
              <StepGender
                value={state.gender}
                onChange={(v) => setState({ ...state, gender: v })}
              />
            )}
            {step === 2 && <StepAgeHeight state={state} setState={setState} />}
            {step === 3 && <StepWeight state={state} setState={setState} />}
            {step === 4 && (
              <StepGoal value={state.goal} onChange={(v) => setState({ ...state, goal: v })} />
            )}
            {step === 5 && (
              <StepActivity
                value={state.activity}
                onChange={(v) => setState({ ...state, activity: v })}
              />
            )}
            {step === 6 && (
              <StepDiet value={state.diet} onChange={(v) => setState({ ...state, diet: v })} />
            )}
            {step === 7 && (
              <StepAllergies
                value={state.allergies}
                onChange={(v) => setState({ ...state, allergies: v })}
              />
            )}
            {step === 8 && <StepLoading />}
            {step === 9 && <StepResult state={state} />}
          </ScrollView>
        </KeyboardAvoidingView>
      </Animated.View>

      {/* Bottom CTA */}
      {step !== 8 && (
        <View style={[styles.cta, { paddingBottom: insets.bottom + 12 }]}>
          <Pressable
            onPress={step === 9 ? onDone : next}
            disabled={!canProceed && step !== 9}
            style={({ pressed }) => [
              styles.ctaBtn,
              !canProceed && step !== 9 && { opacity: 0.4 },
              pressed && { transform: [{ scale: 0.98 }], opacity: 0.92 },
            ]}
          >
            <Text style={styles.ctaText}>
              {step === 0
                ? 'Başlayalım'
                : step === 9
                  ? 'Plana Başla'
                  : step === 7
                    ? 'Planımı Hesapla'
                    : 'Devam'}
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

// ─── STEP COMPONENTS ──────────────────────────

function StepWelcome() {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingTop: 60,
      }}
    >
      <View style={styles.welcomeIcon}>
        <Text style={{ fontSize: 64 }}>🥗</Text>
      </View>
      <Text style={styles.title}>Beslenmeni planlayalım</Text>
      <Text style={styles.subtitle}>
        Sana özel kalori ve makro hedeflerini birkaç soruyla belirleyelim. Ne yediğini takip etmek
        hiç bu kadar kolay olmamıştı.
      </Text>
    </View>
  );
}

function StepGender({
  value,
  onChange,
}: {
  value: 'male' | 'female' | null;
  onChange: (v: 'male' | 'female') => void;
}) {
  return (
    <View style={styles.stepRoot}>
      <Text style={styles.qTitle}>Cinsiyetin nedir?</Text>
      <Text style={styles.qHint}>Kalori ihtiyacını doğru hesaplamak için.</Text>
      <View style={{ height: 32 }} />
      <View style={{ gap: 12 }}>
        <OptionCard
          selected={value === 'male'}
          onPress={() => onChange('male')}
          emoji="👨"
          title="Erkek"
        />
        <OptionCard
          selected={value === 'female'}
          onPress={() => onChange('female')}
          emoji="👩"
          title="Kadın"
        />
      </View>
    </View>
  );
}

function StepAgeHeight({ state, setState }: { state: State; setState: (s: State) => void }) {
  return (
    <View style={styles.stepRoot}>
      <Text style={styles.qTitle}>Yaş ve boy</Text>
      <Text style={styles.qHint}>BMR (bazal metabolizma) hesabı için.</Text>
      <View style={{ height: 32 }} />
      <NumberField
        label="Yaş"
        suffix="yıl"
        value={state.age?.toString() ?? ''}
        onChangeText={(v) => setState({ ...state, age: v ? parseInt(v, 10) : null })}
        placeholder="28"
      />
      <View style={{ height: 16 }} />
      <NumberField
        label="Boy"
        suffix="cm"
        value={state.heightCm?.toString() ?? ''}
        onChangeText={(v) => setState({ ...state, heightCm: v ? parseInt(v, 10) : null })}
        placeholder="175"
      />
    </View>
  );
}

function StepWeight({ state, setState }: { state: State; setState: (s: State) => void }) {
  return (
    <View style={styles.stepRoot}>
      <Text style={styles.qTitle}>Mevcut ve hedef kilo</Text>
      <Text style={styles.qHint}>
        Hedef kilo opsiyonel — boş bırakırsan koruma modunda devam ederiz.
      </Text>
      <View style={{ height: 32 }} />
      <NumberField
        label="Mevcut kilo"
        suffix="kg"
        value={state.weightKg?.toString() ?? ''}
        onChangeText={(v) => setState({ ...state, weightKg: v ? parseFloat(v) : null })}
        placeholder="78"
      />
      <View style={{ height: 16 }} />
      <NumberField
        label="Hedef kilo (ops.)"
        suffix="kg"
        value={state.targetWeightKg?.toString() ?? ''}
        onChangeText={(v) => setState({ ...state, targetWeightKg: v ? parseFloat(v) : null })}
        placeholder="72"
      />
    </View>
  );
}

function StepGoal({
  value,
  onChange,
}: {
  value: GoalType | null;
  onChange: (v: GoalType) => void;
}) {
  return (
    <View style={styles.stepRoot}>
      <Text style={styles.qTitle}>Asıl hedefin ne?</Text>
      <Text style={styles.qHint}>Kalori dengesini buna göre ayarlayacağım.</Text>
      <View style={{ height: 32 }} />
      <View style={{ gap: 12 }}>
        {(Object.keys(GOAL_LABELS_TR) as GoalType[]).map((k) => (
          <OptionCard
            key={k}
            selected={value === k}
            onPress={() => onChange(k)}
            emoji={GOAL_LABELS_TR[k].emoji}
            title={GOAL_LABELS_TR[k].title}
            subtitle={GOAL_LABELS_TR[k].subtitle}
          />
        ))}
      </View>
    </View>
  );
}

function StepActivity({
  value,
  onChange,
}: {
  value: ActivityLevel | null;
  onChange: (v: ActivityLevel) => void;
}) {
  return (
    <View style={styles.stepRoot}>
      <Text style={styles.qTitle}>Günlük aktiviten?</Text>
      <Text style={styles.qHint}>Egzersiz + iş + günlük hareketin toplamı.</Text>
      <View style={{ height: 32 }} />
      <View style={{ gap: 12 }}>
        {(Object.keys(ACTIVITY_LABELS_TR) as ActivityLevel[]).map((k) => (
          <OptionCard
            key={k}
            selected={value === k}
            onPress={() => onChange(k)}
            emoji={ACTIVITY_LABELS_TR[k].emoji}
            title={ACTIVITY_LABELS_TR[k].title}
            subtitle={ACTIVITY_LABELS_TR[k].subtitle}
          />
        ))}
      </View>
    </View>
  );
}

function StepDiet({
  value,
  onChange,
}: {
  value: DietMode | null;
  onChange: (v: DietMode) => void;
}) {
  return (
    <View style={styles.stepRoot}>
      <Text style={styles.qTitle}>Beslenme tarzın?</Text>
      <Text style={styles.qHint}>
        Makro dağılımını (protein/karb/yağ) buna göre kuracağım. Sonra değiştirebilirsin.
      </Text>
      <View style={{ height: 32 }} />
      <View style={{ gap: 12 }}>
        {(Object.keys(DIET_LABELS_TR) as DietMode[]).map((k) => (
          <OptionCard
            key={k}
            selected={value === k}
            onPress={() => onChange(k)}
            emoji={DIET_LABELS_TR[k].emoji}
            title={DIET_LABELS_TR[k].title}
            subtitle={DIET_LABELS_TR[k].subtitle}
          />
        ))}
      </View>
    </View>
  );
}

function StepAllergies({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const toggle = (item: string) => {
    Haptics.selectionAsync();
    onChange(value.includes(item) ? value.filter((v) => v !== item) : [...value, item]);
  };
  return (
    <View style={styles.stepRoot}>
      <Text style={styles.qTitle}>Yemediklerin var mı?</Text>
      <Text style={styles.qHint}>Alerji veya tercih — barkod ve foto taramada uyaracağız.</Text>
      <View style={{ height: 24 }} />
      <View style={styles.chipWrap}>
        {ALLERGIES.map((a) => {
          const on = value.includes(a);
          return (
            <Pressable
              key={a}
              onPress={() => toggle(a)}
              style={({ pressed }) => [
                styles.chip,
                on && styles.chipOn,
                pressed && { transform: [{ scale: 0.97 }] },
              ]}
            >
              <Text style={[styles.chipText, on && styles.chipTextOn]}>{a}</Text>
            </Pressable>
          );
        })}
      </View>
      <Text style={[styles.qHint, { marginTop: 16, fontSize: 13 }]}>
        Hiçbiri yoksa direkt devam edebilirsin.
      </Text>
    </View>
  );
}

function StepLoading() {
  const rotateAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 1400,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ).start();
  }, [rotateAnim]);
  const rotate = rotateAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingTop: 60,
      }}
    >
      <Animated.View style={{ transform: [{ rotate }] }}>
        <Ionicons name="nutrition" size={56} color={TEAL} />
      </Animated.View>
      <View style={{ height: 32 }} />
      <Text style={styles.title}>Planını hazırlıyorum…</Text>
      <Text style={styles.subtitle}>Sana özel kalori ve makro hedeflerini hesaplıyorum.</Text>
    </View>
  );
}

function StepResult({ state }: { state: State }) {
  const plan = useMemo(() => {
    if (
      !state.gender ||
      !state.age ||
      !state.heightCm ||
      !state.weightKg ||
      !state.activity ||
      !state.goal ||
      !state.diet
    )
      return null;
    return generateNutritionPlan({
      gender: state.gender,
      age: state.age,
      heightCm: state.heightCm,
      weightKg: state.weightKg,
      activity: state.activity,
      goal: state.goal,
      diet: state.diet,
    });
  }, [state]);

  if (!plan) return null;

  return (
    <View style={styles.stepRoot}>
      <View style={{ alignItems: 'center', marginBottom: 24 }}>
        <View style={styles.welcomeIcon}>
          <Text style={{ fontSize: 56 }}>🎯</Text>
        </View>
        <Text style={[styles.title, { textAlign: 'center' }]}>Planın hazır</Text>
      </View>

      <View style={styles.planCard}>
        <View style={styles.planRow}>
          <Text style={styles.planLabel}>Günlük kalori</Text>
          <Text style={styles.planValue}>{plan.calories.toLocaleString('tr-TR')} kcal</Text>
        </View>
        <View style={styles.planDivider} />
        <View style={styles.planRow}>
          <Text style={styles.planLabel}>Protein</Text>
          <Text style={styles.planValue}>{plan.proteinG} g</Text>
        </View>
        <View style={styles.planDivider} />
        <View style={styles.planRow}>
          <Text style={styles.planLabel}>Karbonhidrat</Text>
          <Text style={styles.planValue}>{plan.carbsG} g</Text>
        </View>
        <View style={styles.planDivider} />
        <View style={styles.planRow}>
          <Text style={styles.planLabel}>Yağ</Text>
          <Text style={styles.planValue}>{plan.fatG} g</Text>
        </View>
      </View>

      <View style={{ height: 16 }} />
      <View style={styles.metaCard}>
        <Text style={styles.metaLine}>BMR (bazal): {plan.bmr} kcal</Text>
        <Text style={styles.metaLine}>TDEE (toplam): {plan.tdee} kcal</Text>
        <Text style={styles.metaLine}>Lif hedefi: {plan.fiberG} g/gün</Text>
        <Text style={styles.metaLine}>Doymuş yağ limiti: {plan.saturatedFatG} g/gün</Text>
      </View>

      <Text style={[styles.qHint, { marginTop: 20, fontSize: 13 }]}>
        Bu hedefleri sonradan ayarlardan değiştirebilirsin.
      </Text>
    </View>
  );
}

// ─── REUSABLE BITS ────────────────────────────

function OptionCard({
  selected,
  onPress,
  emoji,
  title,
  subtitle,
}: {
  selected: boolean;
  onPress: () => void;
  emoji: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.option,
        selected && styles.optionOn,
        pressed && { transform: [{ scale: 0.98 }], opacity: 0.92 },
      ]}
    >
      <Text style={{ fontSize: 28, marginRight: 14 }}>{emoji}</Text>
      <View style={{ flex: 1 }}>
        <Text style={[styles.optionTitle, selected && { color: TEAL }]}>{title}</Text>
        {subtitle && <Text style={styles.optionSubtitle}>{subtitle}</Text>}
      </View>
      {selected && <Ionicons name="checkmark-circle" size={22} color={TEAL} />}
    </Pressable>
  );
}

function NumberField({
  label,
  suffix,
  value,
  onChangeText,
  placeholder,
}: {
  label: string;
  suffix: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <View>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.fieldRow}>
        <TextInput
          style={styles.fieldInput}
          value={value}
          onChangeText={(v) => onChangeText(v.replace(/[^\d.,]/g, '').replace(',', '.'))}
          placeholder={placeholder}
          placeholderTextColor={N.text.tertiary}
          keyboardType="numeric"
        />
        <Text style={styles.fieldSuffix}>{suffix}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: N.bg.page },
  header: {
    height: 48,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: { width: 36, height: 36, alignItems: 'flex-start', justifyContent: 'center' },
  progressTrack: {
    flex: 1,
    height: 6,
    backgroundColor: N.bg.card,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: TEAL, borderRadius: 3 },
  body: { flex: 1 },
  scroll: { flexGrow: 1, paddingBottom: 40 },
  stepRoot: { flex: 1, paddingHorizontal: 24, paddingTop: 24 },
  welcomeIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: N.bg.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    color: N.text.primary,
    letterSpacing: -0.4,
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: N.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  qTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: N.text.primary,
    letterSpacing: -0.4,
  },
  qHint: { fontSize: 15, color: N.text.tertiary, marginTop: 6, lineHeight: 20 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: N.bg.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  optionOn: { borderColor: TEAL, backgroundColor: 'rgba(20, 184, 166, 0.12)' },
  optionTitle: { fontSize: 17, fontWeight: '600', color: N.text.primary, letterSpacing: -0.2 },
  optionSubtitle: { fontSize: 13, color: N.text.tertiary, marginTop: 2 },
  fieldLabel: { fontSize: 13, color: N.text.tertiary, marginBottom: 6, fontWeight: '500' },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: N.bg.card,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  fieldInput: { flex: 1, fontSize: 18, color: N.text.primary, fontWeight: '500' },
  fieldSuffix: { fontSize: 14, color: N.text.tertiary, marginLeft: 8 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: N.bg.card,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  chipOn: { borderColor: TEAL, backgroundColor: 'rgba(20, 184, 166, 0.16)' },
  chipText: { fontSize: 14, color: N.text.secondary, fontWeight: '500' },
  chipTextOn: { color: TEAL },
  cta: { paddingHorizontal: 24, paddingTop: 12 },
  ctaBtn: {
    backgroundColor: N.text.primary,
    borderRadius: 28,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: { fontSize: 17, fontWeight: '700', color: '#FFFFFF', letterSpacing: -0.2 },
  planCard: {
    backgroundColor: N.bg.card,
    borderRadius: 18,
    paddingVertical: 8,
    paddingHorizontal: 18,
  },
  planRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
  },
  planLabel: { fontSize: 15, color: N.text.secondary },
  planValue: { fontSize: 17, fontWeight: '700', color: N.text.primary, letterSpacing: -0.2 },
  planDivider: { height: 1, backgroundColor: N.border.soft },
  metaCard: {
    backgroundColor: N.bg.card,
    borderRadius: 14,
    padding: 14,
    gap: 6,
  },
  metaLine: { fontSize: 13, color: N.text.tertiary },
});

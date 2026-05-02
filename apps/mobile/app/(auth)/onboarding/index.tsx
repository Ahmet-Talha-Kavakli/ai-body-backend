import React, { useState, useRef } from 'react';
import { Animated, StyleSheet, View, TouchableOpacity, Text, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useUser } from '@clerk/expo';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { Step1Welcome } from './steps/Step1Welcome';
import { Step2Goal } from './steps/Step2Goal';
import { Step3Personal } from './steps/Step3Personal';
import { Step4Body } from './steps/Step4Body';
import { Step5Activity } from './steps/Step5Activity';
import { Step6Health } from './steps/Step6Health';
import { Step7Diet } from './steps/Step7Diet';
import { Step8Sleep } from './steps/Step8Sleep';
import { Step9Pet } from './steps/Step9Pet';
import { Step10Ready } from './steps/Step10Ready';

const TEAL = '#2DD4BF';
const TOTAL_STEPS = 10;

export interface OnboardingData {
  primaryGoal: string;
  name: string;
  age: number | undefined;
  gender: string;
  height: number | undefined;
  weight: number | undefined;
  targetWeight: number | undefined;
  fitnessLevel: string;
  trainingDaysPerWeek: number;
  medicalRestrictions: string[];
  activeInjuries: string[];
  dietType: string;
  avgSleepHours: number;
  stressLevel: number;
  waterGoalLiters: number;
  petName: string;
}

const INITIAL: OnboardingData = {
  primaryGoal: '',
  name: '',
  age: undefined,
  gender: '',
  height: undefined,
  weight: undefined,
  targetWeight: undefined,
  fitnessLevel: '',
  trainingDaysPerWeek: 3,
  medicalRestrictions: [],
  activeInjuries: [],
  dietType: '',
  avgSleepHours: 7,
  stressLevel: 3,
  waterGoalLiters: 2.5,
  petName: '',
};

export default function OnboardingScreen() {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<OnboardingData>(INITIAL);
  const [submitting, setSubmitting] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const router = useRouter();
  const { user } = useUser();
  const insets = useSafeAreaInsets();

  const onChange = (partial: Partial<OnboardingData>) =>
    setData((prev) => ({ ...prev, ...partial }));

  const animateTransition = (cb: () => void) => {
    Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }).start(() => {
      cb();
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    });
  };

  const next = () => {
    if (step < TOTAL_STEPS) animateTransition(() => setStep((s) => s + 1));
  };

  const back = () => {
    if (step > 1) animateTransition(() => setStep((s) => s - 1));
  };

  const submit = async () => {
    setSubmitting(true);
    try {
      await user?.update({
        unsafeMetadata: { onboardingComplete: true, ...data },
      });
      router.replace('/(tabs)');
    } catch {
      router.replace('/(tabs)');
    } finally {
      setSubmitting(false);
    }
  };

  const progress = step / TOTAL_STEPS;

  const STEPS = [
    <Step1Welcome key={1} data={data} onChange={onChange} onNext={next} />,
    <Step2Goal key={2} data={data} onChange={onChange} />,
    <Step3Personal key={3} data={data} onChange={onChange} />,
    <Step4Body key={4} data={data} onChange={onChange} />,
    <Step5Activity key={5} data={data} onChange={onChange} />,
    <Step6Health key={6} data={data} onChange={onChange} />,
    <Step7Diet key={7} data={data} onChange={onChange} />,
    <Step8Sleep key={8} data={data} onChange={onChange} />,
    <Step9Pet key={9} data={data} onChange={onChange} />,
    <Step10Ready key={10} data={data} submitting={submitting} onSubmit={submit} />,
  ];

  const isFirst = step === 1;
  const isLast = step === TOTAL_STEPS;

  // Step 1 and 10 handle their own CTA
  const showNav = step !== 1 && step !== TOTAL_STEPS;

  return (
    <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      {/* Header */}
      <View style={styles.header}>
        {!isFirst ? (
          <TouchableOpacity
            onPress={back}
            style={styles.backBtn}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="chevron-back" size={24} color="rgba(255,255,255,0.7)" />
          </TouchableOpacity>
        ) : (
          <View style={styles.backBtn} />
        )}

        {/* Progress bar */}
        <View style={styles.progressWrap}>
          <View style={styles.progressTrack}>
            <Animated.View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
          </View>
          <Text style={styles.progressLabel}>
            {step} / {TOTAL_STEPS}
          </Text>
        </View>

        <View style={styles.backBtn} />
      </View>

      {/* Step content */}
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {STEPS[step - 1]}
      </Animated.View>

      {/* Bottom nav */}
      {showNav && (
        <View style={styles.footer}>
          <TouchableOpacity style={styles.nextBtn} onPress={next} activeOpacity={0.85}>
            <Text style={styles.nextBtnText}>Devam Et</Text>
            <Ionicons name="arrow-forward" size={18} color="#000" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F5F5F7' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  progressWrap: { flex: 1, gap: 6 },
  progressTrack: {
    height: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: TEAL,
    borderRadius: 2,
  },
  progressLabel: {
    color: '#94A3B8',
    fontSize: 11,
    textAlign: 'right',
    fontWeight: '500',
  },
  content: { flex: 1, paddingHorizontal: 24 },
  footer: { paddingHorizontal: 24, paddingBottom: 16, paddingTop: 8 },
  nextBtn: {
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
  nextBtnText: { color: '#000', fontSize: 16, fontWeight: '700' },
});

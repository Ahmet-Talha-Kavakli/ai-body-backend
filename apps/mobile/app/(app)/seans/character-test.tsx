/**
 * Character Test Screen — V3 Faz C
 *
 * Hogwarts-Sorting tarzı 5 soruluk test.
 * Her soru tam ekran kart, seçim sonrası slide animasyonu.
 * Sonunda reveal sahnesi: archetype + isim açıklama.
 */

import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useAuth } from '@clerk/expo';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

import { font, C, API_URL } from '../../../lib/theme';
import {
  fetchCharacterTest,
  submitCharacterTest,
  type TestAnswer,
  type TestQuestion,
  type TestResult,
} from '../../../src/services/assistant/characterTest';

const EASE_OUT = Easing.bezier(0.16, 1, 0.3, 1);
const EASE_IN = Easing.bezier(0.4, 0, 1, 1);

export default function CharacterTestScreen() {
  const router = useRouter();
  const { getToken } = useAuth();
  const insets = useSafeAreaInsets();

  const [questions, setQuestions] = useState<TestQuestion[] | null>(null);
  const [answers, setAnswers] = useState<TestAnswer[]>([]);
  const [stepIdx, setStepIdx] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);

  // Slide animasyonu
  const slideX = useRef(new Animated.Value(0)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;

  // İlk yükleme
  useEffect(() => {
    (async () => {
      const token = (await getToken()) ?? '';
      const status = await fetchCharacterTest({ apiUrl: API_URL, token });
      if (status) {
        setQuestions(status.questions);
        Animated.timing(cardOpacity, {
          toValue: 1,
          duration: 360,
          easing: EASE_OUT,
          useNativeDriver: true,
        }).start();
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelect = async (optionId: string) => {
    if (!questions) return;
    Haptics.selectionAsync();
    const q = questions[stepIdx]!;
    const newAnswers = [...answers, { questionId: q.id, optionId }];
    setAnswers(newAnswers);

    if (stepIdx < questions.length - 1) {
      // Sonraki soruya geç — slide animasyonu
      Animated.timing(slideX, {
        toValue: -400,
        duration: 280,
        easing: EASE_IN,
        useNativeDriver: true,
      }).start(() => {
        setStepIdx((i) => i + 1);
        slideX.setValue(400);
        Animated.timing(slideX, {
          toValue: 0,
          duration: 320,
          easing: EASE_OUT,
          useNativeDriver: true,
        }).start();
      });
    } else {
      // Son soru — submit
      setSubmitting(true);
      Animated.timing(cardOpacity, {
        toValue: 0,
        duration: 240,
        easing: EASE_IN,
        useNativeDriver: true,
      }).start();
      const token = (await getToken()) ?? '';
      const r = await submitCharacterTest({
        apiUrl: API_URL,
        token,
        answers: newAnswers,
      });
      if (r) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setResult(r);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        // Hata olursa geri dön
        router.back();
      }
      setSubmitting(false);
    }
  };

  // ─── Reveal sahnesi ────────────────────────────────────────────────────────
  if (result) {
    return (
      <RevealScene result={result} onContinue={() => router.replace('/(tabs)/sessions' as never)} />
    );
  }

  // ─── Loading ───────────────────────────────────────────────────────────────
  if (!questions) {
    return (
      <View style={[s.root, { paddingTop: insets.top, justifyContent: 'center' }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator color={C.accent} />
      </View>
    );
  }

  const q = questions[stepIdx]!;
  const total = questions.length;

  return (
    <View style={[s.root, { paddingTop: insets.top + 20 }]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Progress dots */}
      <View style={s.progressRow}>
        {questions.map((_, i) => (
          <View
            key={i}
            style={[s.progressDot, i <= stepIdx && { backgroundColor: C.accent, width: 24 }]}
          />
        ))}
      </View>

      <Text style={s.stepCount}>
        {stepIdx + 1} / {total}
      </Text>

      {/* Soru kartı */}
      <Animated.View
        style={[s.card, { opacity: cardOpacity, transform: [{ translateX: slideX }] }]}
      >
        <Text style={s.prompt}>{q.prompt}</Text>

        <View style={s.options}>
          {q.options.map((opt, i) => (
            <OptionRow
              key={opt.id}
              label={opt.label}
              delay={i * 60}
              disabled={submitting}
              onPress={() => handleSelect(opt.id)}
            />
          ))}
        </View>
      </Animated.View>

      {submitting && (
        <View style={s.submittingOverlay}>
          <ActivityIndicator color={C.accent} size="large" />
          <Text style={s.submittingText}>Karakter belirleniyor...</Text>
        </View>
      )}
    </View>
  );
}

// ─── Option satırı ──────────────────────────────────────────────────────────

function OptionRow({
  label,
  delay,
  onPress,
  disabled,
}: {
  label: string;
  delay: number;
  onPress: () => void;
  disabled: boolean;
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const ty = useRef(new Animated.Value(8)).current;
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 320,
        delay,
        easing: EASE_OUT,
        useNativeDriver: true,
      }),
      Animated.timing(ty, {
        toValue: 0,
        duration: 320,
        delay,
        easing: EASE_OUT,
        useNativeDriver: true,
      }),
    ]).start();
  }, [delay, opacity, ty]);

  return (
    <Animated.View style={{ opacity, transform: [{ translateY: ty }, { scale }] }}>
      <Pressable
        onPress={onPress}
        disabled={disabled}
        onPressIn={() =>
          Animated.timing(scale, {
            toValue: 0.97,
            duration: 120,
            easing: Easing.bezier(0.4, 0, 0.2, 1),
            useNativeDriver: true,
          }).start()
        }
        onPressOut={() =>
          Animated.timing(scale, {
            toValue: 1,
            duration: 100,
            easing: Easing.bezier(0.4, 0, 0.2, 1),
            useNativeDriver: true,
          }).start()
        }
        style={s.optionBtn}
      >
        <Text style={s.optionLabel}>{label}</Text>
      </Pressable>
    </Animated.View>
  );
}

// ─── Reveal sahnesi ─────────────────────────────────────────────────────────

function RevealScene({ result, onContinue }: { result: TestResult; onContinue: () => void }) {
  const insets = useSafeAreaInsets();
  const avatarScale = useRef(new Animated.Value(0.6)).current;
  const avatarOpacity = useRef(new Animated.Value(0)).current;
  const labelY = useRef(new Animated.Value(20)).current;
  const labelOpacity = useRef(new Animated.Value(0)).current;
  const nameY = useRef(new Animated.Value(20)).current;
  const nameOpacity = useRef(new Animated.Value(0)).current;
  const blurbY = useRef(new Animated.Value(20)).current;
  const blurbOpacity = useRef(new Animated.Value(0)).current;
  const btnOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Animated.sequence([
      Animated.parallel([
        Animated.timing(avatarOpacity, {
          toValue: 1,
          duration: 520,
          easing: EASE_OUT,
          useNativeDriver: true,
        }),
        Animated.spring(avatarScale, {
          toValue: 1,
          friction: 6,
          tension: 50,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(labelOpacity, {
          toValue: 1,
          duration: 380,
          easing: EASE_OUT,
          useNativeDriver: true,
        }),
        Animated.timing(labelY, {
          toValue: 0,
          duration: 380,
          easing: EASE_OUT,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(nameOpacity, {
          toValue: 1,
          duration: 420,
          easing: EASE_OUT,
          useNativeDriver: true,
        }),
        Animated.timing(nameY, {
          toValue: 0,
          duration: 420,
          easing: EASE_OUT,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(blurbOpacity, {
          toValue: 1,
          duration: 380,
          easing: EASE_OUT,
          useNativeDriver: true,
        }),
        Animated.timing(blurbY, {
          toValue: 0,
          duration: 380,
          easing: EASE_OUT,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(btnOpacity, {
        toValue: 1,
        duration: 380,
        easing: EASE_OUT,
        useNativeDriver: true,
      }),
    ]).start();
  }, [
    avatarOpacity,
    avatarScale,
    labelOpacity,
    labelY,
    nameOpacity,
    nameY,
    blurbOpacity,
    blurbY,
    btnOpacity,
  ]);

  return (
    <View style={[s.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Soft gradient arka plan */}
      <LinearGradient colors={['#F2EFFE', '#E0DBFC', '#F2EFFE']} style={StyleSheet.absoluteFill} />

      <View style={revealSt.center}>
        <Animated.View
          style={[revealSt.avatar, { opacity: avatarOpacity, transform: [{ scale: avatarScale }] }]}
        >
          <Text style={revealSt.avatarTxt}>{result.name[0]?.toUpperCase()}</Text>
        </Animated.View>

        <Animated.Text
          style={[revealSt.label, { opacity: labelOpacity, transform: [{ translateY: labelY }] }]}
        >
          {result.label}
        </Animated.Text>

        <Animated.Text
          style={[revealSt.name, { opacity: nameOpacity, transform: [{ translateY: nameY }] }]}
        >
          {result.name}
        </Animated.Text>

        <Animated.Text
          style={[revealSt.blurb, { opacity: blurbOpacity, transform: [{ translateY: blurbY }] }]}
        >
          {result.blurb}
        </Animated.Text>
      </View>

      <Animated.View style={{ opacity: btnOpacity, paddingHorizontal: 24, paddingBottom: 12 }}>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            onContinue();
          }}
          style={revealSt.btn}
        >
          <Text style={revealSt.btnText}>Tanışalım</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.page, paddingHorizontal: 24 },
  progressRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 8,
    marginBottom: 8,
  },
  progressDot: {
    width: 12,
    height: 4,
    borderRadius: 2,
    backgroundColor: C.hairline,
  },
  stepCount: {
    fontFamily: font.medium,
    fontSize: 11,
    color: C.textMuted,
    letterSpacing: 0.5,
    marginBottom: 24,
  },
  card: { flex: 1 },
  prompt: {
    fontFamily: font.bold,
    fontSize: 26,
    color: C.text,
    letterSpacing: -0.5,
    lineHeight: 34,
    marginBottom: 28,
  },
  options: { gap: 10 },
  optionBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(94,92,230,0.14)',
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 18,
    minHeight: 56,
    justifyContent: 'center',
  },
  optionLabel: {
    fontFamily: font.medium,
    fontSize: 15,
    color: C.text,
    letterSpacing: -0.2,
    lineHeight: 22,
  },
  submittingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(248,247,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  submittingText: {
    fontFamily: font.medium,
    fontSize: 14,
    color: C.textMuted,
  },
});

const revealSt = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: C.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
    shadowColor: C.accent,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
  },
  avatarTxt: {
    fontFamily: font.bold,
    fontSize: 48,
    color: '#fff',
  },
  label: {
    fontFamily: font.semibold,
    fontSize: 13,
    color: C.accent,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  name: {
    fontFamily: font.extrabold,
    fontSize: 36,
    color: C.text,
    letterSpacing: -0.8,
    marginBottom: 14,
  },
  blurb: {
    fontFamily: font.regular,
    fontSize: 16,
    color: C.textMuted,
    textAlign: 'center',
    lineHeight: 24,
    letterSpacing: -0.2,
    maxWidth: 320,
  },
  btn: {
    backgroundColor: C.accent,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    minHeight: 56,
  },
  btnText: {
    fontFamily: font.bold,
    fontSize: 16,
    color: '#fff',
    letterSpacing: -0.2,
  },
});

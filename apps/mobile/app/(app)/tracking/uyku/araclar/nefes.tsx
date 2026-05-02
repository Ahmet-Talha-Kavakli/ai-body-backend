import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAudioPlayer } from 'expo-audio';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import * as Haptics from 'expo-haptics';
import { SymbolView } from 'expo-symbols';
import { useSharedValue } from 'react-native-reanimated';
import { font } from '../_components/theme';
import { useSleepFonts } from '../_components/useSleepFonts';
import {
  BREATH_PATTERNS,
  BREATH_SOUND_BELL,
  BREATH_SOUND_EXHALE,
  BREATH_SOUND_INHALE,
  BreathPattern,
  BreathPhase,
  getCycleSec,
  getPhase,
  getPhaseLabel,
} from './_breath/patterns';
import InfiniteBreathPath from './_breath/InfiniteBreathPath';

const ACCENT = '#5E5CE6';
const NIGHT = '#0A0F1F';

type Screen = 'setup' | 'active' | 'done';

export default function NefesScreen() {
  const fontsLoaded = useSleepFonts();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [screen, setScreen] = useState<Screen>('setup');
  const [pattern, setPattern] = useState<BreathPattern>(BREATH_PATTERNS[0]!);
  const [durationMin, setDurationMin] = useState<number>(BREATH_PATTERNS[0]!.defaultMin);

  if (!fontsLoaded) return <View style={st.root} />;

  return (
    <View style={[st.root, { paddingTop: insets.top }]}>
      {screen === 'setup' && (
        <SetupView
          pattern={pattern}
          duration={durationMin}
          onChangePattern={(p) => {
            setPattern(p);
            setDurationMin(p.defaultMin);
          }}
          onChangeDuration={setDurationMin}
          onStart={() => setScreen('active')}
          onClose={() => router.back()}
        />
      )}
      {screen === 'active' && (
        <ActiveView
          pattern={pattern}
          durationMin={durationMin}
          onClose={() => setScreen('setup')}
          onDone={() => setScreen('done')}
        />
      )}
      {screen === 'done' && (
        <DoneView
          pattern={pattern}
          durationMin={durationMin}
          onAgain={() => setScreen('active')}
          onClose={() => router.back()}
        />
      )}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SETUP
// ─────────────────────────────────────────────────────────────────────────────

function SetupView({
  pattern,
  duration,
  onChangePattern,
  onChangeDuration,
  onStart,
  onClose,
}: {
  pattern: BreathPattern;
  duration: number;
  onChangePattern: (p: BreathPattern) => void;
  onChangeDuration: (d: number) => void;
  onStart: () => void;
  onClose: () => void;
}) {
  const [showInfo, setShowInfo] = useState(false);
  const insets = useSafeAreaInsets();

  return (
    <>
      <View style={st.header}>
        <Pressable onPress={onClose} hitSlop={14} style={st.headerBtn}>
          <SymbolView
            name="xmark"
            size={18}
            tintColor="rgba(255,255,255,0.85)"
            fallback={<Text style={{ color: '#fff' }}>×</Text>}
          />
        </Pressable>
        <Text style={st.headerTitle}>Nefes Çalışması</Text>
        <Pressable
          onPress={() => setShowInfo(!showInfo)}
          hitSlop={14}
          style={[st.headerBtn, { backgroundColor: 'rgba(255,255,255,0.12)' }]}
        >
          <SymbolView
            name="info"
            size={14}
            tintColor="rgba(255,255,255,0.85)"
            fallback={<Text style={{ color: '#fff' }}>i</Text>}
          />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={[st.setupScroll, { paddingBottom: insets.bottom + 120 }]}>
        {/* Süre */}
        <View style={st.durationWrap}>
          <Pressable
            onPress={() => {
              Haptics.selectionAsync();
              onChangeDuration(Math.max(2, duration - 1));
            }}
            style={st.durationBtn}
            hitSlop={10}
          >
            <SymbolView
              name="minus"
              size={18}
              tintColor="rgba(255,255,255,0.85)"
              fallback={<Text style={{ color: '#fff', fontSize: 22 }}>−</Text>}
            />
          </Pressable>
          <View style={{ alignItems: 'center', minWidth: 110 }}>
            <Text style={st.durationVal}>{pad(duration)}:00</Text>
            <Text style={st.durationLabel}>Süre Ayarla</Text>
          </View>
          <Pressable
            onPress={() => {
              Haptics.selectionAsync();
              onChangeDuration(Math.min(30, duration + 1));
            }}
            style={st.durationBtn}
            hitSlop={10}
          >
            <SymbolView
              name="plus"
              size={18}
              tintColor="rgba(255,255,255,0.85)"
              fallback={<Text style={{ color: '#fff', fontSize: 22 }}>+</Text>}
            />
          </Pressable>
        </View>

        {/* Pattern listesi */}
        <Text style={st.sectionTitle}>Pattern Seç</Text>
        <View style={{ gap: 10, marginTop: 10 }}>
          {BREATH_PATTERNS.map((p) => {
            const active = pattern.id === p.id;
            return (
              <Pressable
                key={p.id}
                onPress={() => {
                  Haptics.selectionAsync();
                  onChangePattern(p);
                }}
                style={[
                  patternSt.card,
                  active && {
                    backgroundColor: 'rgba(94, 92, 230, 0.2)',
                    borderColor: ACCENT,
                  },
                ]}
              >
                <View style={patternSt.emojiWrap}>
                  <Text style={{ fontSize: 26 }}>{p.emoji}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={patternSt.name}>{p.name}</Text>
                    <View style={patternSt.ratioPill}>
                      <Text style={patternSt.ratioTxt}>{ratioStr(p)}</Text>
                    </View>
                  </View>
                  <Text style={patternSt.short}>{p.short}</Text>
                  {active && showInfo && <Text style={patternSt.desc}>{p.description}</Text>}
                </View>
                <View
                  style={[
                    patternSt.radio,
                    active && { backgroundColor: ACCENT, borderColor: ACCENT },
                  ]}
                >
                  {active && (
                    <SymbolView
                      name="checkmark"
                      size={12}
                      tintColor="#fff"
                      fallback={<Text style={{ color: '#fff', fontSize: 11 }}>✓</Text>}
                    />
                  )}
                </View>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      {/* Başla CTA — sticky bottom */}
      <View style={[st.ctaWrap, { paddingBottom: insets.bottom + 16 }]}>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            onStart();
          }}
          style={{
            backgroundColor: ACCENT,
            borderRadius: 30,
            paddingVertical: 18,
            paddingHorizontal: 64,
            alignItems: 'center',
            minHeight: 60,
            justifyContent: 'center',
            shadowColor: ACCENT,
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.4,
            shadowRadius: 18,
          }}
        >
          <Text style={{ fontFamily: font.bold, fontSize: 17, color: '#fff', letterSpacing: -0.2 }}>
            Başla
          </Text>
        </Pressable>
      </View>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ACTIVE
// ─────────────────────────────────────────────────────────────────────────────

function ActiveView({
  pattern,
  durationMin,
  onClose,
  onDone,
}: {
  pattern: BreathPattern;
  durationMin: number;
  onClose: () => void;
  onDone: () => void;
}) {
  const insets = useSafeAreaInsets();
  const [paused, setPaused] = useState(false);
  const [remainingDisplay, setRemainingDisplay] = useState(durationMin * 60);
  const [phaseLabel, setPhaseLabel] = useState<string>(getPhaseLabel('inhale'));

  const cycleSec = getCycleSec(pattern);
  const totalSec = durationMin * 60;

  const elapsedRef = useRef(0);
  const tickRef = useRef<NodeJS.Timeout | null>(null);
  const startedAtRef = useRef<number>(Date.now());
  const pauseElapsedRef = useRef<number>(0);
  const lastPhaseRef = useRef<BreathPhase | null>(null);

  // Reanimated shared value — UI thread'de path animasyonu
  const cycleProgress = useSharedValue(0);

  // Talimat fade-in animasyonu
  const labelOpacity = useRef(new Animated.Value(1)).current;

  // Audio
  const inhalePlayer = useAudioPlayer({ uri: BREATH_SOUND_INHALE });
  const exhalePlayer = useAudioPlayer({ uri: BREATH_SOUND_EXHALE });
  const bellPlayer = useAudioPlayer({ uri: BREATH_SOUND_BELL });

  useEffect(() => {
    activateKeepAwakeAsync('breath-active').catch(() => {});
    return () => {
      deactivateKeepAwake('breath-active');
    };
  }, []);

  // Saat + phase tick (saniyede 1)
  useEffect(() => {
    if (paused) {
      pauseElapsedRef.current = elapsedRef.current;
      if (tickRef.current) clearInterval(tickRef.current);
      return;
    }
    startedAtRef.current = Date.now();

    const tick = () => {
      const liveElapsed = pauseElapsedRef.current + (Date.now() - startedAtRef.current) / 1000;
      elapsedRef.current = liveElapsed;
      const remaining = Math.max(0, totalSec - liveElapsed);
      setRemainingDisplay(remaining);

      // Phase tespiti
      const elapsedInCycle = liveElapsed % cycleSec;
      const phaseInfo = getPhase(elapsedInCycle, pattern);
      if (phaseInfo.phase !== lastPhaseRef.current) {
        lastPhaseRef.current = phaseInfo.phase;
        // Talimat fade
        Animated.sequence([
          Animated.timing(labelOpacity, {
            toValue: 0,
            duration: 220,
            useNativeDriver: true,
            easing: Easing.bezier(0.4, 0, 1, 1),
          }),
          Animated.timing(labelOpacity, {
            toValue: 1,
            duration: 380,
            useNativeDriver: true,
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
        ]).start();
        setTimeout(() => setPhaseLabel(getPhaseLabel(phaseInfo.phase)), 220);

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        if (phaseInfo.phase === 'inhale') {
          try {
            inhalePlayer.seekTo(0);
            inhalePlayer.play();
          } catch {}
        } else if (phaseInfo.phase === 'exhale') {
          try {
            exhalePlayer.seekTo(0);
            exhalePlayer.play();
          } catch {}
        }
      }

      if (liveElapsed >= totalSec) {
        if (tickRef.current) clearInterval(tickRef.current);
        try {
          bellPlayer.play();
        } catch {}
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onDone();
      }
    };

    tickRef.current = setInterval(tick, 250);
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused]);

  return (
    <>
      <View style={st.header}>
        <Pressable
          onPress={() => {
            if (tickRef.current) clearInterval(tickRef.current);
            onClose();
          }}
          hitSlop={14}
          style={st.headerBtn}
        >
          <SymbolView
            name="xmark"
            size={18}
            tintColor="rgba(255,255,255,0.85)"
            fallback={<Text style={{ color: '#fff' }}>×</Text>}
          />
        </Pressable>
        <Text style={st.headerTitle}>Nefes Çalışması</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={{ alignItems: 'center', paddingTop: 18 }}>
        <Text style={activeSt.timer}>{formatMs(remainingDisplay)}</Text>
        <Text style={activeSt.timerLabel}>Kalan Süre</Text>
      </View>

      <View style={{ alignItems: 'center', paddingHorizontal: 32, paddingTop: 36, minHeight: 70 }}>
        <Animated.Text style={[activeSt.instr, { opacity: labelOpacity }]}>
          {phaseLabel}
        </Animated.Text>
      </View>

      {/* Reanimated-driven sonsuz path */}
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <InfiniteBreathPath pattern={pattern} paused={paused} cycleProgress={cycleProgress} />
      </View>

      <View style={[st.ctaWrap, { paddingBottom: insets.bottom + 16 }]}>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setPaused(!paused);
          }}
          style={{
            backgroundColor: paused ? ACCENT : 'rgba(255,255,255,0.12)',
            borderRadius: 30,
            paddingVertical: 18,
            paddingHorizontal: 64,
            alignItems: 'center',
            minHeight: 60,
            justifyContent: 'center',
          }}
        >
          <Text
            style={{
              fontFamily: font.bold,
              fontSize: 17,
              color: paused ? '#fff' : ACCENT,
              letterSpacing: -0.2,
            }}
          >
            {paused ? 'Devam Et' : 'Duraklat'}
          </Text>
        </Pressable>
      </View>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DONE
// ─────────────────────────────────────────────────────────────────────────────

function DoneView({
  pattern,
  durationMin,
  onAgain,
  onClose,
}: {
  pattern: BreathPattern;
  durationMin: number;
  onAgain: () => void;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const fade = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.7)).current;
  const sparkle1 = useRef(new Animated.Value(0)).current;
  const sparkle2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fade, {
          toValue: 1,
          duration: 480,
          useNativeDriver: true,
          easing: Easing.bezier(0.16, 1, 0.3, 1),
        }),
        Animated.spring(scale, { toValue: 1, useNativeDriver: true, tension: 100, friction: 8 }),
      ]),
      Animated.stagger(220, [
        Animated.timing(sparkle1, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
          easing: Easing.bezier(0.16, 1, 0.3, 1),
        }),
        Animated.timing(sparkle2, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
          easing: Easing.bezier(0.16, 1, 0.3, 1),
        }),
      ]),
    ]).start();
  }, []);

  return (
    <View style={{ flex: 1 }}>
      <View style={st.header}>
        <Pressable onPress={onClose} hitSlop={14} style={st.headerBtn}>
          <SymbolView
            name="xmark"
            size={18}
            tintColor="rgba(255,255,255,0.85)"
            fallback={<Text style={{ color: '#fff' }}>×</Text>}
          />
        </Pressable>
        <Text style={st.headerTitle}>Tamamlandı</Text>
        <View style={{ width: 40 }} />
      </View>

      <View
        style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}
      >
        <Animated.View
          style={{
            width: 140,
            height: 140,
            borderRadius: 36,
            backgroundColor: 'rgba(94, 92, 230, 0.2)',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: fade,
            transform: [{ scale }],
          }}
        >
          <SymbolView
            name="checkmark"
            size={64}
            tintColor={ACCENT}
            fallback={<Text style={{ fontSize: 56 }}>✓</Text>}
          />

          <Animated.View
            style={[
              doneSt.sparkle,
              { top: -10, right: -10, opacity: sparkle1, transform: [{ scale: sparkle1 }] },
            ]}
          >
            <Text style={{ fontSize: 22 }}>✨</Text>
          </Animated.View>
          <Animated.View
            style={[
              doneSt.sparkle,
              { bottom: -8, left: -10, opacity: sparkle2, transform: [{ scale: sparkle2 }] },
            ]}
          >
            <Text style={{ fontSize: 18 }}>✨</Text>
          </Animated.View>
        </Animated.View>

        <Animated.Text style={[doneSt.title, { opacity: fade }]}>İyi iş çıkardın</Animated.Text>
        <Animated.Text style={[doneSt.sub, { opacity: fade }]}>
          {pattern.name} • {durationMin} dakika
        </Animated.Text>

        <Animated.View style={[doneSt.statsRow, { opacity: fade }]}>
          <DoneStat label="Süre" value={`${durationMin}dk`} />
          <View style={doneSt.statDivider} />
          <DoneStat label="Pattern" value={pattern.name} />
          <View style={doneSt.statDivider} />
          <DoneStat
            label="Döngü"
            value={String(Math.round((durationMin * 60) / getCycleSec(pattern)))}
          />
        </Animated.View>
      </View>

      <View style={[st.ctaWrap, { paddingBottom: insets.bottom + 16, gap: 10 }]}>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            onAgain();
          }}
          style={{
            backgroundColor: ACCENT,
            borderRadius: 30,
            paddingVertical: 18,
            alignItems: 'center',
            minHeight: 60,
            justifyContent: 'center',
            shadowColor: ACCENT,
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.4,
            shadowRadius: 14,
          }}
        >
          <Text style={{ fontFamily: font.bold, fontSize: 17, color: '#fff' }}>Tekrar Başla</Text>
        </Pressable>
        <Pressable
          onPress={onClose}
          hitSlop={10}
          style={{ paddingVertical: 12, alignItems: 'center' }}
        >
          <Text style={{ fontFamily: font.medium, fontSize: 15, color: 'rgba(255,255,255,0.6)' }}>
            Kapat
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

function DoneStat({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ alignItems: 'center', flex: 1 }}>
      <Text style={{ fontFamily: font.bold, fontSize: 16, color: '#fff', letterSpacing: -0.2 }}>
        {value}
      </Text>
      <Text
        style={{
          fontFamily: font.regular,
          fontSize: 11,
          color: 'rgba(255,255,255,0.5)',
          marginTop: 2,
        }}
      >
        {label}
      </Text>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// helpers
// ─────────────────────────────────────────────────────────────────────────────

function pad(n: number) {
  return String(n).padStart(2, '0');
}
function formatMs(sec: number) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${pad(m)}:${pad(s)}`;
}
function ratioStr(p: BreathPattern) {
  const parts = [p.inhale, p.hold1, p.exhale, p.hold2].filter((v) => v > 0);
  return parts.map((v) => (Number.isInteger(v) ? String(v) : v.toFixed(1))).join('-');
}

// ─────────────────────────────────────────────────────────────────────────────
// styles
// ─────────────────────────────────────────────────────────────────────────────

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: NIGHT },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 12,
    gap: 8,
  },
  headerBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  headerTitle: {
    flex: 1,
    fontFamily: font.bold,
    fontSize: 16,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  setupScroll: { paddingHorizontal: 22, paddingTop: 24 },

  durationWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 18,
    marginBottom: 32,
  },
  durationBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  durationVal: { fontFamily: font.bold, fontSize: 32, color: '#fff', letterSpacing: -0.5 },
  durationLabel: {
    fontFamily: font.regular,
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 2,
  },

  sectionTitle: {
    fontFamily: font.semibold,
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginTop: 8,
  },

  ctaWrap: { paddingHorizontal: 22, paddingTop: 12 },
});

const patternSt = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 14,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  emojiWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: { fontFamily: font.bold, fontSize: 16, color: '#fff', letterSpacing: -0.2 },
  ratioPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: 'rgba(10, 132, 255, 0.2)',
  },
  ratioTxt: { fontFamily: font.semibold, fontSize: 11, color: ACCENT, letterSpacing: 0.5 },
  short: { fontFamily: font.regular, fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 3 },
  desc: {
    fontFamily: font.regular,
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 8,
    lineHeight: 17,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

const activeSt = StyleSheet.create({
  timer: { fontFamily: font.bold, fontSize: 38, color: ACCENT, letterSpacing: -0.6 },
  timerLabel: {
    fontFamily: font.regular,
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 4,
  },
  instr: {
    fontFamily: font.bold,
    fontSize: 22,
    color: '#fff',
    textAlign: 'center',
    letterSpacing: -0.3,
    lineHeight: 30,
  },
});

const doneSt = StyleSheet.create({
  sparkle: { position: 'absolute' },
  title: {
    fontFamily: font.extrabold,
    fontSize: 32,
    color: '#fff',
    letterSpacing: -0.6,
    marginTop: 28,
    textAlign: 'center',
  },
  sub: {
    fontFamily: font.medium,
    fontSize: 14,
    color: 'rgba(255,255,255,0.55)',
    marginTop: 8,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 32,
    paddingHorizontal: 8,
    paddingVertical: 16,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignSelf: 'stretch',
  },
  statDivider: {
    width: StyleSheet.hairlineWidth,
    height: 32,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
});

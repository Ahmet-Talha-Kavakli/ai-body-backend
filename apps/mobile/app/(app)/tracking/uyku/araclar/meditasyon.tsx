import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAudioPlayer } from 'expo-audio';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { Canvas, Circle, RadialGradient, vec } from '@shopify/react-native-skia';
import {
  cancelAnimation,
  Easing as REasing,
  useDerivedValue,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { SymbolView } from 'expo-symbols';
import { font, SLEEP } from '../_components/theme';
import { useSleepFonts } from '../_components/useSleepFonts';
import {
  MEDITATION_CATEGORIES,
  MEDITATION_SESSIONS,
  MeditationCategory,
  MeditationSession,
} from './_meditation/sessions';

type CategoryKey = (typeof MEDITATION_CATEGORIES)[number]['key'];

export default function MeditasyonScreen() {
  const fontsLoaded = useSleepFonts();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [activeCategory, setActiveCategory] = useState<CategoryKey>('all');
  const [activeSession, setActiveSession] = useState<MeditationSession | null>(null);

  if (!fontsLoaded) return <View style={st.root} />;

  if (activeSession) {
    return <MeditationPlayer session={activeSession} onClose={() => setActiveSession(null)} />;
  }

  const filtered =
    activeCategory === 'all'
      ? MEDITATION_SESSIONS
      : MEDITATION_SESSIONS.filter((s) => s.category === activeCategory);

  const heroSession = MEDITATION_SESSIONS[0]!;

  return (
    <View style={[st.root, { paddingTop: insets.top }]}>
      <View style={st.header}>
        <Pressable onPress={() => router.back()} hitSlop={14} style={st.backBtn}>
          <SymbolView
            name="chevron.left"
            size={20}
            tintColor={SLEEP.text}
            fallback={<Text>‹</Text>}
          />
        </Pressable>
        <Text style={st.headerTitle}>Meditasyon</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={[st.scroll, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero kart — bugünün önerisi */}
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setActiveSession(heroSession);
          }}
          style={heroSt.wrap}
        >
          <View style={heroSt.bg}>
            <Text style={heroSt.label}>BUGÜN İÇİN</Text>
            <Text style={heroSt.title}>{heroSession.title}</Text>
            <Text style={heroSt.desc}>{heroSession.description}</Text>
            <View style={heroSt.metaRow}>
              <View style={heroSt.metaPill}>
                <SymbolView
                  name="clock"
                  size={11}
                  tintColor="#fff"
                  fallback={<Text style={{ color: '#fff', fontSize: 10 }}>⏱</Text>}
                />
                <Text style={heroSt.metaTxt}>{heroSession.durationMin} dk</Text>
              </View>
              <View style={[heroSt.playBtn]}>
                <SymbolView
                  name="play.fill"
                  size={14}
                  tintColor={SLEEP.accent}
                  fallback={<Text style={{ color: SLEEP.accent }}>▶</Text>}
                />
              </View>
            </View>
          </View>
        </Pressable>

        {/* Kategori chip'leri */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={st.chipsRow}
          style={{ marginTop: 24 }}
        >
          {MEDITATION_CATEGORIES.map((cat) => {
            const active = activeCategory === cat.key;
            return (
              <Pressable
                key={cat.key}
                onPress={() => {
                  Haptics.selectionAsync();
                  setActiveCategory(cat.key);
                }}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  paddingHorizontal: 14,
                  paddingVertical: 9,
                  borderRadius: 14,
                  backgroundColor: active ? SLEEP.accent : SLEEP.card,
                  marginRight: 8,
                }}
              >
                <Text style={{ fontSize: 14 }}>{cat.emoji}</Text>
                <Text
                  style={{
                    fontFamily: font.semibold,
                    fontSize: 13,
                    color: active ? '#fff' : SLEEP.text,
                  }}
                >
                  {cat.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Oturum listesi */}
        <View style={{ marginTop: 18, gap: 10, paddingHorizontal: 18 }}>
          {filtered.map((session) => (
            <SessionCard
              key={session.id}
              session={session}
              onPress={() => setActiveSession(session)}
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Session Card
// ─────────────────────────────────────────────────────────────────────────────

function SessionCard({ session, onPress }: { session: MeditationSession; onPress: () => void }) {
  const scale = useRef(new Animated.Value(1)).current;
  return (
    <Pressable
      onPressIn={() =>
        Animated.spring(scale, {
          toValue: 0.97,
          useNativeDriver: true,
          tension: 400,
          friction: 14,
        }).start()
      }
      onPressOut={() =>
        Animated.spring(scale, {
          toValue: 1,
          useNativeDriver: true,
          tension: 300,
          friction: 12,
        }).start()
      }
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
    >
      <Animated.View style={[cardSt.wrap, { transform: [{ scale }] }]}>
        <View style={cardSt.emojiWrap}>
          <Text style={{ fontSize: 28 }}>{session.emoji}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={cardSt.title} numberOfLines={1}>
            {session.title}
          </Text>
          <Text style={cardSt.desc} numberOfLines={1}>
            {session.description}
          </Text>
          <View style={cardSt.metaRow}>
            <View style={cardSt.timePill}>
              <Text style={cardSt.timeTxt}>{session.durationMin} dk</Text>
            </View>
          </View>
        </View>
        <View style={cardSt.playWrap}>
          <SymbolView
            name="play.fill"
            size={14}
            tintColor={SLEEP.accent}
            fallback={<Text style={{ color: SLEEP.accent }}>▶</Text>}
          />
        </View>
      </Animated.View>
    </Pressable>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Player
// ─────────────────────────────────────────────────────────────────────────────

function MeditationPlayer({
  session,
  onClose,
}: {
  session: MeditationSession;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const [paused, setPaused] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [currentCueIdx, setCurrentCueIdx] = useState(-1);
  const [done, setDone] = useState(false);

  const totalSec = session.durationMin * 60;
  const player = useAudioPlayer({ uri: session.soundUri });

  const tickRef = useRef<NodeJS.Timeout | null>(null);
  const startedAtRef = useRef<number>(Date.now());
  const pauseElapsedRef = useRef<number>(0);

  // Reanimated breathing visual
  const breath = useSharedValue(0);

  // Cue fade animasyonu
  const cueOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    activateKeepAwakeAsync('meditation').catch(() => {});
    try {
      player.loop = true;
      player.volume = 0.5;
      player.play();
    } catch {}

    breath.value = withRepeat(
      withTiming(1, { duration: 4500, easing: REasing.inOut(REasing.sin) }),
      -1,
      true,
    );

    return () => {
      try {
        player.pause();
      } catch {}
      cancelAnimation(breath);
      deactivateKeepAwake('meditation');
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (paused || done) {
      pauseElapsedRef.current = elapsed;
      if (tickRef.current) clearInterval(tickRef.current);
      try {
        player.pause();
      } catch {}
      cancelAnimation(breath);
      return;
    }
    startedAtRef.current = Date.now();
    try {
      player.play();
    } catch {}
    breath.value = withRepeat(
      withTiming(1, { duration: 4500, easing: REasing.inOut(REasing.sin) }),
      -1,
      true,
    );

    tickRef.current = setInterval(() => {
      const live = pauseElapsedRef.current + (Date.now() - startedAtRef.current) / 1000;
      setElapsed(live);

      // Aktif cue tespit
      const idx = session.cues.findIndex((c, i) => {
        const next = session.cues[i + 1];
        return live >= c.at && (!next || live < next.at);
      });
      if (idx !== currentCueIdx && idx !== -1) {
        setCurrentCueIdx(idx);
        Animated.sequence([
          Animated.timing(cueOpacity, {
            toValue: 0,
            duration: 220,
            useNativeDriver: true,
            easing: Easing.bezier(0.4, 0, 1, 1),
          }),
          Animated.timing(cueOpacity, {
            toValue: 1,
            duration: 480,
            useNativeDriver: true,
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
        ]).start();
        Haptics.selectionAsync();
      }

      if (live >= totalSec) {
        if (tickRef.current) clearInterval(tickRef.current);
        try {
          player.pause();
        } catch {}
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setDone(true);
      }
    }, 250);

    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused, done]);

  // Initial cue fade-in
  useEffect(() => {
    Animated.timing(cueOpacity, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
      easing: Easing.bezier(0.16, 1, 0.3, 1),
    }).start();
  }, []);

  const remaining = Math.max(0, totalSec - elapsed);
  const progress = Math.min(1, elapsed / totalSec);
  const currentCue = currentCueIdx >= 0 ? session.cues[currentCueIdx] : null;

  // Breathing ring (Skia)
  const ringR = useDerivedValue(() => 90 + breath.value * 28);
  const ringOpacity = useDerivedValue(() => 0.18 + breath.value * 0.18);
  const innerR = useDerivedValue(() => 60 + breath.value * 18);

  if (done) {
    return (
      <DoneView
        session={session}
        onAgain={() => {
          setDone(false);
          setElapsed(0);
          pauseElapsedRef.current = 0;
          setCurrentCueIdx(-1);
        }}
        onClose={onClose}
        insets={insets}
      />
    );
  }

  return (
    <View style={[st.root, { paddingTop: insets.top }]}>
      <View style={st.header}>
        <Pressable onPress={onClose} hitSlop={14} style={st.backBtn}>
          <SymbolView
            name="chevron.down"
            size={20}
            tintColor={SLEEP.text}
            fallback={<Text>↓</Text>}
          />
        </Pressable>
        <Text style={st.headerTitle} numberOfLines={1}>
          {session.title}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Breathing visual */}
      <View style={{ alignItems: 'center', marginTop: 32 }}>
        <Canvas style={{ width: 240, height: 240 }}>
          <Circle cx={120} cy={120} r={ringR} opacity={ringOpacity}>
            <RadialGradient
              c={vec(120, 120)}
              r={120}
              colors={[SLEEP.accent, SLEEP.accent + '00']}
            />
          </Circle>
          <Circle cx={120} cy={120} r={innerR} color={SLEEP.accent} opacity={0.18} />
          <Circle
            cx={120}
            cy={120}
            r={innerR}
            style="stroke"
            strokeWidth={1.5}
            color={SLEEP.accent}
            opacity={0.5}
          />
        </Canvas>
      </View>

      {/* Cue text */}
      <View style={playerSt.cueWrap}>
        <Animated.Text style={[playerSt.cue, { opacity: cueOpacity }]}>
          {currentCue?.text ?? 'Rahat bir pozisyon al, başlıyoruz.'}
        </Animated.Text>
      </View>

      {/* Progress bar + saat */}
      <View style={[playerSt.bottom, { paddingBottom: insets.bottom + 24 }]}>
        <View style={playerSt.progressTrack}>
          <View style={[playerSt.progressFill, { width: `${progress * 100}%` }]} />
        </View>
        <View style={playerSt.timeRow}>
          <Text style={playerSt.timeTxt}>{formatMs(elapsed)}</Text>
          <Text style={playerSt.timeTxt}>−{formatMs(remaining)}</Text>
        </View>

        <View style={playerSt.controlsRow}>
          <Pressable
            onPress={() => {
              Haptics.selectionAsync();
              const newElapsed = Math.max(0, elapsed - 15);
              pauseElapsedRef.current = newElapsed;
              setElapsed(newElapsed);
              startedAtRef.current = Date.now();
              setCurrentCueIdx(-1);
            }}
            hitSlop={10}
            style={playerSt.sideBtn}
          >
            <SymbolView
              name="gobackward.15"
              size={26}
              tintColor={SLEEP.text}
              fallback={<Text>−15</Text>}
            />
          </Pressable>

          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              setPaused(!paused);
            }}
            style={[playerSt.playBtn, { backgroundColor: SLEEP.accent }]}
          >
            <SymbolView
              name={paused ? 'play.fill' : 'pause.fill'}
              size={28}
              tintColor="#fff"
              fallback={<Text style={{ color: '#fff', fontSize: 22 }}>{paused ? '▶' : '⏸'}</Text>}
            />
          </Pressable>

          <Pressable
            onPress={() => {
              Haptics.selectionAsync();
              const newElapsed = Math.min(totalSec, elapsed + 15);
              pauseElapsedRef.current = newElapsed;
              setElapsed(newElapsed);
              startedAtRef.current = Date.now();
              setCurrentCueIdx(-1);
            }}
            hitSlop={10}
            style={playerSt.sideBtn}
          >
            <SymbolView
              name="goforward.15"
              size={26}
              tintColor={SLEEP.text}
              fallback={<Text>+15</Text>}
            />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Done
// ─────────────────────────────────────────────────────────────────────────────

function DoneView({
  session,
  onAgain,
  onClose,
  insets,
}: {
  session: MeditationSession;
  onAgain: () => void;
  onClose: () => void;
  insets: { bottom: number; top: number };
}) {
  const fade = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.7)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, {
        toValue: 1,
        duration: 480,
        useNativeDriver: true,
        easing: Easing.bezier(0.16, 1, 0.3, 1),
      }),
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, tension: 100, friction: 8 }),
    ]).start();
  }, []);

  return (
    <View style={[st.root, { paddingTop: insets.top }]}>
      <View style={st.header}>
        <Pressable onPress={onClose} hitSlop={14} style={st.backBtn}>
          <SymbolView name="xmark" size={18} tintColor={SLEEP.text} fallback={<Text>×</Text>} />
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
            backgroundColor: SLEEP.accentSoft,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: fade,
            transform: [{ scale }],
          }}
        >
          <Text style={{ fontSize: 64 }}>{session.emoji}</Text>
        </Animated.View>

        <Animated.Text style={[doneSt.title, { opacity: fade }]}>İyi iş çıkardın</Animated.Text>
        <Animated.Text style={[doneSt.sub, { opacity: fade }]}>
          {session.title} • {session.durationMin} dakika
        </Animated.Text>
      </View>

      <View style={[playerSt.bottom, { paddingBottom: insets.bottom + 16, gap: 10 }]}>
        <Pressable
          onPress={onAgain}
          style={{
            backgroundColor: SLEEP.accent,
            borderRadius: 16,
            paddingVertical: 18,
            alignItems: 'center',
            minHeight: 60,
            shadowColor: SLEEP.accent,
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.3,
            shadowRadius: 12,
          }}
        >
          <Text style={{ fontFamily: font.bold, fontSize: 17, color: '#fff' }}>Tekrar Yap</Text>
        </Pressable>
        <Pressable
          onPress={onClose}
          hitSlop={10}
          style={{ paddingVertical: 12, alignItems: 'center' }}
        >
          <Text style={{ fontFamily: font.medium, fontSize: 15, color: SLEEP.textMuted }}>
            Listeye Dön
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

// ─── helpers
function formatMs(sec: number) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// ─── styles
const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: SLEEP.page },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 12,
    gap: 8,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: {
    flex: 1,
    fontFamily: font.bold,
    fontSize: 17,
    color: SLEEP.text,
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  scroll: { paddingTop: 8 },
  chipsRow: { paddingHorizontal: 18 },
});

const heroSt = StyleSheet.create({
  wrap: { paddingHorizontal: 18 },
  bg: {
    backgroundColor: SLEEP.accent,
    borderRadius: 22,
    padding: 22,
    shadowColor: SLEEP.accent,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 18,
  },
  label: {
    fontFamily: font.semibold,
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  title: { fontFamily: font.extrabold, fontSize: 22, color: '#fff', letterSpacing: -0.4 },
  desc: {
    fontFamily: font.regular,
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 6,
    lineHeight: 18,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  metaTxt: { fontFamily: font.semibold, fontSize: 12, color: '#fff' },
  playBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

const cardSt = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 14,
    backgroundColor: SLEEP.card,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
  },
  emojiWrap: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: SLEEP.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontFamily: font.bold, fontSize: 15, color: SLEEP.text, letterSpacing: -0.2 },
  desc: { fontFamily: font.regular, fontSize: 12, color: SLEEP.textMuted, marginTop: 2 },
  metaRow: { flexDirection: 'row', marginTop: 6 },
  timePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: '#F2F2F7',
  },
  timeTxt: { fontFamily: font.semibold, fontSize: 11, color: SLEEP.textMuted },
  playWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: SLEEP.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

const playerSt = StyleSheet.create({
  cueWrap: { paddingHorizontal: 32, marginTop: 36, minHeight: 100, justifyContent: 'center' },
  cue: {
    fontFamily: font.bold,
    fontSize: 22,
    color: SLEEP.text,
    textAlign: 'center',
    letterSpacing: -0.3,
    lineHeight: 30,
  },
  bottom: { paddingHorizontal: 22, paddingTop: 16, marginTop: 'auto' },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: SLEEP.accentSoft,
    overflow: 'hidden',
  },
  progressFill: { height: 4, borderRadius: 2, backgroundColor: SLEEP.accent },
  timeRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  timeTxt: { fontFamily: font.medium, fontSize: 12, color: SLEEP.textMuted },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 28,
    marginTop: 24,
  },
  sideBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: SLEEP.accent,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
  },
});

const doneSt = StyleSheet.create({
  title: {
    fontFamily: font.extrabold,
    fontSize: 30,
    color: SLEEP.text,
    letterSpacing: -0.6,
    marginTop: 28,
    textAlign: 'center',
  },
  sub: {
    fontFamily: font.medium,
    fontSize: 14,
    color: SLEEP.textMuted,
    marginTop: 8,
    textAlign: 'center',
  },
});

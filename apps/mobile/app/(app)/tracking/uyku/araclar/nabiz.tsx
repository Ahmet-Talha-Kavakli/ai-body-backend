import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { SymbolView } from 'expo-symbols';
import { font, SLEEP } from '../_components/theme';
import { useSleepFonts } from '../_components/useSleepFonts';
import PPGMeasure, { PPGResult } from '../_components/PPGMeasure';

type Phase = 'measure' | 'result';

export default function NabizScreen() {
  const fontsLoaded = useSleepFonts();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [phase, setPhase] = useState<Phase>('measure');
  const [result, setResult] = useState<PPGResult | null>(null);

  if (!fontsLoaded) return <View style={st.root} />;

  return (
    <View style={[st.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={st.header}>
        <Pressable onPress={() => router.back()} hitSlop={14} style={st.backBtn}>
          <SymbolView
            name="chevron.left"
            size={20}
            tintColor={SLEEP.text}
            fallback={<Text>‹</Text>}
          />
        </Pressable>
        <Text style={st.headerTitle}>Nabız</Text>
        <View style={{ width: 40 }} />
      </View>

      {phase === 'measure' && (
        <PPGMeasure
          label="bedtime"
          onComplete={(r) => {
            setResult(r);
            setPhase('result');
          }}
        />
      )}

      {phase === 'result' && result && (
        <ResultView
          result={result}
          onAgain={() => {
            setResult(null);
            setPhase('measure');
          }}
          onClose={() => router.back()}
          insets={insets}
        />
      )}
    </View>
  );
}

function ResultView({
  result,
  onAgain,
  onClose,
  insets,
}: {
  result: PPGResult;
  onAgain: () => void;
  onClose: () => void;
  insets: { bottom: number };
}) {
  const fade = useRef(new Animated.Value(0)).current;
  const heartScale = useRef(new Animated.Value(0.7)).current;
  const bpmAnim = useRef(new Animated.Value(0)).current;
  const hrvAnim = useRef(new Animated.Value(0)).current;
  const [shownBpm, setShownBpm] = useState(0);
  const [shownHrv, setShownHrv] = useState(0);

  useEffect(() => {
    const idBpm = bpmAnim.addListener(({ value }) => setShownBpm(Math.round(value)));
    const idHrv = hrvAnim.addListener(({ value }) => setShownHrv(Math.round(value)));
    return () => {
      bpmAnim.removeListener(idBpm);
      hrvAnim.removeListener(idHrv);
    };
  }, []);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, {
        toValue: 1,
        duration: 480,
        useNativeDriver: true,
        easing: Easing.bezier(0.16, 1, 0.3, 1),
      }),
      Animated.spring(heartScale, {
        toValue: 1,
        useNativeDriver: true,
        tension: 100,
        friction: 7,
      }),
      Animated.timing(bpmAnim, {
        toValue: result.bpm,
        duration: 1100,
        useNativeDriver: false,
        easing: Easing.bezier(0.22, 1, 0.36, 1),
      }),
      Animated.timing(hrvAnim, {
        toValue: result.hrv,
        duration: 1100,
        useNativeDriver: false,
        easing: Easing.bezier(0.22, 1, 0.36, 1),
      }),
    ]).start();

    // Kalp atışı animasyonu
    const heartPulse = Animated.loop(
      Animated.sequence([
        Animated.timing(heartScale, {
          toValue: 1.1,
          duration: 300,
          useNativeDriver: true,
          easing: Easing.bezier(0.4, 0, 0.2, 1),
        }),
        Animated.timing(heartScale, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
          easing: Easing.bezier(0.4, 0, 0.2, 1),
        }),
      ]),
    );
    setTimeout(() => heartPulse.start(), 1200);
    return () => heartPulse.stop();
  }, []);

  const bpmCategory = categorizeBpm(result.bpm);
  const hrvCategory = categorizeHrv(result.hrv);

  return (
    <Animated.View style={[{ flex: 1, paddingHorizontal: 22 }, { opacity: fade }]}>
      {/* Heart hero */}
      <View style={resultSt.heartWrap}>
        <Animated.View style={{ transform: [{ scale: heartScale }] }}>
          <View style={resultSt.heartBg}>
            <SymbolView
              name="heart.fill"
              size={64}
              tintColor="#FF3B30"
              fallback={<Text style={{ fontSize: 56 }}>❤️</Text>}
            />
          </View>
        </Animated.View>
      </View>

      {/* BPM */}
      <View style={resultSt.mainStat}>
        <Text style={resultSt.mainValue}>{shownBpm}</Text>
        <Text style={resultSt.mainUnit}>BPM</Text>
        <View style={[resultSt.categoryPill, { backgroundColor: bpmCategory.bg }]}>
          <Text style={[resultSt.categoryTxt, { color: bpmCategory.color }]}>
            {bpmCategory.label}
          </Text>
        </View>
      </View>

      {/* Stats grid */}
      <View style={resultSt.statsGrid}>
        <StatCard
          icon="waveform.path.ecg"
          label="Kalp Atış Değişkenliği"
          value={`${shownHrv} ms`}
          tint={hrvCategory.color}
          bg={hrvCategory.bg}
          sub={hrvCategory.label}
        />
        <StatCard
          icon="heart.text.square"
          label="Kalp Sağlığı"
          value={categorizeHealth(result.bpm, result.hrv)}
          tint={SLEEP.accent}
          bg={SLEEP.accentSoft}
        />
      </View>

      {/* Açıklama */}
      <View style={resultSt.infoCard}>
        <SymbolView
          name="info.circle"
          size={14}
          tintColor={SLEEP.textMuted}
          fallback={<Text>i</Text>}
        />
        <Text style={resultSt.infoTxt}>
          Bu ölçüm telefon kamerası ile yapıldı, tıbbi cihaz değildir. Anormal sonuçlar için doktora
          danış.
        </Text>
      </View>

      {/* Aksiyonlar */}
      <View style={[resultSt.actions, { paddingBottom: insets.bottom + 16 }]}>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            onAgain();
          }}
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
          <Text style={{ fontFamily: font.bold, fontSize: 17, color: '#fff', letterSpacing: -0.2 }}>
            Tekrar Ölç
          </Text>
        </Pressable>
        <Pressable
          onPress={onClose}
          hitSlop={10}
          style={{ paddingVertical: 12, alignItems: 'center', marginTop: 4 }}
        >
          <Text style={{ fontFamily: font.medium, fontSize: 15, color: SLEEP.textMuted }}>
            Kapat
          </Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}

function StatCard({
  icon,
  label,
  value,
  tint,
  bg,
  sub,
}: {
  icon: string;
  label: string;
  value: string;
  tint: string;
  bg: string;
  sub?: string;
}) {
  return (
    <View style={statSt.wrap}>
      <View style={[statSt.iconWrap, { backgroundColor: bg }]}>
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <SymbolView name={icon as any} size={18} tintColor={tint} fallback={<Text>•</Text>} />
      </View>
      <Text style={statSt.label}>{label}</Text>
      <Text style={[statSt.value, { color: tint }]}>{value}</Text>
      {sub && <Text style={statSt.sub}>{sub}</Text>}
    </View>
  );
}

// ─── Yardımcı kategoriler ────────────────────────────────────────────────────

function categorizeBpm(bpm: number): { label: string; color: string; bg: string } {
  if (bpm < 50) return { label: 'Düşük', color: '#FF9F0A', bg: 'rgba(255, 159, 10, 0.15)' };
  if (bpm < 60) return { label: 'Sakin', color: '#0A84FF', bg: 'rgba(10, 132, 255, 0.15)' };
  if (bpm <= 100) return { label: 'Normal', color: '#30D158', bg: 'rgba(48, 209, 88, 0.15)' };
  if (bpm <= 120) return { label: 'Yüksek', color: '#FF9F0A', bg: 'rgba(255, 159, 10, 0.15)' };
  return { label: 'Çok Yüksek', color: '#FF3B30', bg: 'rgba(255, 59, 48, 0.15)' };
}

function categorizeHrv(hrv: number): { label: string; color: string; bg: string } {
  if (hrv < 20) return { label: 'Düşük', color: '#FF3B30', bg: 'rgba(255, 59, 48, 0.15)' };
  if (hrv < 40) return { label: 'Ortalama', color: '#FF9F0A', bg: 'rgba(255, 159, 10, 0.15)' };
  if (hrv < 70) return { label: 'İyi', color: '#30D158', bg: 'rgba(48, 209, 88, 0.15)' };
  return { label: 'Çok İyi', color: '#30D158', bg: 'rgba(48, 209, 88, 0.15)' };
}

function categorizeHealth(bpm: number, hrv: number): string {
  const bpmOk = bpm >= 60 && bpm <= 100;
  const hrvOk = hrv >= 30;
  if (bpmOk && hrvOk) return 'İyi';
  if (bpmOk || hrvOk) return 'Orta';
  return 'Dikkat';
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: SLEEP.page },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
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
});

const resultSt = StyleSheet.create({
  heartWrap: { alignItems: 'center', marginTop: 24 },
  heartBg: {
    width: 120,
    height: 120,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 59, 48, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainStat: { alignItems: 'center', marginTop: 20, gap: 4 },
  mainValue: { fontFamily: font.extrabold, fontSize: 84, color: SLEEP.text, letterSpacing: -3 },
  mainUnit: {
    fontFamily: font.semibold,
    fontSize: 14,
    color: SLEEP.textMuted,
    marginTop: -8,
    letterSpacing: 1.5,
  },
  categoryPill: { marginTop: 12, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 14 },
  categoryTxt: { fontFamily: font.bold, fontSize: 13, letterSpacing: -0.1 },
  statsGrid: { flexDirection: 'row', gap: 10, marginTop: 28 },
  infoCard: {
    flexDirection: 'row',
    gap: 8,
    padding: 12,
    marginTop: 18,
    backgroundColor: SLEEP.card,
    borderRadius: 12,
    alignItems: 'flex-start',
  },
  infoTxt: {
    flex: 1,
    fontFamily: font.regular,
    fontSize: 11,
    color: SLEEP.textMuted,
    lineHeight: 16,
  },
  actions: { gap: 4, marginTop: 'auto', paddingTop: 16 },
});

const statSt = StyleSheet.create({
  wrap: {
    flex: 1,
    padding: 14,
    backgroundColor: SLEEP.card,
    borderRadius: 16,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  label: { fontFamily: font.regular, fontSize: 11, color: SLEEP.textDim, letterSpacing: 0.2 },
  value: { fontFamily: font.bold, fontSize: 18, letterSpacing: -0.3 },
  sub: { fontFamily: font.semibold, fontSize: 11, color: SLEEP.textMuted },
});

import { useEffect, useRef, useState, useCallback } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@clerk/expo';
import { Canvas, Circle, Path, Skia, vec, SweepGradient } from '@shopify/react-native-skia';
import { SymbolView } from 'expo-symbols';
import * as Haptics from 'expo-haptics';
import { font, SLEEP, API_URL } from './_components/theme';
import { useSleepFonts } from './_components/useSleepFonts';

interface SleepSession {
  id: string;
  status: string;
  startedAt: string;
  endedAt: string | null;
  totalMinutes: number | null;
  sleepScore: number | null;
  awakeMinutes: number;
  lightMinutes: number;
  deepMinutes: number;
  remMinutes: number;
  snoreCount: number;
  snoreMinutes: number;
  movementCount: number;
  bedtimeBpm: number | null;
  wakeBpm: number | null;
  bedtimeHrv: number | null;
  wakeHrv: number | null;
  dataSource?: string;
}

export default function BugunScreen() {
  const fontsLoaded = useSleepFonts();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { getToken } = useAuth();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [active, setActive] = useState<SleepSession | null>(null);
  const [last, setLast] = useState<SleepSession | null>(null);

  const scoreAnim = useRef(new Animated.Value(0)).current;
  const [shownScore, setShownScore] = useState(0);
  const prevScore = useRef(0);

  useEffect(() => {
    const id = scoreAnim.addListener(({ value }) => setShownScore(Math.round(value)));
    return () => scoreAnim.removeListener(id);
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/api/tracking/sleep/sessions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setActive(data.active ?? null);
      const recent: SleepSession[] = data.recent ?? [];
      setLast(recent[0] ?? null);

      const next = recent[0]?.sleepScore ?? 0;
      if (prevScore.current !== next) {
        prevScore.current = next;
        Animated.timing(scoreAnim, {
          toValue: next,
          duration: 1100,
          useNativeDriver: false,
          easing: Easing.bezier(0.22, 1, 0.36, 1),
        }).start();
      }
    } catch (e) {
      console.error('[uyku/bugun]', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [getToken, scoreAnim]);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData]),
  );

  if (!fontsLoaded) return <View style={st.root} />;

  return (
    <ScrollView
      style={st.root}
      contentContainerStyle={[st.scroll, { paddingTop: insets.top + 8, paddingBottom: 40 }]}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            fetchData();
          }}
          tintColor={SLEEP.accent}
        />
      }
    >
      <Text style={st.greeting}>{getGreeting()}</Text>
      <Text style={st.dateTxt}>{formatDate(new Date())}</Text>

      {active && (
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push({
              pathname: '/(app)/tracking/uyku-takip',
              params: {
                sessionId: active.id,
              },
            });
          }}
          style={st.activeCard}
        >
          <View style={st.activeDot} />
          <View style={{ flex: 1 }}>
            <Text style={st.activeTitle}>Aktif uyku oturumu</Text>
            <Text style={st.activeSub}>Devam etmek için dokun</Text>
          </View>
          <SymbolView
            name="chevron.right"
            size={16}
            tintColor={SLEEP.accent}
            fallback={<Text>›</Text>}
          />
        </Pressable>
      )}

      {!last && !loading && (
        <EmptyState onStart={() => router.push('/(app)/tracking/uyku/baslat' as never)} />
      )}

      {last && (
        <>
          <ScoreRing score={shownScore} animatedValue={scoreAnim} />

          <View style={st.stats}>
            <Stat label="Süre" value={fmtDuration(last.totalMinutes)} icon="clock.fill" />
            <Stat
              label="Derin"
              value={fmtMinutes(last.deepMinutes)}
              icon="moon.zzz.fill"
              color="#0A84FF"
            />
            <Stat label="REM" value={fmtMinutes(last.remMinutes)} icon="brain" color="#BF5AF2" />
            <Stat
              label="Hafif"
              value={fmtMinutes(last.lightMinutes)}
              icon="moon.fill"
              color={SLEEP.accent}
            />
          </View>

          <StagesBar
            light={last.lightMinutes}
            deep={last.deepMinutes}
            rem={last.remMinutes}
            awake={last.awakeMinutes}
          />

          <DataSourceBadge dataSource={last.dataSource ?? 'estimated'} />

          <View style={st.metricsRow}>
            <MetricCard
              icon="heart.fill"
              label="Yatış BPM"
              value={last.bedtimeBpm ? String(Math.round(last.bedtimeBpm)) : '—'}
              tint="#FF3B30"
            />
            <MetricCard
              icon="heart.text.square.fill"
              label="Sabah BPM"
              value={last.wakeBpm ? String(Math.round(last.wakeBpm)) : '—'}
              tint="#FF6B35"
            />
            <MetricCard
              icon="waveform"
              label="Horlama"
              value={last.snoreCount > 0 ? `${last.snoreCount}×` : 'Yok'}
              tint={last.snoreCount > 5 ? SLEEP.warn : SLEEP.success}
            />
          </View>

          <Tip
            score={last.sleepScore ?? 0}
            deep={last.deepMinutes}
            total={last.totalMinutes ?? 0}
          />
        </>
      )}
    </ScrollView>
  );
}

function ScoreRing({ score, animatedValue }: { score: number; animatedValue: Animated.Value }) {
  const SIZE = 220;
  const STROKE = 16;
  const cx = SIZE / 2;
  const cy = SIZE / 2;
  const r = (SIZE - STROKE) / 2;
  const path = Skia.Path.Make();
  path.addCircle(cx, cy, r);

  return (
    <View style={ringSt.wrap}>
      <Canvas style={{ width: SIZE, height: SIZE }}>
        <Circle
          cx={cx}
          cy={cy}
          r={r}
          style="stroke"
          strokeWidth={STROKE}
          color={SLEEP.accentSoft}
        />
        <Path
          path={path}
          style="stroke"
          strokeWidth={STROKE}
          strokeCap="round"
          start={0}
          end={Math.max(0.001, score / 100)}
          color={SLEEP.accent}
        >
          <SweepGradient c={vec(cx, cy)} colors={[SLEEP.accent, '#7D7BF0', SLEEP.accent]} />
        </Path>
      </Canvas>
      <View style={ringSt.center} pointerEvents="none">
        <Text style={ringSt.score}>{score}</Text>
        <Text style={ringSt.scoreLabel}>UYKU SKORU</Text>
        <Text style={ringSt.scoreQuality}>{qualityLabel(score)}</Text>
      </View>
    </View>
  );
}

function StagesBar({
  light,
  deep,
  rem,
  awake,
}: {
  light: number;
  deep: number;
  rem: number;
  awake: number;
}) {
  const total = Math.max(1, light + deep + rem + awake);
  return (
    <View style={st.stageBar}>
      <View style={[st.stageSeg, { flex: deep / total, backgroundColor: '#0A84FF' }]} />
      <View style={[st.stageSeg, { flex: rem / total, backgroundColor: '#BF5AF2' }]} />
      <View style={[st.stageSeg, { flex: light / total, backgroundColor: SLEEP.accent }]} />
      <View style={[st.stageSeg, { flex: awake / total, backgroundColor: '#FF9F0A' }]} />
    </View>
  );
}

function Stat({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string;
  icon: string;
  color?: string;
}) {
  return (
    <View style={statSt.wrap}>
      <View style={[statSt.iconWrap, { backgroundColor: (color ?? SLEEP.accent) + '15' }]}>
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <SymbolView
          name={icon as any}
          size={16}
          tintColor={color ?? SLEEP.accent}
          fallback={<Text>•</Text>}
        />
      </View>
      <Text style={statSt.value}>{value}</Text>
      <Text style={statSt.label}>{label}</Text>
    </View>
  );
}

function MetricCard({
  icon,
  label,
  value,
  tint,
}: {
  icon: string;
  label: string;
  value: string;
  tint: string;
}) {
  return (
    <View style={mc.wrap}>
      <View style={[mc.iconWrap, { backgroundColor: tint + '15' }]}>
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <SymbolView name={icon as any} size={18} tintColor={tint} fallback={<Text>•</Text>} />
      </View>
      <Text style={mc.value}>{value}</Text>
      <Text style={mc.label}>{label}</Text>
    </View>
  );
}

function Tip({ score, deep, total }: { score: number; deep: number; total: number }) {
  const tip = generateTip(score, deep, total);
  return (
    <View style={tipSt.wrap}>
      <View style={tipSt.iconWrap}>
        <SymbolView name="sparkles" size={18} tintColor={SLEEP.accent} fallback={<Text>✨</Text>} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={tipSt.title}>Asistan</Text>
        <Text style={tipSt.txt}>{tip}</Text>
      </View>
    </View>
  );
}

function EmptyState({ onStart }: { onStart: () => void }) {
  return (
    <View style={emptySt.wrap}>
      <View style={emptySt.iconWrap}>
        <SymbolView
          name="moon.stars.fill"
          size={40}
          tintColor={SLEEP.accent}
          fallback={<Text style={{ fontSize: 36 }}>🌙</Text>}
        />
      </View>
      <Text style={emptySt.title}>İlk uykunu kaydetmeye hazır mısın?</Text>
      <Text style={emptySt.sub}>
        Bu gece "Başlat" sekmesinden uykunu takibe al — sabah burada özetini gör.
      </Text>
      <Pressable
        onPress={onStart}
        style={{
          marginTop: 22,
          backgroundColor: SLEEP.accent,
          borderRadius: 16,
          paddingVertical: 16,
          paddingHorizontal: 32,
          alignItems: 'center',
          minHeight: 52,
        }}
      >
        <Text style={emptySt.btnTxt}>Hemen Başlat</Text>
      </Pressable>
    </View>
  );
}

function DataSourceBadge({ dataSource }: { dataSource: string }) {
  const isWearable = dataSource === 'wearable';
  return (
    <View style={badgeSt.wrap}>
      <View style={[badgeSt.pill, isWearable && { backgroundColor: SLEEP.accentSoft }]}>
        <SymbolView
          name={isWearable ? 'applewatch' : 'sparkles'}
          size={11}
          tintColor={isWearable ? SLEEP.accent : SLEEP.textMuted}
          fallback={<Text style={{ fontSize: 9 }}>•</Text>}
        />
        <Text style={[badgeSt.txt, isWearable && { color: SLEEP.accent }]}>
          {isWearable ? 'Apple Watch ile ölçüldü' : 'Tahmin — telefon sensörü'}
        </Text>
      </View>
    </View>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 5) return 'İyi geceler';
  if (h < 12) return 'Günaydın';
  if (h < 18) return 'İyi günler';
  return 'İyi akşamlar';
}

function formatDate(d: Date) {
  const days = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
  const months = [
    'Ocak',
    'Şubat',
    'Mart',
    'Nisan',
    'Mayıs',
    'Haziran',
    'Temmuz',
    'Ağustos',
    'Eylül',
    'Ekim',
    'Kasım',
    'Aralık',
  ];
  return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]}`;
}

function fmtDuration(min: number | null) {
  if (!min) return '—';
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  return `${h}s ${m}d`;
}

function fmtMinutes(min: number) {
  if (!min || min < 1) return '—';
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  if (h === 0) return `${m}d`;
  return `${h}s ${m}d`;
}

function qualityLabel(score: number) {
  if (score >= 85) return 'Mükemmel';
  if (score >= 70) return 'İyi';
  if (score >= 55) return 'Ortalama';
  if (score >= 40) return 'Düşük';
  return 'Yetersiz';
}

function generateTip(score: number, deep: number, total: number) {
  if (score === 0) return 'Veri toplandıkça kişisel öneriler sunacağım.';
  if (score >= 85) return 'Harika bir gece! Bu rutini koru — yatış saatini sabit tut.';
  if (deep < total * 0.15)
    return 'Derin uykun düşük. Yatmadan 2 saat önce kafein almamayı ve odayı serin tutmayı dene.';
  if (score < 55)
    return 'Bu gece iyi geçmemiş. Mavi ışıktan uzak dur ve yatış saatini 30dk öne çek.';
  return 'Ortalama bir gece. Akşam yürüyüşü ve nefes egzersizi skorunu yükseltebilir.';
}

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: SLEEP.page },
  scroll: { paddingHorizontal: 18 },
  greeting: { fontFamily: font.extrabold, fontSize: 28, color: SLEEP.text, letterSpacing: -0.6 },
  dateTxt: { fontFamily: font.regular, fontSize: 13, color: SLEEP.textMuted, marginTop: 4 },
  activeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 16,
    backgroundColor: SLEEP.accentSoft,
    marginTop: 18,
  },
  activeDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: SLEEP.accent },
  activeTitle: { fontFamily: font.semibold, fontSize: 14, color: SLEEP.accent },
  activeSub: { fontFamily: font.regular, fontSize: 12, color: SLEEP.textMuted, marginTop: 2 },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    paddingHorizontal: 8,
  },
  stageBar: {
    flexDirection: 'row',
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
    marginTop: 20,
    backgroundColor: '#E5E5EA',
  },
  stageSeg: { height: '100%' },
  metricsRow: { flexDirection: 'row', gap: 10, marginTop: 18 },
});

const badgeSt = StyleSheet.create({
  wrap: { alignItems: 'center', marginTop: 12 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: '#F2F2F7',
  },
  txt: { fontFamily: font.medium, fontSize: 11, color: SLEEP.textMuted, letterSpacing: 0.2 },
});

const ringSt = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center', marginTop: 24 },
  center: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  score: { fontFamily: font.extrabold, fontSize: 64, color: SLEEP.text, letterSpacing: -2 },
  scoreLabel: {
    fontFamily: font.semibold,
    fontSize: 11,
    color: SLEEP.textDim,
    letterSpacing: 1.5,
    marginTop: -4,
  },
  scoreQuality: {
    fontFamily: font.bold,
    fontSize: 14,
    color: SLEEP.accent,
    marginTop: 4,
    letterSpacing: -0.2,
  },
});

const statSt = StyleSheet.create({
  wrap: { alignItems: 'center', flex: 1, gap: 6 },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: { fontFamily: font.bold, fontSize: 15, color: SLEEP.text, letterSpacing: -0.3 },
  label: { fontFamily: font.regular, fontSize: 11, color: SLEEP.textDim },
});

const mc = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: SLEEP.card,
    borderRadius: 16,
    padding: 12,
    gap: 8,
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
  },
  value: { fontFamily: font.bold, fontSize: 16, color: SLEEP.text, letterSpacing: -0.3 },
  label: { fontFamily: font.regular, fontSize: 11, color: SLEEP.textDim, textAlign: 'center' },
});

const tipSt = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    gap: 12,
    padding: 14,
    marginTop: 18,
    backgroundColor: SLEEP.card,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: SLEEP.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontFamily: font.bold, fontSize: 13, color: SLEEP.accent, letterSpacing: -0.2 },
  txt: { fontFamily: font.regular, fontSize: 13, color: SLEEP.text, marginTop: 4, lineHeight: 19 },
});

const emptySt = StyleSheet.create({
  wrap: { alignItems: 'center', paddingVertical: 56, paddingHorizontal: 24 },
  iconWrap: {
    width: 84,
    height: 84,
    borderRadius: 24,
    backgroundColor: SLEEP.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  title: {
    fontFamily: font.bold,
    fontSize: 18,
    color: SLEEP.text,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  sub: {
    fontFamily: font.regular,
    fontSize: 13,
    color: SLEEP.textMuted,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 19,
  },
  btnTxt: { fontFamily: font.bold, fontSize: 15, color: '#fff', letterSpacing: -0.2 },
});

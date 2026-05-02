import { useEffect, useRef, useState } from 'react';
import { Alert, Animated, Easing, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@clerk/expo';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { Accelerometer } from 'expo-sensors';
import {
  AudioModule,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioPlayer,
  RecordingPresets,
} from 'expo-audio';
import * as Haptics from 'expo-haptics';
import { SymbolView } from 'expo-symbols';
import {
  useFonts,
  Sora_400Regular,
  Sora_500Medium,
  Sora_600SemiBold,
  Sora_700Bold,
  Sora_800ExtraBold,
} from '@expo-google-fonts/sora';
import { Canvas, Path, Skia, vec, LinearGradient } from '@shopify/react-native-skia';
import { font, SLEEP, API_URL } from './uyku/_components/theme';
import { SLEEP_MUSIC } from './uyku/_components/sleepMusicLibrary';
import AuroraBackground from './uyku/_components/AuroraBackground';
import ChargingCard from './uyku/_components/ChargingCard';

type Stage = 'awake' | 'light' | 'deep' | 'rem';

const FLUSH_INTERVAL_MS = 30_000; // 30s'de bir backend'e batch event gönder
const SAMPLE_INTERVAL_MS = 1000; // 1s'de bir ses + ivme sample
const SNORE_DB_THRESHOLD = -25; // dB üstü → snore candidate
const MOVEMENT_THRESHOLD = 0.08; // accel-delta üstü → movement event
const SNIPPET_ROLL_MS = 10 * 60_000; // 10 dakikalık recording penceresi
const SNIPPET_PEAK_THRESHOLD = -20; // bu dB'in üstüne çıkıyorsa snippet'i sakla

interface BatchedEvent {
  type: 'snore' | 'movement' | 'noise_peak' | 'stage_change';
  timestamp: string;
  value?: number | null;
  stage?: string | null;
  durationSec?: number | null;
}

export default function UykuTakipScreen() {
  const [fontsLoaded] = useFonts({
    Sora_400Regular,
    Sora_500Medium,
    Sora_600SemiBold,
    Sora_700Bold,
    Sora_800ExtraBold,
  });
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { getToken } = useAuth();
  const params = useLocalSearchParams<{
    sessionId: string;
    alarmAt?: string;
    smartAlarm?: string;
    musicTrackId?: string;
    sleepTimerMin?: string;
  }>();

  const [now, setNow] = useState(() => new Date());
  const [currentDb, setCurrentDb] = useState(-60);
  const [currentStage, setCurrentStage] = useState<Stage>('awake');
  const [snoreCount, setSnoreCount] = useState(0);
  const [movementCount, setMovementCount] = useState(0);
  const [recording, setRecording] = useState(false);

  const eventBuffer = useRef<BatchedEvent[]>([]);
  const totals = useRef({
    awake: 0,
    light: 0,
    deep: 0,
    rem: 0,
    snoreSec: 0,
    sumDb: 0,
    dbCount: 0,
    peakDb: -120,
  });
  const stageStartedAt = useRef<Date>(new Date());
  const lastAccel = useRef({ x: 0, y: 0, z: 0 });
  const recorder = useAudioRecorder(RecordingPresets.LOW_QUALITY);

  const selectedTrack = params.musicTrackId
    ? (SLEEP_MUSIC.find((t) => t.id === params.musicTrackId) ?? null)
    : null;
  const player = useAudioPlayer(selectedTrack ? { uri: selectedTrack.uri } : null);
  const sampleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const flushTimerRef = useRef<NodeJS.Timeout | null>(null);
  const clockTimerRef = useRef<NodeJS.Timeout | null>(null);
  const accelSubRef = useRef<{ remove: () => void } | null>(null);
  const alarmFiredRef = useRef(false);
  const snippetTimerRef = useRef<NodeJS.Timeout | null>(null);
  const chunkPeakDbRef = useRef(-120);
  const chunkSnoreSecRef = useRef(0);
  const chunkStartedAtRef = useRef<Date>(new Date());

  // dB ribbon animasyonu
  const dbAnim = useRef(new Animated.Value(0)).current;

  // Sleep music + auto-stop timer
  useEffect(() => {
    if (!selectedTrack || !player) return;
    try {
      player.loop = true;
      player.volume = 0.6;
      player.play();
    } catch {}
    const timerMin = Number(params.sleepTimerMin ?? '0');
    if (timerMin > 0) {
      const stopAt = setTimeout(() => {
        try {
          player.pause();
        } catch {}
      }, timerMin * 60_000);
      return () => clearTimeout(stopAt);
    }
    return () => {
      try {
        player.pause();
      } catch {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTrack?.id]);

  // İlk açılışta: izinler + recording + sensörler + keepAwake
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const status = await AudioModule.requestRecordingPermissionsAsync();
        if (!status.granted) {
          Alert.alert(
            'Mikrofon İzni Gerekli',
            'Uyku takibi için mikrofon erişimi şart. Ayarlardan açabilirsin.',
            [{ text: 'Tamam', onPress: () => router.back() }],
          );
          return;
        }
        await activateKeepAwakeAsync('sleep-tracking');
        await setAudioModeAsync({
          allowsRecording: true,
          playsInSilentMode: true,
          shouldPlayInBackground: true,
          interruptionMode: 'mixWithOthers',
        });
        await recorder.prepareToRecordAsync();
        recorder.record();
        if (!alive) return;
        setRecording(true);

        Accelerometer.setUpdateInterval(SAMPLE_INTERVAL_MS);
        accelSubRef.current = Accelerometer.addListener((data) => {
          const dx = data.x - lastAccel.current.x;
          const dy = data.y - lastAccel.current.y;
          const dz = data.z - lastAccel.current.z;
          const delta = Math.sqrt(dx * dx + dy * dy + dz * dz);
          lastAccel.current = data;
          if (delta > MOVEMENT_THRESHOLD) {
            eventBuffer.current.push({
              type: 'movement',
              timestamp: new Date().toISOString(),
              value: Number(delta.toFixed(3)),
              stage: currentStage,
            });
            setMovementCount((c) => c + 1);
            // Hareket → muhtemelen awake/light
            transitionStage(delta > 0.25 ? 'awake' : 'light');
          }
        });

        // Sample timer — dB metering + stage transitions
        sampleTimerRef.current = setInterval(() => {
          (() => {
            const s = recorder.getStatus() as unknown as { metering?: number };
            const db = s.metering ?? -60;
            setCurrentDb(db);
            totals.current.sumDb += db;
            totals.current.dbCount += 1;
            if (db > totals.current.peakDb) totals.current.peakDb = db;
            if (db > chunkPeakDbRef.current) chunkPeakDbRef.current = db;
            Animated.timing(dbAnim, {
              toValue: Math.max(0, Math.min(1, (db + 60) / 60)),
              duration: 600,
              useNativeDriver: false,
              easing: Easing.bezier(0.22, 1, 0.36, 1),
            }).start();

            if (db > SNORE_DB_THRESHOLD) {
              eventBuffer.current.push({
                type: 'snore',
                timestamp: new Date().toISOString(),
                value: Number(db.toFixed(1)),
                stage: currentStage,
                durationSec: 1,
              });
              setSnoreCount((c) => c + 1);
              totals.current.snoreSec += 1;
              chunkSnoreSecRef.current += 1;
            }
          })();

          // Pasif evre tahmini: hareketsiz ve sessizse light → deep ilerlet
          // (gerçek post-process sabah hesaplanır)
          accumulateStage();

          // Smart alarm tetikleme
          maybeFireAlarm();
        }, SAMPLE_INTERVAL_MS);

        flushTimerRef.current = setInterval(flushEvents, FLUSH_INTERVAL_MS);
        clockTimerRef.current = setInterval(() => setNow(new Date()), 30_000);
        chunkStartedAtRef.current = new Date();
        snippetTimerRef.current = setInterval(rotateSnippet, SNIPPET_ROLL_MS);
      } catch (e) {
        console.error('[uyku-takip] init', e);
      }
    })();

    return () => {
      alive = false;
      if (sampleTimerRef.current) clearInterval(sampleTimerRef.current);
      if (flushTimerRef.current) clearInterval(flushTimerRef.current);
      if (clockTimerRef.current) clearInterval(clockTimerRef.current);
      if (snippetTimerRef.current) clearInterval(snippetTimerRef.current);
      accelSubRef.current?.remove();
      try {
        recorder.stop();
      } catch {}
      deactivateKeepAwake('sleep-tracking');
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const accumulateStage = () => {
    const sec = SAMPLE_INTERVAL_MS / 1000;
    totals.current[currentStage] += sec;
    // 90 dakikalık uyku döngüsü tahmini (gerçek wearable yoksa görsel feedback için)
    // Awake → Light → Deep → REM döngüsü
    const elapsed = (Date.now() - stageStartedAt.current.getTime()) / 1000;
    if (currentStage === 'awake') {
      if (elapsed > 300) transitionStage('light');
    } else if (currentStage === 'light') {
      if (elapsed > 1200) transitionStage('deep'); // 20dk light sonrası deep
    } else if (currentStage === 'deep') {
      if (elapsed > 1800) transitionStage('rem'); // 30dk deep sonrası REM
    } else if (currentStage === 'rem') {
      if (elapsed > 900) transitionStage('light'); // 15dk REM sonrası tekrar light
    }
  };

  const transitionStage = (next: Stage) => {
    if (next === currentStage) return;
    eventBuffer.current.push({
      type: 'stage_change',
      timestamp: new Date().toISOString(),
      stage: next,
    });
    stageStartedAt.current = new Date();
    setCurrentStage(next);
  };

  const flushEvents = async () => {
    if (!eventBuffer.current.length) return;
    const batch = eventBuffer.current.splice(0, eventBuffer.current.length);
    try {
      const token = await getToken();
      await fetch(`${API_URL}/api/tracking/sleep/sessions/${params.sessionId}/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ events: batch }),
      });
    } catch (e) {
      console.error('[flushEvents]', e);
      eventBuffer.current.unshift(...batch);
    }
  };

  /**
   * 10 dakikalık recording chunk'ı durdur, peak dB > threshold ise upload et,
   * yeni recording başlat. Snippet sadece "kanıtlı gürültü" varsa saklanır.
   */
  const rotateSnippet = async () => {
    const peakDb = chunkPeakDbRef.current;
    const snoreSec = chunkSnoreSecRef.current;
    const startedAt = chunkStartedAtRef.current;
    const durationSec = Math.round((Date.now() - startedAt.getTime()) / 1000);

    // Reset chunk counters
    chunkPeakDbRef.current = -120;
    chunkSnoreSecRef.current = 0;
    chunkStartedAtRef.current = new Date();

    try {
      await recorder.stop();
    } catch {}

    let recordingUri: string | null = null;
    try {
      const status = recorder.getStatus() as unknown as { url?: string; uri?: string };
      recordingUri = status.url ?? status.uri ?? null;
    } catch {}

    // Peak yüksekse → upload, sonra dosyayı temizle
    const shouldKeep = peakDb >= SNIPPET_PEAK_THRESHOLD && snoreSec >= 5 && recordingUri;
    if (shouldKeep && recordingUri) {
      uploadSnippet(recordingUri, durationSec, peakDb, startedAt).catch((e) =>
        console.error('[snippet upload]', e),
      );
    } else if (recordingUri) {
      // Sıkıştırılmış chunk'ı sil — disk şişirme yok
      FileSystem.deleteAsync(recordingUri, { idempotent: true }).catch(() => {});
    }

    // Yeni recording başlat
    try {
      await recorder.prepareToRecordAsync();
      recorder.record();
    } catch (e) {
      console.error('[recorder restart]', e);
    }
  };

  const uploadSnippet = async (
    uri: string,
    durationSec: number,
    peakDb: number,
    recordedAt: Date,
  ) => {
    const token = await getToken();
    const filename = uri.split('/').pop() ?? 'snippet.m4a';
    const ext = filename.split('.').pop() ?? 'm4a';

    // 1. Storage upload
    const form = new FormData();
    form.append('file', {
      uri: Platform.OS === 'ios' ? uri.replace('file://', '') : uri,
      name: `snippet-${Date.now()}.${ext}`,
      type: `audio/${ext}`,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);
    form.append('sessionId', params.sessionId as string);

    const uploadRes = await fetch(`${API_URL}/api/tracking/sleep/upload-snippet`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    });

    if (!uploadRes.ok) {
      console.error('[snippet] upload failed', await uploadRes.text());
      FileSystem.deleteAsync(uri, { idempotent: true }).catch(() => {});
      return;
    }

    const { url } = await uploadRes.json();

    // 2. Snippet metadata kaydet
    await fetch(`${API_URL}/api/tracking/sleep/sessions/${params.sessionId}/snippets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        fileUrl: url,
        durationSec,
        peakDb,
        recordedAt: recordedAt.toISOString(),
        category: 'snore',
      }),
    });

    // Local dosyayı temizle
    FileSystem.deleteAsync(uri, { idempotent: true }).catch(() => {});
  };

  const maybeFireAlarm = () => {
    if (alarmFiredRef.current || !params.alarmAt) return;
    const target = new Date(params.alarmAt);
    const smart = params.smartAlarm === '1';
    const ms = target.getTime() - Date.now();
    // Smart: 30dk pencerede light evredeyse erken uyandır
    if (smart && ms > 0 && ms <= 30 * 60_000 && currentStage === 'light') {
      alarmFiredRef.current = true;
      fireAlarm();
    } else if (ms <= 0) {
      alarmFiredRef.current = true;
      fireAlarm();
    }
  };

  const fireAlarm = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert('Günaydın', 'Alarmın çalıyor — uyandın mı?', [
      {
        text: '5 dk Ertele',
        onPress: () => {
          alarmFiredRef.current = false;
        },
      },
      { text: 'Uyandım', style: 'default', onPress: stopSession },
    ]);
  };

  const stopSession = async () => {
    if (sampleTimerRef.current) clearInterval(sampleTimerRef.current);
    if (flushTimerRef.current) clearInterval(flushTimerRef.current);
    if (clockTimerRef.current) clearInterval(clockTimerRef.current);
    if (snippetTimerRef.current) clearInterval(snippetTimerRef.current);

    // Son chunk'ı değerlendir (yeni chunk başlatmadan)
    const peakDb = chunkPeakDbRef.current;
    const snoreSec = chunkSnoreSecRef.current;
    const startedAt = chunkStartedAtRef.current;
    const durationSec = Math.round((Date.now() - startedAt.getTime()) / 1000);
    try {
      await recorder.stop();
    } catch {}
    let lastUri: string | null = null;
    try {
      const status = recorder.getStatus() as unknown as { url?: string; uri?: string };
      lastUri = status.url ?? status.uri ?? null;
    } catch {}
    if (lastUri && peakDb >= SNIPPET_PEAK_THRESHOLD && snoreSec >= 5) {
      uploadSnippet(lastUri, durationSec, peakDb, startedAt).catch((e) =>
        console.error('[final snippet]', e),
      );
    } else if (lastUri) {
      FileSystem.deleteAsync(lastUri, { idempotent: true }).catch(() => {});
    }

    try {
      player?.pause();
    } catch {}
    await flushEvents();

    const t = totals.current;
    try {
      const token = await getToken();
      await fetch(`${API_URL}/api/tracking/sleep/sessions/${params.sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          action: 'end',
          actualAlarmAt: new Date().toISOString(),
          awakeMinutes: t.awake / 60,
          lightMinutes: t.light / 60,
          deepMinutes: t.deep / 60,
          remMinutes: t.rem / 60,
          snoreCount,
          snoreMinutes: t.snoreSec / 60,
          movementCount,
          avgDb: t.dbCount > 0 ? t.sumDb / t.dbCount : null,
          peakDb: t.peakDb > -120 ? t.peakDb : null,
        }),
      });
    } catch (e) {
      console.error('[stopSession]', e);
    }
    deactivateKeepAwake('sleep-tracking');
    router.replace('/(app)/tracking/uyku');
  };

  const cancelSession = () => {
    Alert.alert('Uykuyu Bitir', 'Bu oturumu iptal etmek istiyor musun? Veri kaydedilmez.', [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'İptal Et',
        style: 'destructive',
        onPress: async () => {
          if (sampleTimerRef.current) clearInterval(sampleTimerRef.current);
          if (flushTimerRef.current) clearInterval(flushTimerRef.current);
          if (clockTimerRef.current) clearInterval(clockTimerRef.current);
          if (snippetTimerRef.current) clearInterval(snippetTimerRef.current);
          try {
            await recorder.stop();
          } catch {}
          // İptal'de chunk'ı sakla — sil
          try {
            const status = recorder.getStatus() as unknown as { url?: string; uri?: string };
            const uri = status.url ?? status.uri;
            if (uri) FileSystem.deleteAsync(uri, { idempotent: true }).catch(() => {});
          } catch {}
          try {
            player?.pause();
          } catch {}
          try {
            const token = await getToken();
            await fetch(`${API_URL}/api/tracking/sleep/sessions/${params.sessionId}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
              body: JSON.stringify({ action: 'cancel' }),
            });
          } catch {}
          deactivateKeepAwake('sleep-tracking');
          router.replace('/(app)/tracking/uyku');
        },
      },
    ]);
  };

  if (!fontsLoaded) return <View style={st.root} />;

  const hh = pad(now.getHours());
  const mm = pad(now.getMinutes());

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[st.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <AuroraBackground />

        <View style={st.center}>
          <Text style={st.greeting}>İyi uykular</Text>
          <Text style={st.clock}>
            {hh}:{mm}
          </Text>
          <Text style={st.stageTxt}>{stageLabel(currentStage)}</Text>

          <View style={st.chargingWrap}>
            <ChargingCard />
          </View>

          <View style={st.dbWrap}>
            <DbRibbon anim={dbAnim} />
            <Text style={st.dbTxt}>{Math.round(currentDb)} dB</Text>
          </View>

          <View style={st.statsRow}>
            <Stat label="Horlama" value={String(snoreCount)} icon="waveform" />
            <View style={st.statDivider} />
            <Stat label="Hareket" value={String(movementCount)} icon="figure.walk" />
            <View style={st.statDivider} />
            <Stat label="Kayıt" value={recording ? 'Açık' : 'Kapalı'} icon="mic.fill" />
          </View>
        </View>

        <View style={st.bottom}>
          <Pressable
            onPress={() => {
              Alert.alert('Uyandın mı?', 'Uyku oturumunu tamamlamak için onayla.', [
                { text: 'Devam Et', style: 'cancel' },
                { text: 'Uyandım, Bitir', style: 'default', onPress: stopSession },
              ]);
            }}
            style={{
              backgroundColor: 'rgba(255,255,255,0.12)',
              borderRadius: 16,
              paddingVertical: 14,
              paddingHorizontal: 32,
              alignItems: 'center',
              minHeight: 50,
            }}
          >
            <Text style={st.cancelTxt}>Uyandım</Text>
          </Pressable>
          <Pressable
            onPress={cancelSession}
            hitSlop={12}
            style={{ marginTop: 14, paddingVertical: 4 }}
          >
            <Text style={st.discardTxt}>Oturumu iptal et</Text>
          </Pressable>
        </View>
      </View>
    </>
  );
}

function DbRibbon({ anim }: { anim: Animated.Value }) {
  // Skia gradient ribbon — dB seviyesine göre dolan bar
  const W = 240;
  const H = 6;
  const path = Skia.Path.Make();
  path.addRRect({ rect: { x: 0, y: 0, width: W, height: H }, rx: 3, ry: 3 });
  return (
    <View
      style={{
        width: W,
        height: H,
        overflow: 'hidden',
        borderRadius: 3,
        backgroundColor: 'rgba(255,255,255,0.08)',
      }}
    >
      <Animated.View
        style={{
          width: anim.interpolate({ inputRange: [0, 1], outputRange: [0, W] }),
          height: H,
        }}
      >
        <Canvas style={{ width: W, height: H }}>
          <Path path={path}>
            <LinearGradient
              start={vec(0, 0)}
              end={vec(W, 0)}
              colors={['#5E5CE6', '#7D7BF0', '#A8A6FF']}
            />
          </Path>
        </Canvas>
      </Animated.View>
    </View>
  );
}

function Stat({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <View style={statSt.wrap}>
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <SymbolView
        name={icon as any}
        size={16}
        tintColor="rgba(255,255,255,0.55)"
        fallback={<Text style={{ color: 'rgba(255,255,255,0.55)' }}>•</Text>}
      />
      <Text style={statSt.value}>{value}</Text>
      <Text style={statSt.label}>{label}</Text>
    </View>
  );
}

function pad(n: number) {
  return String(n).padStart(2, '0');
}
function stageLabel(s: Stage) {
  return ({ awake: 'Uyanık', light: 'Hafif uyku', deep: 'Derin uyku', rem: 'REM' } as const)[s];
}

const st = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: SLEEP.night,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  greeting: {
    fontFamily: font.medium,
    fontSize: 14,
    color: 'rgba(255,255,255,0.55)',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  clock: {
    fontFamily: font.extrabold,
    fontSize: 88,
    color: '#fff',
    letterSpacing: -3,
    lineHeight: 96,
  },
  stageTxt: {
    fontFamily: font.semibold,
    fontSize: 14,
    color: SLEEP.accent,
    marginTop: 4,
    letterSpacing: 0.4,
  },
  chargingWrap: { alignSelf: 'stretch', marginTop: 24, marginHorizontal: -24 },
  dbWrap: { marginTop: 28, alignItems: 'center', gap: 10 },
  dbTxt: {
    fontFamily: font.regular,
    fontSize: 11,
    color: 'rgba(255,255,255,0.45)',
    letterSpacing: 1,
  },
  statsRow: { flexDirection: 'row', alignItems: 'center', marginTop: 48, paddingHorizontal: 24 },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginHorizontal: 18,
  },
  bottom: { width: '100%', alignItems: 'center', paddingBottom: 32 },
  cancelTxt: {
    fontFamily: font.semibold,
    fontSize: 15,
    color: 'rgba(255,255,255,0.95)',
    letterSpacing: -0.2,
  },
  discardTxt: {
    fontFamily: font.regular,
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: 0.2,
  },
});

const statSt = StyleSheet.create({
  wrap: { alignItems: 'center', gap: 4, minWidth: 64 },
  value: { fontFamily: font.bold, fontSize: 18, color: '#fff', letterSpacing: -0.4 },
  label: {
    fontFamily: font.regular,
    fontSize: 11,
    color: 'rgba(255,255,255,0.45)',
    letterSpacing: 0.3,
  },
});

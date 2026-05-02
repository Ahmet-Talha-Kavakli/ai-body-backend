import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Canvas, Circle, SweepGradient, vec, Path, Skia } from '@shopify/react-native-skia';
import * as Haptics from 'expo-haptics';
import { SymbolView } from 'expo-symbols';
import {
  cancelAnimation,
  Easing as REasing,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { font, SLEEP } from './theme';
import { brightnessFromBase64, computePPG, liveBpm } from './ppgAlgorithm';

const RING_SIZE = 240;
const RING_STROKE = 14;
const DURATION_MS = 20_000; // 20s ölçüm
const SAMPLE_HZ = 8; // 8 frame/s — takePictureAsync limit
const SAMPLE_INTERVAL_MS = 1000 / SAMPLE_HZ;

type Phase = 'idle' | 'measuring' | 'done' | 'error' | 'no_finger';

export interface PPGResult {
  bpm: number;
  hrv: number;
}

export default function PPGMeasure({
  label,
  onComplete,
  onSkip,
}: {
  label: 'bedtime' | 'wake';
  onComplete: (result: PPGResult) => void;
  onSkip?: () => void;
}) {
  const [permission, requestPermission] = useCameraPermissions();
  const [phase, setPhase] = useState<Phase>('idle');
  const [bpm, setBpm] = useState(0);
  const [cameraReady, setCameraReady] = useState(false);

  const cameraRef = useRef<CameraView | null>(null);
  const samplesRef = useRef<number[]>([]);
  const startTimeRef = useRef(0);
  const captureLoopRef = useRef<NodeJS.Timeout | null>(null);
  const finishTimerRef = useRef<NodeJS.Timeout | null>(null);
  const noFingerCountRef = useRef(0);

  // Reanimated — UI thread'de ring çizimi (akıcı)
  const progress = useSharedValue(0);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const bpmAnim = useRef(new Animated.Value(0)).current;
  const [bpmShown, setBpmShown] = useState(0);

  useEffect(() => {
    const id = bpmAnim.addListener(({ value }) => setBpmShown(Math.round(value)));
    return () => bpmAnim.removeListener(id);
  }, []);

  // Pulsing while measuring
  useEffect(() => {
    if (phase !== 'measuring') return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.06,
          duration: 600,
          useNativeDriver: true,
          easing: Easing.bezier(0.22, 1, 0.36, 1),
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
          easing: Easing.bezier(0.22, 1, 0.36, 1),
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [phase]);

  const captureFrame = async () => {
    if (!cameraRef.current) return;
    try {
      const pic = await cameraRef.current.takePictureAsync({
        quality: 0.01,
        base64: true,
        skipProcessing: true,
        shutterSound: false,
        exif: false,
      });
      if (!pic?.base64) return;
      const b = brightnessFromBase64(pic.base64);
      samplesRef.current.push(b);

      // Parmak kontrol — brightness çok düşük (parmak yok) ya da çok yüksek (sadece flash) ise uyar
      if (samplesRef.current.length >= SAMPLE_HZ * 3) {
        const recent = samplesRef.current.slice(-SAMPLE_HZ * 3);
        const mean = recent.reduce((a, c) => a + c, 0) / recent.length;
        const variance = recent.reduce((s, v) => s + (v - mean) * (v - mean), 0) / recent.length;

        // Parmak yoksa: sinyalde ya periyodik salınım yok (variance düşük) ya da yansıma çok parlak
        // Brightness charCode'ları ~64-95 aralığında değişir; parmak yokken çok yüksek veya çok düşük olur
        const noFinger = mean < 55 || mean > 85 || variance < 0.4;
        if (noFinger) {
          noFingerCountRef.current++;
          if (noFingerCountRef.current > SAMPLE_HZ * 3) {
            // 3 saniyedir parmak görmüyoruz
            setPhase('no_finger');
          }
        } else {
          noFingerCountRef.current = 0;
          if (phase === 'no_finger') setPhase('measuring');
        }
      }

      // Live BPM güncellemesi (5+ saniye sonra)
      if (samplesRef.current.length >= SAMPLE_HZ * 5) {
        const live = liveBpm(samplesRef.current, SAMPLE_HZ);
        if (live > 0) {
          Animated.timing(bpmAnim, {
            toValue: live,
            duration: 800,
            useNativeDriver: false,
            easing: Easing.bezier(0.22, 1, 0.36, 1),
          }).start();
        }
      }
    } catch (e) {
      // takePictureAsync hata verebilir (busy), sessizce geç
    }
  };

  const startMeasure = async () => {
    if (!permission?.granted) {
      const r = await requestPermission();
      if (!r.granted) {
        setPhase('error');
        return;
      }
    }
    setPhase('measuring');
    samplesRef.current = [];
    noFingerCountRef.current = 0;
    startTimeRef.current = Date.now();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Reanimated UI-thread ring fill — saatçilik gibi akıcı
    progress.value = 0;
    progress.value = withTiming(1, { duration: DURATION_MS, easing: REasing.linear });

    // Frame capture loop — ~8fps
    captureLoopRef.current = setInterval(captureFrame, SAMPLE_INTERVAL_MS);

    // Bitiş zamanlayıcısı (tek timer, JS'te)
    finishTimerRef.current = setTimeout(() => {
      if (captureLoopRef.current) clearInterval(captureLoopRef.current);
      finish();
    }, DURATION_MS);
  };

  const finish = () => {
    const result = computePPG(samplesRef.current, SAMPLE_HZ);
    if (result.bpm === 0 || result.confidence < 0.3) {
      // Yetersiz sinyal
      setPhase('no_finger');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }
    setPhase('done');
    setBpm(result.bpm);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTimeout(() => {
      onComplete({ bpm: result.bpm, hrv: result.hrv });
    }, 1400);
  };

  const cancel = () => {
    if (finishTimerRef.current) clearTimeout(finishTimerRef.current);
    if (captureLoopRef.current) clearInterval(captureLoopRef.current);
    cancelAnimation(progress);
    progress.value = 0;
    setPhase('idle');
    setBpmShown(0);
    bpmAnim.setValue(0);
  };

  const retry = () => {
    cancel();
    setTimeout(() => startMeasure(), 200);
  };

  useEffect(() => {
    return () => {
      if (finishTimerRef.current) clearTimeout(finishTimerRef.current);
      if (captureLoopRef.current) clearInterval(captureLoopRef.current);
      cancelAnimation(progress);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const headline =
    label === 'bedtime' ? 'Uyumadan önce nabzını ölçelim' : 'Günaydın! Sabah nabzını ölçelim';

  let subline =
    'Parmağını arka kameraya ve flaşa bastır, çizgili daire dolana kadar tutmaya devam et.';
  if (phase === 'measuring') subline = 'Parmağını çekme. Sakin nefes al.';
  if (phase === 'no_finger')
    subline = 'Parmağını kameraya ve flaşa tam yerleştir, sıkma. Tekrar dene.';
  if (phase === 'done') subline = 'Tamam — kayıt edildi.';

  const cx = RING_SIZE / 2;
  const cy = RING_SIZE / 2;
  const radius = (RING_SIZE - RING_STROKE) / 2;
  const arc = Skia.Path.Make();
  arc.addCircle(cx, cy, radius);

  return (
    <View style={st.root}>
      <Text style={st.title}>{headline}</Text>
      <Text style={st.sub}>{subline}</Text>

      <Animated.View style={[st.ringWrap, { transform: [{ scale: pulseAnim }] }]}>
        {/* Camera (gizli ama aktif — flaş için) */}
        {(phase === 'measuring' || phase === 'no_finger') && permission?.granted && (
          <View style={st.cameraHidden} pointerEvents="none">
            <CameraView
              ref={(r) => {
                cameraRef.current = r;
              }}
              style={{ flex: 1 }}
              facing="back"
              enableTorch
              flash="on"
              onCameraReady={() => setCameraReady(true)}
              animateShutter={false}
            />
          </View>
        )}

        <Canvas style={{ width: RING_SIZE, height: RING_SIZE }}>
          <Circle
            cx={cx}
            cy={cy}
            r={radius}
            style="stroke"
            strokeWidth={RING_STROKE}
            color={SLEEP.accentSoft}
          />
          <Path
            path={arc}
            style="stroke"
            strokeWidth={RING_STROKE}
            strokeCap="round"
            start={0}
            end={progress}
            color={SLEEP.accent}
          >
            <SweepGradient
              c={vec(cx, cy)}
              colors={[SLEEP.accent, SLEEP.accentDark, SLEEP.accent]}
            />
          </Path>
        </Canvas>

        <View style={st.ringCenter} pointerEvents="none">
          {phase === 'idle' && (
            <>
              <SymbolView
                name="hand.point.up.left.fill"
                size={48}
                tintColor={SLEEP.accent}
                fallback={<Text style={st.bigEmoji}>☝️</Text>}
              />
              <Text style={st.idleHint}>Başlamak için dokun</Text>
            </>
          )}
          {phase === 'measuring' && (
            <>
              <Animated.Text style={st.bpm}>{bpmShown || '—'}</Animated.Text>
              <Text style={st.bpmUnit}>BPM</Text>
              {!cameraReady && <Text style={st.cameraInit}>Kamera hazırlanıyor…</Text>}
            </>
          )}
          {phase === 'no_finger' && (
            <>
              <SymbolView
                name="exclamationmark.triangle.fill"
                size={48}
                tintColor={SLEEP.warn}
                fallback={<Text style={st.bigEmoji}>⚠️</Text>}
              />
              <Text style={st.warnTxt}>Parmak algılanmadı</Text>
            </>
          )}
          {phase === 'done' && (
            <>
              <SymbolView
                name="checkmark.circle.fill"
                size={56}
                tintColor={SLEEP.success}
                fallback={<Text style={st.bigEmoji}>✓</Text>}
              />
              <Text style={st.bpm}>{bpm}</Text>
              <Text style={st.bpmUnit}>BPM</Text>
            </>
          )}
          {phase === 'error' && (
            <>
              <SymbolView
                name="xmark.circle.fill"
                size={48}
                tintColor={SLEEP.danger}
                fallback={<Text style={st.bigEmoji}>✕</Text>}
              />
              <Text style={st.errorTxt}>Kamera izni gerekli</Text>
            </>
          )}
        </View>
      </Animated.View>

      {/* Aksiyon */}
      {phase === 'idle' && (
        <Pressable
          onPress={startMeasure}
          style={{
            marginTop: 32,
            backgroundColor: SLEEP.accent,
            borderRadius: 16,
            paddingVertical: 18,
            paddingHorizontal: 48,
            alignItems: 'center',
            minHeight: 56,
          }}
        >
          <Text style={st.btnTxt}>Ölçümü Başlat</Text>
        </Pressable>
      )}

      {phase === 'measuring' && (
        <Pressable onPress={cancel} style={st.cancelBtn} hitSlop={12}>
          <Text style={st.cancelTxt}>İptal</Text>
        </Pressable>
      )}

      {phase === 'no_finger' && (
        <View style={{ flexDirection: 'row', gap: 12, marginTop: 24 }}>
          <Pressable
            onPress={cancel}
            style={{
              backgroundColor: '#E5E5EA',
              borderRadius: 16,
              paddingVertical: 14,
              paddingHorizontal: 28,
              minHeight: 50,
              alignItems: 'center',
            }}
          >
            <Text style={st.cancelTxt}>İptal</Text>
          </Pressable>
          <Pressable
            onPress={retry}
            style={{
              backgroundColor: SLEEP.accent,
              borderRadius: 16,
              paddingVertical: 14,
              paddingHorizontal: 28,
              minHeight: 50,
              alignItems: 'center',
            }}
          >
            <Text style={st.btnTxt}>Tekrar Dene</Text>
          </Pressable>
        </View>
      )}

      {phase === 'error' && (
        <Pressable
          onPress={requestPermission}
          style={{
            marginTop: 24,
            backgroundColor: SLEEP.accent,
            borderRadius: 16,
            paddingVertical: 16,
            paddingHorizontal: 36,
            minHeight: 52,
            alignItems: 'center',
          }}
        >
          <Text style={st.btnTxt}>İzin Ver</Text>
        </Pressable>
      )}

      {onSkip && (phase === 'idle' || phase === 'no_finger') && (
        <Pressable onPress={onSkip} hitSlop={12} style={{ marginTop: 14 }}>
          <Text style={st.skipTxt}>Bu kez atla</Text>
        </Pressable>
      )}
    </View>
  );
}

const st = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 40,
    paddingHorizontal: 28,
    backgroundColor: SLEEP.page,
  },
  title: {
    fontFamily: font.bold,
    fontSize: 22,
    color: SLEEP.text,
    textAlign: 'center',
    letterSpacing: -0.4,
  },
  sub: {
    fontFamily: font.regular,
    fontSize: 14,
    color: SLEEP.textMuted,
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 20,
    paddingHorizontal: 8,
  },
  ringWrap: {
    width: RING_SIZE,
    height: RING_SIZE,
    marginTop: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringCenter: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  cameraHidden: { position: 'absolute', width: 1, height: 1, opacity: 0, top: -10, left: -10 },
  bpm: { fontFamily: font.extrabold, fontSize: 56, color: SLEEP.text, letterSpacing: -2 },
  bpmUnit: {
    fontFamily: font.semibold,
    fontSize: 13,
    color: SLEEP.textDim,
    marginTop: -4,
    letterSpacing: 1.5,
  },
  cameraInit: { fontFamily: font.regular, fontSize: 11, color: SLEEP.textDim, marginTop: 4 },
  bigEmoji: { fontSize: 48 },
  idleHint: { fontFamily: font.semibold, fontSize: 13, color: SLEEP.textMuted, marginTop: 8 },
  warnTxt: {
    fontFamily: font.semibold,
    fontSize: 14,
    color: SLEEP.warn,
    marginTop: 8,
    textAlign: 'center',
  },
  errorTxt: { fontFamily: font.semibold, fontSize: 14, color: SLEEP.danger, marginTop: 8 },
  btnTxt: { fontFamily: font.semibold, fontSize: 16, color: '#fff', letterSpacing: -0.2 },
  cancelBtn: { marginTop: 28, paddingVertical: 12, paddingHorizontal: 24 },
  cancelTxt: { fontFamily: font.semibold, fontSize: 15, color: SLEEP.textMuted },
  skipTxt: { fontFamily: font.medium, fontSize: 13, color: SLEEP.textDim },
});

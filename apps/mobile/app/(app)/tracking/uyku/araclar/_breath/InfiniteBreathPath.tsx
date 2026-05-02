import { useEffect } from 'react';
import { Dimensions, View } from 'react-native';
import { Canvas, Path, Skia, vec, LinearGradient, Group, Circle } from '@shopify/react-native-skia';
import {
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
  useDerivedValue,
  cancelAnimation,
  type SharedValue,
} from 'react-native-reanimated';
import { BreathPattern, getCycleSec } from './patterns';

const { width: W } = Dimensions.get('window');
const HEIGHT = 320;
const BALL_X = W / 2;
const PEAK_AMPLITUDE = 90; // tepe yüksekliği (px)
const BASE_Y = HEIGHT / 2 + 60; // path'in alt çizgi referansı

/**
 * Path: sinüs benzeri sonsuz dağ. cycleProgress 0..1 = bir nefes döngüsü.
 * Top ekran ortasında sabit kalır, path sürekli sola akar.
 *
 * Top'un Y'si: progress'e göre sinüs eğrisi
 *   progress 0     → Y = BASE_Y (alt)
 *   progress 0.25  → Y = BASE_Y - PEAK_AMPLITUDE (tepe — inhale tamam)
 *   progress 0.5   → Y = BASE_Y (alt — hold)
 *   progress 0.75  → Y = BASE_Y + 30 (vadi — exhale tamam, biraz aşağı)
 *   progress 1     → BASE_Y (alt)
 *
 * Aslında: pattern'e göre phase noktaları farklı yerlerde:
 *   inhale: BASE_Y → tepe
 *   hold1: tepe sabit
 *   exhale: tepe → vadi
 *   hold2: vadi sabit
 */

export default function InfiniteBreathPath({
  pattern,
  paused,
  cycleProgress,
}: {
  pattern: BreathPattern;
  paused: boolean;
  cycleProgress: SharedValue<number>;
}) {
  const cycleSec = getCycleSec(pattern);

  useEffect(() => {
    if (paused) {
      cancelAnimation(cycleProgress);
      return;
    }
    // Mevcut değerden 1'e tamamla, sonra sürekli loop
    const remaining = 1 - cycleProgress.value;
    cycleProgress.value = withTiming(
      1,
      { duration: remaining * cycleSec * 1000, easing: Easing.linear },
      (finished) => {
        if (!finished) return;
        cycleProgress.value = 0;
        cycleProgress.value = withRepeat(
          withTiming(1, { duration: cycleSec * 1000, easing: Easing.linear }),
          -1,
          false,
        );
      },
    );
    return () => cancelAnimation(cycleProgress);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused, cycleSec]);

  // Y koordinatı: cycleProgress + pattern'e göre sine-benzeri eğri
  const ballY = useDerivedValue(() => {
    'worklet';
    const t = cycleProgress.value;
    const p = pattern;
    const total = p.inhale + p.hold1 + p.exhale + p.hold2;
    if (total === 0) return BASE_Y;

    const tInhale = p.inhale / total;
    const tHold1 = (p.inhale + p.hold1) / total;
    const tExhale = (p.inhale + p.hold1 + p.exhale) / total;

    if (t < tInhale) {
      // Inhale: BASE_Y → tepe
      const localT = t / tInhale;
      const eased = 0.5 - 0.5 * Math.cos(localT * Math.PI);
      return BASE_Y - eased * PEAK_AMPLITUDE;
    } else if (t < tHold1) {
      return BASE_Y - PEAK_AMPLITUDE;
    } else if (t < tExhale) {
      // Exhale: tepe → BASE_Y (vadi yok)
      const localT = (t - tHold1) / Math.max(0.001, tExhale - tHold1);
      const eased = 0.5 - 0.5 * Math.cos(localT * Math.PI);
      return BASE_Y - PEAK_AMPLITUDE + eased * PEAK_AMPLITUDE;
    } else {
      // Hold2: BASE_Y düz
      return BASE_Y;
    }
  });

  // Top scale: inhale'de büyür, exhale'de küçülür
  const ballScale = useDerivedValue(() => {
    'worklet';
    const t = cycleProgress.value;
    const p = pattern;
    const total = p.inhale + p.hold1 + p.exhale + p.hold2;
    if (total === 0) return 1;

    const tInhale = p.inhale / total;
    const tHold1 = (p.inhale + p.hold1) / total;
    const tExhale = (p.inhale + p.hold1 + p.exhale) / total;

    if (t < tInhale) {
      const localT = t / tInhale;
      const eased = 0.5 - 0.5 * Math.cos(localT * Math.PI);
      return 0.85 + eased * 0.4; // 0.85 → 1.25
    } else if (t < tHold1) {
      return 1.25;
    } else if (t < tExhale) {
      const localT = (t - tHold1) / Math.max(0.001, tExhale - tHold1);
      const eased = 0.5 - 0.5 * Math.cos(localT * Math.PI);
      return 1.25 - eased * 0.4; // 1.25 → 0.85
    } else {
      return 0.85;
    }
  });

  // Top'un dolu kısmı (içindeki mavi su seviyesi) — 0..1
  const fillRatio = useDerivedValue(() => {
    'worklet';
    const t = cycleProgress.value;
    const p = pattern;
    const total = p.inhale + p.hold1 + p.exhale + p.hold2;
    if (total === 0) return 0;

    const tInhale = p.inhale / total;
    const tHold1 = (p.inhale + p.hold1) / total;
    const tExhale = (p.inhale + p.hold1 + p.exhale) / total;

    if (t < tInhale) return t / tInhale;
    if (t < tHold1) return 1;
    if (t < tExhale) return 1 - (t - tHold1) / Math.max(0.001, tExhale - tHold1);
    return 0;
  });

  // Path geriye doğru ofset — pattern'in ilerisini ve gerisini gösterir
  // Top ortada sabit, 3 cycle'lık path çiziyoruz, ofset cycleProgress'e bağlı
  const pathOffsetX = useDerivedValue(() => {
    'worklet';
    return -cycleProgress.value * (W * 0.8);
  });

  // Skia path'i (sabit, ofset Group transform ile yapılır)
  // 3 cycle yan yana: -1, 0, +1, +2 cycle
  const path = makeBreathPath(pattern, W * 0.8);

  // Group transform için derived array
  const groupTransform = useDerivedValue(() => {
    'worklet';
    return [{ translateX: pathOffsetX.value }];
  });

  return (
    <View style={{ width: W, height: HEIGHT }}>
      <Canvas style={{ width: W, height: HEIGHT }}>
        {/* Background path (silik) — kayan */}
        <Group transform={groupTransform}>
          <Path
            path={path}
            style="stroke"
            strokeWidth={4}
            strokeCap="round"
            strokeJoin="round"
            color="rgba(255,255,255,0.12)"
          />
        </Group>

        {/* Ön plan path (mavi, gradient) — kayan */}
        <Group transform={groupTransform}>
          <Path path={path} style="stroke" strokeWidth={4} strokeCap="round" strokeJoin="round">
            <LinearGradient
              start={vec(0, 0)}
              end={vec(W * 4, 0)}
              colors={['#3F3DC4', '#5E5CE6', '#9F9DFF', '#5E5CE6', '#3F3DC4']}
            />
          </Path>
        </Group>

        {/* Top — sabit X, dinamik Y */}
        <BreathBall
          cx={BALL_X}
          cy={ballY}
          scale={ballScale}
          fillRatio={fillRatio}
          cycleProgress={cycleProgress}
        />
      </Canvas>
    </View>
  );
}

/**
 * Sürekli akıcı path — cycle'lar arası kırılma yok.
 * Strateji: her cycle = 4 anchor noktası (start, peak, valley, end).
 *   Cubic'lerin control point'lerini yatay yaparak her geçişte tangent süreklilik sağla.
 *   Hold periyotları ufak yatay düzlükle yumuşak girip çıkar.
 */
function makeBreathPath(pattern: BreathPattern, cycleWidth: number) {
  const path = Skia.Path.Make();
  const total = pattern.inhale + pattern.hold1 + pattern.exhale + pattern.hold2;
  if (total === 0) return path;

  const numCycles = 5;
  const startX = BALL_X - cycleWidth;

  // Yumuşak geçiş için: hold yokken bile mini düzlük (cubic tangent için)
  const TANGENT_EASE = 0.25; // cubic control x ofseti = segment genişliğinin %25'i

  // Tek seviye: BASE_Y baseline, peakY tepe. Vadi yok, ekstra dip yok.
  // Inhale: BASE_Y → peakY, Hold1: peakY düz, Exhale: peakY → BASE_Y, Hold2: BASE_Y düz.
  // Sonraki cycle: aynı noktadan başlar → hiç kırılma yok.
  const peakY = BASE_Y - PEAK_AMPLITUDE;

  path.moveTo(startX, BASE_Y);

  for (let c = 0; c < numCycles; c++) {
    const cx = startX + c * cycleWidth;
    const inW = (pattern.inhale / total) * cycleWidth;
    const h1W = (pattern.hold1 / total) * cycleWidth;
    const exW = (pattern.exhale / total) * cycleWidth;
    const h2W = (pattern.hold2 / total) * cycleWidth;

    const xAfterInhale = cx + inW;
    const xAfterHold1 = xAfterInhale + h1W;
    const xAfterExhale = xAfterHold1 + exW;
    const xAfterHold2 = xAfterExhale + h2W;

    // 1. INHALE — BASE_Y → peakY (yatay tangent S eğrisi)
    path.cubicTo(
      cx + inW * (0.5 + TANGENT_EASE),
      BASE_Y,
      xAfterInhale - inW * TANGENT_EASE,
      peakY,
      xAfterInhale,
      peakY,
    );

    // 2. HOLD1 — düz tepe
    if (h1W > 0) {
      path.cubicTo(
        xAfterInhale + h1W * 0.33,
        peakY,
        xAfterInhale + h1W * 0.66,
        peakY,
        xAfterHold1,
        peakY,
      );
    }

    // 3. EXHALE — peakY → BASE_Y (yatay tangent S eğrisi, vadi yok)
    path.cubicTo(
      xAfterHold1 + exW * TANGENT_EASE,
      peakY,
      xAfterExhale - exW * TANGENT_EASE,
      BASE_Y,
      xAfterExhale,
      BASE_Y,
    );

    // 4. HOLD2 — düz baseline (hold2 yoksa anında bir sonraki cycle başlar)
    if (h2W > 0) {
      path.cubicTo(
        xAfterExhale + h2W * 0.33,
        BASE_Y,
        xAfterExhale + h2W * 0.66,
        BASE_Y,
        xAfterHold2,
        BASE_Y,
      );
    }
    // Cycle'lar arası ekstra dönüş cubic YOK — zaten aynı seviyede bitti.
  }

  return path;
}

function BreathBall({
  cx,
  cy,
  scale,
  fillRatio,
  cycleProgress,
}: {
  cx: number;
  cy: SharedValue<number>;
  scale: SharedValue<number>;
  fillRatio: SharedValue<number>;
  cycleProgress: SharedValue<number>;
}) {
  const BASE_R = 30;

  // Top dış yarıçap
  const radiusOuter = useDerivedValue(() => BASE_R * scale.value);

  // GLOW HALKASI — top'un dışında pulsing aura
  // Inhale'de büyür, hold'da nazik nefes alır, exhale'de küçülür
  const glowRadius = useDerivedValue(() => {
    'worklet';
    const baseGlow = BASE_R * scale.value;
    // Sürekli yumuşak nefes (1 saniyelik döngü, bağımsız)
    // Cycle progress sürekli akıyor → kullanırız
    const breathOsc = 0.5 + 0.5 * Math.sin(cycleProgress.value * Math.PI * 4);
    return baseGlow + 8 + breathOsc * 6;
  });
  const glowOpacity = useDerivedValue(() => {
    'worklet';
    const t = 1 - Math.abs(scale.value - 1) / 0.4; // scale 1.0'a yaklaştıkça glow daha az
    return 0.18 + (0.18 * (scale.value - 0.85)) / 0.4;
  });

  // SU SEVİYESİ — sinüs dalga effect
  // Su seviyesinin Y koordinatı + dalga şekli
  const fillPath = useDerivedValue(() => {
    'worklet';
    const r = BASE_R * scale.value;
    const cyVal = cy.value;
    const fill = fillRatio.value;
    // Fill seviyesinin Y'si (üstten aşağıya)
    const waterTop = cyVal - r + (1 - fill) * (r * 2);
    // Sinüs dalga genliği (fill'e bağlı: orta seviyede en belirgin)
    const waveAmp = 2.5 * Math.min(1, Math.min(fill, 1 - fill) * 4);
    const phase = cycleProgress.value * Math.PI * 4; // dalga animasyonu

    const p = Skia.Path.Make();
    const segs = 12;
    p.moveTo(cx - r, waterTop);
    for (let i = 0; i <= segs; i++) {
      const x = cx - r + (i / segs) * (r * 2);
      const y = waterTop + Math.sin(phase + (i / segs) * Math.PI * 2) * waveAmp;
      if (i === 0) p.lineTo(x, y);
      else p.lineTo(x, y);
    }
    // Suyun alt kısmı kapansın
    p.lineTo(cx + r, cyVal + r);
    p.lineTo(cx - r, cyVal + r);
    p.close();
    return p;
  });

  // Su clip — top dış sınırı içinde kalsın
  const clipPath = useDerivedValue(() => {
    'worklet';
    const r = BASE_R * scale.value - 2;
    const p = Skia.Path.Make();
    p.addCircle(cx, cy.value, r);
    return p;
  });

  // BIRINCI HIGHLIGHT (büyük, sol-üst, hafif döner)
  const highlight1Cx = useDerivedValue(() => {
    'worklet';
    const r = BASE_R * scale.value;
    const angle = cycleProgress.value * Math.PI * 0.6 - Math.PI * 0.65; // yavaş döner
    return cx + Math.cos(angle) * r * 0.42;
  });
  const highlight1Cy = useDerivedValue(() => {
    'worklet';
    const r = BASE_R * scale.value;
    const angle = cycleProgress.value * Math.PI * 0.6 - Math.PI * 0.65;
    return cy.value + Math.sin(angle) * r * 0.42;
  });
  const highlight1R = useDerivedValue(() => 6 * scale.value);

  // İKİNCİ HIGHLIGHT (daha küçük, ters yönde)
  const highlight2Cx = useDerivedValue(() => {
    'worklet';
    const r = BASE_R * scale.value;
    const angle = -cycleProgress.value * Math.PI * 0.4 + Math.PI * 0.3;
    return cx + Math.cos(angle) * r * 0.55;
  });
  const highlight2Cy = useDerivedValue(() => {
    'worklet';
    const r = BASE_R * scale.value;
    const angle = -cycleProgress.value * Math.PI * 0.4 + Math.PI * 0.3;
    return cy.value + Math.sin(angle) * r * 0.55;
  });
  const highlight2R = useDerivedValue(() => 2.5 * scale.value);

  return (
    <Group>
      {/* GLOW halkası — top'un arkasında */}
      <Circle cx={cx} cy={cy} r={glowRadius} color="#5E5CE6" opacity={glowOpacity} />

      {/* Dış shell */}
      <Circle cx={cx} cy={cy} r={radiusOuter} color="#1A2236" />
      <Circle
        cx={cx}
        cy={cy}
        r={radiusOuter}
        style="stroke"
        strokeWidth={1.5}
        color="rgba(255,255,255,0.3)"
      />

      {/* Su (clip ile, dalga şeklinde) */}
      <Group clip={clipPath}>
        <Path path={fillPath} color="#5E5CE6" />
        {/* Üst kabarcık parlaması */}
        <Path path={fillPath} color="rgba(159, 157, 255, 0.5)" style="stroke" strokeWidth={1.5} />
      </Group>

      {/* Highlight'lar — üstte */}
      <Circle cx={highlight1Cx} cy={highlight1Cy} r={highlight1R} color="rgba(255,255,255,0.35)" />
      <Circle cx={highlight2Cx} cy={highlight2Cy} r={highlight2R} color="rgba(255,255,255,0.5)" />
    </Group>
  );
}

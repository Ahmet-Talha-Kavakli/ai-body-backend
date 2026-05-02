/**
 * SkiaDrinkCup — Waterllama tarzı flat içecek ikonları.
 *
 * Tasarım hedefi:
 * - iOS soft flat estetik. Keskin köşe yok (R≈8-12), gradient yok, abartılı 3D yok.
 * - Kap dış konturu soft gri (#E5E5EA). İçeride sıvı clip path ile dolar.
 * - Sıvı üstünde hafif menisk (bezier eğri) — düz çizgi yerine yumuşak yüzey.
 * - Sıvının üstünde 8% beyaz overlay → hafif highlight (cam parlaması hissi).
 * - fillLevel 0 → 1 arası animate (1100ms SMOOTH easing).
 *
 * Performans:
 * - Tek <Canvas> içinde tüm path'ler. useDerivedValue ile reanimated → Skia.
 * - clip ile sıvı kabın içine sınırlanır (boya kap kenarından taşmaz).
 *
 * Mevcut DrinkIcons.tsx'tan ayrı; ileride migration ayrı task.
 */

import React, { useEffect, useMemo } from 'react';
import {
  Canvas,
  Group,
  LinearGradient,
  Path,
  Skia,
  vec,
  type SkPath,
} from '@shopify/react-native-skia';
import {
  Easing,
  useDerivedValue,
  useFrameCallback,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

import { DrinkEffectLayer, DrinkOutsideEffectLayer, type DrinkEffect } from './DrinkEffects';

// =============================================================================
// Types
// =============================================================================

export type DrinkShape =
  | 'glass'
  | 'mug'
  | 'cup'
  | 'bottle'
  | 'wineGlass'
  | 'smoothie'
  | 'canister'
  | 'tallGlass';

export interface SkiaDrinkCupProps {
  shape: DrinkShape;
  /** Sıvı rengi (#RRGGBB). */
  color: string;
  /** Sıvı içi animasyonlu efekt — default 'none'. */
  effect?: DrinkEffect;
  /** 0..1 — 0 boş, 1 tam dolu. (fillSV verilmezse kullanılır) */
  fillLevel?: number;
  /**
   * Opsiyonel: doğrudan UI thread'de izlenecek SharedValue.
   * Verilirse fillLevel kullanılmaz; parent'tan worklet üzerinden gelir
   * (her frame yeni timing kuyruklamaz, gerçekten smooth).
   */
  fillSV?: SharedValue<number>;
  /** Toplam yükseklik (px). Genişlik şekle göre orantılı hesaplanır. */
  size: number;
  /** Default true. False ise direkt set edilir. */
  animated?: boolean;
}

// =============================================================================
// Sabitler
// =============================================================================

/** Kap dış konturu — Apple system gray 2 (bir tık daha açık). */
const STROKE_GRAY = '#AEAEB2';
/** Sıvı üstündeki highlight overlay (8% beyaz). */
const HIGHLIGHT_WHITE = '#FFFFFF14'; // 0x14 ≈ 8% alpha

/** SMOOTH easing — wiki/animasyon standardı. */
const EASE_SMOOTH = Easing.bezier(0.22, 1, 0.36, 1);

/**
 * Hex rengi RGB tuple'a çevirir. "#RRGGBB" veya "#RGB" kabul.
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  let h = hex.replace('#', '');
  if (h.length === 3)
    h = h
      .split('')
      .map((c) => c + c)
      .join('');
  const n = parseInt(h, 16);
  return { r: (n >> 16) & 0xff, g: (n >> 8) & 0xff, b: n & 0xff };
}

/**
 * RGB → hex, lightness shift (±%delta) uygulayarak.
 * shift > 0 → açıklaştır (white'a yaklaş), shift < 0 → koyulaştır (black'e).
 */
function shiftColor(hex: string, shift: number): string {
  const { r, g, b } = hexToRgb(hex);
  const apply = (c: number): number => {
    if (shift > 0) {
      return Math.round(c + (255 - c) * shift);
    } else {
      return Math.round(c * (1 + shift));
    }
  };
  const toHex = (n: number) => n.toString(16).padStart(2, '0');
  return `#${toHex(apply(r))}${toHex(apply(g))}${toHex(apply(b))}`;
}

/**
 * Yüzey dalga örnekleyici — gerçek zamanlı sıvı yüzey simülasyonu.
 *   t        : saniye (sürekli artan, sıçrama yok)
 *   x        : viewBox X koordinatı
 *   w        : viewBox genişliği
 *   amp      : taban genlik (viewBox birim)
 *   splash   : 0..1 — son değişimden gelen ekstra momentum
 *
 * Üç frekansın toplamı:
 *   - Ana yatay dalga (slow)  : 0.6 Hz, 1 tepe, sağa akar
 *   - Hızlı yüzey çırpıntısı   : 1.4 Hz, 2 tepe, sola akar (faz farkı)
 *   - Mikro dalga              : 2.5 Hz, 3 tepe, çok küçük, yüzey ripple'ı
 *
 * Splash momentumu hem genliği büyütür hem de hızlı dalgaya bias verir.
 */
function sampleWave(t: number, x: number, w: number, amp: number, splash: number): number {
  'worklet';
  const TWO_PI = Math.PI * 2;
  const xn = x / w; // 0..1

  // Ana dalga — sağa akar, ~3.5 saniyede 1 tur
  const slow = Math.sin(xn * TWO_PI - t * 0.28 * TWO_PI);
  // Orta dalga — sola akar, 2 tepe, ~2.5 saniyede 1 tur
  const fast = Math.sin(xn * TWO_PI * 2 + t * 0.4 * TWO_PI);
  // Mikro dalga — 3 tepe, ~1.5 saniyede 1 tur
  const micro = Math.sin(xn * TWO_PI * 3 - t * 0.65 * TWO_PI);

  const a = slow * 0.55;
  const b = fast * 0.3;
  const c = micro * 0.15;

  // Splash → genliği 1.6×'a kadar yükseltir
  const boostedAmp = amp * (1 + splash * 0.6);
  return (a + b + c) * boostedAmp;
}

// =============================================================================
// Şekil tanımları
// =============================================================================
//
// Her şekil 100x100 viewBox'ta tasarlanır (sonra `size` ile ölçeklenir).
// `aspectRatio` = w/h → genişlik = size * aspectRatio.
// `bodyPath`     = kap dış silüeti (gri kontur). Path doldurulur (fill, stroke değil).
// `innerPath`    = sıvı clip alanı (kap iç boşluğu). bodyPath'tan biraz içeride.
// `liquidBounds` = sıvının yer alabileceği y aralığı (top..bottom, viewBox koordinat).
// `handlePath?`  = mug/cup için sağ kulp (varsa). Sıvı bu alana akmaz.

interface ShapeDef {
  aspectRatio: number; // w / h (100 birim viewBox)
  vbWidth: number; // viewBox genişliği (yükseklik 100)
  bodyPath: string; // dış silüet (gri)
  innerPath: string; // sıvı clip
  liquidTop: number; // sıvının ulaşabileceği en üst y (viewBox)
  liquidBottom: number; // sıvının başladığı en alt y (viewBox)
  /**
   * Gövdenin yatay merkezi (viewBox biriminde).
   * Kulplu kaplarda gövde sola yatık → render'da Canvas'ı sola çekmek için kullanılır
   * (kullanıcı kulpu değil gövdeyi merkezde görür). Yoksa vbWidth/2.
   */
  bodyCenterX?: number;
}

/**
 * Şekiller — Waterllama referansları temel alındı.
 * Tüm yumuşak köşeler quadratic bezier (Q) ile çizildi → ~10-14 birim radius.
 */
const SHAPES: Record<DrinkShape, ShapeDef> = {
  // -------------------------------------------------------------------------
  // GLASS — klasik bardak. Üst geniş, alt biraz dar (konik). Waterllama 47.
  // -------------------------------------------------------------------------
  glass: {
    aspectRatio: 0.78,
    vbWidth: 78,
    bodyPath: 'M8 8 Q8 5 11 5 H67 Q70 5 70 8 L64 90 Q63.5 95 58.5 95 H19.5 Q14.5 95 14 90 Z',
    innerPath: 'M10 10 Q10 8 12 8 H66 Q68 8 68 10 L62 88 Q61.7 92 58 92 H20 Q16.3 92 16 88 Z',
    liquidTop: 10,
    liquidBottom: 92,
  },

  // -------------------------------------------------------------------------
  // MUG — kulplu kupa. Geniş gövde (yuvarlak köşeli rect) + sağda kulp.
  // Waterllama 53 referansı (yeşil çay kupası).
  // -------------------------------------------------------------------------
  mug: {
    aspectRatio: 1.05,
    vbWidth: 105,
    bodyPath:
      'M5 18 Q5 8 15 8 H73 Q83 8 83 18 V72 Q83 92 63 92 H25 Q5 92 5 72 Z' +
      'M83 28 H92 Q100 28 100 42 V58 Q100 72 92 72 H83 V64 H89 Q94 64 94 56 V44 Q94 36 89 36 H83 Z',
    innerPath: 'M9 22 Q9 12 19 12 H69 Q79 12 79 22 V70 Q79 88 61 88 H27 Q9 88 9 70 Z',
    liquidTop: 12,
    liquidBottom: 88,
    bodyCenterX: 44, // gövde 5..83 ortası
  },

  // -------------------------------------------------------------------------
  // CUP — çay fincanı. Kısa ve geniş, sağ kulp.
  // -------------------------------------------------------------------------
  cup: {
    aspectRatio: 1.1,
    vbWidth: 110,
    bodyPath:
      'M10 28 Q10 20 18 20 H72 Q80 20 80 28 V68 Q80 88 60 88 H30 Q10 88 10 68 Z' +
      'M80 38 H88 Q96 38 96 50 V58 Q96 70 88 70 H80 V62 H85 Q90 62 90 54 V52 Q90 46 85 46 H80 Z',
    innerPath: 'M14 32 Q14 24 22 24 H68 Q76 24 76 32 V66 Q76 84 58 84 H32 Q14 84 14 66 Z',
    liquidTop: 24,
    liquidBottom: 84,
    bodyCenterX: 45, // gövde 10..80 ortası
  },

  // -------------------------------------------------------------------------
  // BOTTLE — şişe. Üstte kısa boyun, omuz kavisi, geniş gövde.
  // -------------------------------------------------------------------------
  bottle: {
    aspectRatio: 0.55,
    vbWidth: 55,
    // Kapak + boyun + omuz + gövde tek path
    bodyPath:
      'M19 5 Q18 5 18 6 V14 Q18 17 16 19 Q9 25 9 35 V82 Q9 95 21 95 H34 Q46 95 46 82 V35 Q46 25 39 19 Q37 17 37 14 V6 Q37 5 36 5 Z',
    innerPath:
      'M21 8 H34 V14 Q34 18 36 21 Q43 27 43 36 V81 Q43 92 33 92 H22 Q12 92 12 81 V36 Q12 27 19 21 Q21 18 21 14 Z',
    liquidTop: 8,
    liquidBottom: 92,
  },

  // -------------------------------------------------------------------------
  // WINE GLASS — kadeh. Üst balon, ince ayak, geniş taban.
  // -------------------------------------------------------------------------
  wineGlass: {
    aspectRatio: 0.6,
    vbWidth: 60,
    bodyPath:
      // Balon kase
      'M8 5 Q6 5 6 7 Q6 28 16 44 Q24 56 24 64 H36 Q36 56 44 44 Q54 28 54 7 Q54 5 52 5 Z' +
      // Ayak
      'M27 64 H33 V86 H27 Z' +
      // Taban
      'M14 86 Q14 84 16 84 H44 Q46 84 46 86 V92 Q46 95 43 95 H17 Q14 95 14 92 Z',
    // İç sıvı sadece balon içinde
    innerPath: 'M10 8 Q9 8 9 9 Q9 28 18 42 Q26 53 26 62 H34 Q34 53 42 42 Q51 28 51 9 Q51 8 50 8 Z',
    liquidTop: 8,
    liquidBottom: 62,
  },

  // -------------------------------------------------------------------------
  // SMOOTHIE — geniş kavanoz, kapaklı, pipetli (Waterllama 58 sarı bardak).
  // -------------------------------------------------------------------------
  smoothie: {
    aspectRatio: 0.85,
    vbWidth: 85,
    bodyPath:
      // Pipet (sağda, eğik)
      'M58 8 L66 4 L70 6 L62 12 Z' +
      // Kapak şeridi (geniş, üst kısım)
      'M6 18 Q6 14 10 14 H75 Q79 14 79 18 V26 Q79 30 75 30 H10 Q6 30 6 26 Z' +
      // Gövde — omuzlu, hafif konik (alt biraz daralır)
      'M9 30 H76 L72 86 Q71.5 92 65.5 92 H19.5 Q13.5 92 13 86 Z',
    innerPath: 'M11 32 H74 L70 84 Q69.7 90 65 90 H20 Q15.3 90 15 84 Z',
    liquidTop: 32,
    liquidBottom: 90,
  },

  // -------------------------------------------------------------------------
  // CANISTER — soda kutusu. İnce uzun silindir, üst-alt yumuşak köşeli.
  // -------------------------------------------------------------------------
  canister: {
    aspectRatio: 0.5,
    vbWidth: 50,
    bodyPath:
      // Üst rim (kapak çıkıntısı)
      'M14 5 H36 Q37 5 37 6 V8 H13 V6 Q13 5 14 5 Z' +
      // Gövde
      'M10 8 H40 Q42 8 42 10 V90 Q42 95 37 95 H13 Q8 95 8 90 V10 Q8 8 10 8 Z',
    innerPath: 'M13 11 H37 Q39 11 39 13 V88 Q39 92 35 92 H15 Q11 92 11 88 V13 Q11 11 13 11 Z',
    liquidTop: 11,
    liquidBottom: 92,
  },

  // -------------------------------------------------------------------------
  // TALL GLASS — uzun ince bardak (örn. juice / iced tea).
  // -------------------------------------------------------------------------
  tallGlass: {
    aspectRatio: 0.55,
    vbWidth: 55,
    bodyPath: 'M8 8 Q8 5 11 5 H44 Q47 5 47 8 L42 90 Q41.7 95 37 95 H18 Q13.3 95 13 90 Z',
    innerPath: 'M10 10 Q10 8 12 8 H43 Q45 8 45 10 L40 88 Q39.7 92 36 92 H19 Q15.3 92 15 88 Z',
    liquidTop: 10,
    liquidBottom: 92,
  },
};

// =============================================================================
// Bileşen
// =============================================================================

export function SkiaDrinkCup({
  shape,
  color,
  effect = 'none',
  fillLevel,
  fillSV,
  size,
  animated = true,
}: SkiaDrinkCupProps) {
  const def = SHAPES[shape];
  const width = size * def.aspectRatio;
  const height = size;
  const scale = size / 100; // viewBox 100h → size px

  // Sıvı tonları — drink color'dan ±lightness shift ile yumuşak 3 stop gradient.
  // Hafif tonlama; ton bantları zar zor fark edilir, doğal sıvı derinliği hissi.
  const liquidColors = useMemo(() => {
    return [
      shiftColor(color, 0.08), // üst — hafif açık
      color, // orta — ana ton
      shiftColor(color, -0.1), // alt — hafif koyu
    ];
  }, [color]);

  // Gradient ofset — saniye cinsinden faz, gradient stop'ları yavaşça kayar.
  // 0..1 arası salınır → start/end y koordinatları hafifçe oynar → ton geçişi canlı.
  const gradPhase = useSharedValue(0);

  // Reanimated shared value: fillLevel'i yumuşak izler.
  const internalFill = useSharedValue(fillLevel ?? 0);

  // Dalga zamanı — gerçek zamanlı clock (saniye), her frame artar.
  // Sıçrama yok: sürekli artan değer, sin/cos modulo'su periyodik.
  // Ayrıca son fill değişimini izle → "splash" momentumu (geçici amp boost).
  const waveTime = useSharedValue(0);
  const splashAmp = useSharedValue(0); // 0..1 — değişim olunca yükselir, decay eder
  const lastFillRef = useSharedValue(0);

  useEffect(() => {
    if (fillSV) return; // Parent SV kullanılıyor, internal'e dokunma.
    const target = clamp01(fillLevel ?? 0);
    if (animated) {
      internalFill.value = withTiming(target, {
        duration: 1100,
        easing: EASE_SMOOTH,
      });
    } else {
      internalFill.value = target;
    }
  }, [fillLevel, animated, internalFill, fillSV]);

  // Worklet'te okunacak final fill: fillSV verilmişse onu, değilse internalFill.
  const animatedFill = useDerivedValue(() => {
    return clamp01(fillSV ? fillSV.value : internalFill.value);
  }, [fillSV, internalFill]);

  // Frame clock — UI thread, her frame waveTime'ı saniye cinsinden artırır.
  // Aynı zamanda fill değişimini algılayıp splash momentumu üretir.
  useFrameCallback((info) => {
    'worklet';
    const dt = (info.timeSincePreviousFrame ?? 16) / 1000; // saniye
    if (animated) {
      waveTime.value += dt;
      // Gradient fazı — 7 saniyelik yumuşak döngü, gözle takip edilmez.
      gradPhase.value = (gradPhase.value + dt / 7) % 1;
    }
    // Fill değişti mi? Hızla → splash üret.
    const cur = animatedFill.value;
    const delta = Math.abs(cur - lastFillRef.value);
    if (delta > 0.0008) {
      // Değişim hızı genlik artışı (max 1)
      const boost = Math.min(1, delta * 18);
      if (boost > splashAmp.value) {
        splashAmp.value = boost;
      }
    }
    // Splash decay — yumuşak söner (~2.2s yarılanma süresi)
    splashAmp.value = splashAmp.value * Math.exp(-dt * 0.9);
    lastFillRef.value = cur;
  }, true);

  // Skia path objeleri — sadece şekil değişince oluştur.
  const bodyPath = useMemo<SkPath>(
    () => Skia.Path.MakeFromSVGString(def.bodyPath) ?? Skia.Path.Make(),
    [def.bodyPath],
  );
  const innerPath = useMemo<SkPath>(
    () => Skia.Path.MakeFromSVGString(def.innerPath) ?? Skia.Path.Make(),
    [def.innerPath],
  );

  // def'ten primitive'leri çek — useDerivedValue deps'e object property geçilemez.
  const defVbWidth = def.vbWidth;
  const defLiquidTop = def.liquidTop;
  const defLiquidBottom = def.liquidBottom;

  // Sıvı path — fillLevel + sürekli dalga fonksiyonu ile gerçek yüzey.
  const liquidPath = useDerivedValue<SkPath>(() => {
    const level = clamp01(animatedFill.value);
    const t = waveTime.value;
    const splash = splashAmp.value;

    const w = defVbWidth;
    const surfaceY = defLiquidBottom - (defLiquidBottom - defLiquidTop) * level;
    const bottom = defLiquidBottom + 2;
    const ampMax = 2.2;
    const damp = level < 0.05 || level > 0.97 ? 0.4 : 1;
    const amp = ampMax * damp;

    const SEGMENTS = 24;
    const p = Skia.Path.Make();

    let prevX = 0;
    let prevY = surfaceY + sampleWave(t, 0, w, amp, splash);
    p.moveTo(prevX, prevY);

    for (let i = 1; i <= SEGMENTS; i++) {
      const x = (w / SEGMENTS) * i;
      const y = surfaceY + sampleWave(t, x, w, amp, splash);
      const cx = (prevX + x) / 2;
      const cy = (prevY + y) / 2;
      p.quadTo(prevX, prevY, cx, cy);
      prevX = x;
      prevY = y;
    }
    p.lineTo(w, prevY);
    p.lineTo(w, bottom);
    p.lineTo(0, bottom);
    p.close();
    return p;
  }, [animatedFill, waveTime, splashAmp, defVbWidth, defLiquidTop, defLiquidBottom]);

  // Highlight path — sıvının üst ~%18'lik dilimi (kenardan kenara hafif beyaz).
  const highlightPath = useDerivedValue<SkPath>(() => {
    const level = clamp01(animatedFill.value);
    if (level <= 0.02) return Skia.Path.Make();
    const t = waveTime.value;
    const splash = splashAmp.value;

    const w = defVbWidth;
    const surfaceY = defLiquidBottom - (defLiquidBottom - defLiquidTop) * level;
    const highlightHeight = (defLiquidBottom - defLiquidTop) * 0.18;
    const bottomY = Math.min(defLiquidBottom, surfaceY + highlightHeight);
    const ampMax = 2.2;
    const damp = level < 0.05 || level > 0.97 ? 0.4 : 1;
    const amp = ampMax * damp;

    const SEGMENTS = 24;
    const p = Skia.Path.Make();
    let prevX = 0;
    let prevY = surfaceY + sampleWave(t, 0, w, amp, splash);
    p.moveTo(prevX, prevY);
    for (let i = 1; i <= SEGMENTS; i++) {
      const x = (w / SEGMENTS) * i;
      const y = surfaceY + sampleWave(t, x, w, amp, splash);
      const cx = (prevX + x) / 2;
      const cy = (prevY + y) / 2;
      p.quadTo(prevX, prevY, cx, cy);
      prevX = x;
      prevY = y;
    }
    p.lineTo(w, prevY);
    p.lineTo(w, bottomY);
    p.lineTo(0, bottomY);
    p.close();
    return p;
  }, [animatedFill, waveTime, splashAmp, defVbWidth, defLiquidTop, defLiquidBottom]);

  // Gövde ortalama: bodyCenterX vbWidth/2'den farklıysa Canvas içeriğini kaydır.
  const bodyCenter = def.bodyCenterX ?? defVbWidth / 2;
  const offsetXVb = defVbWidth / 2 - bodyCenter;
  const offsetXPx = offsetXVb * scale;

  // Gradient start/end vec'leri — gradPhase ile çok hafif kayma, doğal nefes hissi.
  const gradStart = useDerivedValue(() => {
    const level = clamp01(animatedFill.value);
    const surfaceY = defLiquidBottom - (defLiquidBottom - defLiquidTop) * level;
    const phase = gradPhase.value;
    const offset = Math.sin(phase * Math.PI * 2) * 6;
    return vec(defVbWidth / 2, surfaceY + offset);
  }, [animatedFill, gradPhase, defLiquidBottom, defLiquidTop, defVbWidth]);

  const gradEnd = useDerivedValue(() => {
    const phase = gradPhase.value;
    const offset = Math.sin(phase * Math.PI * 2 + Math.PI) * 6;
    return vec(defVbWidth / 2, defLiquidBottom + offset);
  }, [animatedFill, gradPhase, defLiquidBottom, defVbWidth]);

  return (
    <Canvas style={{ width, height }}>
      <Group transform={[{ translateX: offsetXPx }, { scale }]}>
        {/* 1) Dış kontur — gri silüet */}
        <Path path={bodyPath} color={STROKE_GRAY} />
        {/* 2) İç boşluk — beyaz (cam içi) */}
        <Path path={innerPath} color="#FFFFFF" />
        {/* 3) Sıvı — innerPath ile clip'lenir, gradient ile boyanır */}
        <Group clip={innerPath}>
          <Path path={liquidPath}>
            <LinearGradient
              start={gradStart}
              end={gradEnd}
              colors={liquidColors}
              positions={[0, 0.5, 1]}
            />
          </Path>
          <Path path={highlightPath} color={HIGHLIGHT_WHITE} />
          {/* 4) Efekt katmanı — partikül/efektler sıvı içinde (clip içi) */}
          <DrinkEffectLayer
            effect={effect}
            fillSV={animatedFill}
            waveTime={waveTime}
            liquidTop={defLiquidTop}
            liquidBottom={defLiquidBottom}
            vbWidth={defVbWidth}
            color={color}
          />
        </Group>
        {/* 5) Bardağın üstündeki efektler — clip dışı (buhar havaya çıkar) */}
        <DrinkOutsideEffectLayer
          effect={effect}
          fillSV={animatedFill}
          waveTime={waveTime}
          liquidTop={defLiquidTop}
          liquidBottom={defLiquidBottom}
          vbWidth={defVbWidth}
          color={color}
        />
      </Group>
    </Canvas>
  );
}

// =============================================================================
// Yardımcılar
// =============================================================================

function clamp01(v: number): number {
  'worklet';
  if (v < 0) return 0;
  if (v > 1) return 1;
  return v;
}

// =============================================================================
// Public sabitler — UI tarafında picker/labels için
// =============================================================================

/**
 * Shape başına sıvı yüzeyinin viewBox üst/alt sınırları (0-100 birim).
 * AddDrinkSheet handle pozisyonunu bardağın gerçek sıvı alanına kilitlemek için kullanır.
 */
export const SHAPE_LIQUID_BOUNDS: Record<DrinkShape, { top: number; bottom: number }> = {
  glass: { top: 10, bottom: 92 },
  mug: { top: 12, bottom: 88 },
  cup: { top: 24, bottom: 84 },
  bottle: { top: 8, bottom: 92 },
  wineGlass: { top: 8, bottom: 62 },
  smoothie: { top: 32, bottom: 90 },
  canister: { top: 11, bottom: 92 },
  tallGlass: { top: 10, bottom: 92 },
};

export const DRINK_SHAPES: DrinkShape[] = [
  'glass',
  'mug',
  'cup',
  'bottle',
  'wineGlass',
  'smoothie',
  'canister',
  'tallGlass',
];

export const DRINK_SHAPE_LABELS_TR: Record<DrinkShape, string> = {
  glass: 'Bardak',
  mug: 'Kupa',
  cup: 'Fincan',
  bottle: 'Şişe',
  wineGlass: 'Kadeh',
  smoothie: 'Smoothie',
  canister: 'Kutu',
  tallGlass: 'Uzun Bardak',
};

/**
 * DrinkEffects — Sıvı içi efektleri Skia ile render eder.
 *
 * Her efekt:
 *  - Sıvının innerPath ile clip'lendiği Group içinde çizilir (parent'ta).
 *  - fillSV (0..1) ile yoğunluk/partikül sayısı ölçeklenir.
 *  - waveTime SV ile sürekli akan zaman → sıçramasız animasyon.
 *  - useFrameCallback parent'ta tek seferden yönetilir (yeni clock yok).
 *
 * Performans: tüm partiküller useDerivedValue ile worklet'te hesaplanır.
 *             React re-render olmaz; Skia path'leri her frame yeni hesaplanır
 *             ama 60fps'de sorun yok (max 16 partikül).
 */

import React, { useMemo } from 'react';
import { Circle, Path, RoundedRect, Skia, type SkPath } from '@shopify/react-native-skia';
import { useDerivedValue, type SharedValue } from 'react-native-reanimated';

// =============================================================================
// Types
// =============================================================================

export type DrinkEffect =
  | 'none'
  | 'microBubbles'
  | 'bubbles'
  | 'iceCubes'
  | 'leaves'
  | 'steam'
  | 'foam'
  | 'rain'
  | 'pulse';

export const DRINK_EFFECTS: DrinkEffect[] = [
  'none',
  'microBubbles',
  'bubbles',
  'iceCubes',
  'leaves',
  'steam',
  'foam',
  'rain',
  'pulse',
];

export const DRINK_EFFECT_LABELS_TR: Record<DrinkEffect, string> = {
  none: 'Hiçbiri',
  microBubbles: 'Mikro Baloncuklar',
  bubbles: 'Baloncuklar',
  iceCubes: 'Buz Küpleri',
  leaves: 'Yapraklar',
  steam: 'Buhar',
  foam: 'Köpük',
  rain: 'Damlacık Yağmuru',
  pulse: 'Pulse',
};

// =============================================================================
// Bileşen propları
// =============================================================================

interface DrinkEffectLayerProps {
  effect: DrinkEffect;
  /** Sıvı yüzeyinin viewBox y koordinatı SV (parent'tan). */
  fillSV: SharedValue<number>;
  /** Sürekli akan zaman SV (saniye). */
  waveTime: SharedValue<number>;
  /** Şeklin sıvı bölgesi viewBox bilgisi. */
  liquidTop: number;
  liquidBottom: number;
  vbWidth: number;
  /** Sıvı rengi — koyu ton hesabı için. */
  color: string;
}

// =============================================================================
// Yardımcılar
// =============================================================================

/**
 * Pseudo-random worklet — seed'e göre stabil [0,1) değer.
 * Her partikül için kendi seed'i, her frame aynı sonucu verir.
 */
function rand(seed: number): number {
  'worklet';
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

/** Hex rengi RGB tuple'a çevirir. */
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

function shiftColor(hex: string, shift: number): string {
  const { r, g, b } = hexToRgb(hex);
  const apply = (c: number): number => {
    if (shift > 0) return Math.round(c + (255 - c) * shift);
    return Math.round(c * (1 + shift));
  };
  const toHex = (n: number) => n.toString(16).padStart(2, '0');
  return `#${toHex(apply(r))}${toHex(apply(g))}${toHex(apply(b))}`;
}

// =============================================================================
// MICRO BUBBLES — küçük, çok sayıda, alttan üste yavaş
// =============================================================================

const MICRO_BUBBLE_COUNT = 14;

function MicroBubbles({
  fillSV,
  waveTime,
  liquidTop,
  liquidBottom,
  vbWidth,
}: Omit<DrinkEffectLayerProps, 'effect' | 'color'>) {
  // Her baloncuk için stabil x ve hız değerleri (seed bazlı, render'da hesapla).
  const bubbles = useMemo(
    () =>
      Array.from({ length: MICRO_BUBBLE_COUNT }).map((_, i) => ({
        seedX: i * 7.13 + 1,
        speed: 0.4 + rand(i * 11.7) * 0.3, // 0.4..0.7 viewBox/saniye
        size: 0.7 + rand(i * 13.3) * 0.6, // 0.7..1.3 birim
        phaseOffset: rand(i * 17.1),
      })),
    [],
  );

  return (
    <>
      {bubbles.map((b, i) => (
        <MicroBubble
          key={i}
          fillSV={fillSV}
          waveTime={waveTime}
          liquidTop={liquidTop}
          liquidBottom={liquidBottom}
          vbWidth={vbWidth}
          xSeed={b.seedX}
          speed={b.speed}
          size={b.size}
          phaseOffset={b.phaseOffset}
          index={i}
          total={MICRO_BUBBLE_COUNT}
        />
      ))}
    </>
  );
}

function MicroBubble({
  fillSV,
  waveTime,
  liquidTop,
  liquidBottom,
  vbWidth,
  xSeed,
  speed,
  size,
  phaseOffset,
  index,
  total,
}: {
  fillSV: SharedValue<number>;
  waveTime: SharedValue<number>;
  liquidTop: number;
  liquidBottom: number;
  vbWidth: number;
  xSeed: number;
  speed: number;
  size: number;
  phaseOffset: number;
  index: number;
  total: number;
}) {
  // x sabit, y zamanla yukarı çıkar; sıvı yüzeyine ulaşınca alta sıçrar.
  const cx = useDerivedValue(() => {
    'worklet';
    // Stabil x (kenardan kenara dağıt)
    const baseX = (rand(xSeed) * 0.8 + 0.1) * vbWidth;
    // Hafif yatay osilasyon
    const wob = Math.sin(waveTime.value * 0.8 + index) * 0.6;
    return baseX + wob;
  });

  const cy = useDerivedValue(() => {
    'worklet';
    const fill = fillSV.value;
    if (fill < 0.05) return -100; // dışarı at, görünmesin
    // Doluluğa göre yoğunluk: az dolu az partikül
    if (index / total > fill * 1.4) return -100;
    const surfaceY = liquidBottom - (liquidBottom - liquidTop) * fill;
    const range = liquidBottom - surfaceY;
    if (range < 4) return -100;
    const phase = (waveTime.value * speed + phaseOffset) % 1;
    return liquidBottom - phase * range;
  });

  const opacity = useDerivedValue(() => {
    'worklet';
    if (cy.value < 0) return 0;
    const surfaceY = liquidBottom - (liquidBottom - liquidTop) * fillSV.value;
    const distFromSurface = cy.value - surfaceY;
    // Yüzeye yaklaşınca fade out
    if (distFromSurface < 4) return Math.max(0, distFromSurface / 4) * 0.5;
    return 0.5;
  });

  return <Circle cx={cx} cy={cy} r={size} color="white" opacity={opacity} />;
}

// =============================================================================
// BUBBLES — büyük, az sayıda, daha hızlı
// =============================================================================

const BUBBLE_COUNT = 6;

function Bubbles({
  fillSV,
  waveTime,
  liquidTop,
  liquidBottom,
  vbWidth,
}: Omit<DrinkEffectLayerProps, 'effect' | 'color'>) {
  const bubbles = useMemo(
    () =>
      Array.from({ length: BUBBLE_COUNT }).map((_, i) => ({
        seedX: i * 13.7 + 2,
        speed: 0.25 + rand(i * 21.3) * 0.2,
        size: 2 + rand(i * 9.7) * 1.6, // 2..3.6 birim
        phaseOffset: rand(i * 23.5),
      })),
    [],
  );

  return (
    <>
      {bubbles.map((b, i) => (
        <BubbleParticle
          key={i}
          fillSV={fillSV}
          waveTime={waveTime}
          liquidTop={liquidTop}
          liquidBottom={liquidBottom}
          vbWidth={vbWidth}
          xSeed={b.seedX}
          speed={b.speed}
          size={b.size}
          phaseOffset={b.phaseOffset}
          index={i}
          total={BUBBLE_COUNT}
        />
      ))}
    </>
  );
}

function BubbleParticle({
  fillSV,
  waveTime,
  liquidTop,
  liquidBottom,
  vbWidth,
  xSeed,
  speed,
  size,
  phaseOffset,
  index,
  total,
}: {
  fillSV: SharedValue<number>;
  waveTime: SharedValue<number>;
  liquidTop: number;
  liquidBottom: number;
  vbWidth: number;
  xSeed: number;
  speed: number;
  size: number;
  phaseOffset: number;
  index: number;
  total: number;
}) {
  const cx = useDerivedValue(() => {
    'worklet';
    const baseX = (rand(xSeed) * 0.7 + 0.15) * vbWidth;
    const wob = Math.sin(waveTime.value * 0.5 + index * 0.7) * 1.2;
    return baseX + wob;
  });

  const cy = useDerivedValue(() => {
    'worklet';
    const fill = fillSV.value;
    if (fill < 0.08) return -100;
    if (index / total > fill * 1.2) return -100;
    const surfaceY = liquidBottom - (liquidBottom - liquidTop) * fill;
    const range = liquidBottom - surfaceY;
    if (range < 6) return -100;
    const phase = (waveTime.value * speed + phaseOffset) % 1;
    return liquidBottom - phase * range;
  });

  const opacity = useDerivedValue(() => {
    'worklet';
    if (cy.value < 0) return 0;
    const surfaceY = liquidBottom - (liquidBottom - liquidTop) * fillSV.value;
    const distFromSurface = cy.value - surfaceY;
    if (distFromSurface < 6) return Math.max(0, distFromSurface / 6) * 0.65;
    return 0.65;
  });

  return <Circle cx={cx} cy={cy} r={size} color="white" opacity={opacity} />;
}

// =============================================================================
// ICE CUBES — yüzeyde yuvarlak köşeli kareler, hafif sallanan
// =============================================================================

const ICE_COUNT = 6;

function IceCubes({
  fillSV,
  waveTime,
  liquidTop,
  liquidBottom,
  vbWidth,
}: Omit<DrinkEffectLayerProps, 'effect' | 'color'>) {
  const cubes = useMemo(
    () =>
      Array.from({ length: ICE_COUNT }).map((_, i) => ({
        seedX: i * 17.3 + 5,
        size: 8 + rand(i * 27.1) * 4, // 8..12 birim
        bobOffset: rand(i * 31.7) * Math.PI * 2,
        rotOffset: rand(i * 41.3) * Math.PI * 2,
      })),
    [],
  );

  return (
    <>
      {cubes.map((c, i) => (
        <IceCube
          key={i}
          fillSV={fillSV}
          waveTime={waveTime}
          liquidTop={liquidTop}
          liquidBottom={liquidBottom}
          vbWidth={vbWidth}
          xSeed={c.seedX}
          size={c.size}
          bobOffset={c.bobOffset}
          rotOffset={c.rotOffset}
          index={i}
          total={ICE_COUNT}
        />
      ))}
    </>
  );
}

function IceCube({
  fillSV,
  waveTime,
  liquidTop,
  liquidBottom,
  vbWidth,
  xSeed,
  size,
  bobOffset,
  rotOffset,
  index,
  total,
}: {
  fillSV: SharedValue<number>;
  waveTime: SharedValue<number>;
  liquidTop: number;
  liquidBottom: number;
  vbWidth: number;
  xSeed: number;
  size: number;
  bobOffset: number;
  rotOffset: number;
  index: number;
  total: number;
}) {
  // x — kenardan biraz içerde, eşit dağıt
  const baseX = (0.18 + (index / total) * 0.65) * vbWidth;

  const x = useDerivedValue(() => {
    'worklet';
    if (fillSV.value < 0.15) return -100;
    if (index / total > fillSV.value * 1.1) return -100;
    const wob = Math.sin(waveTime.value * 0.7 + bobOffset) * 1.5;
    return baseX + wob - size / 2;
  });

  const y = useDerivedValue(() => {
    'worklet';
    const fill = fillSV.value;
    if (fill < 0.15) return -100;
    if (index / total > fill * 1.1) return -100;
    const surfaceY = liquidBottom - (liquidBottom - liquidTop) * fill;
    // Buz sıvının içinde yüzer — yüzeyden 4-12 birim altta dağıt.
    const yFrac = 0.15 + rand(rotOffset * 31.7) * 0.55; // 0.15..0.7
    const baseY = surfaceY + (liquidBottom - surfaceY) * yFrac;
    const bob = Math.sin(waveTime.value * 1.1 + bobOffset) * 0.8;
    return baseY + bob;
  });

  return (
    <RoundedRect
      x={x}
      y={y}
      width={size}
      height={size}
      r={size * 0.22}
      color="rgba(255,255,255,0.78)"
    />
  );
}

// =============================================================================
// LEAVES — sıvı içinde dağınık yaprak silüetleri
// =============================================================================

const LEAF_COUNT = 5;

function Leaves({
  fillSV,
  waveTime,
  liquidTop,
  liquidBottom,
  vbWidth,
  color,
}: Omit<DrinkEffectLayerProps, 'effect'>) {
  const darkColor = useMemo(() => shiftColor(color, -0.35), [color]);
  const leaves = useMemo(
    () =>
      Array.from({ length: LEAF_COUNT }).map((_, i) => ({
        seedX: i * 23.7 + 3,
        seedY: i * 19.3 + 7,
        size: 5 + rand(i * 13.7) * 2.5, // 5..7.5 birim
        rotBase: rand(i * 7.3) * Math.PI * 2,
        bobOffset: rand(i * 11.3) * Math.PI * 2,
      })),
    [],
  );

  return (
    <>
      {leaves.map((l, i) => (
        <Leaf
          key={i}
          fillSV={fillSV}
          waveTime={waveTime}
          liquidTop={liquidTop}
          liquidBottom={liquidBottom}
          vbWidth={vbWidth}
          color={darkColor}
          xSeed={l.seedX}
          ySeed={l.seedY}
          size={l.size}
          rotBase={l.rotBase}
          bobOffset={l.bobOffset}
          index={i}
          total={LEAF_COUNT}
        />
      ))}
    </>
  );
}

function Leaf({
  fillSV,
  waveTime,
  liquidTop,
  liquidBottom,
  vbWidth,
  color,
  xSeed,
  ySeed,
  size,
  rotBase,
  bobOffset,
  index,
  total,
}: {
  fillSV: SharedValue<number>;
  waveTime: SharedValue<number>;
  liquidTop: number;
  liquidBottom: number;
  vbWidth: number;
  color: string;
  xSeed: number;
  ySeed: number;
  size: number;
  rotBase: number;
  bobOffset: number;
  index: number;
  total: number;
}) {
  // Yaprak — basit elips Circle (rotasyon yok, sallanma var).
  // Skia Circle çok hafif; SkPath SV diff'inden kaynaklı bug yok.
  const cx = useDerivedValue(() => {
    'worklet';
    const fill = fillSV.value;
    if (fill < 0.12) return -1000;
    if (index / total > fill * 1.3) return -1000;
    const baseX = (rand(xSeed) * 0.7 + 0.15) * vbWidth;
    const xWob = Math.sin(waveTime.value * 0.4 + bobOffset) * 1.5;
    return baseX + xWob;
  });

  const cy = useDerivedValue(() => {
    'worklet';
    const fill = fillSV.value;
    if (fill < 0.12) return -1000;
    if (index / total > fill * 1.3) return -1000;
    const surfaceY = liquidBottom - (liquidBottom - liquidTop) * fill;
    const yFrac = rand(ySeed) * 0.7 + 0.15;
    const baseY = surfaceY + (liquidBottom - surfaceY) * yFrac;
    const yWob = Math.sin(waveTime.value * 0.5 + bobOffset + 1) * 0.8;
    return baseY + yWob;
  });

  return <Circle cx={cx} cy={cy} r={size * 0.85} color={color} opacity={0.5} />;
}

// =============================================================================
// STEAM — gerçek buhar: çok katmanlı, üst üste binen, yumuşak beyaz partiküller.
// Bardağın üstünde havaya çıkar (clip dışında render edilir).
// =============================================================================

const STEAM_PARTICLE_COUNT = 12;
const STEAM_RISE_HEIGHT = 90; // viewBox biriminde, bardak ağzının üstüne

function Steam({
  fillSV,
  waveTime,
  liquidTop,
  liquidBottom,
  vbWidth,
}: Omit<DrinkEffectLayerProps, 'effect' | 'color'>) {
  const particles = useMemo(
    () =>
      Array.from({ length: STEAM_PARTICLE_COUNT }).map((_, i) => ({
        phase: i / STEAM_PARTICLE_COUNT,
        xSeed: rand(i * 7.31 + 1),
        speedSeed: rand(i * 11.7 + 3),
        wobSeed: rand(i * 13.5 + 7),
        sizeSeed: rand(i * 17.1 + 11),
      })),
    [],
  );

  return (
    <>
      {particles.map((p, i) => (
        <SteamParticle
          key={i}
          fillSV={fillSV}
          waveTime={waveTime}
          liquidTop={liquidTop}
          liquidBottom={liquidBottom}
          vbWidth={vbWidth}
          phase={p.phase}
          xSeed={p.xSeed}
          speedSeed={p.speedSeed}
          wobSeed={p.wobSeed}
          sizeSeed={p.sizeSeed}
        />
      ))}
    </>
  );
}

function SteamParticle({
  fillSV,
  waveTime,
  liquidTop,
  liquidBottom,
  vbWidth,
  phase,
  xSeed,
  speedSeed,
  wobSeed,
  sizeSeed,
}: {
  fillSV: SharedValue<number>;
  waveTime: SharedValue<number>;
  liquidTop: number;
  liquidBottom: number;
  vbWidth: number;
  phase: number;
  xSeed: number;
  speedSeed: number;
  wobSeed: number;
  sizeSeed: number;
}) {
  const speed = 0.16 + speedSeed * 0.1; // 0.16..0.26 (yavaş, gerçekçi)

  const cx = useDerivedValue(() => {
    'worklet';
    const t = (waveTime.value * speed + phase) % 1;
    const baseX = vbWidth * (0.32 + xSeed * 0.36); // ortada %32-68 dağıt
    const wobAmp = 1.5 + t * 6; // yükseldikçe genişler
    const wob = Math.sin(t * Math.PI * 2.5 + wobSeed * 6) * wobAmp;
    return baseX + wob;
  });

  const cy = useDerivedValue(() => {
    'worklet';
    const fill = fillSV.value;
    if (fill < 0.1) return -10000;
    // Sıvı yüzeyinden çıkar — surfaceY = bottom - (bottom - top) * fill
    const surfaceY = liquidBottom - (liquidBottom - liquidTop) * fill;
    const t = (waveTime.value * speed + phase) % 1;
    // Yukarı doğru rim'e kadar ve gerekirse Canvas'ın üstüne taşar (clip ile kesilir)
    return surfaceY - 1 - t * (surfaceY - liquidTop + 8);
  });

  const r = useDerivedValue(() => {
    'worklet';
    const t = (waveTime.value * speed + phase) % 1;
    const baseSize = 1.8 + sizeSeed * 1.6; // 1.8..3.4
    return baseSize + t * 4.5; // yükseldikçe büyür
  });

  const opacity = useDerivedValue(() => {
    'worklet';
    if (fillSV.value < 0.1) return 0;
    const t = (waveTime.value * speed + phase) % 1;
    let alpha;
    if (t < 0.12) {
      alpha = (t / 0.12) * 0.42;
    } else {
      alpha = 0.42 * (1 - (t - 0.12) / 0.88);
    }
    return alpha;
  });

  return <Circle cx={cx} cy={cy} r={r} color="#8E8E93" opacity={opacity} />;
}

// =============================================================================
// FOAM — yüzeyde köpürtü baloncukları (drink color koyu, yarı saydam)
// =============================================================================

// Köpük: yüzeyde 10 küçük yarı saydam beyaz baloncuk, hafif sallanan.
const FOAM_COUNT = 10;

function Foam({
  fillSV,
  waveTime,
  liquidTop,
  liquidBottom,
  vbWidth,
  color,
}: Omit<DrinkEffectLayerProps, 'effect'>) {
  const foamColor = useMemo(() => shiftColor(color, 0.55), [color]);
  const bubbles = useMemo(
    () =>
      Array.from({ length: FOAM_COUNT }).map((_, i) => ({
        xFrac: 0.06 + (i / FOAM_COUNT) * 0.88,
        size: 1.6 + rand(i * 7.7) * 1.4,
        bobOffset: rand(i * 13.1) * Math.PI * 2,
        ySeed: rand(i * 19.3),
      })),
    [],
  );

  return (
    <>
      {bubbles.map((b, i) => (
        <FoamBubble
          key={i}
          fillSV={fillSV}
          waveTime={waveTime}
          liquidTop={liquidTop}
          liquidBottom={liquidBottom}
          vbWidth={vbWidth}
          xFrac={b.xFrac}
          size={b.size}
          bobOffset={b.bobOffset}
          ySeed={b.ySeed}
          color={foamColor}
        />
      ))}
    </>
  );
}

function FoamBubble({
  fillSV,
  waveTime,
  liquidTop,
  liquidBottom,
  vbWidth,
  xFrac,
  size,
  bobOffset,
  ySeed,
  color,
}: {
  fillSV: SharedValue<number>;
  waveTime: SharedValue<number>;
  liquidTop: number;
  liquidBottom: number;
  vbWidth: number;
  xFrac: number;
  size: number;
  bobOffset: number;
  ySeed: number;
  color: string;
}) {
  const cx = useDerivedValue(() => {
    'worklet';
    const baseX = xFrac * vbWidth;
    return baseX + Math.sin(waveTime.value * 0.8 + bobOffset) * 1.2;
  });

  const cy = useDerivedValue(() => {
    'worklet';
    const fill = fillSV.value;
    if (fill < 0.1) return -100;
    const surfaceY = liquidBottom - (liquidBottom - liquidTop) * fill;
    // Yüzeyde 0..3 birim aşağıda dağıt, hafif zıplama
    const baseY = surfaceY + ySeed * 3;
    const bob = Math.sin(waveTime.value * 1.2 + bobOffset) * 0.6;
    return baseY + bob;
  });

  const opacity = useDerivedValue(() => {
    'worklet';
    if (fillSV.value < 0.1) return 0;
    return 0.75;
  });

  return <Circle cx={cx} cy={cy} r={size} color={color} opacity={opacity} />;
}

// =============================================================================
// RAIN — üstten ince damlalar düşer, yüzeye değince kaybolur
// =============================================================================

const RAIN_COUNT = 8;

function Rain({
  fillSV,
  waveTime,
  liquidTop,
  liquidBottom,
  vbWidth,
  color,
}: Omit<DrinkEffectLayerProps, 'effect'>) {
  const dropColor = useMemo(() => shiftColor(color, -0.45), [color]);
  const drops = useMemo(
    () =>
      Array.from({ length: RAIN_COUNT }).map((_, i) => ({
        xFrac: 0.1 + (i / RAIN_COUNT) * 0.85,
        speed: 0.6 + rand(i * 11.3) * 0.4,
        phase: rand(i * 19.7),
      })),
    [],
  );

  return (
    <>
      {drops.map((d, i) => (
        <RainDrop
          key={i}
          fillSV={fillSV}
          waveTime={waveTime}
          liquidTop={liquidTop}
          liquidBottom={liquidBottom}
          vbWidth={vbWidth}
          xFrac={d.xFrac}
          speed={d.speed}
          phase={d.phase}
          index={i}
          total={RAIN_COUNT}
          color={dropColor}
        />
      ))}
    </>
  );
}

function RainDrop({
  fillSV,
  waveTime,
  liquidTop,
  liquidBottom,
  vbWidth,
  xFrac,
  speed,
  phase,
  index,
  total,
  color,
}: {
  fillSV: SharedValue<number>;
  waveTime: SharedValue<number>;
  liquidTop: number;
  liquidBottom: number;
  vbWidth: number;
  xFrac: number;
  speed: number;
  phase: number;
  index: number;
  total: number;
  color: string;
}) {
  const cx = useDerivedValue(() => {
    'worklet';
    return xFrac * vbWidth;
  });

  const cy = useDerivedValue(() => {
    'worklet';
    const fill = fillSV.value;
    if (fill < 0.05) return -100;
    if (index / total > fill * 1.4) return -100;
    const surfaceY = liquidBottom - (liquidBottom - liquidTop) * fill;
    const t = (waveTime.value * speed + phase) % 1;
    // Yukarıdan yüzeye düşer
    return liquidTop + t * (surfaceY - liquidTop - 2);
  });

  const opacity = useDerivedValue(() => {
    'worklet';
    if (cy.value < 0) return 0;
    const t = (waveTime.value * speed + phase) % 1;
    if (t > 0.92) return 0;
    return 0.55;
  });

  return <Circle cx={cx} cy={cy} r={1.4} color={color} opacity={opacity} />;
}

// =============================================================================
// PULSE — sıvının kendisi ritmik parıldar (tüm yüzey overlay)
// =============================================================================

function Pulse({
  fillSV,
  waveTime,
  liquidTop,
  liquidBottom,
  vbWidth,
}: Omit<DrinkEffectLayerProps, 'effect' | 'color'>) {
  const opacity = useDerivedValue(() => {
    'worklet';
    if (fillSV.value < 0.05) return 0;
    // 1.4s'lik nabız: 0..0.18..0
    const t = (waveTime.value * 0.7) % 1;
    const pulse = Math.sin(t * Math.PI * 2) * 0.5 + 0.5; // 0..1
    return pulse * 0.18;
  });

  const y = useDerivedValue(() => {
    'worklet';
    const fill = fillSV.value;
    return liquidBottom - (liquidBottom - liquidTop) * fill;
  });

  const height = useDerivedValue(() => {
    'worklet';
    const fill = fillSV.value;
    return (liquidBottom - liquidTop) * fill + 2;
  });

  return (
    <RoundedRect
      x={0}
      y={y}
      width={vbWidth}
      height={height}
      r={0}
      color="white"
      opacity={opacity}
    />
  );
}

// =============================================================================
// Ana router
// =============================================================================

export function DrinkEffectLayer(props: DrinkEffectLayerProps) {
  const { effect, ...rest } = props;
  switch (effect) {
    case 'microBubbles':
      return <MicroBubbles {...rest} />;
    case 'bubbles':
      return <Bubbles {...rest} />;
    case 'iceCubes':
      return <IceCubes {...rest} />;
    case 'leaves':
      return <Leaves {...rest} />;
    case 'foam':
      return <Foam {...rest} />;
    case 'rain':
      return <Rain {...rest} />;
    case 'pulse':
      return <Pulse {...rest} />;
    case 'steam':
    case 'none':
    default:
      return null;
  }
}

/**
 * Bardağın üstünde (clip dışında) render edilen efektler.
 * Şu an sadece Steam — buhar bardak ağzından havaya yükselir.
 */
export function DrinkOutsideEffectLayer(props: DrinkEffectLayerProps) {
  const { effect, ...rest } = props;
  if (effect === 'steam') {
    return <Steam {...rest} />;
  }
  return null;
}

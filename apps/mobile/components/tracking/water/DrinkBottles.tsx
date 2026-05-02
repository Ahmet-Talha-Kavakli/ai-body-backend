/**
 * Premium drink bottle SVGs for the water vending machine.
 *
 * Stil: yumuşak hatlı, gradient'li, hafif gölgeli — premium-cute karışımı.
 * Her şişe `fillLevel` (0-1) destekler — hayalet (boş) durumdan dolu duruma geçiş için.
 * Renk paleti içecek kategorisine göre değişir.
 */

import React, { useEffect, useRef } from 'react';
import { Animated, Easing, View } from 'react-native';
import Svg, {
  Defs,
  Ellipse,
  LinearGradient,
  Path,
  Rect,
  Stop,
  ClipPath,
  G,
} from 'react-native-svg';

// ─── Types ─────────────────────────────────────────────────────────────────────
export type BottleKind =
  | 'water' // PET su şişesi
  | 'tea' // ince çay bardağı
  | 'coffee' // kupa
  | 'herbal' // bitki çayı (uzun bardak)
  | 'juice' // meyve suyu kutu/glass
  | 'sports' // spor şişesi
  | 'dairy' // süt bardağı
  | 'smoothie' // smoothie kavanoz
  | 'soda' // gazlı kutu
  | 'alcohol'; // şarap kadehi

export interface BottleProps {
  kind: BottleKind;
  fillLevel: number; // 0-1
  liquidColor: string;
  ghost?: boolean; // hayalet (boş slot)
  width?: number;
  height?: number;
  splashTrigger?: number; // her değiştiğinde 1 büyük dalga
}

const AnimatedRect = Animated.createAnimatedComponent(Rect);
const AnimatedPath = Animated.createAnimatedComponent(Path);

// ─── Wavy Liquid + Pour Stream + Ripple ───────────────────────────────────────
// 1) Sıvı path: alt kenar dolu, üst kenar dalgalı sinüs.
// 2) Pour mode (splashTrigger değişince ~1.4sn): sıvı 0 → fillLevel'e dolar
//    + üstten ağıza ince beyaz akış çizgisi + bitince kabın etrafında ripple halka.
interface WavyLiquidProps {
  xMin: number;
  xMax: number;
  yTop: number;
  yBottom: number;
  fillLevel: number;
  liquidColor: string;
  splashTrigger?: number;
}

const POUR_DURATION = 3000; // sıvının 0→target'a dolma süresi (3 saniye, premium yavaş)
const SPLASH_DURATION = 3200; // splash dalga decay süresi
const STREAM_DURATION = 2900; // pour stream görünür kalma süresi (sıvıdan az önce biter)

function WavyLiquid({
  xMin,
  xMax,
  yTop,
  yBottom,
  fillLevel,
  liquidColor,
  splashTrigger = 0,
}: WavyLiquidProps) {
  const pathRef = useRef<any>(null);
  const streamRef = useRef<any>(null);

  // Yeni slot için splashTrigger > 0 ile mount oluyorsa, sıvı 0'dan başlasın.
  // Yoksa hâlihazırda dolu (mount-snapshot) olarak başlat.
  const isPourMount = useRef(splashTrigger > 0).current;
  const initialLevel = isPourMount ? 0 : fillLevel;

  const fillRef = useRef(initialLevel);
  const splashRef = useRef(0);
  const splashStartRef = useRef(0);
  const fillStartRef = useRef(initialLevel);
  const fillTargetRef = useRef(initialLevel);
  const fillStartTsRef = useRef(performance.now());
  const streamStartRef = useRef(0);
  const lastSplashTrigger = useRef(splashTrigger);

  const innerW = xMax - xMin;
  const ampl = Math.max(2, innerW * 0.07);
  const wavelen = Math.max(30, innerW * 1.0);

  // FillLevel değişince smooth geçiş (splash ile çakışmasın diye sadece fillLevel değişince)
  useEffect(() => {
    if (fillTargetRef.current === fillLevel) return;
    fillStartRef.current = fillRef.current;
    fillTargetRef.current = fillLevel;
    fillStartTsRef.current = performance.now();
  }, [fillLevel]);

  // Splash + pour stream tetikleyici
  useEffect(() => {
    if (splashTrigger === 0 || splashTrigger === lastSplashTrigger.current) return;
    lastSplashTrigger.current = splashTrigger;
    splashRef.current = 1;
    splashStartRef.current = performance.now();
    streamStartRef.current = performance.now();
    // Sıvıyı 0'dan target'a doldur
    fillRef.current = 0;
    fillStartRef.current = 0;
    fillTargetRef.current = fillLevel;
    fillStartTsRef.current = performance.now();
  }, [splashTrigger]);

  // Animasyon loop
  useEffect(() => {
    let rafId: number;
    let mounted = true;

    const loop = () => {
      if (!mounted) return;
      const now = performance.now();

      // Fill progress — easeInOutQuint (yumuşak başla, ortada akıcı, yumuşak bit)
      const fillElapsed = now - fillStartTsRef.current;
      const fillProg = Math.min(1, fillElapsed / POUR_DURATION);
      const fillEased =
        fillProg < 0.5
          ? 16 * fillProg * fillProg * fillProg * fillProg * fillProg
          : 1 - Math.pow(-2 * fillProg + 2, 5) / 2;
      fillRef.current =
        fillStartRef.current + (fillTargetRef.current - fillStartRef.current) * fillEased;

      // Splash decay — easeOutQuart ile yumuşak söndürme
      if (splashRef.current > 0) {
        const splashElapsed = now - splashStartRef.current;
        const splashRaw = Math.min(1, splashElapsed / SPLASH_DURATION);
        const splashEased = 1 - Math.pow(splashRaw, 4); // 1 → 0 yumuşak
        splashRef.current = splashEased;
      }

      // Stream progress
      const streamElapsed = now - streamStartRef.current;
      const streamProg =
        streamStartRef.current > 0 ? Math.min(1, streamElapsed / STREAM_DURATION) : 1;

      const level = Math.max(0, Math.min(1, fillRef.current));
      const a = ampl * (1 + splashRef.current * 1.4); // 2.2 → 1.4 (soft)
      // baseY: yüzey Y konumu. Üst kenarı aşmaması için ampl kadar pay bırak.
      const rawBaseY = yBottom - (yBottom - yTop) * level;
      const baseY = Math.max(rawBaseY, yTop + a + 1); // dalga tepe noktası yTop'u geçmesin
      const t = now / 1000;
      const speed = 1.0 + splashRef.current * 0.9; // daha sakin dalgalanma

      // Liquid path
      let d = `M ${xMin.toFixed(2)} ${baseY.toFixed(2)}`;
      const step = 3;
      for (let x = xMin; x <= xMax; x += step) {
        const phase1 = ((x - xMin) / wavelen) * Math.PI * 2 + t * speed;
        const phase2 = ((x - xMin) / (wavelen * 0.62)) * Math.PI * 2 + t * speed * 1.4;
        const y = baseY + Math.sin(phase1) * a + Math.sin(phase2) * a * 0.4;
        d += ` L ${x.toFixed(2)} ${y.toFixed(2)}`;
      }
      d += ` L ${xMax.toFixed(2)} ${(yBottom + 5).toFixed(2)}`;
      d += ` L ${xMin.toFixed(2)} ${(yBottom + 5).toFixed(2)} Z`;

      if (pathRef.current?.setNativeProps) {
        pathRef.current.setNativeProps({ d });
      }

      // Pour stream — yumuşak akış (alt kısımda hafif damla şişmesi)
      if (streamRef.current?.setNativeProps) {
        const streamVisible = streamStartRef.current > 0 && streamProg < 1;
        if (streamVisible) {
          // X: hafif sallanma (daha az, daha yavaş — soft)
          const cx = (xMin + xMax) / 2 + Math.sin(t * 4) * 0.8;
          const streamTopY = Math.max(yTop - 22, 0);
          // Görünürlük: yumuşak fade-in (ilk 15%) + uzun açık + yumuşak fade-out (son 30%)
          let streamOp;
          if (streamProg < 0.15) streamOp = streamProg / 0.15;
          else if (streamProg < 0.7) streamOp = 1;
          else streamOp = 1 - (streamProg - 0.7) / 0.3;
          // Üstte ince (1.2px), altta hafif şişme (1.8px) — damlama hissi
          const wTop = 1.2;
          const wBottom = 1.8;
          const sd = `M ${(cx - wTop / 2).toFixed(2)} ${streamTopY.toFixed(2)}
            L ${(cx + wTop / 2).toFixed(2)} ${streamTopY.toFixed(2)}
            L ${(cx + wBottom / 2).toFixed(2)} ${baseY.toFixed(2)}
            L ${(cx - wBottom / 2).toFixed(2)} ${baseY.toFixed(2)} Z`;
          streamRef.current.setNativeProps({ d: sd, opacity: streamOp });
        } else {
          streamRef.current.setNativeProps({ opacity: 0 });
        }
      }

      rafId = requestAnimationFrame(loop);
    };

    rafId = requestAnimationFrame(loop);
    return () => {
      mounted = false;
      cancelAnimationFrame(rafId);
    };
  }, [xMin, xMax, yTop, yBottom, ampl, wavelen]);

  const initialBaseY = yBottom - (yBottom - yTop) * initialLevel;
  const initialD = `M ${xMin} ${initialBaseY} L ${xMax} ${initialBaseY} L ${xMax} ${yBottom + 5} L ${xMin} ${yBottom + 5} Z`;

  return (
    <>
      <Path ref={pathRef} d={initialD} fill={liquidColor} />
      <Path ref={streamRef} d="M 0 0" fill={liquidColor} opacity={0} />
    </>
  );
}

// ─── Category → bottle kind & default color ────────────────────────────────────
export function categoryToBottle(category: string): BottleKind {
  switch (category) {
    case 'water':
      return 'water';
    case 'tea':
      return 'tea';
    case 'coffee':
      return 'coffee';
    case 'herbal':
      return 'herbal';
    case 'juice':
      return 'juice';
    case 'sports':
      return 'sports';
    case 'dairy':
      return 'dairy';
    case 'smoothie':
      return 'smoothie';
    case 'soda':
      return 'soda';
    case 'alcohol':
      return 'alcohol';
    default:
      return 'juice';
  }
}

export function categoryToColor(category: string): string {
  switch (category) {
    case 'water':
      return '#32ADE6';
    case 'tea':
      return '#C8860A';
    case 'coffee':
      return '#5B3424';
    case 'herbal':
      return '#7DB94A';
    case 'juice':
      return '#FF8C00';
    case 'sports':
      return '#00D4AA';
    case 'dairy':
      return '#E8E4D0';
    case 'smoothie':
      return '#C060C0';
    case 'soda':
      return '#D4A820';
    case 'alcohol':
      return '#A0522D';
    default:
      return '#32ADE6';
  }
}

// ─── Animated fill hook ────────────────────────────────────────────────────────
function useFillAnim(fillLevel: number) {
  const anim = useRef(new Animated.Value(fillLevel)).current;
  const prev = useRef(fillLevel);
  useEffect(() => {
    if (prev.current === fillLevel) return;
    prev.current = fillLevel;
    Animated.timing(anim, {
      toValue: fillLevel,
      duration: 950,
      useNativeDriver: false,
      easing: Easing.bezier(0.22, 1, 0.36, 1),
    }).start();
  }, [fillLevel]);
  return anim;
}

// ─── Helper: ghost styling ─────────────────────────────────────────────────────
function ghostProps(ghost: boolean) {
  return {
    opacity: ghost ? 0.22 : 1,
  };
}

// ─── 1. Water (PET) ───────────────────────────────────────────────────────────
function WaterBottle({
  fillLevel,
  liquidColor,
  ghost,
  width = 60,
  height = 130,
  splashTrigger,
}: BottleProps) {
  const VB_W = 60,
    VB_H = 130;

  return (
    <View style={ghostProps(!!ghost)}>
      <Svg width={width} height={height} viewBox={`0 0 ${VB_W} ${VB_H}`}>
        <Defs>
          <LinearGradient id="waterBody" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor="#FFFFFF" stopOpacity="0.95" />
            <Stop offset="0.5" stopColor="#F0F8FB" stopOpacity="0.85" />
            <Stop offset="1" stopColor="#D8E8EE" stopOpacity="0.9" />
          </LinearGradient>
          <ClipPath id="waterClip">
            <Path d="M 22 18 L 38 18 L 38 28 L 44 36 L 44 116 Q 44 122 38 122 L 22 122 Q 16 122 16 116 L 16 36 L 22 28 Z" />
          </ClipPath>
        </Defs>
        {/* Cap */}
        <Rect x="22" y="6" width="16" height="14" rx="2" fill={ghost ? '#C0C0C0' : '#3A3A3C'} />
        {/* Body */}
        <Path
          d="M 22 18 L 38 18 L 38 28 L 44 36 L 44 116 Q 44 122 38 122 L 22 122 Q 16 122 16 116 L 16 36 L 22 28 Z"
          fill="url(#waterBody)"
          stroke={ghost ? '#B0B0B0' : '#A8C5D0'}
          strokeWidth="1.2"
        />
        {/* Wavy liquid */}
        {!ghost && (
          <G clipPath="url(#waterClip)">
            <WavyLiquid
              xMin={16}
              xMax={44}
              yTop={36}
              yBottom={120}
              fillLevel={fillLevel}
              liquidColor={liquidColor}
              splashTrigger={splashTrigger}
            />
          </G>
        )}
        {/* Highlight stripe */}
        <Path
          d="M 20 30 L 20 110"
          stroke="#FFFFFF"
          strokeWidth="1.5"
          strokeOpacity="0.6"
          strokeLinecap="round"
        />
        {/* Label band */}
        <Rect
          x="16"
          y="62"
          width="28"
          height="14"
          fill={ghost ? '#FFFFFF' : '#FFFFFF'}
          fillOpacity="0.45"
        />
      </Svg>
    </View>
  );
}

// ─── 2. Tea (ince bardak) ──────────────────────────────────────────────────────
function TeaGlass({
  fillLevel,
  liquidColor,
  ghost,
  width = 50,
  height = 110,
  splashTrigger,
}: BottleProps) {
  const VB_W = 50,
    VB_H = 110;

  return (
    <View style={ghostProps(!!ghost)}>
      <Svg width={width} height={height} viewBox={`0 0 ${VB_W} ${VB_H}`}>
        <Defs>
          <LinearGradient id="teaBody" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor="#FFFFFF" stopOpacity="0.85" />
            <Stop offset="1" stopColor="#E8EEF0" stopOpacity="0.7" />
          </LinearGradient>
          <ClipPath id="teaClip">
            <Path d="M 14 26 L 36 26 L 38 96 Q 38 100 34 100 L 16 100 Q 12 100 12 96 Z" />
          </ClipPath>
        </Defs>
        <Ellipse
          cx="25"
          cy="104"
          rx="22"
          ry="3"
          fill={ghost ? '#D0D0D0' : '#8E8E93'}
          fillOpacity="0.4"
        />
        <Path
          d="M 14 26 L 36 26 L 38 96 Q 38 100 34 100 L 16 100 Q 12 100 12 96 Z"
          fill="url(#teaBody)"
          stroke={ghost ? '#B0B0B0' : '#C0A878'}
          strokeWidth="1.2"
        />
        {!ghost && (
          <G clipPath="url(#teaClip)">
            <WavyLiquid
              xMin={12}
              xMax={38}
              yTop={28}
              yBottom={99}
              fillLevel={fillLevel}
              liquidColor={liquidColor}
              splashTrigger={splashTrigger}
            />
          </G>
        )}
        <Path
          d="M 14 26 L 36 26"
          stroke={ghost ? '#A0A0A0' : '#8B7340'}
          strokeWidth="2"
          strokeLinecap="round"
        />
        <Path
          d="M 16 32 L 16 90"
          stroke="#FFFFFF"
          strokeWidth="1.5"
          strokeOpacity="0.55"
          strokeLinecap="round"
        />
      </Svg>
    </View>
  );
}

// ─── 3. Coffee (kupa) ──────────────────────────────────────────────────────────
function CoffeeCup({
  fillLevel,
  liquidColor,
  ghost,
  width = 60,
  height = 100,
  splashTrigger,
}: BottleProps) {
  const VB_W = 60,
    VB_H = 100;

  return (
    <View style={ghostProps(!!ghost)}>
      <Svg width={width} height={height} viewBox={`0 0 ${VB_W} ${VB_H}`}>
        <Defs>
          <LinearGradient id="coffeeBody" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor="#FFFFFF" stopOpacity="1" />
            <Stop offset="1" stopColor="#E8E4DA" stopOpacity="1" />
          </LinearGradient>
          <ClipPath id="coffeeClip">
            <Path d="M 12 30 L 42 30 L 40 86 Q 40 90 36 90 L 18 90 Q 14 90 14 86 Z" />
          </ClipPath>
        </Defs>
        {/* Handle */}
        <Path
          d="M 42 42 Q 54 44 54 56 Q 54 68 42 70"
          fill="none"
          stroke={ghost ? '#B0B0B0' : '#9C8B7A'}
          strokeWidth="4"
          strokeLinecap="round"
        />
        {/* Cup */}
        <Path
          d="M 12 30 L 42 30 L 40 86 Q 40 90 36 90 L 18 90 Q 14 90 14 86 Z"
          fill="url(#coffeeBody)"
          stroke={ghost ? '#B0B0B0' : '#9C8B7A'}
          strokeWidth="1.4"
        />
        {!ghost && (
          <G clipPath="url(#coffeeClip)">
            <WavyLiquid
              xMin={14}
              xMax={40}
              yTop={32}
              yBottom={89}
              fillLevel={fillLevel}
              liquidColor={liquidColor}
              splashTrigger={splashTrigger}
            />
          </G>
        )}
        {/* Rim */}
        <Ellipse
          cx="27"
          cy="30"
          rx="15"
          ry="2.5"
          fill="none"
          stroke={ghost ? '#A0A0A0' : '#7A6A5A'}
          strokeWidth="1.5"
        />
        {/* Steam (sadece dolu kupa) */}
        {!ghost && fillLevel > 0.3 && (
          <>
            <Path
              d="M 22 18 Q 24 12 22 6"
              stroke="#C0C0C0"
              strokeWidth="1.5"
              strokeLinecap="round"
              fill="none"
              opacity="0.5"
            />
            <Path
              d="M 30 16 Q 32 10 30 4"
              stroke="#C0C0C0"
              strokeWidth="1.5"
              strokeLinecap="round"
              fill="none"
              opacity="0.5"
            />
          </>
        )}
      </Svg>
    </View>
  );
}

// ─── 4. Herbal (uzun bardak) ───────────────────────────────────────────────────
function HerbalGlass(props: BottleProps) {
  // tea ile aynı şekil ama renk farklı; reuse
  return <TeaGlass {...props} />;
}

// ─── 5. Juice (kavanoz tarzı) ──────────────────────────────────────────────────
function JuiceGlass({
  fillLevel,
  liquidColor,
  ghost,
  width = 56,
  height = 110,
  splashTrigger,
}: BottleProps) {
  const VB_W = 56,
    VB_H = 110;

  return (
    <View style={ghostProps(!!ghost)}>
      <Svg width={width} height={height} viewBox={`0 0 ${VB_W} ${VB_H}`}>
        <Defs>
          <LinearGradient id="juiceBody" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor="#FFFFFF" stopOpacity="0.9" />
            <Stop offset="1" stopColor="#F0EDE0" stopOpacity="0.75" />
          </LinearGradient>
          <ClipPath id="juiceClip">
            <Path d="M 12 22 L 44 22 L 44 98 Q 44 104 38 104 L 18 104 Q 12 104 12 98 Z" />
          </ClipPath>
        </Defs>
        <Path
          d="M 12 22 L 44 22 L 44 98 Q 44 104 38 104 L 18 104 Q 12 104 12 98 Z"
          fill="url(#juiceBody)"
          stroke={ghost ? '#B0B0B0' : '#D0A060'}
          strokeWidth="1.3"
        />
        {!ghost && (
          <G clipPath="url(#juiceClip)">
            <WavyLiquid
              xMin={12}
              xMax={44}
              yTop={24}
              yBottom={103}
              fillLevel={fillLevel}
              liquidColor={liquidColor}
              splashTrigger={splashTrigger}
            />
          </G>
        )}
        {!ghost && (
          <Path d="M 32 8 L 36 60" stroke="#FF6B35" strokeWidth="2.5" strokeLinecap="round" />
        )}
        <Path
          d="M 16 28 L 16 92"
          stroke="#FFFFFF"
          strokeWidth="1.5"
          strokeOpacity="0.55"
          strokeLinecap="round"
        />
      </Svg>
    </View>
  );
}

// ─── 6. Sports bottle ──────────────────────────────────────────────────────────
function SportsBottle({
  fillLevel,
  liquidColor,
  ghost,
  width = 54,
  height = 130,
  splashTrigger,
}: BottleProps) {
  const VB_W = 54,
    VB_H = 130;

  return (
    <View style={ghostProps(!!ghost)}>
      <Svg width={width} height={height} viewBox={`0 0 ${VB_W} ${VB_H}`}>
        <Defs>
          <LinearGradient id="sportBody" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor={ghost ? '#E0E0E0' : '#2C8A75'} stopOpacity="0.9" />
            <Stop offset="0.5" stopColor={ghost ? '#F0F0F0' : '#3DAA92'} stopOpacity="0.95" />
            <Stop offset="1" stopColor={ghost ? '#D0D0D0' : '#1F6B5C'} stopOpacity="0.9" />
          </LinearGradient>
          <ClipPath id="sportClip">
            <Path d="M 14 32 L 40 32 L 42 118 Q 42 124 36 124 L 18 124 Q 12 124 12 118 Z" />
          </ClipPath>
        </Defs>
        {/* Sports cap */}
        <Path d="M 22 4 L 32 4 L 34 14 L 20 14 Z" fill={ghost ? '#A0A0A0' : '#1F6B5C'} />
        <Rect x="22" y="14" width="10" height="6" fill={ghost ? '#909090' : '#155248'} />
        <Rect x="14" y="20" width="26" height="14" rx="2" fill={ghost ? '#B0B0B0' : '#247568'} />
        {/* Body */}
        <Path
          d="M 14 32 L 40 32 L 42 118 Q 42 124 36 124 L 18 124 Q 12 124 12 118 Z"
          fill="url(#sportBody)"
          stroke={ghost ? '#A0A0A0' : '#155248'}
          strokeWidth="1.2"
        />
        {!ghost && (
          <G clipPath="url(#sportClip)">
            <WavyLiquid
              xMin={12}
              xMax={42}
              yTop={34}
              yBottom={123}
              fillLevel={fillLevel}
              liquidColor={liquidColor}
              splashTrigger={splashTrigger}
            />
          </G>
        )}
        {/* Side band */}
        <Rect x="14" y="60" width="28" height="3" fill="#FFFFFF" fillOpacity="0.4" />
        <Rect x="14" y="86" width="28" height="3" fill="#FFFFFF" fillOpacity="0.4" />
      </Svg>
    </View>
  );
}

// ─── 7. Dairy (süt bardağı) ────────────────────────────────────────────────────
function MilkGlass(props: BottleProps) {
  return <JuiceGlass {...props} />;
}

// ─── 8. Smoothie (kavanoz) ─────────────────────────────────────────────────────
function SmoothieJar({
  fillLevel,
  liquidColor,
  ghost,
  width = 60,
  height = 110,
  splashTrigger,
}: BottleProps) {
  const VB_W = 60,
    VB_H = 110;

  return (
    <View style={ghostProps(!!ghost)}>
      <Svg width={width} height={height} viewBox={`0 0 ${VB_W} ${VB_H}`}>
        <Defs>
          <LinearGradient id="smBody" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor="#FFFFFF" stopOpacity="0.92" />
            <Stop offset="1" stopColor="#E8E0E8" stopOpacity="0.78" />
          </LinearGradient>
          <ClipPath id="smClip">
            <Rect x="12" y="28" width="36" height="68" rx="3" />
          </ClipPath>
        </Defs>
        {/* Lid */}
        <Rect x="14" y="10" width="32" height="14" rx="3" fill={ghost ? '#B0B0B0' : '#8B5CB7'} />
        <Rect x="14" y="22" width="32" height="6" fill={ghost ? '#A0A0A0' : '#6B3F94'} />
        {/* Jar body */}
        <Rect
          x="12"
          y="28"
          width="36"
          height="68"
          rx="3"
          fill="url(#smBody)"
          stroke={ghost ? '#B0B0B0' : '#8B5CB7'}
          strokeWidth="1.3"
        />
        {!ghost && (
          <G clipPath="url(#smClip)">
            <WavyLiquid
              xMin={12}
              xMax={48}
              yTop={30}
              yBottom={95}
              fillLevel={fillLevel}
              liquidColor={liquidColor}
              splashTrigger={splashTrigger}
            />
          </G>
        )}
        {/* Straw */}
        {!ghost && (
          <Path d="M 36 4 L 40 64" stroke="#FF6B35" strokeWidth="2.5" strokeLinecap="round" />
        )}
        {/* Highlight */}
        <Path
          d="M 16 34 L 16 90"
          stroke="#FFFFFF"
          strokeWidth="1.5"
          strokeOpacity="0.6"
          strokeLinecap="round"
        />
      </Svg>
    </View>
  );
}

// ─── 9. Soda (kutu) ────────────────────────────────────────────────────────────
function SodaCan({
  fillLevel,
  liquidColor,
  ghost,
  width = 50,
  height = 120,
  splashTrigger,
}: BottleProps) {
  const VB_W = 50,
    VB_H = 120;

  return (
    <View style={ghostProps(!!ghost)}>
      <Svg width={width} height={height} viewBox={`0 0 ${VB_W} ${VB_H}`}>
        <Defs>
          <LinearGradient id="sodaBody" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor={ghost ? '#D0D0D0' : '#B89018'} stopOpacity="1" />
            <Stop offset="0.5" stopColor={ghost ? '#F0F0F0' : '#E0B838'} stopOpacity="1" />
            <Stop offset="1" stopColor={ghost ? '#C0C0C0' : '#9C7810'} stopOpacity="1" />
          </LinearGradient>
          <ClipPath id="sodaClip">
            <Rect x="10" y="20" width="30" height="86" rx="2" />
          </ClipPath>
        </Defs>
        {/* Top */}
        <Ellipse cx="25" cy="14" rx="14" ry="4" fill={ghost ? '#A0A0A0' : '#7A6010'} />
        <Rect x="11" y="14" width="28" height="8" fill={ghost ? '#B0B0B0' : '#8C7010'} />
        {/* Body */}
        <Rect
          x="10"
          y="20"
          width="30"
          height="86"
          rx="2"
          fill="url(#sodaBody)"
          stroke={ghost ? '#A0A0A0' : '#7A6010'}
          strokeWidth="1"
        />
        {/* Soda kutu opak — liquid görünmez */}
        {/* Highlight */}
        <Path
          d="M 14 26 L 14 100"
          stroke="#FFFFFF"
          strokeWidth="1.5"
          strokeOpacity="0.5"
          strokeLinecap="round"
        />
        {/* Bottom rim */}
        <Ellipse
          cx="25"
          cy="106"
          rx="14"
          ry="3"
          fill={ghost ? '#A0A0A0' : '#7A6010'}
          fillOpacity="0.6"
        />
      </Svg>
    </View>
  );
}

// ─── 10. Wine glass ────────────────────────────────────────────────────────────
function WineGlass({
  fillLevel,
  liquidColor,
  ghost,
  width = 50,
  height = 120,
  splashTrigger,
}: BottleProps) {
  const VB_W = 50,
    VB_H = 120;

  return (
    <View style={ghostProps(!!ghost)}>
      <Svg width={width} height={height} viewBox={`0 0 ${VB_W} ${VB_H}`}>
        <Defs>
          <LinearGradient id="wineBody" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor="#FFFFFF" stopOpacity="0.9" />
            <Stop offset="1" stopColor="#E8E0E8" stopOpacity="0.75" />
          </LinearGradient>
          <ClipPath id="wineClip">
            <Path d="M 10 10 L 40 10 L 36 50 Q 36 62 25 62 Q 14 62 14 50 Z" />
          </ClipPath>
        </Defs>
        {/* Bowl */}
        <Path
          d="M 10 10 L 40 10 L 36 50 Q 36 62 25 62 Q 14 62 14 50 Z"
          fill="url(#wineBody)"
          stroke={ghost ? '#B0B0B0' : '#9A6A8A'}
          strokeWidth="1.2"
        />
        {!ghost && (
          <G clipPath="url(#wineClip)">
            <WavyLiquid
              xMin={10}
              xMax={40}
              yTop={12}
              yBottom={60}
              fillLevel={fillLevel}
              liquidColor={liquidColor}
              splashTrigger={splashTrigger}
            />
          </G>
        )}
        {/* Stem */}
        <Path
          d="M 25 62 L 25 102"
          stroke={ghost ? '#B0B0B0' : '#9A6A8A'}
          strokeWidth="2"
          strokeLinecap="round"
        />
        {/* Base */}
        <Ellipse
          cx="25"
          cy="106"
          rx="12"
          ry="3"
          fill={ghost ? '#C0C0C0' : '#9A6A8A'}
          fillOpacity="0.8"
        />
      </Svg>
    </View>
  );
}

// ─── Main Switch ───────────────────────────────────────────────────────────────
export function DrinkBottle(props: BottleProps) {
  switch (props.kind) {
    case 'water':
      return <WaterBottle {...props} />;
    case 'tea':
      return <TeaGlass {...props} />;
    case 'herbal':
      return <HerbalGlass {...props} />;
    case 'coffee':
      return <CoffeeCup {...props} />;
    case 'juice':
      return <JuiceGlass {...props} />;
    case 'sports':
      return <SportsBottle {...props} />;
    case 'dairy':
      return <MilkGlass {...props} />;
    case 'smoothie':
      return <SmoothieJar {...props} />;
    case 'soda':
      return <SodaCan {...props} />;
    case 'alcohol':
      return <WineGlass {...props} />;
    default:
      return <WaterBottle {...props} />;
  }
}

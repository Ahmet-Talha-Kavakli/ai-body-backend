/**
 * Drink container SVG components — accurate shapes + animated liquid fill + pour stream.
 *
 * Stanley variants:
 *   stanley   → 40oz Quencher (2 L goal)  — handle, wide top, shoulder step
 *   stanley2  → 64oz (2.5 L goal)         — same shape, wider + taller
 *   (no-handle variants omitted — we only use 40oz & 64oz in goal mapping)
 */

import React, { useRef, useEffect } from 'react';
import { Animated, Easing, View } from 'react-native';
import Svg, { Path, Rect, Ellipse, Defs, LinearGradient, Stop } from 'react-native-svg';

// ─── Types ─────────────────────────────────────────────────────────────────────
export type ContainerKind =
  | 'pet'
  | 'stanley'
  | 'stanley2'
  | 'damacana'
  | 'teaglass'
  | 'coffeecup'
  | 'juiceglass'
  | 'sportsbottle'
  | 'milkglass'
  | 'sodacan'
  | 'wineglass'
  | 'smoothieglass';

export interface ContainerProps {
  kind: ContainerKind;
  fillLevel: number;
  liquidColor: string;
  width?: number;
  height?: number;
  isPouring?: boolean;
}

// ─── Mappings ──────────────────────────────────────────────────────────────────
export function goalToKind(goalMl: number): ContainerKind {
  if (goalMl <= 1500) return 'pet';
  if (goalMl <= 2000) return 'stanley'; // 40oz Quencher
  if (goalMl <= 3000) return 'stanley2'; // 64oz
  return 'damacana';
}

export function categoryToKind(category: string): ContainerKind {
  switch (category) {
    case 'water':
      return 'pet';
    case 'tea':
      return 'teaglass';
    case 'coffee':
      return 'coffeecup';
    case 'herbal':
      return 'teaglass';
    case 'juice':
      return 'juiceglass';
    case 'sports':
      return 'sportsbottle';
    case 'dairy':
      return 'milkglass';
    case 'smoothie':
      return 'smoothieglass';
    case 'soda':
      return 'sodacan';
    case 'alcohol':
      return 'wineglass';
    default:
      return 'juiceglass';
  }
}

export function categoryToColor(category: string): string {
  switch (category) {
    case 'water':
      return '#32ADE6';
    case 'tea':
      return '#C8860A';
    case 'coffee':
      return '#6B3A2A';
    case 'herbal':
      return '#7DB94A';
    case 'juice':
      return '#FF8C00';
    case 'sports':
      return '#00D4AA';
    case 'dairy':
      return '#D8D8C0';
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

// ─── Fill animation hook ───────────────────────────────────────────────────────
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

// ─── Pour stream ───────────────────────────────────────────────────────────────
function PourStream({ cx, color, isPouring }: { cx: number; color: string; isPouring: boolean }) {
  const op = useRef(new Animated.Value(0)).current;
  const h = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!isPouring) return;
    op.setValue(1);
    h.setValue(0);
    Animated.sequence([
      Animated.timing(h, {
        toValue: 30,
        duration: 500,
        useNativeDriver: false,
        easing: Easing.bezier(0.16, 1, 0.3, 1),
      }),
      Animated.timing(op, {
        toValue: 0,
        duration: 280,
        useNativeDriver: false,
        easing: Easing.bezier(0.4, 0, 1, 1),
      }),
    ]).start();
  }, [isPouring]);
  return (
    <Animated.View
      style={{
        position: 'absolute',
        top: -2,
        left: cx - 3,
        width: 6,
        opacity: op,
        overflow: 'hidden',
      }}
    >
      <Animated.View style={{ width: 6, height: h, borderRadius: 3, backgroundColor: color }} />
    </Animated.View>
  );
}

// ─── Liquid fill layer ────────────────────────────────────────────────────────
// Placed behind the SVG overlay. overflow:hidden clips liquid to container shape
// when the container body SVG is semi-transparent on top.
function LiquidLayer({
  fillAnim,
  color,
  w,
  h,
  rx = 4,
}: {
  fillAnim: Animated.Value;
  color: string;
  w: number;
  h: number;
  rx?: number;
}) {
  const lH = fillAnim.interpolate({ inputRange: [0, 1], outputRange: [0, h] });
  return (
    <View style={{ width: w, height: h, overflow: 'hidden', borderRadius: rx }}>
      <Animated.View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: lH,
          backgroundColor: color,
          opacity: 0.8,
        }}
      />
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// STANLEY 40oz QUENCHER  (2 L goal)
// Shape: wide upper cylinder → visible shoulder step → narrower tapered lower
// Large D-handle on right, dome lid, straw
// ═══════════════════════════════════════════════════════════════════════════════
export function StanleyTumbler({
  fillLevel,
  liquidColor,
  width = 94,
  height = 200,
  isPouring = false,
}: ContainerProps) {
  const W = width;
  const H = height;
  const fillAnim = useFillAnim(fillLevel);

  // ── Straw ──
  const strawW = 7;
  const strawH = H * 0.16;
  const strawCX = W * 0.5;

  // ── Lid ──
  const lidY = strawH - 8;
  const lidH = H * 0.09;
  const lidW = W * 0.82;
  const lidX = (W - lidW) / 2;

  // ── Metallic rim band ──
  const rimY = lidY + lidH;
  const rimH = 5;
  const rimW = W * 0.88;
  const rimX = (W - rimW) / 2;

  // ── Upper body (wide cylinder, slightly tapered) ──
  const upY = rimY + rimH;
  const upTW = W * 0.82; // top of upper body
  const upTX = (W - upTW) / 2;
  const upBW = W * 0.84; // bottom of upper body (very slightly wider = bulge)
  const upBX = (W - upBW) / 2;
  const upH = H * 0.52; // upper body takes ~52% of height

  // ── Shoulder step ──
  const shY = upY + upH;
  const shW = W * 0.66; // body narrows at shoulder
  const shX = (W - shW) / 2;

  // ── Lower tapered body ──
  const loH = H * 0.16;
  const loBW = W * 0.58; // narrows further toward base
  const loBX = (W - loBW) / 2;

  // ── Base ──
  const baseY = shY + loH;
  const baseW = W * 0.54;
  const baseX = (W - baseW) / 2;
  const baseH = H * 0.045;

  // Body outline path (right side is open for handle)
  const bodyPath = [
    // top-left → down left side of upper body
    `M${upTX},${upY}`,
    `L${upBX},${shY}`,
    // shoulder step left
    `L${shX},${shY}`,
    // lower left, taper to base
    `L${loBX},${shY + loH}`,
    `L${baseX},${baseY}`,
    `L${baseX},${baseY + baseH}`,
    // base bottom
    `L${baseX + baseW},${baseY + baseH}`,
    `L${baseX + baseW},${baseY}`,
    // right of lower body
    `L${loBX + loBW},${shY + loH}`,
    // shoulder step right
    `L${shX + shW},${shY}`,
    // right side upper body
    `L${upBX + upBW},${shY}`,
    `L${upTX + upTW},${upY}`,
    'Z',
  ].join(' ');

  // Handle — large D, attached to right side of upper body
  const hLeft = upBX + upBW - 2;
  const hTop = upY + upH * 0.1;
  const hBot = upY + upH * 0.6;
  const hMid = (hTop + hBot) / 2;
  const hOut = hLeft + W * 0.24;

  const handlePath = [
    `M${hLeft},${hTop}`,
    `C${hLeft + 8},${hTop} ${hOut},${hTop + 6} ${hOut},${hMid}`,
    `C${hOut},${hBot - 6} ${hLeft + 8},${hBot} ${hLeft},${hBot}`,
    `L${hLeft + 9},${hBot}`,
    `C${hOut - 7},${hBot - 4} ${hOut - 7},${hTop + 4} ${hLeft + 9},${hTop}`,
    'Z',
  ].join(' ');

  // Liquid layer positioned over upper+lower body
  const liqX = upBX + 2;
  const liqW = upBW - 4;
  const liqH = baseY + baseH - upY - 4;

  return (
    <View style={{ width: W, height: H }}>
      {/* Liquid behind SVG */}
      <View style={{ position: 'absolute', top: upY + 2, left: liqX }}>
        <LiquidLayer fillAnim={fillAnim} color={liquidColor} w={liqW} h={liqH} rx={6} />
      </View>

      <Svg width={W} height={H} style={{ position: 'absolute', top: 0, left: 0 }}>
        <Defs>
          <LinearGradient id="stanleyBodyGrad" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor="#FFFFFF" stopOpacity="0.30" />
            <Stop offset="0.35" stopColor="#FFFFFF" stopOpacity="0.06" />
            <Stop offset="1" stopColor="#000000" stopOpacity="0.10" />
          </LinearGradient>
          <LinearGradient id="handleGrad" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor="#EAE6DE" stopOpacity="1" />
            <Stop offset="1" stopColor="#D6D2CA" stopOpacity="1" />
          </LinearGradient>
        </Defs>

        {/* Straw */}
        <Rect
          x={strawCX - strawW / 2}
          y={0}
          width={strawW}
          height={strawH + 4}
          rx={strawW / 2}
          fill="#EEEAE4"
          stroke="#D8D4CE"
          strokeWidth={0.8}
        />

        {/* Lid */}
        <Path
          d={`M${lidX},${lidY + lidH} Q${lidX},${lidY} ${lidX + lidW / 2},${lidY - 4} Q${lidX + lidW},${lidY} ${lidX + lidW},${lidY + lidH} Z`}
          fill="#F4F1EC"
          stroke="#D8D4CE"
          strokeWidth={1}
        />
        {/* Straw hole on lid */}
        <Ellipse cx={strawCX} cy={lidY + lidH * 0.3} rx={strawW / 2 + 2} ry={4} fill="#DDD9D2" />

        {/* Metallic rim */}
        <Rect
          x={rimX}
          y={rimY}
          width={rimW}
          height={rimH}
          rx={2.5}
          fill="#C4C0BA"
          stroke="#B0ACA6"
          strokeWidth={0.6}
        />

        {/* Handle (draw before body so body overlaps handle edge) */}
        <Path d={handlePath} fill="url(#handleGrad)" stroke="#C4C0B8" strokeWidth={1} />

        {/* Body — semi-transparent cream/ivory so liquid shows through */}
        <Path d={bodyPath} fill="rgba(240,237,232,0.52)" stroke="#C4C0B8" strokeWidth={1.5} />

        {/* Left shine */}
        <Rect
          x={upTX + 7}
          y={upY + 10}
          width={6}
          height={upH * 0.42}
          rx={3}
          fill="rgba(255,255,255,0.55)"
        />

        {/* Shoulder shadow line */}
        <Path
          d={`M${shX + 2},${shY + 1} L${shX + shW - 2},${shY + 1}`}
          stroke="rgba(0,0,0,0.12)"
          strokeWidth={1.5}
          strokeLinecap="round"
        />

        {/* Base */}
        <Rect
          x={baseX}
          y={baseY}
          width={baseW}
          height={baseH}
          rx={3}
          fill="#D4D0CA"
          stroke="#C0BDB7"
          strokeWidth={0.8}
        />
      </Svg>

      <PourStream cx={strawCX} color={liquidColor} isPouring={isPouring} />
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// STANLEY 64oz  (2.5 L goal)  — Same silhouette, wider + taller
// ═══════════════════════════════════════════════════════════════════════════════
export function StanleyWide({
  fillLevel,
  liquidColor,
  width = 108,
  height = 220,
  isPouring = false,
}: ContainerProps) {
  const W = width;
  const H = height;
  const fillAnim = useFillAnim(fillLevel);

  const strawW = 8;
  const strawH = H * 0.15;
  const strawCX = W * 0.5;

  const lidY = strawH - 8;
  const lidH = H * 0.08;
  const lidW = W * 0.84;
  const lidX = (W - lidW) / 2;
  const rimY = lidY + lidH;
  const rimH = 6;
  const rimW = W * 0.9;
  const rimX = (W - rimW) / 2;

  const upY = rimY + rimH;
  const upTW = W * 0.84;
  const upTX = (W - upTW) / 2;
  const upBW = W * 0.86;
  const upBX = (W - upBW) / 2;
  const upH = H * 0.52;

  const shY = upY + upH;
  const shW = W * 0.68;
  const shX = (W - shW) / 2;

  const loH = H * 0.17;
  const loBW = W * 0.6;
  const loBX = (W - loBW) / 2;

  const baseY = shY + loH;
  const baseW = W * 0.56;
  const baseX = (W - baseW) / 2;
  const baseH = H * 0.044;

  const bodyPath = [
    `M${upTX},${upY}`,
    `L${upBX},${shY}`,
    `L${shX},${shY}`,
    `L${loBX},${shY + loH}`,
    `L${baseX},${baseY}`,
    `L${baseX},${baseY + baseH}`,
    `L${baseX + baseW},${baseY + baseH}`,
    `L${baseX + baseW},${baseY}`,
    `L${loBX + loBW},${shY + loH}`,
    `L${shX + shW},${shY}`,
    `L${upBX + upBW},${shY}`,
    `L${upTX + upTW},${upY}`,
    'Z',
  ].join(' ');

  const hLeft = upBX + upBW - 2;
  const hTop = upY + upH * 0.08;
  const hBot = upY + upH * 0.58;
  const hMid = (hTop + hBot) / 2;
  const hOut = hLeft + W * 0.26;

  const handlePath = [
    `M${hLeft},${hTop}`,
    `C${hLeft + 10},${hTop} ${hOut},${hTop + 7} ${hOut},${hMid}`,
    `C${hOut},${hBot - 7} ${hLeft + 10},${hBot} ${hLeft},${hBot}`,
    `L${hLeft + 10},${hBot}`,
    `C${hOut - 8},${hBot - 4} ${hOut - 8},${hTop + 4} ${hLeft + 10},${hTop}`,
    'Z',
  ].join(' ');

  const liqX = upBX + 2;
  const liqW = upBW - 4;
  const liqH = baseY + baseH - upY - 4;

  return (
    <View style={{ width: W, height: H }}>
      <View style={{ position: 'absolute', top: upY + 2, left: liqX }}>
        <LiquidLayer fillAnim={fillAnim} color={liquidColor} w={liqW} h={liqH} rx={6} />
      </View>
      <Svg width={W} height={H} style={{ position: 'absolute', top: 0, left: 0 }}>
        <Defs>
          <LinearGradient id="stanleyWideGrad" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor="#FFFFFF" stopOpacity="0.28" />
            <Stop offset="0.35" stopColor="#FFFFFF" stopOpacity="0.05" />
            <Stop offset="1" stopColor="#000000" stopOpacity="0.10" />
          </LinearGradient>
        </Defs>
        <Rect
          x={strawCX - strawW / 2}
          y={0}
          width={strawW}
          height={strawH + 4}
          rx={strawW / 2}
          fill="#EEEAE4"
          stroke="#D8D4CE"
          strokeWidth={0.8}
        />
        <Path
          d={`M${lidX},${lidY + lidH} Q${lidX},${lidY} ${lidX + lidW / 2},${lidY - 5} Q${lidX + lidW},${lidY} ${lidX + lidW},${lidY + lidH} Z`}
          fill="#F4F1EC"
          stroke="#D8D4CE"
          strokeWidth={1}
        />
        <Ellipse cx={strawCX} cy={lidY + lidH * 0.3} rx={strawW / 2 + 2} ry={4} fill="#DDD9D2" />
        <Rect
          x={rimX}
          y={rimY}
          width={rimW}
          height={rimH}
          rx={3}
          fill="#C4C0BA"
          stroke="#B0ACA6"
          strokeWidth={0.6}
        />
        <Path d={handlePath} fill="rgba(234,230,222,0.95)" stroke="#C4C0B8" strokeWidth={1} />
        <Path d={bodyPath} fill="rgba(240,237,232,0.52)" stroke="#C4C0B8" strokeWidth={1.5} />
        <Rect
          x={upTX + 8}
          y={upY + 12}
          width={7}
          height={upH * 0.4}
          rx={3.5}
          fill="rgba(255,255,255,0.52)"
        />
        <Path
          d={`M${shX + 2},${shY + 1} L${shX + shW - 2},${shY + 1}`}
          stroke="rgba(0,0,0,0.12)"
          strokeWidth={2}
          strokeLinecap="round"
        />
        <Rect
          x={baseX}
          y={baseY}
          width={baseW}
          height={baseH}
          rx={3}
          fill="#D4D0CA"
          stroke="#C0BDB7"
          strokeWidth={0.8}
        />
      </Svg>
      <PourStream cx={strawCX} color={liquidColor} isPouring={isPouring} />
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PET BOTTLE (1.5 L goal)
// ═══════════════════════════════════════════════════════════════════════════════
export function PetBottle({
  fillLevel,
  liquidColor,
  width = 78,
  height = 175,
  isPouring = false,
}: ContainerProps) {
  const W = width;
  const H = height;
  const fillAnim = useFillAnim(fillLevel);

  const capH = H * 0.07;
  const capW = W * 0.38;
  const capX = (W - capW) / 2;
  const neckH = H * 0.1;
  const neckW = W * 0.3;
  const neckX = (W - neckW) / 2;
  const bodyY = capH + neckH;
  const bodyTW = W * 0.76;
  const bodyTX = (W - bodyTW) / 2;
  const bodyBW = W * 0.84;
  const bodyBX = (W - bodyBW) / 2;
  const bodyH = H * 0.76;
  const baseY = bodyY + bodyH;
  const baseH = H * 0.04;
  const baseW = W * 0.68;
  const baseX = (W - baseW) / 2;

  const bodyPath = [
    `M${bodyTX},${bodyY}`,
    `Q${bodyTX - 4},${bodyY + bodyH * 0.35} ${bodyBX},${bodyY + bodyH * 0.55}`,
    `L${bodyBX},${baseY}`,
    `L${baseX},${baseY}`,
    `L${baseX},${baseY + baseH}`,
    `L${baseX + baseW},${baseY + baseH}`,
    `L${baseX + baseW},${baseY}`,
    `L${bodyBX + bodyBW},${baseY}`,
    `Q${bodyTX + bodyTW + 4},${bodyY + bodyH * 0.35} ${bodyTX + bodyTW},${bodyY}`,
    'Z',
  ].join(' ');

  const liqX = bodyBX + 2;
  const liqW = bodyBW - 4;

  return (
    <View style={{ width: W, height: H }}>
      <View style={{ position: 'absolute', top: bodyY + 2, left: liqX }}>
        <LiquidLayer fillAnim={fillAnim} color={liquidColor} w={liqW} h={bodyH - 4} rx={8} />
      </View>
      <Svg width={W} height={H} style={{ position: 'absolute', top: 0, left: 0 }}>
        <Rect x={capX} y={0} width={capW} height={capH} rx={4} fill="#1E88E5" />
        <Rect
          x={capX + 3}
          y={capH * 0.25}
          width={capW - 6}
          height={2}
          rx={1}
          fill="rgba(255,255,255,0.35)"
        />
        <Rect
          x={neckX}
          y={capH}
          width={neckW}
          height={neckH}
          rx={2}
          fill="rgba(200,232,255,0.40)"
          stroke="#90C4E8"
          strokeWidth={1}
        />
        <Path d={bodyPath} fill="rgba(200,230,255,0.28)" stroke="#90C4E8" strokeWidth={1.5} />
        <Rect
          x={bodyTX + 6}
          y={bodyY + 10}
          width={6}
          height={bodyH * 0.4}
          rx={3}
          fill="rgba(255,255,255,0.55)"
        />
        <Rect
          x={bodyBX + 2}
          y={bodyY + bodyH * 0.56}
          width={bodyBW - 4}
          height={3}
          rx={1.5}
          fill="rgba(150,200,240,0.35)"
        />
        <Rect
          x={bodyBX + 2}
          y={bodyY + bodyH * 0.66}
          width={bodyBW - 4}
          height={3}
          rx={1.5}
          fill="rgba(150,200,240,0.35)"
        />
      </Svg>
      <PourStream cx={W / 2} color={liquidColor} isPouring={isPouring} />
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// DAMACANA (5 L goal)
// ═══════════════════════════════════════════════════════════════════════════════
export function Damacana({
  fillLevel,
  liquidColor,
  width = 96,
  height = 185,
  isPouring = false,
}: ContainerProps) {
  const W = width;
  const H = height;
  const fillAnim = useFillAnim(fillLevel);

  const capW = W * 0.32;
  const capX = (W - capW) / 2;
  const capH = H * 0.06;
  const neckW = W * 0.4;
  const neckX = (W - neckW) / 2;
  const neckH = H * 0.09;
  const bodyY = capH + neckH;
  const bodyW = W * 0.9;
  const bodyX = (W - bodyW) / 2;
  const bodyH = H * 0.73;
  const baseY = bodyY + bodyH;
  const baseH = H * 0.05;
  const baseW = W * 0.78;
  const baseX = (W - baseW) / 2;

  const liqX = bodyX + 2;
  const liqW = bodyW - 4;

  return (
    <View style={{ width: W, height: H }}>
      <View style={{ position: 'absolute', top: bodyY + 2, left: liqX }}>
        <LiquidLayer fillAnim={fillAnim} color={liquidColor} w={liqW} h={bodyH - 4} rx={14} />
      </View>
      <Svg width={W} height={H} style={{ position: 'absolute', top: 0, left: 0 }}>
        <Rect x={capX} y={0} width={capW} height={capH} rx={3} fill="#1565C0" />
        <Rect
          x={neckX}
          y={capH}
          width={neckW}
          height={neckH}
          rx={3}
          fill="rgba(160,210,255,0.38)"
          stroke="#80C0E8"
          strokeWidth={1}
        />
        <Rect
          x={bodyX - 7}
          y={bodyY + bodyH * 0.12}
          width={7}
          height={bodyH * 0.22}
          rx={3.5}
          fill="rgba(120,180,230,0.50)"
        />
        <Rect
          x={bodyX + bodyW}
          y={bodyY + bodyH * 0.12}
          width={7}
          height={bodyH * 0.22}
          rx={3.5}
          fill="rgba(120,180,230,0.50)"
        />
        <Rect
          x={bodyX}
          y={bodyY}
          width={bodyW}
          height={bodyH}
          rx={16}
          fill="rgba(180,220,255,0.24)"
          stroke="#80C0E8"
          strokeWidth={1.5}
        />
        <Rect
          x={bodyX + 10}
          y={bodyY + 14}
          width={8}
          height={bodyH * 0.36}
          rx={4}
          fill="rgba(255,255,255,0.50)"
        />
        <Rect
          x={bodyX + bodyW * 0.2}
          y={bodyY + bodyH * 0.58}
          width={bodyW * 0.6}
          height={bodyH * 0.22}
          rx={8}
          fill="rgba(255,255,255,0.16)"
        />
        <Rect
          x={baseX}
          y={baseY}
          width={baseW}
          height={baseH}
          rx={3}
          fill="#80C0E8"
          opacity={0.6}
        />
      </Svg>
      <PourStream cx={W / 2} color={liquidColor} isPouring={isPouring} />
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// DRINK-TYPE CONTAINERS
// ═══════════════════════════════════════════════════════════════════════════════

// Çay Bardağı — Turkish tulip
export function TeaGlass({
  fillLevel,
  liquidColor,
  width = 56,
  height = 112,
  isPouring = false,
}: ContainerProps) {
  const W = width;
  const H = height;
  const fillAnim = useFillAnim(fillLevel);

  const rimH = 4;
  const topW = W * 0.76;
  const topX = (W - topW) / 2;
  const waistW = W * 0.46;
  const waistX = (W - waistW) / 2;
  const waistY = H * 0.54;
  const botW = W * 0.6;
  const botX = (W - botW) / 2;

  const bodyPath = [
    `M${topX},${rimH}`,
    `Q${topX - 2},${waistY} ${waistX},${waistY}`,
    `Q${botX - 2},${waistY} ${botX},${H}`,
    `L${botX + botW},${H}`,
    `Q${botX + botW + 2},${waistY} ${waistX + waistW},${waistY}`,
    `Q${topX + topW + 2},${waistY} ${topX + topW},${rimH}`,
    'Z',
  ].join(' ');

  return (
    <View style={{ width: W, height: H }}>
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: topX + 2,
          width: topW - 4,
          height: H,
          overflow: 'hidden',
        }}
      >
        <Animated.View
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: fillAnim.interpolate({ inputRange: [0, 1], outputRange: [0, H - rimH] }),
            backgroundColor: liquidColor,
            opacity: 0.75,
          }}
        />
      </View>
      <Svg width={W} height={H} style={{ position: 'absolute', top: 0, left: 0 }}>
        <Rect x={topX - 2} y={0} width={topW + 4} height={rimH} rx={2} fill="#C0C8D0" />
        <Path d={bodyPath} fill="rgba(200,225,240,0.20)" stroke="#A8C0D0" strokeWidth={1.5} />
        <Path
          d={`M${topX + 6},${rimH + 4} Q${topX + 4},${waistY * 0.6} ${waistX + 5},${waistY * 0.85}`}
          fill="none"
          stroke="rgba(255,255,255,0.62)"
          strokeWidth={4}
          strokeLinecap="round"
        />
      </Svg>
      <PourStream cx={W / 2} color={liquidColor} isPouring={isPouring} />
    </View>
  );
}

// Kahve Fincanı
export function CoffeeCup({
  fillLevel,
  liquidColor,
  width = 68,
  height = 104,
  isPouring = false,
}: ContainerProps) {
  const W = width;
  const H = height;
  const fillAnim = useFillAnim(fillLevel);

  const saucerY = H * 0.88;
  const saucerW = W * 0.9;
  const saucerX = (W - saucerW) / 2;
  const cupH = saucerY - 4;
  const topW = W * 0.76;
  const topX = (W - topW) / 2;
  const rimH = 4;
  const botW = W * 0.6;
  const botX = (W - botW) / 2;

  const cupPath = [
    `M${topX},${rimH}`,
    `L${topX + topW},${rimH}`,
    `L${botX + botW},${cupH}`,
    `L${botX},${cupH}`,
    'Z',
  ].join(' ');

  const hLeft = topX + topW;
  const hTop = cupH * 0.18;
  const hBot = cupH * 0.6;
  const hOut = hLeft + W * 0.24;
  const handlePath = [
    `M${hLeft},${hTop}`,
    `C${hOut},${hTop} ${hOut},${hBot} ${hLeft},${hBot}`,
    `L${hLeft + 7},${hBot}`,
    `C${hOut - 7},${hBot} ${hOut - 7},${hTop} ${hLeft + 7},${hTop}`,
    'Z',
  ].join(' ');

  const liqX = topX + 2;
  const liqW = topW - 4;

  return (
    <View style={{ width: W, height: H }}>
      <View style={{ position: 'absolute', top: rimH + 2, left: liqX }}>
        <LiquidLayer fillAnim={fillAnim} color={liquidColor} w={liqW} h={cupH - rimH - 4} />
      </View>
      <Svg width={W} height={H} style={{ position: 'absolute', top: 0, left: 0 }}>
        <Ellipse
          cx={W / 2}
          cy={saucerY + (H - saucerY) / 2}
          rx={saucerW / 2}
          ry={(H - saucerY) / 2}
          fill="#F0EDE8"
          stroke="#D8D4CE"
          strokeWidth={1}
        />
        <Path d={handlePath} fill="#EDE8E2" stroke="#D0CBC4" strokeWidth={1} />
        <Rect x={topX - 2} y={0} width={topW + 4} height={rimH} rx={2} fill="#D8D4CE" />
        <Path d={cupPath} fill="rgba(242,239,234,0.48)" stroke="#D0CBC4" strokeWidth={1.5} />
        <Path
          d={`M${topX + 7},${rimH + 5} L${botX + 9},${cupH * 0.62}`}
          stroke="rgba(255,255,255,0.58)"
          strokeWidth={3.5}
          strokeLinecap="round"
        />
      </Svg>
      <PourStream cx={W / 2} color={liquidColor} isPouring={isPouring} />
    </View>
  );
}

// Meyve Suyu Bardağı
export function JuiceGlass({
  fillLevel,
  liquidColor,
  width = 58,
  height = 112,
  isPouring = false,
}: ContainerProps) {
  const W = width;
  const H = height;
  const fillAnim = useFillAnim(fillLevel);
  const rimH = 4;
  const topW = W * 0.86;
  const topX = (W - topW) / 2;
  const botW = W * 0.62;
  const botX = (W - botW) / 2;
  const bodyPath = [
    `M${topX},${rimH}`,
    `L${topX + topW},${rimH}`,
    `L${botX + botW},${H}`,
    `L${botX},${H}`,
    'Z',
  ].join(' ');
  const liqX = topX + 2;
  const liqW = topW - 4;
  return (
    <View style={{ width: W, height: H }}>
      <View style={{ position: 'absolute', top: rimH + 2, left: liqX }}>
        <LiquidLayer fillAnim={fillAnim} color={liquidColor} w={liqW} h={H - rimH - 4} />
      </View>
      <Svg width={W} height={H} style={{ position: 'absolute', top: 0, left: 0 }}>
        <Rect x={topX - 2} y={0} width={topW + 4} height={rimH} rx={2} fill="#B8D890" />
        <Path d={bodyPath} fill="rgba(200,230,170,0.20)" stroke="#A8C880" strokeWidth={1.5} />
        <Path
          d={`M${topX + 7},${rimH + 5} L${topX + 10},${H * 0.44}`}
          stroke="rgba(255,255,255,0.58)"
          strokeWidth={3.5}
          strokeLinecap="round"
        />
      </Svg>
      <PourStream cx={W / 2} color={liquidColor} isPouring={isPouring} />
    </View>
  );
}

// Spor Şişesi
export function SportsBottle({
  fillLevel,
  liquidColor,
  width = 64,
  height = 155,
  isPouring = false,
}: ContainerProps) {
  const W = width;
  const H = height;
  const fillAnim = useFillAnim(fillLevel);
  const spoutH = H * 0.08;
  const spoutW = W * 0.24;
  const spoutX = (W - spoutW) / 2;
  const neckH = H * 0.08;
  const neckW = W * 0.4;
  const neckX = (W - neckW) / 2;
  const bodyY = spoutH + neckH;
  const bodyW = W * 0.82;
  const bodyX = (W - bodyW) / 2;
  const bodyH = H - bodyY - H * 0.04;
  const baseY = bodyY + bodyH;
  const baseH = H * 0.04;
  const liqX = bodyX + 2;
  const liqW = bodyW - 4;
  return (
    <View style={{ width: W, height: H }}>
      <View style={{ position: 'absolute', top: bodyY + 2, left: liqX }}>
        <LiquidLayer fillAnim={fillAnim} color={liquidColor} w={liqW} h={bodyH - 4} rx={8} />
      </View>
      <Svg width={W} height={H} style={{ position: 'absolute', top: 0, left: 0 }}>
        <Rect x={spoutX} y={0} width={spoutW} height={spoutH} rx={spoutW / 2} fill="#00897B" />
        <Ellipse cx={W / 2} cy={0} rx={spoutW / 2 - 1} ry={3} fill="#00695C" />
        <Rect
          x={neckX}
          y={spoutH}
          width={neckW}
          height={neckH}
          rx={2}
          fill="rgba(0,200,180,0.32)"
          stroke="#00BFA5"
          strokeWidth={1}
        />
        <Rect
          x={bodyX}
          y={bodyY}
          width={bodyW}
          height={bodyH}
          rx={10}
          fill="rgba(0,180,160,0.18)"
          stroke="#00BFA5"
          strokeWidth={1.5}
        />
        {([0.42, 0.52, 0.62] as number[]).map((y, i) => (
          <Rect
            key={i}
            x={bodyX + 4}
            y={bodyY + bodyH * y}
            width={bodyW - 8}
            height={2.5}
            rx={1.2}
            fill="rgba(0,150,130,0.28)"
          />
        ))}
        <Rect
          x={bodyX + 6}
          y={bodyY + 10}
          width={5}
          height={bodyH * 0.36}
          rx={2.5}
          fill="rgba(255,255,255,0.48)"
        />
        <Rect
          x={bodyX}
          y={baseY}
          width={bodyW}
          height={baseH}
          rx={3}
          fill="#00695C"
          opacity={0.6}
        />
      </Svg>
      <PourStream cx={W / 2} color={liquidColor} isPouring={isPouring} />
    </View>
  );
}

// Süt Bardağı
export function MilkGlass({
  fillLevel,
  liquidColor,
  width = 54,
  height = 110,
  isPouring = false,
}: ContainerProps) {
  const W = width;
  const H = height;
  const fillAnim = useFillAnim(fillLevel);
  const bX = W * 0.09;
  const bW = W * 0.82;
  const rimH = 4;
  const liqX = bX + 2;
  const liqW = bW - 4;
  return (
    <View style={{ width: W, height: H }}>
      <View style={{ position: 'absolute', top: rimH + 2, left: liqX }}>
        <LiquidLayer fillAnim={fillAnim} color={liquidColor} w={liqW} h={H - rimH - 4} rx={5} />
      </View>
      <Svg width={W} height={H} style={{ position: 'absolute', top: 0, left: 0 }}>
        <Rect x={bX - 2} y={0} width={bW + 4} height={rimH} rx={2} fill="#D0D0B8" />
        <Rect
          x={bX}
          y={rimH}
          width={bW}
          height={H - rimH}
          rx={6}
          fill="rgba(240,240,220,0.26)"
          stroke="#C8C8A8"
          strokeWidth={1.5}
        />
        <Rect
          x={bX + 7}
          y={rimH + 8}
          width={5}
          height={H * 0.36}
          rx={2.5}
          fill="rgba(255,255,255,0.52)"
        />
      </Svg>
      <PourStream cx={W / 2} color={liquidColor} isPouring={isPouring} />
    </View>
  );
}

// Soda Kutusu
export function SodaCan({
  fillLevel,
  liquidColor,
  width = 56,
  height = 122,
  isPouring = false,
}: ContainerProps) {
  const W = width;
  const H = height;
  const fillAnim = useFillAnim(fillLevel);
  const topH = H * 0.09;
  const botH = H * 0.06;
  const bX = W * 0.1;
  const bW = W * 0.8;
  const bodyY = topH;
  const bodyH = H - topH - botH;
  const liqX = bX + 2;
  const liqW = bW - 4;
  return (
    <View style={{ width: W, height: H }}>
      <View style={{ position: 'absolute', top: bodyY + 2, left: liqX }}>
        <LiquidLayer fillAnim={fillAnim} color={liquidColor} w={liqW} h={bodyH - 4} />
      </View>
      <Svg width={W} height={H} style={{ position: 'absolute', top: 0, left: 0 }}>
        <Ellipse
          cx={W / 2}
          cy={topH}
          rx={bW / 2}
          ry={topH * 0.65}
          fill="#D8D8D8"
          stroke="#B8B8B8"
          strokeWidth={1}
        />
        <Rect x={W / 2 - 7} y={topH * 0.25} width={14} height={5} rx={2.5} fill="#B8B8B8" />
        <Rect x={W / 2 - 2} y={0} width={4} height={topH * 0.55} rx={2} fill="#C0C0C0" />
        <Rect
          x={bX}
          y={bodyY}
          width={bW}
          height={bodyH}
          fill={liquidColor + '22'}
          stroke="#B8B8B8"
          strokeWidth={1.5}
        />
        <Rect
          x={bX + 1}
          y={bodyY + bodyH * 0.18}
          width={bW - 2}
          height={bodyH * 0.64}
          fill={liquidColor + '28'}
        />
        <Rect
          x={bX + 7}
          y={bodyY + 8}
          width={5}
          height={bodyH * 0.4}
          rx={2.5}
          fill="rgba(255,255,255,0.42)"
        />
        <Ellipse
          cx={W / 2}
          cy={bodyY + bodyH}
          rx={bW / 2}
          ry={botH * 0.65}
          fill="#C8C8C8"
          stroke="#B0B0B0"
          strokeWidth={1}
        />
      </Svg>
      <PourStream cx={W / 2} color={liquidColor} isPouring={isPouring} />
    </View>
  );
}

// Şarap Kadehi
export function WineGlass({
  fillLevel,
  liquidColor,
  width = 58,
  height = 135,
  isPouring = false,
}: ContainerProps) {
  const W = width;
  const H = height;
  const fillAnim = useFillAnim(fillLevel);
  const bowlTop = H * 0.04;
  const bowlH = H * 0.5;
  const bowlTW = W * 0.82;
  const bowlTX = (W - bowlTW) / 2;
  const bowlBW = W * 0.3;
  const bowlBX = (W - bowlBW) / 2;
  const stemTop = bowlTop + bowlH;
  const stemH = H * 0.3;
  const baseY = stemTop + stemH;
  const baseW = W * 0.76;
  const baseX = (W - baseW) / 2;
  const bowlPath = [
    `M${bowlTX},${bowlTop}`,
    `L${bowlTX + bowlTW},${bowlTop}`,
    `Q${bowlTX + bowlTW + 4},${stemTop - 4} ${bowlBX + bowlBW},${stemTop}`,
    `L${bowlBX},${stemTop}`,
    `Q${bowlTX - 4},${stemTop - 4} ${bowlTX},${bowlTop}`,
    'Z',
  ].join(' ');
  const liqX = bowlTX + 2;
  const liqW = bowlTW - 4;
  return (
    <View style={{ width: W, height: H }}>
      <View style={{ position: 'absolute', top: bowlTop + 4, left: liqX }}>
        <LiquidLayer fillAnim={fillAnim} color={liquidColor} w={liqW} h={bowlH - 8} />
      </View>
      <Svg width={W} height={H} style={{ position: 'absolute', top: 0, left: 0 }}>
        <Rect x={bowlTX - 2} y={bowlTop} width={bowlTW + 4} height={4} rx={2} fill="#C8D0D8" />
        <Path d={bowlPath} fill="rgba(200,212,228,0.20)" stroke="#B8C4D0" strokeWidth={1.5} />
        <Rect x={W / 2 - 2.5} y={stemTop} width={5} height={stemH} rx={2.5} fill="#C0C8D0" />
        <Ellipse
          cx={W / 2}
          cy={baseY + 6}
          rx={baseW / 2}
          ry={6}
          fill="rgba(200,212,228,0.42)"
          stroke="#B8C4D0"
          strokeWidth={1}
        />
        <Path
          d={`M${bowlTX + 8},${bowlTop + 6} L${bowlTX + 11},${bowlTop + bowlH * 0.4}`}
          stroke="rgba(255,255,255,0.58)"
          strokeWidth={3}
          strokeLinecap="round"
        />
      </Svg>
      <PourStream cx={W / 2} color={liquidColor} isPouring={isPouring} />
    </View>
  );
}

// Smoothie Bardağı
export function SmoothieGlass({
  fillLevel,
  liquidColor,
  width = 58,
  height = 116,
  isPouring = false,
}: ContainerProps) {
  const W = width;
  const H = height;
  const fillAnim = useFillAnim(fillLevel);
  const rimH = 4;
  const topW = W * 0.9;
  const topX = (W - topW) / 2;
  const botW = W * 0.56;
  const botX = (W - botW) / 2;
  const bodyPath = [
    `M${topX},${rimH}`,
    `L${topX + topW},${rimH}`,
    `L${botX + botW},${H}`,
    `L${botX},${H}`,
    'Z',
  ].join(' ');
  const liqX = topX + 2;
  const liqW = topW - 4;
  return (
    <View style={{ width: W, height: H }}>
      <View style={{ position: 'absolute', top: rimH + 2, left: liqX }}>
        <LiquidLayer fillAnim={fillAnim} color={liquidColor} w={liqW} h={H - rimH - 4} />
      </View>
      <Svg width={W} height={H} style={{ position: 'absolute', top: 0, left: 0 }}>
        <Rect x={topX - 2} y={0} width={topW + 4} height={rimH} rx={2} fill="#C090D0" />
        <Path d={bodyPath} fill="rgba(210,175,235,0.20)" stroke="#C090D0" strokeWidth={1.5} />
        <Rect
          x={W * 0.6}
          y={-10}
          width={6}
          height={H * 0.55}
          rx={3}
          fill="#FF8C00"
          opacity={0.72}
        />
        <Path
          d={`M${topX + 7},${rimH + 5} L${topX + 10},${H * 0.4}`}
          stroke="rgba(255,255,255,0.55)"
          strokeWidth={3.5}
          strokeLinecap="round"
        />
      </Svg>
      <PourStream cx={W / 2} color={liquidColor} isPouring={isPouring} />
    </View>
  );
}

// ─── Dispatcher ────────────────────────────────────────────────────────────────
export function DrinkContainer(props: ContainerProps) {
  switch (props.kind) {
    case 'pet':
      return <PetBottle {...props} />;
    case 'stanley':
      return <StanleyTumbler {...props} />;
    case 'stanley2':
      return <StanleyWide {...props} />;
    case 'damacana':
      return <Damacana {...props} />;
    case 'teaglass':
      return <TeaGlass {...props} />;
    case 'coffeecup':
      return <CoffeeCup {...props} />;
    case 'juiceglass':
      return <JuiceGlass {...props} />;
    case 'sportsbottle':
      return <SportsBottle {...props} />;
    case 'milkglass':
      return <MilkGlass {...props} />;
    case 'sodacan':
      return <SodaCan {...props} />;
    case 'wineglass':
      return <WineGlass {...props} />;
    case 'smoothieglass':
      return <SmoothieGlass {...props} />;
    default:
      return <JuiceGlass {...props} />;
  }
}

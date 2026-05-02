/**
 * LiquidWave — Skia ile gerçek sıvı animasyonu (Skia v2 + Reanimated 4).
 *
 * Kap SVG'sinin üstüne absolute fill ile yerleştirilir.
 * `clipPath` parametresi kabın iç bölgesini tanımlar (SVG path string).
 * Sıvı seviyesi `fillLevel` (0-1), üst kenar dalgalanır.
 *
 * Splash: `splashTrigger` her değiştiğinde 1 büyük dalga.
 */

import React, { useEffect, useMemo } from 'react';
import {
  Canvas,
  Path,
  Group,
  LinearGradient,
  vec,
  Skia,
  useClock,
} from '@shopify/react-native-skia';
import { useSharedValue, useDerivedValue, withTiming, Easing } from 'react-native-reanimated';

export interface LiquidWaveProps {
  width: number;
  height: number;
  fillLevel: number; // 0 - 1
  liquidColor: string;
  clipPath: string; // SVG path string for inner cup area
  splashTrigger?: number; // her değiştiğinde splash
  amplitude?: number; // px (1b: belirgin = 3)
  wavelength?: number; // px
}

export function LiquidWave({
  width,
  height,
  fillLevel,
  liquidColor,
  clipPath,
  splashTrigger = 0,
  amplitude = 3,
  wavelength = 50,
}: LiquidWaveProps) {
  const clock = useClock();
  const splashBoost = useSharedValue(0);
  const fill = useSharedValue(fillLevel);

  // Sıvı seviyesi smooth geçiş
  useEffect(() => {
    fill.value = withTiming(fillLevel, {
      duration: 950,
      easing: Easing.bezier(0.22, 1, 0.36, 1),
    });
  }, [fillLevel]);

  // Splash trigger
  useEffect(() => {
    if (splashTrigger === 0) return;
    splashBoost.value = 1;
    splashBoost.value = withTiming(0, {
      duration: 1100,
      easing: Easing.bezier(0.22, 1, 0.36, 1),
    });
  }, [splashTrigger]);

  // Skia clip path
  const clip = useMemo(() => {
    const p = Skia.Path.MakeFromSVGString(clipPath);
    return p ?? Skia.Path.Make();
  }, [clipPath]);

  // Liquid path — frame-by-frame sinüs eğrisi
  const liquidPath = useDerivedValue(() => {
    const t = clock.value / 1000;
    const level = Math.max(0, Math.min(1, fill.value));
    const baseY = height - level * height;

    const ampl = amplitude * (1 + splashBoost.value * 2.2);
    const speed = 1.3 + splashBoost.value * 1.5;

    const path = Skia.Path.Make();
    path.moveTo(0, baseY);

    const step = 2;
    for (let x = 0; x <= width; x += step) {
      const phase1 = (x / wavelength) * Math.PI * 2 + t * speed;
      const phase2 = (x / (wavelength * 0.62)) * Math.PI * 2 + t * speed * 1.4;
      const y = baseY + Math.sin(phase1) * ampl + Math.sin(phase2) * ampl * 0.4;
      path.lineTo(x, y);
    }

    path.lineTo(width, height);
    path.lineTo(0, height);
    path.close();
    return path;
  }, [clock, fill, splashBoost]);

  if (fillLevel <= 0) return null;

  return (
    <Canvas style={{ width, height, position: 'absolute', top: 0, left: 0 }} pointerEvents="none">
      <Group clip={clip}>
        <Path path={liquidPath}>
          <LinearGradient
            start={vec(0, 0)}
            end={vec(width, 0)}
            colors={[liquidColor, shade(liquidColor, 0.82)]}
          />
        </Path>
      </Group>
    </Canvas>
  );
}

function shade(hex: string, factor: number): string {
  if (!hex.startsWith('#') || hex.length !== 7) return hex;
  const r = Math.round(parseInt(hex.slice(1, 3), 16) * factor);
  const g = Math.round(parseInt(hex.slice(3, 5), 16) * factor);
  const b = Math.round(parseInt(hex.slice(5, 7), 16) * factor);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

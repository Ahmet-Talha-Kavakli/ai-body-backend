import { useEffect, useMemo } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import {
  Canvas,
  Circle,
  Group,
  LinearGradient,
  Rect,
  vec,
  Blur,
  RadialGradient,
} from '@shopify/react-native-skia';
import {
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
  useDerivedValue,
} from 'react-native-reanimated';

const { width: W, height: H } = Dimensions.get('window');

interface Star {
  x: number;
  y: number;
  r: number;
  phase: number; // 0..1 — twinkle offset
  speed: number; // twinkle period multiplier
}

function generateStars(count: number): Star[] {
  const stars: Star[] = [];
  for (let i = 0; i < count; i++) {
    stars.push({
      x: Math.random() * W,
      y: Math.random() * H * 0.65, // üst 2/3'te yoğun, altta seyrek
      r: 0.6 + Math.random() * 1.6,
      phase: Math.random(),
      speed: 0.4 + Math.random() * 0.8,
    });
  }
  // Alt kısma birkaç soluk yıldız
  for (let i = 0; i < count * 0.2; i++) {
    stars.push({
      x: Math.random() * W,
      y: H * 0.65 + Math.random() * H * 0.35,
      r: 0.4 + Math.random() * 0.9,
      phase: Math.random(),
      speed: 0.3 + Math.random() * 0.7,
    });
  }
  return stars;
}

export default function AuroraBackground() {
  const stars = useMemo(() => generateStars(45), []);

  // Aurora orb'lar yavaşça hareket eder
  const orbAnim = useSharedValue(0);
  const twinkle = useSharedValue(0);

  useEffect(() => {
    orbAnim.value = withRepeat(
      withTiming(1, { duration: 16_000, easing: Easing.bezier(0.4, 0, 0.6, 1) }),
      -1,
      true,
    );
    twinkle.value = withRepeat(
      withTiming(1, { duration: 4_000, easing: Easing.linear }),
      -1,
      false,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Orb 1 — mor, sol üst → sağ orta arası kayar
  const orb1Cx = useDerivedValue(() => W * 0.25 + Math.sin(orbAnim.value * Math.PI * 2) * W * 0.15);
  const orb1Cy = useDerivedValue(() => H * 0.3 + Math.cos(orbAnim.value * Math.PI * 2) * H * 0.08);

  // Orb 2 — koyu mavi, sağ alt
  const orb2Cx = useDerivedValue(() => W * 0.75 + Math.cos(orbAnim.value * Math.PI * 2) * W * 0.18);
  const orb2Cy = useDerivedValue(() => H * 0.55 + Math.sin(orbAnim.value * Math.PI * 2) * H * 0.06);

  // Orb 3 — alt-orta, derinlik
  const orb3Cx = useDerivedValue(
    () => W * 0.5 + Math.sin(orbAnim.value * Math.PI * 2 + 1) * W * 0.2,
  );
  const orb3Cy = useDerivedValue(
    () => H * 0.75 + Math.cos(orbAnim.value * Math.PI * 2 + 1) * H * 0.05,
  );

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Canvas style={StyleSheet.absoluteFill}>
        {/* Base gece gradient (üstte daha koyu, altta hafif aydınlık) */}
        <Rect x={0} y={0} width={W} height={H}>
          <LinearGradient
            start={vec(0, 0)}
            end={vec(0, H)}
            colors={['#05060F', '#0A0B1F', '#10122E', '#16183A']}
            positions={[0, 0.4, 0.75, 1]}
          />
        </Rect>

        {/* Aurora orb'ları — Skia Blur ile yumuşak */}
        <Group>
          <Blur blur={80} />

          {/* Orb 1 — indigo/mor */}
          <Circle cx={orb1Cx} cy={orb1Cy} r={W * 0.55}>
            <RadialGradient
              c={vec(0, 0)}
              r={W * 0.55}
              colors={['rgba(94, 92, 230, 0.55)', 'rgba(94, 92, 230, 0)']}
              positions={[0, 1]}
            />
          </Circle>

          {/* Orb 2 — derin mavi */}
          <Circle cx={orb2Cx} cy={orb2Cy} r={W * 0.5}>
            <RadialGradient
              c={vec(0, 0)}
              r={W * 0.5}
              colors={['rgba(45, 56, 168, 0.45)', 'rgba(45, 56, 168, 0)']}
              positions={[0, 1]}
            />
          </Circle>

          {/* Orb 3 — sıcak mor (alt) */}
          <Circle cx={orb3Cx} cy={orb3Cy} r={W * 0.45}>
            <RadialGradient
              c={vec(0, 0)}
              r={W * 0.45}
              colors={['rgba(125, 90, 200, 0.35)', 'rgba(125, 90, 200, 0)']}
              positions={[0, 1]}
            />
          </Circle>
        </Group>

        {/* Yıldızlar — twinkling */}
        <Group>
          {stars.map((star, i) => (
            <TwinklingStar key={i} star={star} twinkle={twinkle} />
          ))}
        </Group>

        {/* Vignette üstte (tepe daha karanlık, derinlik) */}
        <Rect x={0} y={0} width={W} height={H * 0.4} opacity={0.5}>
          <LinearGradient
            start={vec(0, 0)}
            end={vec(0, H * 0.4)}
            colors={['rgba(0,0,0,0.55)', 'rgba(0,0,0,0)']}
          />
        </Rect>
      </Canvas>
    </View>
  );
}

function TwinklingStar({
  star,
  twinkle,
}: {
  star: Star;
  twinkle: ReturnType<typeof useSharedValue<number>>;
}) {
  const opacity = useDerivedValue(() => {
    const t = (twinkle.value * star.speed + star.phase) % 1;
    // Sinusoidal twinkle — minimum 0.15, max 1.0
    return 0.15 + 0.85 * Math.abs(Math.sin(t * Math.PI * 2));
  });

  return <Circle cx={star.x} cy={star.y} r={star.r} color="#FFFFFF" opacity={opacity} />;
}

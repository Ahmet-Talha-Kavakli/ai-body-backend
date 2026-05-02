import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Text, View } from 'react-native';
import LottieView from 'lottie-react-native';

export type PamukMood = 'idle' | 'happy' | 'excited' | 'sleepy' | 'celebrating';
interface Props {
  mood?: PamukMood;
  size?: number;
}

const SPRING = Easing.bezier(0.16, 1, 0.3, 1);
const BOUNCE = Easing.bezier(0.34, 1.56, 0.64, 1);
const SMOOTH = Easing.bezier(0.22, 1, 0.36, 1);

// Animasyon hızı mood'a göre — karakter aynı ama tempo değişir
const SPEED: Record<PamukMood, number> = {
  idle: 0.7,
  happy: 1.1,
  excited: 1.8,
  sleepy: 0.3,
  celebrating: 1.5,
};

// 1280×1024 kaynak oranı
const ASPECT = 1024 / 1280;

export default function Pamuk({ mood = 'idle', size = 120 }: Props) {
  const W = size;
  const H = Math.round(size * ASPECT);

  // ─── Animated values ───────────────────────────────────────────────────────
  const floatY = useRef(new Animated.Value(0)).current;
  const jumpY = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // Hearts
  const h1Y = useRef(new Animated.Value(0)).current;
  const h1Op = useRef(new Animated.Value(0)).current;
  const h2Y = useRef(new Animated.Value(0)).current;
  const h2Op = useRef(new Animated.Value(0)).current;
  const h3Y = useRef(new Animated.Value(0)).current;
  const h3Op = useRef(new Animated.Value(0)).current;

  // Notes
  const n1Y = useRef(new Animated.Value(0)).current;
  const n1Op = useRef(new Animated.Value(0)).current;
  const n2Y = useRef(new Animated.Value(0)).current;
  const n2Op = useRef(new Animated.Value(0)).current;

  // Sweat
  const swY = useRef(new Animated.Value(0)).current;
  const swOp = useRef(new Animated.Value(0)).current;

  // Stars
  const starOrbit = useRef(new Animated.Value(0)).current;

  const floatRef = useRef<Animated.CompositeAnimation | null>(null);
  const heartRef = useRef<Animated.CompositeAnimation | null>(null);
  const noteRef = useRef<Animated.CompositeAnimation | null>(null);
  const sweatRef = useRef<Animated.CompositeAnimation | null>(null);
  const starRef = useRef<Animated.CompositeAnimation | null>(null);

  // ─── Helpers ───────────────────────────────────────────────────────────────
  function stopAll() {
    floatRef.current?.stop();
    heartRef.current?.stop();
    noteRef.current?.stop();
    sweatRef.current?.stop();
    starRef.current?.stop();
  }

  function startFloat(amp = 5, speed = 1700) {
    floatRef.current?.stop();
    floatRef.current = Animated.loop(
      Animated.sequence([
        Animated.timing(floatY, {
          toValue: -amp,
          duration: speed,
          useNativeDriver: true,
          easing: Easing.bezier(0.45, 0, 0.55, 1),
        }),
        Animated.timing(floatY, {
          toValue: 0,
          duration: speed,
          useNativeDriver: true,
          easing: Easing.bezier(0.45, 0, 0.55, 1),
        }),
      ]),
    );
    floatRef.current.start();
  }

  function startHearts() {
    heartRef.current?.stop();
    const rise = H * 0.7;
    const loop = (yV: Animated.Value, oV: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.parallel([
            Animated.timing(oV, { toValue: 1, duration: 280, useNativeDriver: true }),
            Animated.timing(yV, {
              toValue: -rise,
              duration: 1400,
              useNativeDriver: true,
              easing: SMOOTH,
            }),
          ]),
          Animated.timing(oV, { toValue: 0, duration: 380, useNativeDriver: true }),
          Animated.parallel([
            Animated.timing(yV, { toValue: 0, duration: 1, useNativeDriver: true }),
            Animated.timing(oV, { toValue: 0, duration: 1, useNativeDriver: true }),
          ]),
          Animated.delay(600),
        ]),
      );
    heartRef.current = Animated.parallel([
      loop(h1Y, h1Op, 0),
      loop(h2Y, h2Op, 560),
      loop(h3Y, h3Op, 1120),
    ]);
    heartRef.current.start();
  }

  function startNotes() {
    noteRef.current?.stop();
    const rise = H * 0.65;
    const loop = (yV: Animated.Value, oV: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.parallel([
            Animated.timing(oV, { toValue: 1, duration: 200, useNativeDriver: true }),
            Animated.timing(yV, {
              toValue: -rise,
              duration: 1200,
              useNativeDriver: true,
              easing: SMOOTH,
            }),
          ]),
          Animated.timing(oV, { toValue: 0, duration: 350, useNativeDriver: true }),
          Animated.parallel([
            Animated.timing(yV, { toValue: 0, duration: 1, useNativeDriver: true }),
            Animated.timing(oV, { toValue: 0, duration: 1, useNativeDriver: true }),
          ]),
          Animated.delay(500),
        ]),
      );
    noteRef.current = Animated.parallel([loop(n1Y, n1Op, 0), loop(n2Y, n2Op, 720)]);
    noteRef.current.start();
  }

  function startSweat() {
    sweatRef.current?.stop();
    sweatRef.current = Animated.loop(
      Animated.sequence([
        Animated.delay(2200),
        Animated.parallel([
          Animated.timing(swOp, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.timing(swY, {
            toValue: H * 0.22,
            duration: 1000,
            useNativeDriver: true,
            easing: SMOOTH,
          }),
        ]),
        Animated.timing(swOp, { toValue: 0, duration: 400, useNativeDriver: true }),
        Animated.parallel([
          Animated.timing(swY, { toValue: 0, duration: 1, useNativeDriver: true }),
          Animated.timing(swOp, { toValue: 0, duration: 1, useNativeDriver: true }),
        ]),
        Animated.delay(1800),
      ]),
    );
    sweatRef.current.start();
  }

  function startStarOrbit() {
    starRef.current?.stop();
    starOrbit.setValue(0);
    starRef.current = Animated.loop(
      Animated.timing(starOrbit, {
        toValue: 1,
        duration: 2400,
        useNativeDriver: true,
        easing: Easing.linear,
      }),
    );
    starRef.current.start();
  }

  // ─── Effect ────────────────────────────────────────────────────────────────
  useEffect(() => {
    stopAll();
    floatY.setValue(0);
    jumpY.setValue(0);
    scaleAnim.setValue(1);
    h1Y.setValue(0);
    h1Op.setValue(0);
    h2Y.setValue(0);
    h2Op.setValue(0);
    h3Y.setValue(0);
    h3Op.setValue(0);
    n1Y.setValue(0);
    n1Op.setValue(0);
    n2Y.setValue(0);
    n2Op.setValue(0);
    swY.setValue(0);
    swOp.setValue(0);
    starOrbit.setValue(0);

    switch (mood) {
      case 'idle':
        startFloat(5);
        break;

      case 'happy':
        startFloat(4);
        startHearts();
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.1,
            duration: 180,
            useNativeDriver: true,
            easing: SPRING,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 280,
            useNativeDriver: true,
            easing: BOUNCE,
          }),
        ]).start();
        break;

      case 'excited':
        startNotes();
        Animated.loop(
          Animated.sequence([
            Animated.timing(jumpY, {
              toValue: -16,
              duration: 200,
              useNativeDriver: true,
              easing: SPRING,
            }),
            Animated.timing(jumpY, {
              toValue: 0,
              duration: 200,
              useNativeDriver: true,
              easing: BOUNCE,
            }),
          ]),
          { iterations: 4 },
        ).start(() => startFloat(4));
        break;

      case 'sleepy':
        startFloat(2, 2600);
        startSweat();
        break;

      case 'celebrating':
        startHearts();
        startStarOrbit();
        Animated.sequence([
          Animated.timing(jumpY, {
            toValue: -24,
            duration: 240,
            useNativeDriver: true,
            easing: SPRING,
          }),
          Animated.timing(scaleAnim, { toValue: 1.15, duration: 100, useNativeDriver: true }),
          Animated.timing(jumpY, {
            toValue: 0,
            duration: 420,
            useNativeDriver: true,
            easing: BOUNCE,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 260,
            useNativeDriver: true,
            easing: BOUNCE,
          }),
        ]).start(() => startFloat(4));
        break;
    }

    return stopAll;
  }, [mood]);

  // ─── Orbit interpolation ───────────────────────────────────────────────────
  const starDeg1 = starOrbit.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const starDeg2 = starOrbit.interpolate({ inputRange: [0, 1], outputRange: ['180deg', '540deg'] });
  const oR = W * 0.52;

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <View
      style={{
        width: W,
        height: H,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'visible',
      }}
    >
      {/* ── Hearts ── */}
      {(mood === 'happy' || mood === 'celebrating') &&
        (
          [
            { yV: h1Y, oV: h1Op, dx: -W * 0.22 },
            { yV: h2Y, oV: h2Op, dx: W * 0.04 },
            { yV: h3Y, oV: h3Op, dx: W * 0.24 },
          ] as { yV: Animated.Value; oV: Animated.Value; dx: number }[]
        ).map(({ yV, oV, dx }, i) => (
          <Animated.View
            key={i}
            style={{
              position: 'absolute',
              top: H * 0.08,
              left: W / 2 + dx,
              transform: [{ translateY: yV }],
              opacity: oV,
            }}
          >
            <Text style={{ fontSize: 14, color: '#FF3B6F' }}>♥</Text>
          </Animated.View>
        ))}

      {/* ── Notes ── */}
      {mood === 'excited' &&
        (
          [
            { yV: n1Y, oV: n1Op, dx: -W * 0.34 },
            { yV: n2Y, oV: n2Op, dx: -W * 0.14 },
          ] as { yV: Animated.Value; oV: Animated.Value; dx: number }[]
        ).map(({ yV, oV, dx }, i) => (
          <Animated.View
            key={i}
            style={{
              position: 'absolute',
              top: H * 0.12,
              left: W / 2 + dx,
              transform: [{ translateY: yV }],
              opacity: oV,
            }}
          >
            <Text style={{ fontSize: 13, color: '#FF9500' }}>♪</Text>
          </Animated.View>
        ))}

      {/* ── Sweat ── */}
      {mood === 'sleepy' && (
        <Animated.View
          style={{
            position: 'absolute',
            top: H * 0.18,
            left: W * 0.74,
            transform: [{ translateY: swY }],
            opacity: swOp,
          }}
        >
          <View style={{ width: 7, height: 11, backgroundColor: '#58C4F5', borderRadius: 10 }} />
        </Animated.View>
      )}

      {/* ── Orbit stars ── */}
      {mood === 'celebrating' && (
        <>
          <Animated.View
            style={{
              position: 'absolute',
              width: oR * 2,
              height: oR * 2,
              top: H * 0.5 - oR,
              left: W / 2 - oR,
              transform: [{ rotate: starDeg1 }],
            }}
          >
            <Text
              style={{
                position: 'absolute',
                top: -9,
                left: oR - 7,
                fontSize: 14,
                color: '#FFD60A',
              }}
            >
              ★
            </Text>
          </Animated.View>
          <Animated.View
            style={{
              position: 'absolute',
              width: oR * 2,
              height: oR * 2,
              top: H * 0.5 - oR,
              left: W / 2 - oR,
              transform: [{ rotate: starDeg2 }],
            }}
          >
            <Text
              style={{
                position: 'absolute',
                top: -7,
                left: oR - 5,
                fontSize: 11,
                color: '#FFCC00',
              }}
            >
              ★
            </Text>
          </Animated.View>
        </>
      )}

      {/* ── Lottie karakter ── */}
      <Animated.View
        style={{
          transform: [{ translateY: floatY }, { translateY: jumpY }, { scale: scaleAnim }],
        }}
      >
        <LottieView
          source={require('../../assets/animations/pamuk.json')}
          autoPlay
          loop
          speed={SPEED[mood]}
          style={{ width: W, height: H }}
          resizeMode="contain"
        />
      </Animated.View>
    </View>
  );
}

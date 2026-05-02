/**
 * İçecek otomatı — gerçek otomat formu (dikey, uzun).
 *
 * Layout (yukarıdan aşağıya):
 *   ┌─────────────────────┐
 *   │  💧  HYDRO          │ ← Üst tabela (parlak mavi, marka)
 *   ├─────────────────────┤
 *   │ ╔═════════════════╗ │
 *   │ ║   üst raf su    ║ │
 *   │ ║─────────────────║ │ ← Cam vitrin
 *   │ ║   alt raf       ║ │   3 raf (su / diğer / boş)
 *   │ ║─────────────────║ │
 *   │ ║   ekstra raf    ║ │
 *   │ ╚═════════════════╝ │
 *   ├─────────────────────┤
 *   │ [LED]  ┌─┬─┐        │ ← Mini kontrol paneli
 *   │        ├─┼─┤        │
 *   ├─────────────────────┤
 *   │  ╔═══════════════╗  │ ← Alma haznesi
 *   │  ║   ▓▓▓▓▓▓▓▓▓   ║  │   (büyük, gölgeli)
 *   │  ╚═══════════════╝  │
 *   └─────────────────────┘
 */

import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { type BottleKind, categoryToBottle, categoryToColor } from './DrinkBottles';
import { AnimatedDrinkBottle } from './AnimatedDrinkBottle';

// ─── Constants ────────────────────────────────────────────────────────────────
const ACCENT = '#32ADE6';
const NEON = '#7DD3F2';
const BODY = '#1B2C44';
const BODY_DARK = '#0F1B2C';
const BODY_DEEP = '#050A12';
const PANEL_BG = '#243650';

const { width: SW, height: SCREEN_H } = Dimensions.get('window');

// Form: dikey otomat — genişlik dar, yükseklik uzun
const MACHINE_W = Math.min(SW - 40, 340);
const MACHINE_H = 660;

const BODY_RADIUS = 22;
const BODY_PAD = 10;

// Bölme yükseklikleri (toplam ~580 - paddings)
const BANNER_H = 80; // Üst tabela
const CONTROL_H = 110; // Kontrol paneli (display + buton)
const DISPENSER_H = 50; // Alma haznesi
// Cabinet (cam vitrin) = kalan = 600 - 20pad - 80 - 90 - 70 - 30 (gaplar) = 310

const CABINET_H = MACHINE_H - BODY_PAD * 2 - BANNER_H - CONTROL_H - DISPENSER_H - 24;
const CABINET_PAD = 8;
const CABINET_INNER_W = MACHINE_W - BODY_PAD * 2 - CABINET_PAD * 2;

// 3 raf, eşit yükseklik
const SHELF_H = (CABINET_H - CABINET_PAD * 2) / 3 - 2;

const TOP_SHELF_MAX_GHOSTS = 8;
const SHELF_CAPACITY = 5; // her alt raf max 5 içecek
const TOTAL_BOTTOM_CAPACITY = SHELF_CAPACITY * 2; // 2 raf = 10

// ─── Types ─────────────────────────────────────────────────────────────────────
export interface BottomSlot {
  id: string;
  category: string;
  amountMl: number;
  kind: BottleKind;
  color: string;
}

export interface VendingMachineProps {
  goalMl: number;
  defaultBottleMl: number;
  waterMl: number;
  bottomDrinks: BottomSlot[];
  newSlotId: string | null;
  onLedPress: () => void;
  onAddPress: () => void;
  onWaterShelfPress: () => void; // Üst raf → su listesi
  onBottomDrinkPress: (slotId: string) => void; // Alt raf içecek → detay
  loading?: boolean; // ilk açılışta konveyör animasyon
}

// ─── Conveyor Loader (yükleme animasyonu) ─────────────────────────────────────
const LOADER_KINDS: BottleKind[] = [
  'water',
  'tea',
  'coffee',
  'herbal',
  'juice',
  'sports',
  'dairy',
  'smoothie',
  'soda',
];
const LOADER_COLORS: Record<BottleKind, string> = {
  water: '#32ADE6',
  tea: '#C8860A',
  coffee: '#5B3424',
  herbal: '#7DB94A',
  juice: '#FF8C00',
  sports: '#00D4AA',
  dairy: '#E8E4D0',
  smoothie: '#C060C0',
  soda: '#D4A820',
  alcohol: '#A0522D',
};

function pickRandomKind(): BottleKind {
  return LOADER_KINDS[Math.floor(Math.random() * LOADER_KINDS.length)]!;
}

interface ConveyorBottleProps {
  kind: BottleKind;
  width: number;
  height: number;
  delay: number;
  fromLeft: boolean;
  travelDistance: number;
}

// Apple-grade easing curves
// Apple in-app standard easing — UIKit / SwiftUI default
const APPLE_EASE_OUT = Easing.bezier(0.32, 0.72, 0, 1);
const APPLE_EASE_IN = Easing.bezier(0.42, 0, 1, 1);

function ConveyorBottle({
  kind,
  width,
  height,
  delay,
  fromLeft,
  travelDistance,
}: ConveyorBottleProps) {
  const tx = useRef(new Animated.Value(fromLeft ? -travelDistance : travelDistance)).current;
  const op = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.94)).current;

  useEffect(() => {
    Animated.sequence([
      // Giriş — translate + opacity + hafif scale (premium hissi)
      Animated.parallel([
        Animated.timing(tx, {
          toValue: 0,
          duration: 520,
          delay,
          useNativeDriver: true,
          easing: APPLE_EASE_OUT,
        }),
        Animated.timing(op, {
          toValue: 1,
          duration: 420,
          delay,
          useNativeDriver: true,
          easing: APPLE_EASE_OUT,
        }),
        Animated.spring(scale, {
          toValue: 1,
          delay,
          useNativeDriver: true,
          tension: 180,
          friction: 22,
        }),
      ]),
      // Bekleme (durup nefes alır gibi)
      Animated.delay(360),
      // Çıkış — yumuşak geçiş, çıkış easing'i biraz yumuşak (in-out gibi)
      Animated.parallel([
        Animated.timing(tx, {
          toValue: fromLeft ? travelDistance : -travelDistance,
          duration: 520,
          useNativeDriver: true,
          easing: APPLE_EASE_IN,
        }),
        Animated.timing(op, {
          toValue: 0,
          duration: 380,
          delay: 120,
          useNativeDriver: true,
          easing: APPLE_EASE_IN,
        }),
        Animated.timing(scale, {
          toValue: 0.94,
          duration: 420,
          useNativeDriver: true,
          easing: APPLE_EASE_IN,
        }),
      ]),
    ]).start();
  }, []);

  return (
    <Animated.View style={{ transform: [{ translateX: tx }, { scale }], opacity: op }}>
      <AnimatedDrinkBottle
        kind={kind}
        fillLevel={1}
        liquidColor={LOADER_COLORS[kind]}
        width={width}
        height={height}
      />
    </Animated.View>
  );
}

interface ConveyorRowProps {
  bottleW: number;
  bottleH: number;
  rowW: number;
  fromLeft: boolean;
  /** Her batch arası ms */
  cycleMs: number;
  /** Stagger ms */
  staggerMs: number;
}

function ConveyorRow({ bottleW, bottleH, rowW, fromLeft, cycleMs, staggerMs }: ConveyorRowProps) {
  const [batchKey, setBatchKey] = useState(0);
  const [kinds, setKinds] = useState<BottleKind[]>([
    pickRandomKind(),
    pickRandomKind(),
    pickRandomKind(),
  ]);

  useEffect(() => {
    const i = setInterval(() => {
      setBatchKey((k) => k + 1);
      setKinds([pickRandomKind(), pickRandomKind(), pickRandomKind()]);
    }, cycleMs);
    return () => clearInterval(i);
  }, [cycleMs]);

  const ordered = fromLeft ? kinds : [...kinds].reverse();
  const travel = rowW * 0.6;

  return (
    <View style={[loaderStyles.row, { width: rowW }]}>
      {ordered.map((k, i) => {
        const idx = fromLeft ? i : kinds.length - 1 - i;
        return (
          <ConveyorBottle
            key={`${batchKey}-${idx}`}
            kind={k}
            width={bottleW}
            height={bottleH}
            delay={i * staggerMs}
            fromLeft={fromLeft}
            travelDistance={travel}
          />
        );
      })}
    </View>
  );
}

const loaderStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    overflow: 'hidden',
  },
});

// ─── Ripple — slot etrafında bir kez yayılan halka (Apple Pay onayı tarzı) ────
function Ripple({ visible, color, size }: { visible: boolean; color: string; size: number }) {
  const scale = useRef(new Animated.Value(0.4)).current;
  const op = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;
    scale.setValue(0.4);
    op.setValue(0.55);
    Animated.parallel([
      Animated.timing(scale, {
        toValue: 1.4,
        duration: 1100,
        useNativeDriver: true,
        easing: Easing.bezier(0.32, 0.72, 0, 1),
      }),
      Animated.timing(op, {
        toValue: 0,
        duration: 1100,
        useNativeDriver: true,
        easing: Easing.bezier(0.4, 0, 0.2, 1),
      }),
    ]).start();
  }, [visible]);

  if (!visible) return null;
  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: -size / 4,
        top: -size / 6,
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: 2,
        borderColor: color,
        opacity: op,
        transform: [{ scale }],
      }}
    />
  );
}

// ─── Top Shelf Bottle ──────────────────────────────────────────────────────────
function TopShelfBottle({
  filled,
  isNew,
  slotW,
  bottleW,
  bottleH,
  splashTrigger,
  onPress,
}: {
  filled: boolean;
  isNew: boolean;
  slotW: number;
  bottleW: number;
  bottleH: number;
  splashTrigger: number;
  onPress?: () => void;
}) {
  const tapScale = useRef(new Animated.Value(1)).current;

  const Container: any = onPress ? Pressable : View;
  return (
    <Container
      style={{ width: slotW, alignItems: 'center' }}
      onPress={onPress}
      onPressIn={
        onPress
          ? () =>
              Animated.spring(tapScale, {
                toValue: 0.92,
                useNativeDriver: true,
                tension: 300,
                friction: 12,
              }).start()
          : undefined
      }
      onPressOut={
        onPress
          ? () =>
              Animated.spring(tapScale, {
                toValue: 1,
                useNativeDriver: true,
                tension: 300,
                friction: 12,
              }).start()
          : undefined
      }
      hitSlop={4}
    >
      <Animated.View style={{ transform: [{ scale: tapScale }] }}>
        <Ripple visible={isNew} color="#32ADE6" size={bottleW * 1.6} />
        <AnimatedDrinkBottle
          kind="water"
          fillLevel={filled ? 1 : 0}
          liquidColor="#32ADE6"
          ghost={!filled}
          width={bottleW}
          height={bottleH}
          splashTrigger={isNew ? splashTrigger : 0}
        />
      </Animated.View>
    </Container>
  );
}

// ─── Bottom Shelf Bottle ───────────────────────────────────────────────────────
function BottomShelfBottle({
  slot,
  isNew,
  slotW,
  bottleW,
  bottleH,
  splashTrigger,
  onPress,
}: {
  slot: BottomSlot;
  isNew: boolean;
  slotW: number;
  bottleW: number;
  bottleH: number;
  splashTrigger: number;
  onPress?: () => void;
}) {
  const tapScale = useRef(new Animated.Value(1)).current;

  const Container: any = onPress ? Pressable : View;
  return (
    <Container
      style={{ width: slotW, alignItems: 'center' }}
      onPress={onPress}
      onPressIn={
        onPress
          ? () =>
              Animated.spring(tapScale, {
                toValue: 0.92,
                useNativeDriver: true,
                tension: 300,
                friction: 12,
              }).start()
          : undefined
      }
      onPressOut={
        onPress
          ? () =>
              Animated.spring(tapScale, {
                toValue: 1,
                useNativeDriver: true,
                tension: 300,
                friction: 12,
              }).start()
          : undefined
      }
      hitSlop={4}
    >
      <Animated.View style={{ transform: [{ scale: tapScale }] }}>
        <Ripple visible={isNew} color={slot.color} size={bottleW * 1.6} />
        <AnimatedDrinkBottle
          kind={slot.kind}
          fillLevel={1}
          liquidColor={slot.color}
          ghost={false}
          width={bottleW}
          height={bottleH}
          splashTrigger={isNew ? splashTrigger : 0}
        />
      </Animated.View>
    </Container>
  );
}

// ─── Display Screen — Apple-style hierarchy ───────────────────────────────────
function DisplayScreen({
  waterMl,
  goalMl,
  onPress,
}: {
  waterMl: number;
  goalMl: number;
  onPress: () => void;
}) {
  const countAnim = useRef(new Animated.Value(waterMl)).current;
  const prev = useRef(waterMl);
  const [shown, setShown] = React.useState(waterMl);
  const reached = waterMl >= goalMl && goalMl > 0;
  const pct = goalMl > 0 ? Math.min(1, waterMl / goalMl) : 0;
  const pctShown = Math.round(pct * 100);
  const progressAnim = useRef(new Animated.Value(pct)).current;

  useEffect(() => {
    const id = countAnim.addListener(({ value }) => setShown(Math.round(value)));
    return () => countAnim.removeListener(id);
  }, []);

  useEffect(() => {
    if (prev.current === waterMl) return;
    prev.current = waterMl;
    Animated.timing(countAnim, {
      toValue: waterMl,
      duration: 1100,
      useNativeDriver: false,
      easing: Easing.bezier(0.22, 1, 0.36, 1),
    }).start();
    Animated.timing(progressAnim, {
      toValue: pct,
      duration: 1100,
      useNativeDriver: false,
      easing: Easing.bezier(0.22, 1, 0.36, 1),
    }).start();
  }, [waterMl]);

  const widthInterp = progressAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  return (
    <Pressable onPress={onPress} hitSlop={4} style={{ flex: 1 }}>
      {({ pressed }) => (
        <View style={[ds.screen, pressed && { opacity: 0.92 }]}>
          {/* Üst etiket */}
          <View style={ds.headerRow}>
            <Text style={ds.label}>Günlük İlerleme</Text>
            <Text style={ds.percent}>{pctShown}%</Text>
          </View>

          {/* Ana sayaç */}
          <View style={ds.valueRow}>
            <Text style={ds.bigVal}>{shown.toLocaleString('tr-TR')}</Text>
            <Text style={ds.unit}>/ {goalMl.toLocaleString('tr-TR')} ml</Text>
          </View>

          {/* Progress bar */}
          <View style={ds.progressBarBg}>
            <Animated.View
              style={[
                ds.progressBarFill,
                { width: widthInterp, backgroundColor: reached ? '#30D158' : NEON },
              ]}
            />
          </View>
        </View>
      )}
    </Pressable>
  );
}

const ds = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: BODY_DEEP,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 0.5,
    borderColor: 'rgba(125,211,242,0.15)',
    justifyContent: 'space-between',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  percent: {
    color: NEON,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  bigVal: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: -1,
    lineHeight: 28,
  },
  unit: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: -0.1,
  },
  progressBarBg: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
});

// ─── Big Action Button (otomatın "satın al" butonu = + ekle) ───────────────────
function BigActionButton({ onPress }: { onPress: () => void }) {
  const scale = useRef(new Animated.Value(1)).current;
  const glow = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glow, {
          toValue: 1,
          duration: 1400,
          useNativeDriver: true,
          easing: Easing.bezier(0.22, 1, 0.36, 1),
        }),
        Animated.timing(glow, {
          toValue: 0,
          duration: 1400,
          useNativeDriver: true,
          easing: Easing.bezier(0.22, 1, 0.36, 1),
        }),
      ]),
    ).start();
  }, []);

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() =>
        Animated.spring(scale, {
          toValue: 0.9,
          useNativeDriver: true,
          tension: 300,
          friction: 12,
        }).start()
      }
      onPressOut={() =>
        Animated.spring(scale, {
          toValue: 1,
          useNativeDriver: true,
          tension: 300,
          friction: 12,
        }).start()
      }
    >
      <Animated.View style={[bab.wrap, { transform: [{ scale }] }]}>
        <Animated.View
          style={[
            bab.glowRing,
            { opacity: glow.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.8] }) },
          ]}
        />
        <View style={bab.inner}>
          <Ionicons name="add" size={28} color="#fff" />
        </View>
      </Animated.View>
    </Pressable>
  );
}

const bab = StyleSheet.create({
  wrap: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowRing: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: NEON,
    shadowColor: NEON,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 12,
  },
  inner: {
    width: 50,
    height: 50,
    borderRadius: 16,
    backgroundColor: ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 1.5,
    borderTopColor: '#5BCAEC',
    borderBottomWidth: 1,
    borderBottomColor: '#1A6B95',
  },
});

// ─── Main Vending Machine ──────────────────────────────────────────────────────
export function VendingMachine({
  goalMl,
  defaultBottleMl,
  waterMl,
  bottomDrinks,
  newSlotId,
  onLedPress,
  onAddPress,
  onWaterShelfPress,
  onBottomDrinkPress,
  loading = false,
}: VendingMachineProps) {
  const [splashTick, setSplashTick] = React.useState(0);
  const lastSlotRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    if (newSlotId && newSlotId !== lastSlotRef.current) {
      lastSlotRef.current = newSlotId;
      setSplashTick((t) => t + 1);
    }
  }, [newSlotId]);

  const totalGhosts = Math.min(
    Math.max(1, Math.ceil(goalMl / Math.max(defaultBottleMl, 50))),
    TOP_SHELF_MAX_GHOSTS,
  );
  const filledCount = Math.min(Math.floor(waterMl / Math.max(defaultBottleMl, 50)), totalGhosts);

  const topSlotW = CABINET_INNER_W / totalGhosts;
  const topBottleW = Math.min(56, topSlotW - 2);
  const topBottleH = SHELF_H - 8;

  // İçecekleri 2 alt rafa dağıt — son 10'u al, ilk 5'i orta rafa, sonraki 5'i alt rafa
  const recentBottom = bottomDrinks.slice(-TOTAL_BOTTOM_CAPACITY);
  const middleShelf = recentBottom.slice(0, SHELF_CAPACITY);
  const bottomShelf = recentBottom.slice(SHELF_CAPACITY);

  const bottomSlotW = CABINET_INNER_W / SHELF_CAPACITY;
  const bottomBottleW = Math.min(72, bottomSlotW - 4);
  const bottomBottleH = SHELF_H - 8;

  return (
    <View style={s.outer}>
      <View style={s.body}>
        {/* ═══ ÜST TABELA ═══ */}
        <View style={s.banner}>
          <View style={s.bannerInner}>
            <Ionicons name="water" size={20} color="#fff" style={{ opacity: 0.95 }} />
            <Text style={s.bannerText}>FitAI Otomatı</Text>
          </View>
          <View style={s.bannerNeonLine} />
        </View>

        {/* ═══ CAM VİTRİN ═══ */}
        <View style={[s.cabinet, { height: CABINET_H }]}>
          {/* Cam yansıma */}
          <View pointerEvents="none" style={s.glassReflection} />
          <View pointerEvents="none" style={s.glassEdge} />

          {/* Üst raf — su şişeleri */}
          <View style={[s.shelfBox, { height: SHELF_H }]}>
            <View style={s.shelfRow}>
              {loading ? (
                <ConveyorRow
                  bottleW={topBottleW}
                  bottleH={topBottleH}
                  rowW={CABINET_INNER_W}
                  fromLeft={true}
                  cycleMs={1700}
                  staggerMs={120}
                />
              ) : (
                Array.from({ length: totalGhosts }).map((_, i) => {
                  const filled = i < filledCount;
                  const isNewWaterFill = newSlotId === 'water' && i === filledCount - 1;
                  return (
                    <TopShelfBottle
                      key={`top-${i}`}
                      filled={filled}
                      isNew={isNewWaterFill}
                      slotW={topSlotW}
                      bottleW={topBottleW}
                      bottleH={topBottleH}
                      splashTrigger={splashTick}
                      onPress={filled ? onWaterShelfPress : undefined}
                    />
                  );
                })
              )}
            </View>
            <View style={s.shelfBoard} />
          </View>

          {/* Orta raf — diğer içecekler */}
          <View style={[s.shelfBox, { height: SHELF_H }]}>
            <View style={s.shelfRow}>
              {loading ? (
                <ConveyorRow
                  bottleW={bottomBottleW}
                  bottleH={bottomBottleH}
                  rowW={CABINET_INNER_W}
                  fromLeft={false}
                  cycleMs={1700}
                  staggerMs={120}
                />
              ) : middleShelf.length === 0 ? (
                <View style={s.bottomEmptyHint}>
                  <Text style={s.bottomEmptyTxt}>İçecekler buraya gelir</Text>
                </View>
              ) : (
                middleShelf.map((slot) => (
                  <BottomShelfBottle
                    key={slot.id}
                    slot={slot}
                    isNew={slot.id === newSlotId}
                    slotW={bottomSlotW}
                    bottleW={bottomBottleW}
                    bottleH={bottomBottleH}
                    splashTrigger={splashTick}
                    onPress={() => onBottomDrinkPress(slot.id)}
                  />
                ))
              )}
            </View>
            <View style={s.shelfBoard} />
          </View>

          {/* Alt raf — taşan içecekler (5+) ya da hayalet silüetler */}
          <View style={[s.shelfBox, { height: SHELF_H }]}>
            <View style={s.shelfRow}>
              {loading ? (
                <ConveyorRow
                  bottleW={bottomBottleW}
                  bottleH={bottomBottleH}
                  rowW={CABINET_INNER_W}
                  fromLeft={true}
                  cycleMs={1700}
                  staggerMs={120}
                />
              ) : bottomShelf.length > 0 ? (
                bottomShelf.map((slot) => (
                  <BottomShelfBottle
                    key={slot.id}
                    slot={slot}
                    isNew={slot.id === newSlotId}
                    slotW={bottomSlotW}
                    bottleW={bottomBottleW}
                    bottleH={bottomBottleH}
                    splashTrigger={splashTick}
                    onPress={() => onBottomDrinkPress(slot.id)}
                  />
                ))
              ) : (
                (['tea', 'coffee', 'juice', 'smoothie'] as const).map((kind, i) => (
                  <View
                    key={`ph-${i}`}
                    style={{ width: bottomSlotW, alignItems: 'center', opacity: 0.18 }}
                  >
                    <AnimatedDrinkBottle
                      kind={kind}
                      fillLevel={1}
                      liquidColor="#A0A8B0"
                      ghost={false}
                      width={Math.min(60, bottomSlotW - 6)}
                      height={SHELF_H - 8}
                    />
                  </View>
                ))
              )}
            </View>
            <View style={s.shelfBoard} />
          </View>
        </View>

        {/* ═══ KONTROL PANELİ ═══ */}
        <View style={s.controlPanel}>
          <DisplayScreen waterMl={waterMl} goalMl={goalMl} onPress={onLedPress} />
          <BigActionButton onPress={onAddPress} />
        </View>

        {/* ═══ ALMA HAZNESİ ═══ */}
        <View style={s.dispenser}>
          <View style={s.dispenserOpening}>
            <View style={s.dispenserShadow} />
            <View style={s.dispenserDeepShadow} />
          </View>
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  outer: {
    width: MACHINE_W,
    height: MACHINE_H,
    alignSelf: 'center',
  },
  body: {
    width: MACHINE_W,
    height: MACHINE_H,
    backgroundColor: BODY,
    borderRadius: BODY_RADIUS,
    padding: BODY_PAD,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.45,
    shadowRadius: 28,
    borderWidth: 2,
    borderColor: BODY_DARK,
  },

  // ── BANNER ──
  banner: {
    height: BANNER_H,
    backgroundColor: '#1976A8',
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1.5,
    borderColor: '#0F5478',
    overflow: 'hidden',
    position: 'relative',
  },
  bannerInner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 14,
  },
  bannerText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  bannerNeonLine: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: '#0A4A6B',
  },

  // ── CABINET ──
  cabinet: {
    backgroundColor: '#E8F4FA',
    borderRadius: 12,
    padding: CABINET_PAD,
    borderWidth: 2,
    borderColor: BODY_DARK,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 8,
  },
  glassReflection: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '45%',
    height: '100%',
    backgroundColor: '#FFFFFF',
    opacity: 0.22,
    transform: [{ skewX: '-14deg' }, { translateX: -20 }],
  },
  glassEdge: {
    position: 'absolute',
    top: 4,
    left: 4,
    right: 4,
    height: 1.5,
    backgroundColor: '#FFFFFF',
    opacity: 0.6,
    borderRadius: 1,
  },
  shelfBox: {
    justifyContent: 'flex-end',
  },
  shelfRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    overflow: 'visible',
  },
  shelfBoard: {
    height: 5,
    backgroundColor: '#8FA3B8',
    borderRadius: 2,
    marginTop: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    borderTopWidth: 1,
    borderTopColor: '#B5C6D8',
  },
  bottomEmptyHint: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomEmptyTxt: {
    fontSize: 11,
    color: '#90A8B8',
    fontStyle: 'italic',
  },

  // ── CONTROL PANEL ──
  controlPanel: {
    height: CONTROL_H,
    backgroundColor: PANEL_BG,
    borderRadius: 12,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1.5,
    borderColor: BODY_DARK,
    marginBottom: 8,
  },

  // ── DISPENSER ──
  dispenser: {
    height: DISPENSER_H,
    backgroundColor: BODY_DARK,
    borderRadius: 12,
    padding: 8,
    borderWidth: 1.5,
    borderColor: '#0A1525',
  },
  dispenserOpening: {
    flex: 1,
    backgroundColor: BODY_DEEP,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 3,
    borderTopColor: '#000',
  },
  dispenserShadow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 18,
    backgroundColor: '#000',
    opacity: 0.85,
  },
  dispenserDeepShadow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 8,
    backgroundColor: '#000',
  },
  dispenserHint: {
    color: NEON,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 6,
    opacity: 0.3,
    fontFamily: 'Menlo',
  },
});

export { categoryToBottle, categoryToColor };

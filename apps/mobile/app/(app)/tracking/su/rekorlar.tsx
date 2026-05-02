import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSession } from '@clerk/expo';
import {
  Canvas,
  Rect,
  RadialGradient,
  vec,
  Turbulence,
  ColorMatrix,
  Group,
  Blur,
  Circle,
} from '@shopify/react-native-skia';
import {
  useDerivedValue,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing as REasing,
} from 'react-native-reanimated';
import {
  DrinkIcon,
  DRINK_ICON_NAMES,
  type DrinkIconName,
} from '../../../../components/tracking/water/DrinkIcons';
import { getReadableDrinkColor } from '../../../../components/tracking/water/drinkColor';

const ACCENT = '#0A84FF';
const { width: SW, height: SH } = Dimensions.get('window');
const HERO_H = 360; // detay sheet hero yüksekliği — ikon + isim + bigStatRow toplam alanı
const BANNER_H = 240; // ana ekran "Su Rekorların" banner yüksekliği
const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

// ─── Types ────────────────────────────────────────────────────────────────────

interface DrinkRecord {
  drinkId: string;
  drinkName: string;
  iconName: string;
  category: string;
  color: string;
  totalMl: number;
  bestDayMl: number;
  totalCount: number;
}

const ICON_FALLBACK_BY_CATEGORY: Record<string, DrinkIconName> = {
  water: 'bottle',
  tea: 'cup',
  coffee: 'mug',
  herbal: 'cup',
  juice: 'glass',
  sports: 'bottle',
  dairy: 'glass',
  smoothie: 'smoothie',
  soda: 'canister',
  alcohol: 'wineGlass',
  other: 'glass',
};

function pickIconName(name: string | undefined, category: string): DrinkIconName {
  if (name && DRINK_ICON_NAMES.includes(name as DrinkIconName)) return name as DrinkIconName;
  return ICON_FALLBACK_BY_CATEGORY[category] ?? 'glass';
}

// ─── Renk Türetme ─────────────────────────────────────────────────────────────
// Hex'i HSL'e çevirip tone'lar oluşturuyoruz — gradient stops için.

function hexToHsl(hex: string): { h: number; s: number; l: number } {
  let h = hex.replace('#', '');
  if (h.length === 3)
    h = h
      .split('')
      .map((c) => c + c)
      .join('');
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let H = 0;
  let S = 0;
  const L = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    S = L > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        H = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        H = ((b - r) / d + 2) / 6;
        break;
      case b:
        H = ((r - g) / d + 4) / 6;
        break;
    }
  }
  return { h: H * 360, s: S * 100, l: L * 100 };
}

function hslToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const c = l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    return Math.round(255 * c)
      .toString(16)
      .padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

// Bir base renkten gradient için 4 ton üret: çok koyu, koyu, base, açık-parlak
function deriveGradientStops(baseHex: string) {
  const { h, s, l } = hexToHsl(baseHex);
  const sat = Math.min(s, 75); // aşırı doygunluğu kıs
  return {
    veryDark: hslToHex(h, sat, Math.max(8, l - 38)), // sol-üst karanlık
    dark: hslToHex(h, sat, Math.max(18, l - 22)), // orta-koyu
    base: hslToHex(h, sat, Math.max(35, l - 5)), // base ton
    light: hslToHex(h, Math.min(sat + 10, 85), Math.min(82, l + 22)), // sağ-alt parlama
  };
}

interface WaterRecords {
  empty: boolean;
  bestDayMl: number;
  bestDayDate: string;
  bestDayDiff: number | null;
  longestStreak: number;
  currentStreak: number;
  lastGoalDate: string | null;
  totalLiters: number;
  avgDailyMl: number;
  goalHitRate: number;
  bestWeekMl: number;
  bestWeekLabel: string;
  bestMonthMl: number;
  bestMonthLabel: string;
  earliestGoalTime: string | null;
  drinkRecords: DrinkRecord[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtMl(ml: number): string {
  if (ml >= 1000) return `${(ml / 1000).toFixed(ml % 1000 === 0 ? 0 : 1)}L`;
  return `${ml}ml`;
}

// ─── API Hook ─────────────────────────────────────────────────────────────────

function useWaterRecords() {
  const { session } = useSession();
  const [data, setData] = useState<WaterRecords | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetch_ = useCallback(async () => {
    try {
      setLoading(true);
      setError(false);
      const token = await session?.getToken();
      const res = await fetch(`${API_URL}/api/water/records`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error('fetch failed');
      const json = (await res.json()) as WaterRecords;
      // İçecek renklerini render-time'da gri'ye çevir (beyaz drink'ler)
      if (!json.empty && json.drinkRecords) {
        json.drinkRecords = json.drinkRecords.map((d) => ({
          ...d,
          color: getReadableDrinkColor(d.color),
        }));
      }
      setData(json);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    fetch_();
  }, [fetch_]);

  return { data, loading, error, refetch: fetch_ };
}

// ─── Skia Gradient Hero Background ────────────────────────────────────────────
// Çok katmanlı: koyu base → büyük dark blob (sol-üst) → parlak light blob (sağ-alt) → grain noise.

function HeroGradient({
  baseColor,
  width,
  height,
}: {
  baseColor: string;
  width: number;
  height: number;
}) {
  const stops = deriveGradientStops(baseColor);

  // Sürekli 0 → 2π döngüsü (40 saniyede bir tam tur). Tüm blob'lar bunun
  // farklı çarpanlarıyla farklı hızlarda hareket eder.
  const clock = useSharedValue(0);
  useEffect(() => {
    clock.value = withRepeat(
      withTiming(Math.PI * 2, { duration: 40000, easing: REasing.linear }),
      -1,
      false,
    );
  }, []);

  // Hareket genliği ekran boyutunun %4–6'sı kadar — fark edilir ama dikkat dağıtmaz.

  // Blob 1 — büyük orta blob (sol-orta)
  const c1 = useDerivedValue(() => {
    const t = clock.value;
    return vec(
      width * 0.32 + Math.sin(t * 1.0) * width * 0.06,
      height * 0.45 + Math.cos(t * 1.3) * height * 0.05,
    );
  });

  // Blob 2 — karanlık leke (sol-üst köşe)
  const c2 = useDerivedValue(() => {
    const t = clock.value;
    return vec(
      width * 0.05 + Math.sin(t * 0.7 + 1.2) * width * 0.05,
      height * 0.1 + Math.cos(t * 0.9) * height * 0.04,
    );
  });

  // Blob 3 — parlak ışık (sağ-alt) — en hareketli, dikkat çeker
  const c3 = useDerivedValue(() => {
    const t = clock.value;
    return vec(
      width * 0.92 + Math.cos(t * 1.5) * width * 0.05,
      height * 0.78 + Math.sin(t * 1.2) * height * 0.04,
    );
  });

  // Blob 4 — ikincil parlama (orta-sağ)
  const c4 = useDerivedValue(() => {
    const t = clock.value;
    return vec(
      width * 0.78 + Math.sin(t * 1.8 + 2.1) * width * 0.04,
      height * 0.32 + Math.cos(t * 1.6) * height * 0.05,
    );
  });

  // Grain seed — yavaşça değişsin (her ~150ms'de bir adım), film grain hissi
  const grainSeed = useDerivedValue(() => Math.floor(clock.value * 30) % 8);

  return (
    <Canvas style={{ position: 'absolute', top: 0, left: 0, width, height }}>
      {/* 1) Düz koyu base — alt katman */}
      <Rect x={0} y={0} width={width} height={height} color={stops.veryDark} />

      {/* 2) Büyük orta blob */}
      <Circle c={c1} r={width * 0.75}>
        <RadialGradient
          c={c1}
          r={width * 0.75}
          colors={[stops.base, stops.dark, 'transparent']}
          positions={[0, 0.45, 1]}
        />
      </Circle>

      {/* 3) Karanlık leke — sol-üst köşe */}
      <Circle c={c2} r={width * 0.55}>
        <RadialGradient
          c={c2}
          r={width * 0.55}
          colors={[stops.veryDark, 'transparent']}
          positions={[0.3, 1]}
        />
      </Circle>

      {/* 4) Parlak ışık blob'u — sağ-alt köşe */}
      <Circle c={c3} r={width * 0.55}>
        <RadialGradient
          c={c3}
          r={width * 0.55}
          colors={[stops.light, stops.base, 'transparent']}
          positions={[0, 0.4, 1]}
        />
      </Circle>

      {/* 5) İkincil küçük parlak nokta — orta-sağ */}
      <Circle c={c4} r={width * 0.3}>
        <RadialGradient
          c={c4}
          r={width * 0.3}
          colors={[`${stops.light}cc`, 'transparent']}
          positions={[0, 1]}
        />
      </Circle>

      {/* 6) Animated grain — Turbulence seed yavaşça değişir */}
      <Group opacity={0.18}>
        <Rect x={0} y={0} width={width} height={height}>
          <ColorMatrix matrix={[0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0]} />
          <Turbulence freqX={0.85} freqY={0.85} octaves={2} seed={grainSeed} />
        </Rect>
      </Group>
    </Canvas>
  );
}

// ─── Detail Sheet ─────────────────────────────────────────────────────────────

function DrinkDetailSheet({
  drink,
  visible,
  onClose,
}: {
  drink: DrinkRecord | null;
  visible: boolean;
  onClose: () => void;
}) {
  const slideAnim = useRef(new Animated.Value(SH)).current;
  const opAnim = useRef(new Animated.Value(0)).current;
  const contentOp = useRef(new Animated.Value(0)).current;
  const contentTy = useRef(new Animated.Value(20)).current;
  const [snap, setSnap] = useState<DrinkRecord | null>(null);

  useEffect(() => {
    if (visible && drink) {
      setSnap(drink);
      contentOp.setValue(0);
      contentTy.setValue(20);
      requestAnimationFrame(() => {
        Animated.parallel([
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 520,
            useNativeDriver: true,
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
          Animated.timing(opAnim, { toValue: 1, duration: 380, useNativeDriver: true }),
        ]).start();
        setTimeout(
          () =>
            Animated.parallel([
              Animated.timing(contentOp, {
                toValue: 1,
                duration: 400,
                useNativeDriver: true,
                easing: Easing.bezier(0.16, 1, 0.3, 1),
              }),
              Animated.timing(contentTy, {
                toValue: 0,
                duration: 400,
                useNativeDriver: true,
                easing: Easing.bezier(0.16, 1, 0.3, 1),
              }),
            ]).start(),
          160,
        );
      });
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: SH,
          duration: 460,
          useNativeDriver: true,
          easing: Easing.bezier(0.4, 0, 1, 1),
        }),
        Animated.timing(opAnim, { toValue: 0, duration: 320, useNativeDriver: true }),
      ]).start(({ finished }) => {
        if (finished) setSnap(null);
      });
    }
  }, [visible]);

  if (!snap) return null;

  const rows = [
    {
      label: 'Toplam Tüketim',
      val: fmtMl(snap.totalMl),
      icon: 'water-outline' as const,
      color: ACCENT,
    },
    {
      label: 'En İyi Gün',
      val: fmtMl(snap.bestDayMl),
      icon: 'trophy-outline' as const,
      color: '#FF9500',
    },
    {
      label: 'Toplam Kayıt',
      val: `${snap.totalCount} kez`,
      icon: 'list-outline' as const,
      color: '#5E5CE6',
    },
  ];

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents={visible ? 'auto' : 'none'}>
      <Animated.View
        style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.55)', opacity: opAnim }]}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>
      <Animated.View style={[ds.sheet, { transform: [{ translateY: slideAnim }] }]}>
        <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
          <View style={ds.hero}>
            <HeroGradient baseColor={snap.color} width={SW} height={HERO_H} />
            <View style={ds.handle} />
            <View style={ds.iconWrap}>
              <View
                style={[
                  ds.iconBg,
                  {
                    backgroundColor: 'rgba(255,255,255,0.18)',
                    borderWidth: 1,
                    borderColor: 'rgba(255,255,255,0.22)',
                  },
                ]}
              >
                <DrinkIcon
                  name={pickIconName(snap.iconName, snap.category)}
                  size={56}
                  color="#fff"
                />
              </View>
            </View>
            <Text style={ds.heroName}>{snap.drinkName}</Text>
            <View style={[ds.bigStatRow, { backgroundColor: 'rgba(0,0,0,0.28)' }]}>
              {[
                { val: fmtMl(snap.totalMl), lbl: 'Toplam' },
                { val: fmtMl(snap.bestDayMl), lbl: 'En İyi Gün' },
                { val: `${snap.totalCount}`, lbl: 'Kayıt' },
              ].map((s, i) => (
                <View
                  key={s.lbl}
                  style={[
                    ds.bigStatItem,
                    i < 2 && {
                      borderRightWidth: StyleSheet.hairlineWidth,
                      borderRightColor: 'rgba(255,255,255,0.25)',
                    },
                  ]}
                >
                  <Text style={ds.bigStatVal}>{s.val}</Text>
                  <Text style={ds.bigStatLbl}>{s.lbl}</Text>
                </View>
              ))}
            </View>
          </View>
          <Animated.View
            style={{
              opacity: contentOp,
              transform: [{ translateY: contentTy }],
              paddingHorizontal: 20,
              paddingTop: 20,
              paddingBottom: 140,
            }}
          >
            <View style={ds.detailList}>
              {rows.map((r, i) => (
                <View
                  key={r.label}
                  style={[ds.detailRow, i < rows.length - 1 && ds.detailRowBorder]}
                >
                  <View style={[ds.detailIcon, { backgroundColor: r.color + '18' }]}>
                    <Ionicons name={r.icon} size={17} color={r.color} />
                  </View>
                  <Text style={ds.detailLbl}>{r.label}</Text>
                  <Text style={[ds.detailVal, { color: r.color }]}>{r.val}</Text>
                </View>
              ))}
            </View>
          </Animated.View>
        </ScrollView>
      </Animated.View>
    </View>
  );
}

// ─── Hero Stat Card ───────────────────────────────────────────────────────────

function HeroCard({
  icon,
  iconColor,
  bg,
  label,
  value,
  unit,
  sub,
  diff,
  diffPositive,
  index,
}: {
  icon: string;
  iconColor: string;
  bg: string;
  label: string;
  value: string;
  unit?: string;
  sub: string;
  diff?: string | null;
  diffPositive?: boolean;
  index: number;
}) {
  const entryOp = useRef(new Animated.Value(0)).current;
  const entryTy = useRef(new Animated.Value(28)).current;

  useEffect(() => {
    const t = setTimeout(
      () =>
        Animated.parallel([
          Animated.timing(entryOp, {
            toValue: 1,
            duration: 380,
            useNativeDriver: true,
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
          Animated.timing(entryTy, {
            toValue: 0,
            duration: 380,
            useNativeDriver: true,
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
        ]).start(),
      index * 60,
    );
    return () => clearTimeout(t);
  }, []);

  return (
    <Animated.View
      style={[
        hc.card,
        { backgroundColor: bg, opacity: entryOp, transform: [{ translateY: entryTy }] },
      ]}
    >
      <View style={[hc.iconBox, { backgroundColor: iconColor + '20' }]}>
        <Ionicons name={icon as any} size={22} color={iconColor} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={hc.label}>{label}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 4, marginTop: 4 }}>
          <Text style={[hc.value, { color: iconColor }]}>{value}</Text>
          {unit && <Text style={[hc.unit, { color: iconColor }]}>{unit}</Text>}
        </View>
        <Text style={hc.sub} numberOfLines={1}>
          {sub}
        </Text>
      </View>
      {diff != null && (
        <View style={[hc.diffChip, { backgroundColor: diffPositive ? '#30D15822' : '#FF3B3022' }]}>
          <Ionicons
            name={diffPositive ? 'arrow-up' : 'arrow-down'}
            size={10}
            color={diffPositive ? '#30D158' : '#FF3B30'}
          />
          <Text style={[hc.diffTxt, { color: diffPositive ? '#30D158' : '#FF3B30' }]}>{diff}</Text>
        </View>
      )}
    </Animated.View>
  );
}

// ─── Drink Record Row ─────────────────────────────────────────────────────────

function DrinkRow({
  drink,
  index,
  onPress,
  maxMl,
}: {
  drink: DrinkRecord;
  index: number;
  onPress: () => void;
  maxMl: number;
}) {
  const entryOp = useRef(new Animated.Value(0)).current;
  const entryTy = useRef(new Animated.Value(20)).current;
  const pressAnim = useRef(new Animated.Value(1)).current;
  const barWidth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const t = setTimeout(
      () => {
        Animated.parallel([
          Animated.timing(entryOp, {
            toValue: 1,
            duration: 340,
            useNativeDriver: true,
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
          Animated.timing(entryTy, {
            toValue: 0,
            duration: 340,
            useNativeDriver: true,
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
        ]).start();
        Animated.timing(barWidth, {
          toValue: maxMl > 0 ? drink.totalMl / maxMl : 0,
          duration: 1100,
          useNativeDriver: false,
          easing: Easing.bezier(0.22, 1, 0.36, 1),
        }).start();
      },
      index * 50 + 200,
    );
    return () => clearTimeout(t);
  }, []);

  const rank = index + 1;
  const rankColor =
    rank === 1 ? '#FFD60A' : rank === 2 ? '#AEAEB2' : rank === 3 ? '#FF9500' : '#C7C7CC';

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() =>
        Animated.timing(pressAnim, {
          toValue: 0.97,
          duration: 80,
          useNativeDriver: true,
          easing: Easing.bezier(0.4, 0, 0.2, 1),
        }).start()
      }
      onPressOut={() =>
        Animated.spring(pressAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 300,
          friction: 12,
        }).start()
      }
    >
      <Animated.View
        style={[
          dr.card,
          { opacity: entryOp, transform: [{ translateY: entryTy }, { scale: pressAnim }] },
        ]}
      >
        <View style={[dr.rankBadge, { backgroundColor: rankColor + '22' }]}>
          <Text style={[dr.rankTxt, { color: rankColor }]}>{rank}</Text>
        </View>
        <View style={[dr.iconBox, { backgroundColor: drink.color + '18' }]}>
          <DrinkIcon
            name={pickIconName(drink.iconName, drink.category)}
            size={28}
            color={drink.color}
          />
        </View>
        <View style={{ flex: 1, gap: 6 }}>
          <View
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
          >
            <Text style={dr.name}>{drink.drinkName}</Text>
            <Text style={[dr.total, { color: drink.color }]}>{fmtMl(drink.totalMl)}</Text>
          </View>
          <View style={dr.barTrack}>
            <Animated.View
              style={[
                dr.barFill,
                {
                  backgroundColor: drink.color,
                  width: barWidth.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
                },
              ]}
            />
          </View>
          <Text style={dr.sub}>
            {drink.totalCount} kayıt · En iyi gün {fmtMl(drink.bestDayMl)}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color="#C7C7CC" />
      </Animated.View>
    </Pressable>
  );
}

// ─── Stat Row ─────────────────────────────────────────────────────────────────

function StatRow({
  icon,
  color,
  label,
  value,
  index,
}: {
  icon: string;
  color: string;
  label: string;
  value: string;
  index: number;
}) {
  const entryOp = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const t = setTimeout(
      () =>
        Animated.timing(entryOp, {
          toValue: 1,
          duration: 320,
          useNativeDriver: true,
          easing: Easing.bezier(0.16, 1, 0.3, 1),
        }).start(),
      index * 40 + 300,
    );
    return () => clearTimeout(t);
  }, []);
  return (
    <Animated.View style={[sr.row, { opacity: entryOp }]}>
      <View style={[sr.iconBox, { backgroundColor: color + '18' }]}>
        <Ionicons name={icon as any} size={16} color={color} />
      </View>
      <Text style={sr.label}>{label}</Text>
      <Text style={[sr.value, { color }]}>{value}</Text>
    </Animated.View>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

function RekorlarTab() {
  const { data, loading, error, refetch } = useWaterRecords();
  const [detailDrink, setDetailDrink] = useState<DrinkRecord | null>(null);
  const [detailVisible, setDetailVisible] = useState(false);

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={ACCENT} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
        <Ionicons name="cloud-offline-outline" size={48} color="#C7C7CC" />
        <Text style={{ fontSize: 16, fontWeight: '700', color: '#1C1C1E' }}>Bağlantı hatası</Text>
        <Pressable
          onPress={refetch}
          style={{
            paddingHorizontal: 20,
            paddingVertical: 10,
            backgroundColor: ACCENT,
            borderRadius: 12,
          }}
        >
          <Text style={{ fontSize: 14, fontWeight: '700', color: '#fff' }}>Tekrar Dene</Text>
        </Pressable>
      </View>
    );
  }

  if (!data || data.empty) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 }}>
        <Ionicons name="trophy-outline" size={52} color="#C7C7CC" />
        <Text style={{ fontSize: 16, fontWeight: '700', color: '#1C1C1E' }}>Henüz rekor yok</Text>
        <Text
          style={{ fontSize: 14, color: '#8E8E93', textAlign: 'center', paddingHorizontal: 40 }}
        >
          Su ekledikçe rekorların burada görünür
        </Text>
      </View>
    );
  }

  const maxMl =
    data.drinkRecords.length > 0 ? Math.max(...data.drinkRecords.map((d) => d.totalMl), 1) : 1;

  const heroCards = [
    {
      icon: 'trophy',
      iconColor: '#FF9500',
      bg: '#FFF4E5',
      label: 'En İyi Gün',
      value: fmtMl(data.bestDayMl),
      sub: data.bestDayDate,
      diff: data.bestDayDiff != null ? fmtMl(data.bestDayDiff) : null,
      diffPositive: true,
    },
    {
      icon: 'flame',
      iconColor: '#FF2D55',
      bg: '#FFE9ED',
      label: 'En Uzun Seri',
      value: `${data.longestStreak}`,
      unit: 'gün',
      sub:
        data.longestStreak === 0
          ? 'Henüz hedef tamamlanmadı'
          : data.longestStreak === data.currentStreak && data.currentStreak > 0
            ? 'Devam ediyor'
            : data.lastGoalDate
              ? `Son: ${new Date(data.lastGoalDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })}`
              : '',
      diff: null,
      diffPositive: true,
    },
    {
      icon: 'water',
      iconColor: ACCENT,
      bg: '#E5F2FF',
      label: 'Toplam Hacim',
      value: `${data.totalLiters.toFixed(1)}`,
      unit: 'L',
      sub: `Ort. ${fmtMl(data.avgDailyMl)}/gün`,
      diff: null,
      diffPositive: true,
    },
  ];

  const statRows = [
    {
      icon: 'calendar-outline',
      color: '#5E5CE6',
      label: 'Hedef Başarı Oranı',
      value: `%${data.goalHitRate}`,
    },
    {
      icon: 'bar-chart-outline',
      color: '#30D158',
      label: 'En İyi Hafta',
      value: `${fmtMl(data.bestWeekMl)} · ${data.bestWeekLabel}`,
    },
    {
      icon: 'stats-chart-outline',
      color: '#FF6B35',
      label: 'En İyi Ay',
      value: `${fmtMl(data.bestMonthMl)} · ${data.bestMonthLabel}`,
    },
    ...(data.earliestGoalTime
      ? [
          {
            icon: 'time-outline',
            color: '#FF9500',
            label: 'En Erken Hedef Saati',
            value: data.earliestGoalTime,
          },
        ]
      : []),
  ];

  return (
    <>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 60 }}
      >
        {/* Hero Banner */}
        <View style={mb.banner}>
          <HeroGradient baseColor={ACCENT} width={SW - 40} height={BANNER_H} />
          <View style={mb.bannerIconWrap}>
            <View style={mb.bannerIconBg}>
              <Ionicons name="trophy" size={40} color="#FFD60A" />
            </View>
          </View>
          <Text style={mb.bannerTitle}>Su Rekorların</Text>
          <Text style={mb.bannerSub}>Tüm zamanların en iyi performansları</Text>
        </View>

        {/* 3 Hero Kart */}
        <View style={{ paddingHorizontal: 20, gap: 12, marginTop: -20, marginBottom: 28 }}>
          {heroCards.map((c, i) => (
            <HeroCard key={c.label} {...c} index={i} />
          ))}
        </View>

        {/* İçecek Sıralaması */}
        {data.drinkRecords.length > 0 && (
          <>
            <Text style={mb.sectionTitle}>İçecek Sıralaması</Text>
            <View style={{ paddingHorizontal: 20, gap: 10, marginBottom: 28 }}>
              {data.drinkRecords.map((d, i) => (
                <DrinkRow
                  key={d.drinkId}
                  drink={d}
                  index={i}
                  maxMl={maxMl}
                  onPress={() => {
                    setDetailDrink(d);
                    setDetailVisible(true);
                  }}
                />
              ))}
            </View>
          </>
        )}

        {/* Ek İstatistikler */}
        <Text style={mb.sectionTitle}>Daha Fazla İstatistik</Text>
        <View style={[mb.statCard, { marginHorizontal: 20 }]}>
          {statRows.map((s, i) => (
            <View key={s.label}>
              <StatRow {...s} index={i} />
              {i < statRows.length - 1 && <View style={mb.divider} />}
            </View>
          ))}
        </View>
      </ScrollView>

      <DrinkDetailSheet
        drink={detailDrink}
        visible={detailVisible}
        onClose={() => setDetailVisible(false)}
      />
    </>
  );
}

// ─── Route ────────────────────────────────────────────────────────────────────

export default function RekorlarRoute() {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, paddingTop: insets.top + 12, backgroundColor: '#F2F2F7' }}>
      <RekorlarTab />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const mb = StyleSheet.create({
  banner: {
    marginHorizontal: 20,
    borderRadius: 28,
    height: BANNER_H,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
  },
  bannerIconWrap: {
    marginBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  bannerIconBg: {
    width: 88,
    height: 88,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.6,
    marginBottom: 4,
  },
  bannerSub: { fontSize: 13, color: 'rgba(255,255,255,0.75)', fontWeight: '500' },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1C1C1E',
    letterSpacing: -0.4,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: 22,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
  },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: '#F2F2F7', marginLeft: 56 },
});

const hc = StyleSheet.create({
  card: {
    borderRadius: 22,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { fontSize: 12, fontWeight: '600', color: '#8E8E93' },
  value: { fontSize: 28, fontWeight: '800', letterSpacing: -0.7, lineHeight: 32 },
  unit: { fontSize: 15, fontWeight: '700', letterSpacing: -0.3, lineHeight: 20, marginBottom: 4 },
  sub: { fontSize: 12, color: '#8E8E93', marginTop: 2 },
  diffChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  diffTxt: { fontSize: 11, fontWeight: '700' },
});

const dr = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  rankBadge: {
    width: 28,
    height: 28,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankTxt: { fontSize: 13, fontWeight: '800' },
  iconBox: {
    width: 46,
    height: 46,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: { fontSize: 14, fontWeight: '700', color: '#1C1C1E' },
  total: { fontSize: 15, fontWeight: '800', letterSpacing: -0.3 },
  barTrack: { height: 5, backgroundColor: '#F2F2F7', borderRadius: 3, overflow: 'hidden' },
  barFill: { height: 5, borderRadius: 3 },
  sub: { fontSize: 11, color: '#8E8E93' },
});

const sr = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  iconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { flex: 1, fontSize: 14, fontWeight: '500', color: '#3A3A3C' },
  value: { fontSize: 14, fontWeight: '700', letterSpacing: -0.2 },
});

const ds = StyleSheet.create({
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#F2F2F7',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    overflow: 'hidden',
    maxHeight: '88%',
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.45)',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 24,
  },
  hero: {
    paddingTop: 14,
    paddingBottom: 0,
    alignItems: 'center',
    overflow: 'hidden',
    height: HERO_H,
  },
  iconWrap: {
    marginBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
  },
  iconBg: {
    width: 100,
    height: 100,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroName: {
    fontSize: 30,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.7,
    marginBottom: 20,
  },
  bigStatRow: { flexDirection: 'row', width: '100%' },
  bigStatItem: { flex: 1, alignItems: 'center', paddingVertical: 18 },
  bigStatVal: { fontSize: 22, fontWeight: '800', color: '#fff', letterSpacing: -0.5 },
  bigStatLbl: { fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: '500', marginTop: 2 },
  detailList: { backgroundColor: '#fff', borderRadius: 20, overflow: 'hidden' },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
  },
  detailRowBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#E5E5EA' },
  detailIcon: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailLbl: { flex: 1, fontSize: 15, fontWeight: '500', color: '#3A3A3C' },
  detailVal: { fontSize: 16, fontWeight: '700', letterSpacing: -0.2 },
});

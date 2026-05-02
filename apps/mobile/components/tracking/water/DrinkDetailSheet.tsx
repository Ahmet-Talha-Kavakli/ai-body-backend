/**
 * DrinkDetailSheet — Apple Health tarzı modal kart.
 *
 * Bir içecek log'u (kart) tıklandığında açılır:
 *  - Header: ikon + isim + saat
 *  - Büyük kap görseli (animasyonlu sıvı)
 *  - Detay satırları: miktar (inline edit), kategori, hidrasyon değeri, saat
 *  - AI skoru/notu (varsa)
 *  - Eylemler: Tekrar Ekle, Düzenle, Sil
 *
 * Modal tarzı: blur arka plan, ortada kart (Apple Health data point detail).
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path, Defs, RadialGradient as SvgRadialGradient, Stop } from 'react-native-svg';
import { AnimatedDrinkBottle } from './AnimatedDrinkBottle';
import { type BottleKind, categoryToBottle, categoryToColor } from './DrinkBottles';

const ACCENT = '#32ADE6';
const { width: SW, height: SH } = Dimensions.get('window');

export interface DrinkLogDetail {
  id: string;
  drinkType: string; // category
  amountMl: number;
  catalogId: string | null;
  createdAt: string;
  nametr?: string | null;
  hydrationValue?: number | null; // 0-1
  caffeinePerServing?: number | null;
  sugarPerServing?: number | null;
  aiScore?: 'green' | 'yellow' | 'red' | null;
  aiNote?: string | null;
}

const CATEGORY_LABELS: Record<string, string> = {
  water: 'Su',
  tea: 'Çay',
  coffee: 'Kahve',
  herbal: 'Bitki Çayı',
  juice: 'Meyve Suyu',
  sports: 'Spor İçeceği',
  dairy: 'Süt & Protein',
  smoothie: 'Smoothie',
  soda: 'Gazlı İçecek',
  alcohol: 'Alkol',
  other: 'Diğer',
};

function formatTime(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

// ─── MetaBlob (organik, dalgalı blob — slime/metaball hissi) ──────────────────
// 3 organik blob asimetrik şekilde üst üste, yumuşak rotation animasyonu.
function MetaBlob({ size, color }: { size: number; color: string }) {
  const r1 = useRef(new Animated.Value(0)).current;
  const r2 = useRef(new Animated.Value(0)).current;
  const r3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop1 = Animated.loop(
      Animated.timing(r1, {
        toValue: 1,
        duration: 14000,
        useNativeDriver: true,
        easing: Easing.linear,
      }),
    );
    const loop2 = Animated.loop(
      Animated.timing(r2, {
        toValue: 1,
        duration: 18000,
        useNativeDriver: true,
        easing: Easing.linear,
      }),
    );
    const loop3 = Animated.loop(
      Animated.timing(r3, {
        toValue: 1,
        duration: 22000,
        useNativeDriver: true,
        easing: Easing.linear,
      }),
    );
    loop1.start();
    loop2.start();
    loop3.start();
    return () => {
      loop1.stop();
      loop2.stop();
      loop3.stop();
    };
  }, []);

  const rot1 = r1.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const rot2 = r2.interpolate({ inputRange: [0, 1], outputRange: ['360deg', '0deg'] });
  const rot3 = r3.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  // Asimetrik organik blob path'leri (border-radius'un asimetrik versiyonu)
  // 60% 40% 30% 70% / 60% 30% 70% 40% — CSS gibi
  const blobPath1 = `M ${size * 0.5} 0
    C ${size * 0.85} 0, ${size} ${size * 0.2}, ${size} ${size * 0.55}
    C ${size} ${size * 0.85}, ${size * 0.75} ${size}, ${size * 0.45} ${size}
    C ${size * 0.15} ${size}, 0 ${size * 0.75}, 0 ${size * 0.45}
    C 0 ${size * 0.15}, ${size * 0.2} 0, ${size * 0.5} 0 Z`;

  const blobPath2 = `M ${size * 0.5} 0
    C ${size * 0.8} 0, ${size} ${size * 0.3}, ${size} ${size * 0.6}
    C ${size} ${size * 0.85}, ${size * 0.65} ${size}, ${size * 0.4} ${size}
    C ${size * 0.1} ${size}, 0 ${size * 0.7}, 0 ${size * 0.4}
    C 0 ${size * 0.15}, ${size * 0.25} 0, ${size * 0.5} 0 Z`;

  const blobPath3 = `M ${size * 0.5} 0
    C ${size * 0.9} 0, ${size} ${size * 0.25}, ${size} ${size * 0.5}
    C ${size} ${size * 0.8}, ${size * 0.7} ${size}, ${size * 0.5} ${size}
    C ${size * 0.2} ${size}, 0 ${size * 0.8}, 0 ${size * 0.5}
    C 0 ${size * 0.2}, ${size * 0.2} 0, ${size * 0.5} 0 Z`;

  return (
    <View
      style={{
        width: size,
        height: size,
        position: 'absolute',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      pointerEvents="none"
    >
      <Animated.View
        style={{ position: 'absolute', width: size, height: size, transform: [{ rotate: rot1 }] }}
      >
        <Svg width={size} height={size}>
          <Defs>
            <SvgRadialGradient id="blob1" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor={color} stopOpacity="0.18" />
              <Stop offset="100%" stopColor={color} stopOpacity="0.05" />
            </SvgRadialGradient>
          </Defs>
          <Path d={blobPath1} fill="url(#blob1)" />
        </Svg>
      </Animated.View>
      <Animated.View
        style={{
          position: 'absolute',
          width: size * 0.92,
          height: size * 0.92,
          transform: [{ rotate: rot2 }],
        }}
      >
        <Svg width={size * 0.92} height={size * 0.92}>
          <Defs>
            <SvgRadialGradient id="blob2" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor={color} stopOpacity="0.22" />
              <Stop offset="100%" stopColor={color} stopOpacity="0.08" />
            </SvgRadialGradient>
          </Defs>
          <Path
            d={blobPath2.replace(/\d+\.?\d*/g, (n) => (parseFloat(n) * 0.92).toFixed(2))}
            fill="url(#blob2)"
          />
        </Svg>
      </Animated.View>
      <Animated.View
        style={{
          position: 'absolute',
          width: size * 0.78,
          height: size * 0.78,
          transform: [{ rotate: rot3 }],
        }}
      >
        <Svg width={size * 0.78} height={size * 0.78}>
          <Defs>
            <SvgRadialGradient id="blob3" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor={color} stopOpacity="0.28" />
              <Stop offset="100%" stopColor={color} stopOpacity="0.1" />
            </SvgRadialGradient>
          </Defs>
          <Path
            d={blobPath3.replace(/\d+\.?\d*/g, (n) => (parseFloat(n) * 0.78).toFixed(2))}
            fill="url(#blob3)"
          />
        </Svg>
      </Animated.View>
    </View>
  );
}

interface Props {
  visible: boolean;
  log: DrinkLogDetail | null;
  onClose: () => void;
  onDelete: (id: string) => Promise<void>;
  onEdit: (id: string, newMl: number) => Promise<void>;
  onReadd: (log: DrinkLogDetail) => Promise<void>;
}

export function DrinkDetailSheet({ visible, log, onClose, onDelete, onEdit, onReadd }: Props) {
  const [mounted, setMounted] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editVal, setEditVal] = useState('');
  const [busy, setBusy] = useState<'delete' | 'readd' | null>(null);
  // Kapanış sırasında log null olsa bile son log'u koru (animasyon bitene kadar)
  const [activeLog, setActiveLog] = useState<DrinkLogDetail | null>(log);

  const scaleAnim = useRef(new Animated.Value(0.86)).current;
  const opAnim = useRef(new Animated.Value(0)).current; // overlay (blur arka plan) opacity
  const cardOpAnim = useRef(new Animated.Value(0)).current; // kart opacity (ayrı)
  const tyAnim = useRef(new Animated.Value(20)).current;

  // Apple-grade easing
  const APPLE_OUT = Easing.bezier(0.32, 0.72, 0, 1);
  const APPLE_IN = Easing.bezier(0.42, 0, 1, 1);

  // visible true olduğunda log'u activeLog'a yansıt; visible false ise eski log'u koru
  useEffect(() => {
    if (visible && log) setActiveLog(log);
  }, [visible, log]);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      setEditing(false);
      setEditVal(log ? String(log.amountMl) : '');
      setBusy(null);
      scaleAnim.setValue(0.86);
      opAnim.setValue(0);
      cardOpAnim.setValue(0);
      tyAnim.setValue(20);
      requestAnimationFrame(() =>
        Animated.parallel([
          Animated.spring(scaleAnim, {
            toValue: 1,
            useNativeDriver: true,
            damping: 22,
            mass: 1,
            stiffness: 220,
          }),
          // Overlay biraz daha hızlı belirsin
          Animated.timing(opAnim, {
            toValue: 1,
            duration: 320,
            useNativeDriver: true,
            easing: APPLE_OUT,
          }),
          // Kart fade biraz daha geç
          Animated.timing(cardOpAnim, {
            toValue: 1,
            duration: 380,
            delay: 40,
            useNativeDriver: true,
            easing: APPLE_OUT,
          }),
          Animated.spring(tyAnim, {
            toValue: 0,
            useNativeDriver: true,
            damping: 22,
            mass: 1,
            stiffness: 200,
          }),
        ]).start(),
      );
    } else if (mounted) {
      // Apple kapanış — yumuşak geri çekilme.
      // Sıralama: kart önce hareket başlar, sonra fade, en son blur overlay solar.
      const APPLE_STANDARD = Easing.bezier(0.4, 0.0, 0.2, 1);
      const APPLE_FADE = Easing.bezier(0.32, 0.72, 0, 1);
      Animated.parallel([
        // Kart küçülüp aşağı kayar
        Animated.timing(scaleAnim, {
          toValue: 0.9,
          duration: 480,
          useNativeDriver: true,
          easing: APPLE_STANDARD,
        }),
        Animated.timing(tyAnim, {
          toValue: 14,
          duration: 480,
          useNativeDriver: true,
          easing: APPLE_STANDARD,
        }),
        // Kart fade — kısa süre sonra başlar
        Animated.timing(cardOpAnim, {
          toValue: 0,
          duration: 360,
          delay: 100,
          useNativeDriver: true,
          easing: APPLE_FADE,
        }),
        // Blur overlay en son solar (ortam yumuşak çıkar)
        Animated.timing(opAnim, {
          toValue: 0,
          duration: 460,
          delay: 120,
          useNativeDriver: true,
          easing: APPLE_FADE,
        }),
      ]).start(({ finished }) => {
        if (finished) {
          setMounted(false);
          setActiveLog(null);
        }
      });
    }
  }, [visible]);

  if (!mounted || !activeLog) return null;
  const displayLog = activeLog;

  const kind: BottleKind =
    displayLog.drinkType === 'water' || displayLog.drinkType === 'other'
      ? displayLog.drinkType === 'water'
        ? 'water'
        : 'juice'
      : categoryToBottle(displayLog.drinkType);
  const color = categoryToColor(displayLog.drinkType);
  const name = displayLog.nametr ?? CATEGORY_LABELS[displayLog.drinkType] ?? 'İçecek';
  const time = formatTime(displayLog.createdAt);
  const hydrationPct =
    displayLog.hydrationValue != null ? Math.round(displayLog.hydrationValue * 100) : null;
  const effectiveHydration =
    hydrationPct != null
      ? Math.round(displayLog.amountMl * (displayLog.hydrationValue ?? 0))
      : null;

  const handleSaveEdit = async () => {
    const ml = parseInt(editVal);
    if (!ml || ml <= 0 || ml > 5000) return;
    setEditing(false);
    await onEdit(displayLog.id, ml);
  };

  const handleDelete = () => {
    Alert.alert('Logu sil', `${name} (${displayLog.amountMl} ml) logu silinsin mi?`, [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: async () => {
          setBusy('delete');
          try {
            await onDelete(displayLog.id);
            onClose();
          } finally {
            setBusy(null);
          }
        },
      },
    ]);
  };

  const handleReadd = async () => {
    setBusy('readd');
    try {
      await onReadd(displayLog);
      onClose();
    } finally {
      setBusy(null);
    }
  };

  const aiColor =
    displayLog.aiScore === 'green'
      ? '#30D158'
      : displayLog.aiScore === 'yellow'
        ? '#FFD60A'
        : displayLog.aiScore === 'red'
          ? '#FF453A'
          : null;
  const aiLabel =
    displayLog.aiScore === 'green'
      ? 'Önerilir'
      : displayLog.aiScore === 'yellow'
        ? 'Dikkatli'
        : displayLog.aiScore === 'red'
          ? 'Kaçın'
          : null;

  return (
    <Modal visible transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <Animated.View style={[s.overlay, { opacity: opAnim }]}>
        <BlurView intensity={28} tint="dark" style={StyleSheet.absoluteFill} />
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={s.kbWrap}
          pointerEvents="box-none"
        >
          <Animated.View
            style={[
              s.card,
              {
                opacity: cardOpAnim,
                transform: [{ scale: scaleAnim }, { translateY: tyAnim }],
              },
            ]}
          >
            {/* ─ Header ─ */}
            <View style={s.header}>
              <View style={[s.iconBox, { backgroundColor: color + '20' }]}>
                <View style={{ width: 30, height: 50 }}>
                  <AnimatedDrinkBottle
                    kind={kind}
                    fillLevel={1}
                    liquidColor={color}
                    width={30}
                    height={50}
                  />
                </View>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.name} numberOfLines={1}>
                  {name}
                </Text>
                <View style={s.subRow}>
                  <Ionicons name="time-outline" size={12} color="#8E8E93" />
                  <Text style={s.sub}>{time}</Text>
                  <View style={s.dot} />
                  <Text style={s.sub}>{CATEGORY_LABELS[displayLog.drinkType] ?? 'Diğer'}</Text>
                </View>
              </View>
              <Pressable onPress={onClose} hitSlop={12} style={s.closeBtn}>
                <Ionicons name="close" size={18} color="#8E8E93" />
              </Pressable>
            </View>

            {/* ─ Büyük kap görseli + organik blob ─ */}
            <View style={s.heroWrap}>
              <MetaBlob size={210} color={color} />
              <AnimatedDrinkBottle
                kind={kind}
                fillLevel={1}
                liquidColor={color}
                width={88}
                height={150}
              />
            </View>

            {/* ─ Miktar (inline edit) ─ */}
            <View style={s.amountRow}>
              {editing ? (
                <View style={s.editRow}>
                  <TextInput
                    style={s.editInput}
                    value={editVal}
                    onChangeText={setEditVal}
                    keyboardType="number-pad"
                    autoFocus
                    maxLength={4}
                    selectTextOnFocus
                  />
                  <Text style={s.editUnit}>ml</Text>
                  <Pressable onPress={handleSaveEdit} hitSlop={8} style={s.editConfirm}>
                    <Ionicons name="checkmark" size={20} color="#fff" />
                  </Pressable>
                  <Pressable onPress={() => setEditing(false)} hitSlop={8} style={s.editCancel}>
                    <Ionicons name="close" size={18} color="#8E8E93" />
                  </Pressable>
                </View>
              ) : (
                <Pressable
                  onPress={() => {
                    setEditVal(String(displayLog.amountMl));
                    setEditing(true);
                  }}
                  hitSlop={6}
                >
                  {({ pressed }) => (
                    <View style={[s.amountInner, pressed && { opacity: 0.7 }]}>
                      <Text style={s.amountVal}>{displayLog.amountMl}</Text>
                      <Text style={s.amountUnit}>ml</Text>
                      <Ionicons name="pencil" size={13} color="#C7C7CC" style={{ marginLeft: 8 }} />
                    </View>
                  )}
                </Pressable>
              )}
            </View>

            {/* ─ Hidrasyon kartı ─ */}
            {hydrationPct != null && (
              <View style={s.hydraCard}>
                <View style={s.hydraLeft}>
                  <Ionicons name="water" size={16} color={ACCENT} />
                  <Text style={s.hydraLabel}>Etkin Hidrasyon</Text>
                </View>
                <View style={s.hydraRight}>
                  <Text style={s.hydraVal}>{effectiveHydration} ml</Text>
                  <Text style={s.hydraPct}>%{hydrationPct}</Text>
                </View>
              </View>
            )}

            {/* ─ Kafein/Şeker (varsa) ─ */}
            {(displayLog.caffeinePerServing != null || displayLog.sugarPerServing != null) && (
              <View style={s.statsRow}>
                {displayLog.caffeinePerServing != null && displayLog.caffeinePerServing > 0 && (
                  <View style={s.stat}>
                    <Text style={s.statVal}>
                      {displayLog.caffeinePerServing}
                      <Text style={s.statUnit}>mg</Text>
                    </Text>
                    <Text style={s.statLabel}>Kafein</Text>
                  </View>
                )}
                {displayLog.sugarPerServing != null && displayLog.sugarPerServing > 0 && (
                  <View style={s.stat}>
                    <Text style={s.statVal}>
                      {displayLog.sugarPerServing}
                      <Text style={s.statUnit}>g</Text>
                    </Text>
                    <Text style={s.statLabel}>Şeker</Text>
                  </View>
                )}
              </View>
            )}

            {/* ─ AI not ─ */}
            {displayLog.aiNote && aiColor && (
              <View style={[s.aiCard, { borderLeftColor: aiColor }]}>
                <View style={s.aiHeader}>
                  <View style={[s.aiDot, { backgroundColor: aiColor }]} />
                  <Text style={[s.aiLabel, { color: aiColor }]}>{aiLabel}</Text>
                </View>
                <Text style={s.aiNote}>{displayLog.aiNote}</Text>
              </View>
            )}

            {/* ─ Eylemler ─ */}
            <View style={s.actions}>
              <Pressable
                onPress={busy === 'readd' ? undefined : handleReadd}
                style={[s.actionBtn, s.actionPrimary]}
              >
                <Ionicons name="add" size={16} color="#fff" />
                <Text style={s.actionPrimaryTxt}>
                  {busy === 'readd' ? 'Ekleniyor...' : 'Tekrar Ekle'}
                </Text>
              </Pressable>
              <Pressable
                onPress={busy === 'delete' ? undefined : handleDelete}
                style={[s.actionBtn, s.actionDanger]}
              >
                <Ionicons name="trash-outline" size={15} color="#FF453A" />
                <Text style={s.actionDangerTxt}>Sil</Text>
              </Pressable>
            </View>
          </Animated.View>
        </KeyboardAvoidingView>
      </Animated.View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.32)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  kbWrap: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.25,
    shadowRadius: 28,
  },
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  iconBox: {
    width: 50,
    height: 60,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  name: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1C1C1E',
    letterSpacing: -0.4,
  },
  subRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 3,
  },
  sub: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '500',
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#C7C7CC',
    marginHorizontal: 2,
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Hero
  heroWrap: {
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    position: 'relative',
  },
  // Amount
  amountRow: {
    alignItems: 'center',
    marginBottom: 16,
  },
  amountInner: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  amountVal: {
    fontSize: 40,
    fontWeight: '800',
    color: '#1C1C1E',
    letterSpacing: -1.5,
  },
  amountUnit: {
    fontSize: 18,
    fontWeight: '600',
    color: '#8E8E93',
    marginLeft: 4,
  },
  editRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
  },
  editInput: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1C1C1E',
    letterSpacing: -1,
    minWidth: 80,
    textAlign: 'center',
    padding: 0,
  },
  editUnit: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8E8E93',
  },
  editConfirm: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  editCancel: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E5E5EA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Hydra
  hydraCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F2F2F7',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 10,
  },
  hydraLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  hydraLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#3C3C43',
  },
  hydraRight: { alignItems: 'flex-end' },
  hydraVal: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  hydraPct: {
    fontSize: 11,
    fontWeight: '600',
    color: ACCENT,
    marginTop: 1,
  },
  // Stats
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  stat: {
    flex: 1,
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  statVal: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1C1C1E',
    letterSpacing: -0.4,
  },
  statUnit: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8E8E93',
  },
  statLabel: {
    fontSize: 11,
    color: '#8E8E93',
    fontWeight: '500',
    marginTop: 2,
  },
  // AI
  aiCard: {
    backgroundColor: '#F8F8FB',
    borderRadius: 12,
    padding: 12,
    borderLeftWidth: 3,
    marginBottom: 14,
  },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  aiDot: { width: 6, height: 6, borderRadius: 3 },
  aiLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.4, textTransform: 'uppercase' },
  aiNote: { fontSize: 13, color: '#3C3C43', lineHeight: 18 },
  // Actions
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 13,
    borderRadius: 14,
  },
  actionPrimary: { backgroundColor: ACCENT },
  actionPrimaryTxt: { color: '#fff', fontSize: 14, fontWeight: '700' },
  actionDanger: { backgroundColor: '#FFE5E3' },
  actionDangerTxt: { color: '#FF453A', fontSize: 14, fontWeight: '700' },
});

/**
 * Mutfak — buzdolabı stok takibi.
 *
 * Apple seviyesi:
 *  - iOS native nav bar (Kapat / Mutfak / + manuel)
 *  - Üst özet kart (toplam, az kalan, yakında bitecek)
 *  - Kategori chip filtre
 *  - Ürün listesi (FlatList virtualized): emoji, ad, miktar, expire renk
 *  - Swipe-to-delete + uzun bas → context menu
 *  - Floating "Buzdolabı tara" FAB → AI scan ekranı
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  DeviceEventEmitter,
  Easing,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { SymbolView } from 'expo-symbols';
import { Swipeable, GestureHandlerRootView } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { useAuth } from '@clerk/expo';

import { N, font } from '../../nutrition/theme';
import { fetchPantry, deletePantryItem } from '../api/client';
import type { PantryItem } from '../api/types';
import KitchenScanScreen from './KitchenScanScreen';
import AddItemSheet from './AddItemSheet';

const EASE_SPRING = Easing.bezier(0.16, 1, 0.3, 1);
const EASE_CLOSE = Easing.bezier(0.4, 0, 1, 1);

type Props = {
  visible: boolean;
  onClose: () => void;
};

const CATEGORY_LABEL: Record<string, { tr: string; emoji: string }> = {
  all: { tr: 'Tümü', emoji: '🛒' },
  protein: { tr: 'Protein', emoji: '🥩' },
  sebze: { tr: 'Sebze', emoji: '🥬' },
  meyve: { tr: 'Meyve', emoji: '🍎' },
  süt: { tr: 'Süt', emoji: '🥛' },
  tahıl: { tr: 'Tahıl', emoji: '🌾' },
  baharat: { tr: 'Baharat', emoji: '🧂' },
  içecek: { tr: 'İçecek', emoji: '🥤' },
  diğer: { tr: 'Diğer', emoji: '📦' },
};

const ITEM_EMOJI_FALLBACK: Record<string, string> = {
  protein: '🥩',
  sebze: '🥦',
  meyve: '🍎',
  süt: '🥛',
  tahıl: '🍞',
  baharat: '🧂',
  içecek: '🥤',
};

function emojiFor(item: PantryItem): string {
  const n = item.name.toLowerCase();
  if (n.includes('süt') || n.includes('yoğurt')) return '🥛';
  if (n.includes('peynir')) return '🧀';
  if (n.includes('yumurta')) return '🥚';
  if (n.includes('domates')) return '🍅';
  if (n.includes('salatalık')) return '🥒';
  if (n.includes('elma')) return '🍎';
  if (n.includes('muz')) return '🍌';
  if (n.includes('et') || n.includes('tavuk')) return '🍗';
  if (n.includes('balık')) return '🐟';
  if (n.includes('ekmek')) return '🍞';
  if (n.includes('su')) return '💧';
  if (n.includes('kahve')) return '☕';
  if (n.includes('çay')) return '🍵';
  if (item.category) {
    const fallback = ITEM_EMOJI_FALLBACK[item.category];
    if (fallback) return fallback;
  }
  return '📦';
}

function expireInfo(expiresAt: string | null): {
  days: number | null;
  label: string;
  color: string;
} {
  if (!expiresAt) return { days: null, label: 'Süresiz', color: N.text.tertiary };
  const now = Date.now();
  const exp = new Date(expiresAt).getTime();
  const days = Math.ceil((exp - now) / (24 * 60 * 60 * 1000));
  if (days < 0) return { days, label: `${Math.abs(days)} gün geçmiş`, color: N.semantic.danger };
  if (days === 0) return { days, label: 'Bugün bitiyor', color: N.semantic.danger };
  if (days <= 2) return { days, label: `${days} gün kaldı`, color: N.semantic.warning };
  if (days <= 7) return { days, label: `${days} gün kaldı`, color: '#FF9F0A' };
  return { days, label: `${days} gün kaldı`, color: N.semantic.success };
}

export default function KitchenScreen({ visible, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const { getToken } = useAuth();

  const [items, setItems] = useState<PantryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [scanOpen, setScanOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);

  const slide = useRef(new Animated.Value(0)).current;
  const overlay = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(overlay, {
        toValue: visible ? 1 : 0,
        duration: visible ? 380 : 320,
        useNativeDriver: true,
        easing: visible ? EASE_SPRING : EASE_CLOSE,
      }),
      Animated.timing(slide, {
        toValue: visible ? 1 : 0,
        duration: visible ? 480 : 380,
        useNativeDriver: true,
        easing: visible ? EASE_SPRING : EASE_CLOSE,
      }),
    ]).start();
  }, [visible, slide, overlay]);

  const load = useCallback(async () => {
    try {
      setError(null);
      const token = await getToken();
      if (!token) {
        setError('Yetki yok');
        return;
      }
      const { items } = await fetchPantry(token);
      setItems(items);
    } catch (err) {
      console.error('[pantry/fetch]', err);
      setError('Ürünler yüklenemedi');
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    if (visible) load();
  }, [visible, load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const onDelete = useCallback(
    async (id: string, name: string) => {
      Alert.alert('Sil', `"${name}" silinsin mi?`, [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            try {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
              const token = await getToken();
              if (!token) return;
              setItems((prev) => prev.filter((i) => i.id !== id));
              await deletePantryItem(token, id);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              DeviceEventEmitter.emit('pantry:dirty');
            } catch (err) {
              console.error('[pantry/delete]', err);
              await load();
            }
          },
        },
      ]);
    },
    [getToken, load],
  );

  const stats = useMemo(() => {
    let lowStock = 0;
    let expiringSoon = 0;
    for (const it of items) {
      if (it.isLowStock) lowStock++;
      const info = expireInfo(it.expiresAt);
      if (info.days !== null && info.days <= 2) expiringSoon++;
    }
    return { total: items.length, lowStock, expiringSoon };
  }, [items]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    items.forEach((i) => i.category && set.add(i.category));
    return ['all', ...Array.from(set)];
  }, [items]);

  const filtered = useMemo(
    () => (activeCategory === 'all' ? items : items.filter((i) => i.category === activeCategory)),
    [items, activeCategory],
  );

  const ty = slide.interpolate({ inputRange: [0, 1], outputRange: [800, 0] });

  return (
    <Modal
      transparent
      visible={visible}
      onRequestClose={onClose}
      animationType="none"
      statusBarTranslucent
    >
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Animated.View style={[styles.overlay, { opacity: overlay }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
          <Animated.View style={[styles.sheet, { transform: [{ translateY: ty }] }]}>
            <View style={styles.handle} />
            <View style={[styles.headerRow, { paddingTop: 4 }]}>
              <Pressable onPress={onClose} hitSlop={12} style={styles.headerSide}>
                <Text style={styles.headerCancel}>Kapat</Text>
              </Pressable>
              <Text style={styles.headerTitle}>Mutfak</Text>
              <Pressable
                onPress={() => {
                  Haptics.selectionAsync();
                  setAddOpen(true);
                }}
                hitSlop={12}
                style={({ pressed }) => [
                  {
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    backgroundColor: '#000000',
                    alignItems: 'center',
                    justifyContent: 'center',
                    alignSelf: 'flex-end',
                  },
                  pressed && { opacity: 0.6 },
                ]}
              >
                <SymbolView
                  name="plus"
                  size={18}
                  tintColor="#FFFFFF"
                  fallback={<Ionicons name="add" size={22} color="#FFFFFF" />}
                />
              </Pressable>
            </View>

            {loading ? (
              <View style={styles.loading}>
                <ActivityIndicator color={N.accent.primary} />
              </View>
            ) : (
              <FlatList
                data={filtered}
                keyExtractor={(i) => i.id}
                ListHeaderComponent={
                  <View>
                    {/* Hero stat card */}
                    <View style={styles.heroCard}>
                      <View style={styles.heroIconWrap}>
                        <Text style={{ fontSize: 36 }}>🧊</Text>
                      </View>
                      <Text style={styles.heroTitle}>Buzdolabı</Text>
                      <Text style={styles.heroSubtitle}>
                        {stats.total === 0 ? 'Henüz ürün yok' : `${stats.total} ürün takipte`}
                      </Text>
                      <View style={styles.heroStatsRow}>
                        <StatCell label="Toplam" value={stats.total} color={N.text.primary} />
                        <View style={styles.statDiv} />
                        <StatCell label="Az kalan" value={stats.lowStock} color="#FF9500" />
                        <View style={styles.statDiv} />
                        <StatCell
                          label="Yakında biter"
                          value={stats.expiringSoon}
                          color={N.semantic.danger}
                        />
                      </View>
                    </View>

                    {/* Category filter */}
                    {categories.length > 1 && (
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.catRow}
                        style={{ marginTop: 18 }}
                      >
                        {categories.map((c) => {
                          const meta = CATEGORY_LABEL[c] ?? { tr: c, emoji: '📦' };
                          const active = activeCategory === c;
                          return (
                            <Pressable
                              key={c}
                              onPress={() => {
                                Haptics.selectionAsync();
                                setActiveCategory(c);
                              }}
                              style={[
                                styles.catChip,
                                active && {
                                  backgroundColor: N.text.primary,
                                  borderColor: N.text.primary,
                                },
                              ]}
                            >
                              <Text style={styles.catEmoji}>{meta.emoji}</Text>
                              <Text style={[styles.catLabel, active && { color: '#FFFFFF' }]}>
                                {meta.tr}
                              </Text>
                            </Pressable>
                          );
                        })}
                      </ScrollView>
                    )}

                    <Text style={styles.sectionTitle}>
                      {activeCategory === 'all'
                        ? 'Tüm ürünler'
                        : (CATEGORY_LABEL[activeCategory]?.tr ?? activeCategory)}
                    </Text>
                  </View>
                }
                ListEmptyComponent={
                  <View style={styles.emptyCard}>
                    <View style={styles.emptyIconCircle}>
                      <SymbolView
                        name="cart"
                        size={28}
                        tintColor={N.text.tertiary}
                        fallback={
                          <Ionicons name="cart-outline" size={28} color={N.text.tertiary} />
                        }
                      />
                    </View>
                    <Text style={styles.emptyTitle}>Buzdolabın boş görünüyor</Text>
                    <Text style={styles.emptySub}>
                      {error
                        ? 'Bağlantı sorunu — aşağı çek yenile.'
                        : 'Aşağıdaki butona basıp buzdolabını taratabilir veya sağ üstten manuel ürün ekleyebilirsin.'}
                    </Text>
                  </View>
                }
                renderItem={({ item, index }) => (
                  <PantryRow
                    item={item}
                    onDelete={() => onDelete(item.id, item.name)}
                    isFirst={index === 0}
                    isLast={index === filtered.length - 1}
                  />
                )}
                ItemSeparatorComponent={() => (
                  <View
                    style={{
                      height: StyleSheet.hairlineWidth,
                      backgroundColor: N.border.hairline,
                      marginLeft: 16 + 36 + 12,
                    }}
                  />
                )}
                contentContainerStyle={{
                  paddingHorizontal: 16,
                  paddingBottom: insets.bottom + 130,
                }}
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    tintColor={N.accent.primary}
                  />
                }
                showsVerticalScrollIndicator={false}
              />
            )}

            {/* Floating scan FAB */}
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                setScanOpen(true);
              }}
              style={{
                position: 'absolute',
                left: 16,
                right: 16,
                bottom: insets.bottom + 16,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                backgroundColor: '#000000',
                borderRadius: 100,
                paddingVertical: 16,
                shadowColor: '#000',
                shadowOpacity: 0.22,
                shadowRadius: 16,
                shadowOffset: { width: 0, height: 6 },
                elevation: 6,
              }}
            >
              <SymbolView
                name="camera.fill"
                size={18}
                tintColor="#FFFFFF"
                fallback={<Ionicons name="camera" size={20} color="#FFFFFF" />}
              />
              <Text
                style={{
                  fontSize: 16,
                  fontFamily: font.semibold,
                  color: '#FFFFFF',
                  letterSpacing: -0.2,
                }}
              >
                Buzdolabını tara
              </Text>
            </Pressable>
          </Animated.View>
        </Animated.View>

        {/* Scan modal */}
        <KitchenScanScreen
          visible={scanOpen}
          onClose={() => setScanOpen(false)}
          onSaved={() => {
            setScanOpen(false);
            load();
          }}
        />

        {/* Manual add sheet */}
        <AddItemSheet
          visible={addOpen}
          onClose={() => setAddOpen(false)}
          onSaved={() => {
            setAddOpen(false);
            load();
          }}
        />
      </GestureHandlerRootView>
    </Modal>
  );
}

function StatCell({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={styles.statCell}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function PantryRow({
  item,
  onDelete,
  isFirst,
  isLast,
}: {
  item: PantryItem;
  onDelete: () => void;
  isFirst: boolean;
  isLast: boolean;
}) {
  const ref = useRef<Swipeable>(null);
  const info = expireInfo(item.expiresAt);
  const emoji = emojiFor(item);

  const radius = {
    borderTopLeftRadius: isFirst ? 14 : 0,
    borderTopRightRadius: isFirst ? 14 : 0,
    borderBottomLeftRadius: isLast ? 14 : 0,
    borderBottomRightRadius: isLast ? 14 : 0,
  };

  const renderRightActions = (_progress: any, dragX: any) => {
    const trans = dragX.interpolate({
      inputRange: [-100, 0],
      outputRange: [0, 100],
      extrapolate: 'clamp',
    });
    return (
      <View style={styles.swipeRightContainer}>
        <Animated.View
          style={[
            styles.swipeDelete,
            isLast && { borderBottomRightRadius: 14 },
            isFirst && { borderTopRightRadius: 14 },
            { transform: [{ translateX: trans }] },
          ]}
        >
          <Pressable
            onPress={() => {
              ref.current?.close();
              onDelete();
            }}
            style={styles.swipeDeleteInner}
          >
            <SymbolView
              name="trash.fill"
              size={18}
              tintColor="#FFFFFF"
              fallback={<Ionicons name="trash" size={20} color="#FFFFFF" />}
            />
            <Text style={styles.swipeDeleteText}>Sil</Text>
          </Pressable>
        </Animated.View>
      </View>
    );
  };

  return (
    <Swipeable
      ref={ref}
      renderRightActions={renderRightActions}
      friction={2}
      rightThreshold={40}
      overshootRight={false}
    >
      <Pressable
        onLongPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          onDelete();
        }}
        delayLongPress={400}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: N.bg.card,
          paddingHorizontal: 16,
          paddingVertical: 12,
          ...radius,
        }}
      >
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            backgroundColor: N.bg.well,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 12,
          }}
        >
          <Text style={{ fontSize: 20 }}>{emoji}</Text>
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text
            style={{
              fontSize: 16,
              fontFamily: font.semibold,
              color: N.text.primary,
              letterSpacing: -0.2,
            }}
            numberOfLines={1}
          >
            {item.name.charAt(0).toUpperCase() + item.name.slice(1)}
          </Text>
          <Text
            style={{
              fontSize: 13,
              color: N.text.tertiary,
              marginTop: 2,
              fontFamily: font.regular,
              letterSpacing: -0.1,
            }}
            numberOfLines={1}
          >
            {item.quantity ? `${item.quantity} ${item.unit ?? ''} · ` : ''}
            <Text style={{ color: info.color, fontFamily: font.semibold }}>{info.label}</Text>
          </Text>
        </View>
        {item.isLowStock && (
          <View style={styles.lowStockChip}>
            <Text style={styles.lowStockText}>Az</Text>
          </View>
        )}
      </Pressable>
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: N.bg.page,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    height: '95%',
    paddingTop: 8,
    overflow: 'hidden',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: N.border.strong,
    alignSelf: 'center',
    marginBottom: 6,
  },

  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: N.bg.page,
  },
  headerSide: { width: 60 },
  headerCancel: {
    fontSize: 17,
    color: N.text.secondary,
    fontFamily: font.regular,
    letterSpacing: -0.2,
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: font.semibold,
    color: N.text.primary,
    letterSpacing: -0.3,
  },

  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  // Hero
  heroCard: {
    backgroundColor: N.bg.card,
    borderRadius: 24,
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginTop: 6,
    ...N.shadow.card,
  },
  heroIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: N.accent.soft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  heroTitle: { fontSize: 24, fontFamily: font.bold, color: N.text.primary, letterSpacing: -0.5 },
  heroSubtitle: {
    fontSize: 13,
    color: N.text.tertiary,
    marginTop: 4,
    fontFamily: font.medium,
    letterSpacing: -0.1,
  },
  heroStatsRow: {
    flexDirection: 'row',
    marginTop: 18,
    width: '100%',
    paddingTop: 18,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: N.border.hairline,
  },
  statCell: { flex: 1, alignItems: 'center' },
  statDiv: { width: StyleSheet.hairlineWidth, backgroundColor: N.border.hairline },
  statValue: {
    fontSize: 24,
    fontFamily: font.extrabold,
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.6,
  },
  statLabel: {
    fontSize: 11,
    color: N.text.tertiary,
    marginTop: 4,
    fontFamily: font.semibold,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },

  // Categories
  catRow: { gap: 8, paddingHorizontal: 0 },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 100,
    backgroundColor: N.bg.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: N.border.hairline,
    marginRight: 6,
  },
  catEmoji: { fontSize: 14 },
  catLabel: { fontSize: 13, fontFamily: font.semibold, color: N.text.primary, letterSpacing: -0.1 },

  sectionTitle: {
    fontSize: 13,
    fontFamily: font.bold,
    color: N.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 24,
    marginBottom: 10,
    paddingHorizontal: 6,
  },

  // Empty
  emptyCard: {
    backgroundColor: N.bg.card,
    borderRadius: 18,
    paddingVertical: 40,
    paddingHorizontal: 28,
    alignItems: 'center',
    ...N.shadow.card,
  },
  emptyIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: N.bg.well,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 17,
    fontFamily: font.semibold,
    color: N.text.primary,
    letterSpacing: -0.3,
  },
  emptySub: {
    fontSize: 14,
    color: N.text.tertiary,
    marginTop: 6,
    textAlign: 'center',
    fontFamily: font.regular,
    lineHeight: 20,
    letterSpacing: -0.1,
  },

  // Row (Apple grouped list)
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: N.bg.card,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  rowEmoji: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: N.bg.well,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowName: { fontSize: 16, fontFamily: font.semibold, color: N.text.primary, letterSpacing: -0.2 },
  rowMeta: {
    fontSize: 13,
    color: N.text.tertiary,
    marginTop: 2,
    fontFamily: font.regular,
    letterSpacing: -0.1,
  },

  lowStockChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    backgroundColor: 'rgba(255,149,0,0.15)',
  },
  lowStockText: {
    fontSize: 11,
    color: N.semantic.warning,
    fontFamily: font.bold,
    letterSpacing: -0.1,
  },

  // Swipe
  swipeRightContainer: { width: 100, flexDirection: 'row' },
  swipeDelete: {
    flex: 1,
    backgroundColor: N.semantic.danger,
    justifyContent: 'center',
    alignItems: 'center',
  },
  swipeDeleteInner: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  swipeDeleteText: { color: '#FFFFFF', fontSize: 13, fontFamily: font.semibold },
});

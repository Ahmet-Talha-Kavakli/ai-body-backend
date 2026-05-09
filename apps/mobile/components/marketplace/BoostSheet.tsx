/**
 * V4.8 Faz F — Listing Boost satın alma sheet
 *
 * Apple One / iCloud+ subscription seçim paterni:
 *   - Üstte ikon + büyük başlık + kısa açıklama (hero)
 *   - 3 paket dikey kart, her biri seçilebilir (radio paterni)
 *   - Seçili kart: accent border + soft accent bg + sağda checkmark
 *   - En altta full-width "X kredi · Satın Al" CTA (canlı accent)
 *   - Aktif boost varsa üstte yeşil banner (kalan süre)
 *
 * Kurallar:
 *   - Pressable callback style YOK (CLAUDE.md KRİTİK BUTON KURALI)
 *   - Pressable + row YOK; row hep ayrı View içinde
 *   - bgColor / textColor const olarak çıkarılı, JSX okunabilir
 *   - Native @gorhom/bottom-sheet (UISheet) + native Alert (UIAlertController)
 */

import { forwardRef, useCallback, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, Text, View } from 'react-native';
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetView,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import { SymbolView } from 'expo-symbols';
import * as Haptics from 'expo-haptics';
import { C, font } from '../../lib/theme';
import { useMarketApi } from '../../lib/marketplace/marketApi';

interface Package {
  tier: '24h' | '7d' | 'sponsored';
  label: string;
  price: number;
  durationMs: number;
}

interface BoostInfo {
  balance: number;
  isActive: boolean;
  boostUntil: string | null;
  boostTier: string | null;
  packages: Package[];
}

export interface BoostSheetRef {
  open: (listingId: string) => void;
  close: () => void;
}

interface Props {
  onPurchased?: (newBoostUntil: string) => void;
}

const TIER_META: Record<
  string,
  { icon: string; color: string; sub: string; recommended?: boolean }
> = {
  '24h': { icon: 'bolt.fill', color: '#5E5CE6', sub: '1 gün' },
  '7d': { icon: 'flame.fill', color: '#FF9F0A', sub: '7 gün', recommended: true },
  sponsored: { icon: 'crown.fill', color: '#FFCC00', sub: '30 gün' },
};

export const BoostSheet = forwardRef<BoostSheetRef, Props>(function BoostSheet(
  { onPurchased },
  ref,
) {
  const sheetRef = useRef<BottomSheet>(null);
  const api = useMarketApi();
  const apiRef = useRef(api);
  apiRef.current = api;

  const [listingId, setListingId] = useState<string | null>(null);
  const [info, setInfo] = useState<BoostInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const [selectedTier, setSelectedTier] = useState<string>('7d');

  const snapPoints = useMemo(() => ['82%'], []);

  const load = useCallback(async (id: string) => {
    setLoading(true);
    const data = await apiRef.current.getBoostInfo(id);
    setInfo(data);
    setLoading(false);
  }, []);

  useImperativeHandle(ref, () => ({
    open: (id: string) => {
      setListingId(id);
      setSelectedTier('7d');
      load(id);
      sheetRef.current?.expand();
    },
    close: () => sheetRef.current?.close(),
  }));

  const onConfirmPurchase = useCallback(() => {
    if (!listingId || !info) return;
    const pkg = info.packages.find((p) => p.tier === selectedTier);
    if (!pkg) return;
    const insufficient = info.balance < pkg.price;
    if (insufficient) {
      Alert.alert(
        'Yetersiz bakiye',
        `${pkg.label} için ${pkg.price} kredi gerekli. Bakiyen: ${info.balance}.`,
        [{ text: 'Tamam' }],
      );
      return;
    }
    Alert.alert(
      `${pkg.label} öne çıkar`,
      `${pkg.price} kredi düşecek. Bakiyen: ${info.balance} → ${info.balance - pkg.price}.`,
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Onayla',
          style: 'default',
          onPress: async () => {
            setPurchasing(true);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            const r = await apiRef.current.buyBoost(listingId, pkg.tier as Package['tier']);
            setPurchasing(false);
            if (r.ok) {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              if (r.boostUntil) onPurchased?.(r.boostUntil);
              if (r.balance != null) {
                setInfo((cur) =>
                  cur
                    ? {
                        ...cur,
                        balance: r.balance!,
                        isActive: true,
                        boostUntil: r.boostUntil!,
                        boostTier: pkg.tier,
                      }
                    : cur,
                );
              }
              Alert.alert(
                'Boost aktif',
                `Listingn ${pkg.label.toLowerCase()} boyunca öne çıkacak.`,
                [{ text: 'Tamam', onPress: () => sheetRef.current?.close() }],
              );
            } else {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
              Alert.alert('Satın alma başarısız', r.error ?? 'Bir sorun oldu, tekrar dene.');
            }
          },
        },
      ],
    );
  }, [listingId, info, selectedTier, onPurchased]);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} opacity={0.5} />
    ),
    [],
  );

  return (
    <BottomSheet
      ref={sheetRef}
      index={-1}
      snapPoints={snapPoints}
      enablePanDownToClose
      backdropComponent={renderBackdrop}
      backgroundStyle={{ backgroundColor: C.page }}
      handleIndicatorStyle={{ backgroundColor: C.textDim }}
    >
      <BottomSheetView style={{ flex: 1, paddingHorizontal: 20 }}>
        <Hero />

        {loading || !info ? (
          <View style={{ paddingTop: 60, alignItems: 'center' }}>
            <ActivityIndicator color={C.accent} />
          </View>
        ) : (
          <>
            {info.isActive && info.boostUntil && (
              <ActiveBanner until={new Date(info.boostUntil)} tier={info.boostTier} />
            )}

            <View style={{ marginTop: 4 }}>
              {info.packages.map((pkg) => (
                <PackageCard
                  key={pkg.tier}
                  pkg={pkg}
                  selected={selectedTier === pkg.tier}
                  insufficient={info.balance < pkg.price}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setSelectedTier(pkg.tier);
                  }}
                />
              ))}
            </View>

            <BalanceRow balance={info.balance} />

            <PurchaseCTA
              info={info}
              selectedTier={selectedTier}
              isPurchasing={purchasing}
              onPress={onConfirmPurchase}
            />

            <Text
              style={{
                fontFamily: font.regular,
                fontSize: 11,
                color: C.textMuted,
                textAlign: 'center',
                marginTop: 10,
                lineHeight: 16,
              }}
            >
              Süre dolduğunda listing normal sıralamaya döner. İade yok.
            </Text>
          </>
        )}
      </BottomSheetView>
    </BottomSheet>
  );
});

function Hero() {
  return (
    <View style={{ alignItems: 'center', paddingTop: 4, paddingBottom: 20 }}>
      <View
        style={{
          width: 56,
          height: 56,
          borderRadius: 16,
          backgroundColor: C.accentSoft,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 14,
        }}
      >
        <SymbolView name="bolt.fill" tintColor={C.accent} size={28} />
      </View>
      <Text
        style={{ fontFamily: font.extrabold, fontSize: 22, color: C.text, letterSpacing: -0.4 }}
      >
        Listenini öne çıkar
      </Text>
      <Text
        style={{
          fontFamily: font.regular,
          fontSize: 14,
          color: C.textMuted,
          textAlign: 'center',
          marginTop: 6,
          lineHeight: 20,
          paddingHorizontal: 8,
        }}
      >
        Boost'lu listingler kategori başında ve Trend'de üstte gösterilir.
      </Text>
    </View>
  );
}

function ActiveBanner({ until, tier }: { until: Date; tier: string | null }) {
  const remaining = formatRemaining(until);
  const tierLabel = tier ? (TIER_META[tier]?.sub ?? '') : '';
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#30D15822',
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 11,
        marginBottom: 14,
      }}
    >
      <SymbolView name="checkmark.circle.fill" tintColor="#30D158" size={18} />
      <View style={{ flex: 1, marginLeft: 10 }}>
        <Text style={{ fontFamily: font.bold, fontSize: 13, color: '#30D158' }}>Aktif boost</Text>
        <Text style={{ fontFamily: font.regular, fontSize: 12, color: C.textMuted, marginTop: 1 }}>
          {tierLabel ? `${tierLabel} · ` : ''}
          {remaining}
        </Text>
      </View>
    </View>
  );
}

function BalanceRow({ balance }: { balance: number }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 14,
        paddingHorizontal: 4,
      }}
    >
      <SymbolView name="bolt.fill" tintColor={C.accent} size={13} />
      <Text style={{ fontFamily: font.bold, fontSize: 13, color: C.accent, marginLeft: 5 }}>
        {balance}
      </Text>
      <Text style={{ fontFamily: font.regular, fontSize: 13, color: C.textMuted, marginLeft: 4 }}>
        kredi bakiyen
      </Text>
    </View>
  );
}

function PackageCard({
  pkg,
  selected,
  insufficient,
  onPress,
}: {
  pkg: Package;
  selected: boolean;
  insufficient: boolean;
  onPress: () => void;
}) {
  const meta = TIER_META[pkg.tier];
  const color = meta?.color ?? C.accent;
  const icon = meta?.icon ?? 'bolt.fill';
  const recommended = meta?.recommended ?? false;

  // Pressable'a callback style verme — düz inline (CLAUDE.md kuralı)
  const cardBg = selected ? C.accentSoft : C.card;
  const cardBorderColor = selected ? C.accent : 'transparent';

  return (
    <Pressable
      onPress={onPress}
      style={{
        backgroundColor: cardBg,
        borderRadius: 14,
        paddingHorizontal: 14,
        paddingVertical: 14,
        marginBottom: 10,
        borderWidth: 2,
        borderColor: cardBorderColor,
      }}
    >
      {/* Pressable'a row vermek bug, içte ayrı View */}
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        {/* Sol — tier ikonu */}
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 11,
            backgroundColor: color + '22',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 12,
          }}
        >
          <SymbolView name={icon as any} tintColor={color} size={20} />
        </View>

        {/* Orta — başlık + alt yazı */}
        <View style={{ flex: 1, minWidth: 0, marginRight: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text
              numberOfLines={1}
              style={{
                fontFamily: font.bold,
                fontSize: 16,
                color: C.text,
                letterSpacing: -0.2,
              }}
            >
              {pkg.label}
            </Text>
            {recommended && (
              <View
                style={{
                  marginLeft: 8,
                  backgroundColor: C.accent,
                  paddingHorizontal: 6,
                  paddingVertical: 2,
                  borderRadius: 5,
                }}
              >
                <Text
                  style={{
                    fontFamily: font.bold,
                    fontSize: 9,
                    color: '#FFFFFF',
                    letterSpacing: 0.4,
                  }}
                >
                  ÖNERİLEN
                </Text>
              </View>
            )}
          </View>
          <Text
            numberOfLines={1}
            style={{
              fontFamily: font.semibold,
              fontSize: 14,
              color: C.text,
              marginTop: 2,
            }}
          >
            {pkg.price} kredi
          </Text>
          {insufficient && (
            <Text
              style={{
                fontFamily: font.regular,
                fontSize: 11,
                color: '#FF3B30',
                marginTop: 2,
              }}
            >
              Bakiye yetersiz
            </Text>
          )}
        </View>

        {/* Sağ — radio circle */}
        <View
          style={{
            width: 24,
            height: 24,
            borderRadius: 12,
            borderWidth: 2,
            borderColor: selected ? C.accent : C.border,
            backgroundColor: selected ? C.accent : 'transparent',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {selected && <SymbolView name="checkmark" tintColor="#FFFFFF" size={13} />}
        </View>
      </View>
    </Pressable>
  );
}

function PurchaseCTA({
  info,
  selectedTier,
  isPurchasing,
  onPress,
}: {
  info: BoostInfo;
  selectedTier: string;
  isPurchasing: boolean;
  onPress: () => void;
}) {
  const pkg = info.packages.find((p) => p.tier === selectedTier);
  const insufficient = pkg ? info.balance < pkg.price : false;
  const disabled = !pkg || isPurchasing;

  // CLAUDE.md KRİTİK BUTON KURALI: dinamik bg + Pressable inline style
  const bgColor = !pkg || insufficient ? C.surface : C.accent;
  const textColor = !pkg || insufficient ? C.textMuted : '#FFFFFF';
  const label = !pkg
    ? 'Bir paket seç'
    : insufficient
      ? `${pkg.price} kredi gerekli`
      : `${pkg.price} kredi · Satın Al`;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={{
        backgroundColor: bgColor,
        borderRadius: 14,
        paddingVertical: 17,
        marginTop: 16,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 56,
        opacity: isPurchasing ? 0.7 : 1,
      }}
    >
      {isPurchasing ? (
        <ActivityIndicator color="#FFFFFF" />
      ) : (
        <Text
          style={{
            fontFamily: font.bold,
            fontSize: 16,
            color: textColor,
            letterSpacing: -0.2,
          }}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}

function formatRemaining(until: Date): string {
  const ms = until.getTime() - Date.now();
  if (ms <= 0) return 'Süresi doldu';
  const hours = Math.floor(ms / (60 * 60 * 1000));
  if (hours < 1) {
    const mins = Math.floor(ms / (60 * 1000));
    return `${mins} dakika kaldı`;
  }
  if (hours < 24) return `${hours} saat kaldı`;
  const days = Math.floor(hours / 24);
  return `${days} gün kaldı`;
}

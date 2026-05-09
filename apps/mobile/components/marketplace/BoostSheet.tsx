/**
 * V4.8 Faz F — Listing Boost satın alma sheet
 *
 * Apple App Store iAP paterni:
 *   - 3 paket kartı (24 Saat / 1 Hafta / 30 Gün Sponsorlu)
 *   - Her kartta süre + kazandıracağı görünürlük açıklaması + fiyat
 *   - "Satın Al" CTA → native confirm Alert
 *   - Aktif boost varsa üstte mevcut durumu gösterir
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

const TIER_DESC: Record<string, string> = {
  '24h': 'Listenin en üstünde 1 gün',
  '7d': 'Trend listesinde 1 hafta',
  sponsored: 'Tüm kategorilerde 30 gün',
};

const TIER_ICON: Record<string, string> = {
  '24h': 'bolt.fill',
  '7d': 'flame.fill',
  sponsored: 'crown.fill',
};

const TIER_COLOR: Record<string, string> = {
  '24h': '#5E5CE6',
  '7d': '#FF9F0A',
  sponsored: '#FFCC00',
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
  const [purchasingTier, setPurchasingTier] = useState<string | null>(null);
  const [selectedTier, setSelectedTier] = useState<string | null>('7d');

  const snapPoints = useMemo(() => ['85%'], []);

  const load = useCallback(async (id: string) => {
    setLoading(true);
    const data = await apiRef.current.getBoostInfo(id);
    setInfo(data);
    setLoading(false);
  }, []);

  useImperativeHandle(ref, () => ({
    open: (id: string) => {
      setListingId(id);
      load(id);
      sheetRef.current?.expand();
    },
    close: () => sheetRef.current?.close(),
  }));

  const onConfirmPurchase = useCallback(() => {
    if (!listingId || !info || !selectedTier) return;
    const pkg = info.packages.find((p) => p.tier === selectedTier);
    if (!pkg) return;
    const insufficient = info.balance < pkg.price;
    Alert.alert(
      `${pkg.label} öne çıkar`,
      insufficient
        ? `Bu paket ${pkg.price} kredi tutuyor. Bakiyen ${info.balance}. Yeterli krediyi yükle, sonra tekrar dene.`
        : `Bu işlem ${pkg.price} kredi düşecek. Bakiyen: ${info.balance} → ${info.balance - pkg.price}.`,
      insufficient
        ? [{ text: 'Tamam' }]
        : [
            { text: 'Vazgeç', style: 'cancel' },
            {
              text: 'Onayla',
              style: 'default',
              onPress: async () => {
                setPurchasingTier(pkg.tier);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                const r = await apiRef.current.buyBoost(listingId, pkg.tier as Package['tier']);
                setPurchasingTier(null);
                if (r.ok) {
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                  if (r.boostUntil) onPurchased?.(r.boostUntil);
                  Alert.alert(
                    'Boost aktif',
                    `Listingn ${pkg.label.toLowerCase()} boyunca öne çıkacak.`,
                    [{ text: 'Tamam', onPress: () => sheetRef.current?.close() }],
                  );
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
                } else {
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                  Alert.alert(
                    'Satın alma başarısız',
                    r.error ?? 'Bir sorun oldu, daha sonra tekrar dene.',
                  );
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
      <BottomSheetView style={{ flex: 1, paddingHorizontal: 20, paddingBottom: 32 }}>
        <View style={{ alignItems: 'center', marginTop: 4, marginBottom: 18 }}>
          <View
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              backgroundColor: C.accentSoft,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 12,
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
            }}
          >
            Boost'lu listingler kategori başında, Trend section'ında ve Keşfet'in üst sıralarında
            gösterilir.
          </Text>
        </View>

        {loading || !info ? (
          <View style={{ paddingTop: 60, alignItems: 'center' }}>
            <ActivityIndicator color={C.accent} />
          </View>
        ) : (
          <>
            {info.isActive && info.boostUntil && (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 10,
                  backgroundColor: '#30D15822',
                  borderRadius: 12,
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                  marginBottom: 14,
                }}
              >
                <SymbolView name="checkmark.circle.fill" tintColor="#30D158" size={18} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: font.bold, fontSize: 13, color: '#30D158' }}>
                    Aktif boost
                  </Text>
                  <Text
                    style={{
                      fontFamily: font.regular,
                      fontSize: 12,
                      color: C.textMuted,
                      marginTop: 1,
                    }}
                  >
                    {formatRemaining(new Date(info.boostUntil))}
                  </Text>
                </View>
              </View>
            )}

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 14 }}>
              <SymbolView name="bolt.fill" tintColor={C.accent} size={14} />
              <Text style={{ fontFamily: font.bold, fontSize: 14, color: C.accent }}>
                {info.balance} kredi
              </Text>
              <Text style={{ fontFamily: font.regular, fontSize: 13, color: C.textMuted }}>
                · bakiyen
              </Text>
            </View>

            {info.packages.map((pkg) => (
              <PackageCard
                key={pkg.tier}
                pkg={pkg}
                selected={selectedTier === pkg.tier}
                onPress={() => {
                  Haptics.selectionAsync();
                  setSelectedTier(pkg.tier);
                }}
              />
            ))}

            <PurchaseCTA
              info={info}
              selectedTier={selectedTier}
              isPurchasing={purchasingTier !== null}
              onPress={onConfirmPurchase}
            />

            <Text
              style={{
                fontFamily: font.regular,
                fontSize: 11,
                color: C.textMuted,
                textAlign: 'center',
                marginTop: 12,
                lineHeight: 16,
              }}
            >
              Boost süresi dolduğunda listing normal sıralamaya döner. İade yok.
            </Text>
          </>
        )}
      </BottomSheetView>
    </BottomSheet>
  );
});

function PurchaseCTA({
  info,
  selectedTier,
  isPurchasing,
  onPress,
}: {
  info: BoostInfo;
  selectedTier: string | null;
  isPurchasing: boolean;
  onPress: () => void;
}) {
  const pkg = info.packages.find((p) => p.tier === selectedTier);
  const disabled = !pkg || isPurchasing;
  const insufficient = pkg ? info.balance < pkg.price : false;

  const bgColor = insufficient ? C.surface : C.accent;
  const textColor = insufficient ? C.text : '#FFFFFF';

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={{
        backgroundColor: bgColor,
        borderRadius: 14,
        paddingVertical: 16,
        marginTop: 16,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 56,
        opacity: disabled ? 0.5 : 1,
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
          {!pkg
            ? 'Bir paket seç'
            : insufficient
              ? `${pkg.price} kredi gerekli`
              : `${pkg.price} kredi · Satın Al`}
        </Text>
      )}
    </Pressable>
  );
}

function PackageCard({
  pkg,
  selected,
  onPress,
}: {
  pkg: Package;
  selected: boolean;
  onPress: () => void;
}) {
  const color = TIER_COLOR[pkg.tier] ?? C.accent;
  const icon = TIER_ICON[pkg.tier] ?? 'bolt.fill';
  const desc = TIER_DESC[pkg.tier] ?? '';

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        backgroundColor: selected ? C.accentSoft : C.card,
        borderRadius: 14,
        paddingHorizontal: 14,
        height: 76,
        justifyContent: 'center',
        marginBottom: 10,
        borderWidth: 2,
        borderColor: selected ? C.accent : 'transparent',
        opacity: pressed ? 0.85 : 1,
      })}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
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
        <View style={{ flex: 1, minWidth: 0, marginRight: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
            <Text
              numberOfLines={1}
              style={{ fontFamily: font.bold, fontSize: 16, color: C.text, letterSpacing: -0.2 }}
            >
              {pkg.label}
            </Text>
            <Text
              numberOfLines={1}
              style={{ fontFamily: font.semibold, fontSize: 13, color: C.textMuted }}
            >
              {pkg.price} cr
            </Text>
          </View>
          <Text
            numberOfLines={1}
            style={{ fontFamily: font.regular, fontSize: 13, color: C.textMuted, marginTop: 2 }}
          >
            {desc}
          </Text>
        </View>
        <View
          style={{
            width: 22,
            height: 22,
            borderRadius: 11,
            borderWidth: 2,
            borderColor: selected ? C.accent : C.border,
            backgroundColor: selected ? C.accent : 'transparent',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {selected && <SymbolView name="checkmark" tintColor="#FFFFFF" size={12} />}
        </View>
      </View>
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

/**
 * V4.8 Faz E — Long-press Quick Rent Sheet
 *
 * Market kartı uzun basıldığında alttan açılır. Kart önizleme + 3 hızlı CTA.
 * Demo / 7 gün kira / 30 gün kira — direkt kira başlatır.
 */

import { forwardRef, useCallback, useImperativeHandle, useRef } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import BottomSheet, { BottomSheetBackdrop, BottomSheetView } from '@gorhom/bottom-sheet';
import { Image } from 'expo-image';
import { SymbolView } from 'expo-symbols';
import * as Haptics from 'expo-haptics';
import { Easing } from 'react-native-reanimated';
import { C, font } from '../../lib/theme';
import { useMarketApi, type MarketListing, type RentalType } from '../../lib/marketplace/marketApi';

const EASE_OUT_SPRING = Easing.bezier(0.16, 1, 0.3, 1);

export interface QuickRentSheetRef {
  open: (listing: MarketListing) => void;
  close: () => void;
}

interface Props {
  onOpenDetail: (listingId: string) => void;
  onDemo: (listingId: string) => void;
  onRented?: () => void;
}

export const QuickRentSheet = forwardRef<QuickRentSheetRef, Props>(
  ({ onOpenDetail, onDemo, onRented }, ref) => {
    const sheetRef = useRef<BottomSheet>(null);
    const listingRef = useRef<MarketListing | null>(null);
    const api = useMarketApi();

    useImperativeHandle(ref, () => ({
      open: (listing) => {
        listingRef.current = listing;
        sheetRef.current?.snapToIndex(0);
      },
      close: () => sheetRef.current?.close(),
    }));

    const renderBackdrop = useCallback(
      (props: any) => (
        <BottomSheetBackdrop
          {...props}
          appearsOnIndex={0}
          disappearsOnIndex={-1}
          opacity={0.45}
          pressBehavior="close"
        />
      ),
      [],
    );

    const onRent = (type: RentalType) => {
      const l = listingRef.current;
      if (!l) return;
      const price =
        type === 'rent_14d' ? l.rentPrice14d : type === 'rent_30d' ? l.rentPrice30d : l.buyPrice;
      const label = type === 'rent_14d' ? '14 gün' : type === 'rent_30d' ? '30 gün' : 'satın alma';

      Alert.alert('Onay', `${l.character.name} · ${price} credit ile ${label}?`, [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Onayla',
          onPress: async () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            const r = await api.rent(l.id, type);
            if (!r.ok) {
              Alert.alert('Hata', r.error ?? 'İşlem başarısız');
              return;
            }
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            sheetRef.current?.close();
            Alert.alert('Başarılı', 'Karakter sohbet listende.');
            onRented?.();
          },
        },
      ]);
    };

    const listing = listingRef.current;

    return (
      <BottomSheet
        ref={sheetRef}
        snapPoints={[420]}
        index={-1}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        backgroundStyle={{
          backgroundColor: C.card,
          borderTopLeftRadius: 22,
          borderTopRightRadius: 22,
        }}
        handleIndicatorStyle={{ backgroundColor: C.borderStrong, width: 36, height: 5 }}
        animationConfigs={{ duration: 380, easing: EASE_OUT_SPRING }}
      >
        <BottomSheetView style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 24 }}>
          {listing && (
            <>
              {/* Preview */}
              <Pressable
                onPress={() => {
                  sheetRef.current?.close();
                  setTimeout(() => onOpenDetail(listing.id), 280);
                }}
              >
                {({ pressed }) => (
                  <View
                    style={{
                      flexDirection: 'row',
                      gap: 14,
                      alignItems: 'center',
                      paddingVertical: 8,
                      opacity: pressed ? 0.85 : 1,
                    }}
                  >
                    <View
                      style={{
                        width: 64,
                        height: 64,
                        borderRadius: 16,
                        backgroundColor: C.well,
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                      }}
                    >
                      {listing.character.avatarUrl ? (
                        <Image
                          source={{ uri: listing.character.avatarUrl }}
                          style={{ width: 64, height: 64 }}
                        />
                      ) : (
                        <SymbolView name="person.fill" tintColor={C.textMuted} size={28} />
                      )}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontFamily: font.bold, fontSize: 18, color: C.text }}>
                        {listing.character.name}
                      </Text>
                      <Text
                        numberOfLines={2}
                        style={{
                          fontFamily: font.regular,
                          fontSize: 13,
                          color: C.textMuted,
                          marginTop: 4,
                          lineHeight: 18,
                        }}
                      >
                        {listing.character.bio ?? `${listing.character.age} yaşında`}
                      </Text>
                    </View>
                    <SymbolView name="chevron.right" tintColor={C.textDim} size={14} />
                  </View>
                )}
              </Pressable>

              <View
                style={{
                  height: StyleSheet_hairline,
                  backgroundColor: C.hairline,
                  marginVertical: 14,
                }}
              />

              {/* CTA grid */}
              <Text
                style={{
                  fontFamily: font.semibold,
                  fontSize: 13,
                  color: C.textMuted,
                  letterSpacing: 0.4,
                  marginBottom: 10,
                }}
              >
                HIZLI İŞLEM
              </Text>

              <View style={{ gap: 8 }}>
                <QuickAction
                  label="5 mesaj demo"
                  sublabel="Ücretsiz, 24 saat geçerli"
                  icon="play.fill"
                  iconColor={C.success}
                  onPress={() => {
                    sheetRef.current?.close();
                    setTimeout(() => onDemo(listing.id), 280);
                  }}
                />
                {listing.rentPrice14d && (
                  <QuickAction
                    label="14 gün kira"
                    sublabel={`${listing.rentPrice14d} credit`}
                    icon="calendar"
                    iconColor={C.info}
                    onPress={() => onRent('rent_14d')}
                  />
                )}
                {listing.rentPrice30d && (
                  <QuickAction
                    label="30 gün kira"
                    sublabel={`${listing.rentPrice30d} credit · en popüler`}
                    icon="calendar.badge.plus"
                    iconColor={C.accent}
                    onPress={() => onRent('rent_30d')}
                    primary
                  />
                )}
                {listing.buyEnabled && listing.buyPrice && (
                  <QuickAction
                    label="Satın al"
                    sublabel={`${listing.buyPrice} credit · kalıcı`}
                    icon="bag.fill"
                    iconColor="#FF9F0A"
                    onPress={() => onRent('outright_buy')}
                  />
                )}
              </View>
            </>
          )}
        </BottomSheetView>
      </BottomSheet>
    );
  },
);

QuickRentSheet.displayName = 'QuickRentSheet';

const StyleSheet_hairline = 0.5;

function QuickAction({
  label,
  sublabel,
  icon,
  iconColor,
  onPress,
  primary,
}: {
  label: string;
  sublabel: string;
  icon: string;
  iconColor: string;
  onPress: () => void;
  primary?: boolean;
}) {
  return (
    <Pressable onPress={onPress}>
      {({ pressed }) => (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            paddingHorizontal: 14,
            paddingVertical: 12,
            backgroundColor: primary ? C.accent : C.surface,
            borderRadius: 14,
            minHeight: 56,
            opacity: pressed ? 0.85 : 1,
          }}
        >
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              backgroundColor: primary ? '#FFFFFF22' : iconColor + '22',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <SymbolView name={icon as any} tintColor={primary ? '#FFFFFF' : iconColor} size={18} />
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontFamily: font.semibold,
                fontSize: 15,
                color: primary ? '#FFFFFF' : C.text,
              }}
            >
              {label}
            </Text>
            <Text
              style={{
                fontFamily: font.regular,
                fontSize: 12,
                color: primary ? '#FFFFFFCC' : C.textMuted,
                marginTop: 1,
              }}
            >
              {sublabel}
            </Text>
          </View>
        </View>
      )}
    </Pressable>
  );
}

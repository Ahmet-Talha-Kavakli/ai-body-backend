/**
 * V4.8 Faz F — Demo bitti, kira'ya yumuşak geçiş sheet
 *
 * 5 demo mesajından sonra otomatik açılır.
 * Apple subscription paterni: avatar + duygusal başlık + 3 kira tier kartı + CTA.
 *
 * Kurallar:
 *   - Pressable callback style YOK (CLAUDE.md KRİTİK BUTON KURALI)
 *   - Pressable + row YOK; row hep ayrı View içinde
 *   - bgColor / textColor const olarak çıkarılı
 *   - Native @gorhom/bottom-sheet (UISheet)
 */

import { forwardRef, useCallback, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, Text, View } from 'react-native';
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetView,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import { Image } from 'expo-image';
import { SymbolView } from 'expo-symbols';
import * as Haptics from 'expo-haptics';
import { C, font } from '../../lib/theme';
import { useMarketApi, type RentalType } from '../../lib/marketplace/marketApi';

export interface DemoEndSheetRef {
  open: (info: {
    listingId: string;
    characterName: string;
    avatarUrl: string | null;
    rentPrice7d: number | null;
    rentPrice14d: number | null;
    rentPrice30d: number | null;
  }) => void;
  close: () => void;
}

interface Props {
  onRented?: () => void;
  onLater?: () => void;
}

interface OpenInfo {
  listingId: string;
  characterName: string;
  avatarUrl: string | null;
  rentPrice7d: number | null;
  rentPrice14d: number | null;
  rentPrice30d: number | null;
}

interface PriceOption {
  type: RentalType;
  label: string;
  days: number;
  price: number;
  recommended: boolean;
}

export const DemoEndSheet = forwardRef<DemoEndSheetRef, Props>(function DemoEndSheet(
  { onRented, onLater },
  ref,
) {
  const sheetRef = useRef<BottomSheet>(null);
  const api = useMarketApi();
  const apiRef = useRef(api);
  apiRef.current = api;

  const [info, setInfo] = useState<OpenInfo | null>(null);
  const [selectedType, setSelectedType] = useState<RentalType>('rent_7d');
  const [renting, setRenting] = useState(false);

  const snapPoints = useMemo(() => ['85%'], []);

  useImperativeHandle(ref, () => ({
    open: (i) => {
      setInfo(i);
      // En ucuz tier'ı default seç (genelde 7d)
      const cheapest = pickDefault(i);
      setSelectedType(cheapest);
      sheetRef.current?.expand();
    },
    close: () => sheetRef.current?.close(),
  }));

  const options: PriceOption[] = useMemo(() => {
    if (!info) return [];
    const arr: PriceOption[] = [];
    if (info.rentPrice7d != null) {
      arr.push({
        type: 'rent_7d',
        label: '7 Gün',
        days: 7,
        price: info.rentPrice7d,
        recommended: true,
      });
    }
    if (info.rentPrice14d != null) {
      arr.push({
        type: 'rent_14d',
        label: '14 Gün',
        days: 14,
        price: info.rentPrice14d,
        recommended: false,
      });
    }
    if (info.rentPrice30d != null) {
      arr.push({
        type: 'rent_30d',
        label: '30 Gün',
        days: 30,
        price: info.rentPrice30d,
        recommended: false,
      });
    }
    return arr;
  }, [info]);

  const onConfirmRent = useCallback(() => {
    if (!info || renting) return;
    const opt = options.find((o) => o.type === selectedType);
    if (!opt) return;
    Alert.alert(
      `${info.characterName} ile ${opt.label.toLowerCase()}`,
      `${opt.price} kredi düşecek. Konuşmaya devam edebilir, hatıralarınız kapsüllenir.`,
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Onayla',
          style: 'default',
          onPress: async () => {
            setRenting(true);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            const r = await apiRef.current.rent(info.listingId, opt.type);
            setRenting(false);
            if (r.ok) {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              sheetRef.current?.close();
              setTimeout(() => onRented?.(), 200);
            } else {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
              Alert.alert('Kira başlatılamadı', r.error ?? 'Tekrar dene.');
            }
          },
        },
      ],
    );
  }, [info, selectedType, options, renting, onRented]);

  const onLaterPress = () => {
    Haptics.selectionAsync();
    sheetRef.current?.close();
    setTimeout(() => onLater?.(), 200);
  };

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} opacity={0.55} />
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
        {info && <Hero name={info.characterName} avatarUrl={info.avatarUrl} />}

        {options.length === 0 ? (
          <View style={{ paddingTop: 40, alignItems: 'center' }}>
            <ActivityIndicator color={C.accent} />
          </View>
        ) : (
          <>
            <View style={{ marginTop: 4 }}>
              {options.map((opt) => (
                <PriceCard
                  key={opt.type}
                  option={opt}
                  selected={selectedType === opt.type}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setSelectedType(opt.type);
                  }}
                />
              ))}
            </View>

            <RentCTA
              option={options.find((o) => o.type === selectedType)}
              isRenting={renting}
              onPress={onConfirmRent}
            />

            <Pressable
              onPress={onLaterPress}
              disabled={renting}
              style={{
                paddingVertical: 14,
                alignItems: 'center',
                marginTop: 6,
              }}
            >
              <Text style={{ fontFamily: font.semibold, fontSize: 14, color: C.textMuted }}>
                Daha sonra
              </Text>
            </Pressable>
          </>
        )}
      </BottomSheetView>
    </BottomSheet>
  );
});

function pickDefault(info: OpenInfo): RentalType {
  if (info.rentPrice7d != null) return 'rent_7d';
  if (info.rentPrice14d != null) return 'rent_14d';
  if (info.rentPrice30d != null) return 'rent_30d';
  return 'rent_7d';
}

function Hero({ name, avatarUrl }: { name: string; avatarUrl: string | null }) {
  return (
    <View style={{ alignItems: 'center', paddingTop: 4, paddingBottom: 22 }}>
      <View
        style={{
          width: 84,
          height: 84,
          borderRadius: 42,
          backgroundColor: C.surface,
          overflow: 'hidden',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 14,
        }}
      >
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} style={{ width: 84, height: 84 }} contentFit="cover" />
        ) : (
          <SymbolView name="person.fill" tintColor={C.textMuted} size={40} />
        )}
      </View>
      <Text
        style={{ fontFamily: font.extrabold, fontSize: 22, color: C.text, letterSpacing: -0.4 }}
      >
        {name} ile aranızda bir bağ kuruldu
      </Text>
      <Text
        style={{
          fontFamily: font.regular,
          fontSize: 14,
          color: C.textMuted,
          textAlign: 'center',
          marginTop: 8,
          lineHeight: 20,
          paddingHorizontal: 4,
        }}
      >
        Konuşmaya devam etmek istersen kirala. Hatıralarınız kapsüllenir, geri döndüğünde kaldığınız
        yerden devam edersiniz.
      </Text>
    </View>
  );
}

function PriceCard({
  option,
  selected,
  onPress,
}: {
  option: PriceOption;
  selected: boolean;
  onPress: () => void;
}) {
  // Pressable callback style YOK
  const cardBg = selected ? C.accentSoft : C.card;
  const cardBorderColor = selected ? C.accent : 'transparent';
  const perDay = (option.price / option.days).toFixed(1);

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
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 11,
            backgroundColor: C.accentSoft,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 12,
          }}
        >
          <SymbolView name="calendar" tintColor={C.accent} size={20} />
        </View>

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
              {option.label}
            </Text>
            {option.recommended && (
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
            {option.price} kredi
            <Text style={{ fontFamily: font.regular, color: C.textMuted }}>
              {' '}
              · günlük {perDay} cr
            </Text>
          </Text>
        </View>

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

function RentCTA({
  option,
  isRenting,
  onPress,
}: {
  option: PriceOption | undefined;
  isRenting: boolean;
  onPress: () => void;
}) {
  const disabled = !option || isRenting;
  const bgColor = !option ? C.surface : C.accent;
  const textColor = !option ? C.textMuted : '#FFFFFF';
  const label = !option ? 'Bir paket seç' : `${option.price} kredi · Şimdi kirala`;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={{
        backgroundColor: bgColor,
        borderRadius: 14,
        paddingVertical: 17,
        marginTop: 14,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 56,
        opacity: isRenting ? 0.7 : 1,
      }}
    >
      {isRenting ? (
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

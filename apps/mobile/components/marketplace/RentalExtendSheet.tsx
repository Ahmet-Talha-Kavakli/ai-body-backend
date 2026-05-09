/**
 * V4.8 Faz F — Kira süresini uzat sheet
 *
 * Apple subscription paterni: 3 uzatma seçeneği (7d/14d/30d) + radio + CTA.
 *
 * Kurallar (CLAUDE.md):
 *   - Pressable callback style YOK
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
import { SymbolView } from 'expo-symbols';
import * as Haptics from 'expo-haptics';
import { C, font } from '../../lib/theme';
import { useMarketApi } from '../../lib/marketplace/marketApi';

interface ExtendOption {
  type: 'rent_7d' | 'rent_14d' | 'rent_30d';
  days: number;
  price: number;
}

interface ExtendInfo {
  balance: number;
  currentEndsAt: string | null;
  options: ExtendOption[];
}

export interface RentalExtendSheetRef {
  open: (rentalId: string, characterName: string) => void;
  close: () => void;
}

interface Props {
  onExtended?: (newEndsAt: string) => void;
}

export const RentalExtendSheet = forwardRef<RentalExtendSheetRef, Props>(function RentalExtendSheet(
  { onExtended },
  ref,
) {
  const sheetRef = useRef<BottomSheet>(null);
  const api = useMarketApi();
  const apiRef = useRef(api);
  apiRef.current = api;

  const [rentalId, setRentalId] = useState<string | null>(null);
  const [characterName, setCharacterName] = useState<string>('');
  const [info, setInfo] = useState<ExtendInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [extending, setExtending] = useState(false);
  const [selectedType, setSelectedType] = useState<'rent_7d' | 'rent_14d' | 'rent_30d'>('rent_7d');

  const snapPoints = useMemo(() => ['78%'], []);

  const load = useCallback(async (id: string) => {
    setLoading(true);
    const data = await apiRef.current.getExtendInfo(id);
    setInfo(data);
    if (data && data.options.length > 0) {
      setSelectedType(data.options[0]!.type);
    }
    setLoading(false);
  }, []);

  useImperativeHandle(ref, () => ({
    open: (id: string, name: string) => {
      setRentalId(id);
      setCharacterName(name);
      load(id);
      sheetRef.current?.expand();
    },
    close: () => sheetRef.current?.close(),
  }));

  const onConfirm = useCallback(() => {
    if (!rentalId || !info) return;
    const opt = info.options.find((o) => o.type === selectedType);
    if (!opt) return;
    const insufficient = info.balance < opt.price;
    if (insufficient) {
      Alert.alert(
        'Yetersiz bakiye',
        `${opt.days} gün uzatma için ${opt.price} kredi gerekli. Bakiyen: ${info.balance}.`,
        [{ text: 'Tamam' }],
      );
      return;
    }
    Alert.alert(
      `${opt.days} gün uzat`,
      `${opt.price} kredi düşecek. ${characterName} ile ${opt.days} gün daha konuşmaya devam edersin.`,
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Onayla',
          style: 'default',
          onPress: async () => {
            setExtending(true);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            const r = await apiRef.current.extendRental(rentalId, opt.type);
            setExtending(false);
            if (r.ok) {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              if (r.endsAt) onExtended?.(r.endsAt);
              Alert.alert(
                'Süre uzatıldı',
                `${opt.days} gün eklendi. Yeni bitiş: ${r.endsAt ? formatDate(new Date(r.endsAt)) : ''}`,
                [{ text: 'Tamam', onPress: () => sheetRef.current?.close() }],
              );
            } else {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
              Alert.alert('Uzatma başarısız', r.error ?? 'Tekrar dene.');
            }
          },
        },
      ],
    );
  }, [rentalId, info, selectedType, characterName, onExtended]);

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
        <Hero
          name={characterName}
          currentEndsAt={info?.currentEndsAt ? new Date(info.currentEndsAt) : null}
        />

        {loading || !info ? (
          <View style={{ paddingTop: 60, alignItems: 'center' }}>
            <ActivityIndicator color={C.accent} />
          </View>
        ) : info.options.length === 0 ? (
          <Text
            style={{
              fontFamily: font.regular,
              fontSize: 14,
              color: C.textMuted,
              textAlign: 'center',
              paddingTop: 40,
              lineHeight: 20,
            }}
          >
            Bu listing için uzatma seçeneği tanımlı değil.
          </Text>
        ) : (
          <>
            <View style={{ marginTop: 4 }}>
              {info.options.map((opt) => (
                <ExtendCard
                  key={opt.type}
                  option={opt}
                  selected={selectedType === opt.type}
                  insufficient={info.balance < opt.price}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setSelectedType(opt.type);
                  }}
                />
              ))}
            </View>

            <BalanceRow balance={info.balance} />

            <ConfirmCTA
              info={info}
              selectedType={selectedType}
              isExtending={extending}
              onPress={onConfirm}
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
              Uzatma ücreti hemen düşer. İade yok.
            </Text>
          </>
        )}
      </BottomSheetView>
    </BottomSheet>
  );
});

function Hero({ name, currentEndsAt }: { name: string; currentEndsAt: Date | null }) {
  const remaining = currentEndsAt ? formatRemaining(currentEndsAt) : null;
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
        <SymbolView name="calendar.badge.plus" tintColor={C.accent} size={28} />
      </View>
      <Text
        style={{ fontFamily: font.extrabold, fontSize: 22, color: C.text, letterSpacing: -0.4 }}
      >
        {name} ile devam et
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
        {remaining
          ? `Şu an ${remaining}. Süreyi uzat, sohbet devam etsin.`
          : 'Süreyi uzat, sohbet devam etsin.'}
      </Text>
    </View>
  );
}

function BalanceRow({ balance }: { balance: number }) {
  return (
    <View
      style={{ flexDirection: 'row', alignItems: 'center', marginTop: 14, paddingHorizontal: 4 }}
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

function ExtendCard({
  option,
  selected,
  insufficient,
  onPress,
}: {
  option: ExtendOption;
  selected: boolean;
  insufficient: boolean;
  onPress: () => void;
}) {
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
          <Text
            numberOfLines={1}
            style={{ fontFamily: font.bold, fontSize: 16, color: C.text, letterSpacing: -0.2 }}
          >
            +{option.days} gün
          </Text>
          <Text
            numberOfLines={1}
            style={{ fontFamily: font.semibold, fontSize: 14, color: C.text, marginTop: 2 }}
          >
            {option.price} kredi
            <Text style={{ fontFamily: font.regular, color: C.textMuted }}>
              {' '}
              · günlük {perDay} cr
            </Text>
          </Text>
          {insufficient && (
            <Text
              style={{ fontFamily: font.regular, fontSize: 11, color: '#FF3B30', marginTop: 2 }}
            >
              Bakiye yetersiz
            </Text>
          )}
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

function ConfirmCTA({
  info,
  selectedType,
  isExtending,
  onPress,
}: {
  info: ExtendInfo;
  selectedType: 'rent_7d' | 'rent_14d' | 'rent_30d';
  isExtending: boolean;
  onPress: () => void;
}) {
  const opt = info.options.find((o) => o.type === selectedType);
  const insufficient = opt ? info.balance < opt.price : false;
  const disabled = !opt || isExtending;

  const bgColor = !opt || insufficient ? C.surface : C.accent;
  const textColor = !opt || insufficient ? C.textMuted : '#FFFFFF';
  const label = !opt
    ? 'Bir süre seç'
    : insufficient
      ? `${opt.price} kredi gerekli`
      : `${opt.price} kredi · Süreyi uzat`;

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
        opacity: isExtending ? 0.7 : 1,
      }}
    >
      {isExtending ? (
        <ActivityIndicator color="#FFFFFF" />
      ) : (
        <Text
          style={{ fontFamily: font.bold, fontSize: 16, color: textColor, letterSpacing: -0.2 }}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}

function formatRemaining(until: Date): string {
  const ms = until.getTime() - Date.now();
  if (ms <= 0) return 'süresi doldu';
  const hours = Math.floor(ms / (60 * 60 * 1000));
  if (hours < 24) return `${hours} saat kaldı`;
  const days = Math.floor(hours / 24);
  return `${days} gün kaldı`;
}

function formatDate(d: Date): string {
  return d.toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

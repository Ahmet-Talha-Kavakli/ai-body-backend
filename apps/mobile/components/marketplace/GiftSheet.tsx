/**
 * V4.8 Faz F — Hediye Et sheet
 *
 * Tek ekranda:
 *   - Karakter info + "Hediye et" başlık
 *   - Handle input (@kullanici)
 *   - 3 tier kartı (radio paterni — RentalExtendSheet'le aynı)
 *   - Opsiyonel mesaj input (max 200 char)
 *   - "X kredi · Hediye gönder" CTA
 *
 * Kurallar (CLAUDE.md):
 *   - Pressable callback style YOK
 *   - bgColor / textColor const olarak çıkarılı
 *   - Native @gorhom/bottom-sheet (UISheet) + BottomSheetTextInput
 */

import { forwardRef, useCallback, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, Text, View } from 'react-native';
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetView,
  BottomSheetTextInput,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import { SymbolView } from 'expo-symbols';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { C, font } from '../../lib/theme';
import { useMarketApi, type RentalType } from '../../lib/marketplace/marketApi';

interface GiftOption {
  type: Extract<RentalType, 'rent_7d' | 'rent_14d' | 'rent_30d'>;
  days: number;
  price: number;
}

interface OpenInfo {
  listingId: string;
  characterName: string;
  avatarUrl: string | null;
  rentPrice7d: number | null;
  rentPrice14d: number | null;
  rentPrice30d: number | null;
}

export interface GiftSheetRef {
  open: (info: OpenInfo) => void;
  close: () => void;
}

interface Props {
  onSent?: (recipientHandle: string) => void;
}

export const GiftSheet = forwardRef<GiftSheetRef, Props>(function GiftSheet({ onSent }, ref) {
  const sheetRef = useRef<BottomSheet>(null);
  const api = useMarketApi();
  const apiRef = useRef(api);
  apiRef.current = api;

  const [info, setInfo] = useState<OpenInfo | null>(null);
  const [handle, setHandle] = useState('');
  const [message, setMessage] = useState('');
  const [selectedType, setSelectedType] = useState<GiftOption['type']>('rent_7d');
  const [sending, setSending] = useState(false);

  const snapPoints = useMemo(() => ['90%'], []);

  const options: GiftOption[] = useMemo(() => {
    if (!info) return [];
    const arr: GiftOption[] = [];
    if (info.rentPrice7d != null) arr.push({ type: 'rent_7d', days: 7, price: info.rentPrice7d });
    if (info.rentPrice14d != null)
      arr.push({ type: 'rent_14d', days: 14, price: info.rentPrice14d });
    if (info.rentPrice30d != null)
      arr.push({ type: 'rent_30d', days: 30, price: info.rentPrice30d });
    return arr;
  }, [info]);

  useImperativeHandle(ref, () => ({
    open: (i) => {
      setInfo(i);
      setHandle('');
      setMessage('');
      setSelectedType(
        i.rentPrice7d != null ? 'rent_7d' : i.rentPrice14d != null ? 'rent_14d' : 'rent_30d',
      );
      sheetRef.current?.expand();
    },
    close: () => sheetRef.current?.close(),
  }));

  const onConfirm = useCallback(async () => {
    if (!info) return;
    const cleanHandle = handle.trim().replace(/^@/, '');
    if (!cleanHandle) {
      Alert.alert('Eksik', "Yaratıcı handle'ı yazmalısın (@ olmadan).");
      return;
    }
    const opt = options.find((o) => o.type === selectedType);
    if (!opt) return;

    setSending(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const r = await apiRef.current.giftRental(
      info.listingId,
      cleanHandle,
      opt.type,
      message.trim() || undefined,
    );
    setSending(false);
    if (r.ok) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      sheetRef.current?.close();
      setTimeout(() => {
        onSent?.(cleanHandle);
        Alert.alert(
          'Hediye gönderildi 🎁',
          `@${cleanHandle} kullanıcısına ${info.characterName} ile ${opt.days} gün hediye ettin.`,
        );
      }, 250);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Hediye gönderilemedi', r.error ?? 'Tekrar dene.');
    }
  }, [info, handle, message, selectedType, options, onSent]);

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
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      backdropComponent={renderBackdrop}
      backgroundStyle={{ backgroundColor: C.page }}
      handleIndicatorStyle={{ backgroundColor: C.textDim }}
    >
      <BottomSheetView style={{ flex: 1, paddingHorizontal: 20 }}>
        {info && <Hero name={info.characterName} avatarUrl={info.avatarUrl} />}

        {/* Handle input */}
        <View style={{ marginBottom: 14 }}>
          <Text
            style={{
              fontFamily: font.semibold,
              fontSize: 12,
              color: C.textMuted,
              letterSpacing: 0.4,
              marginBottom: 6,
              textTransform: 'uppercase',
            }}
          >
            Kime hediye?
          </Text>
          <View
            style={{
              backgroundColor: C.card,
              borderRadius: 12,
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 14,
              height: 48,
            }}
          >
            <Text style={{ fontFamily: font.semibold, fontSize: 16, color: C.textMuted }}>@</Text>
            <BottomSheetTextInput
              value={handle}
              onChangeText={setHandle}
              placeholder="kullaniciadi"
              placeholderTextColor={C.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
              style={{
                flex: 1,
                marginLeft: 4,
                fontFamily: font.regular,
                fontSize: 16,
                color: C.text,
                paddingVertical: 0,
              }}
            />
          </View>
        </View>

        {/* Tier seçimi */}
        {options.length > 0 && (
          <>
            <Text
              style={{
                fontFamily: font.semibold,
                fontSize: 12,
                color: C.textMuted,
                letterSpacing: 0.4,
                marginBottom: 6,
                textTransform: 'uppercase',
              }}
            >
              Süre
            </Text>
            <View style={{ marginBottom: 14 }}>
              {options.map((opt) => (
                <GiftCard
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
          </>
        )}

        {/* Mesaj */}
        <View style={{ marginBottom: 14 }}>
          <Text
            style={{
              fontFamily: font.semibold,
              fontSize: 12,
              color: C.textMuted,
              letterSpacing: 0.4,
              marginBottom: 6,
              textTransform: 'uppercase',
            }}
          >
            Mesaj <Text style={{ fontFamily: font.regular }}>· isteğe bağlı</Text>
          </Text>
          <View
            style={{
              backgroundColor: C.card,
              borderRadius: 12,
              paddingHorizontal: 14,
              paddingVertical: 12,
            }}
          >
            <BottomSheetTextInput
              value={message}
              onChangeText={(t) => setMessage(t.slice(0, 200))}
              placeholder="Doğum günün kutlu olsun! :)"
              placeholderTextColor={C.textMuted}
              multiline
              style={{
                fontFamily: font.regular,
                fontSize: 15,
                color: C.text,
                minHeight: 50,
                paddingVertical: 0,
                lineHeight: 21,
              }}
            />
          </View>
        </View>

        <ConfirmCTA
          options={options}
          selectedType={selectedType}
          handle={handle}
          isSending={sending}
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
          Hediye, @{handle.replace(/^@/, '') || 'kullanici'} kişisinin hesabına anında gider.
        </Text>
      </BottomSheetView>
    </BottomSheet>
  );
});

function Hero({ name, avatarUrl }: { name: string; avatarUrl: string | null }) {
  return (
    <View style={{ alignItems: 'center', paddingTop: 4, paddingBottom: 18 }}>
      <View
        style={{
          width: 56,
          height: 56,
          borderRadius: 16,
          backgroundColor: C.accentSoft,
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          marginBottom: 12,
        }}
      >
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} style={{ width: 56, height: 56 }} contentFit="cover" />
        ) : (
          <SymbolView name="gift.fill" tintColor={C.accent} size={28} />
        )}
      </View>
      <Text
        style={{ fontFamily: font.extrabold, fontSize: 22, color: C.text, letterSpacing: -0.4 }}
      >
        {name}'i hediye et
      </Text>
      <Text
        style={{
          fontFamily: font.regular,
          fontSize: 13,
          color: C.textMuted,
          marginTop: 4,
          textAlign: 'center',
        }}
      >
        Kira anında alıcıda başlar.
      </Text>
    </View>
  );
}

function GiftCard({
  option,
  selected,
  onPress,
}: {
  option: GiftOption;
  selected: boolean;
  onPress: () => void;
}) {
  const cardBg = selected ? C.accentSoft : C.card;
  const cardBorderColor = selected ? C.accent : 'transparent';

  return (
    <Pressable
      onPress={onPress}
      style={{
        backgroundColor: cardBg,
        borderRadius: 12,
        paddingHorizontal: 14,
        height: 60,
        justifyContent: 'center',
        marginBottom: 8,
        borderWidth: 2,
        borderColor: cardBorderColor,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            backgroundColor: C.accentSoft,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 12,
          }}
        >
          <SymbolView name="calendar" tintColor={C.accent} size={18} />
        </View>
        <View style={{ flex: 1, marginRight: 8 }}>
          <Text style={{ fontFamily: font.bold, fontSize: 15, color: C.text }}>
            {option.days} gün
          </Text>
          <Text
            style={{ fontFamily: font.regular, fontSize: 13, color: C.textMuted, marginTop: 1 }}
          >
            {option.price} kredi
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

function ConfirmCTA({
  options,
  selectedType,
  handle,
  isSending,
  onPress,
}: {
  options: GiftOption[];
  selectedType: GiftOption['type'];
  handle: string;
  isSending: boolean;
  onPress: () => void;
}) {
  const opt = options.find((o) => o.type === selectedType);
  const handleValid = handle.trim().length > 0;
  const disabled = !opt || !handleValid || isSending;

  const bgColor = disabled ? C.surface : C.accent;
  const textColor = disabled ? C.textMuted : '#FFFFFF';
  const label = !opt
    ? 'Bir paket seç'
    : !handleValid
      ? 'Handle gerekli'
      : `${opt.price} kredi · Hediye gönder`;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={{
        backgroundColor: bgColor,
        borderRadius: 14,
        paddingVertical: 17,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 56,
        opacity: isSending ? 0.7 : 1,
      }}
    >
      {isSending ? (
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

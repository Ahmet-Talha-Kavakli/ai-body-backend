/**
 * V4.8 Faz E — Kiralarım
 *
 * Aktif kiralar + yorum bekleyenler + geçmiş.
 */

import { Stack, useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import {
  ActionSheetIOS,
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SymbolView } from 'expo-symbols';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { C, font } from '../../../lib/theme';
import { useMarketApi } from '../../../lib/marketplace/marketApi';
import {
  RentalExtendSheet,
  type RentalExtendSheetRef,
} from '../../../components/marketplace/RentalExtendSheet';

export default function RentalsScreen() {
  const router = useRouter();
  const api = useMarketApi();
  const apiRef = useRef(api);
  apiRef.current = api;

  const [data, setData] = useState<{ active: any[]; pendingReview: any[]; history: any[] } | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const extendSheetRef = useRef<RentalExtendSheetRef>(null);

  const refresh = useCallback(async () => {
    const r = await apiRef.current.myRentals();
    if (r) setData(r);
    setLoading(false);
  }, []);

  const onActiveRentalPress = useCallback(
    (rental: any) => {
      Haptics.selectionAsync();
      ActionSheetIOS.showActionSheetWithOptions(
        {
          title: rental.character.name,
          message: rental.endsAt
            ? `Bitiş: ${new Date(rental.endsAt).toLocaleDateString('tr-TR')}`
            : undefined,
          options: ['İptal', 'Süreyi uzat', 'Erken bitir'],
          cancelButtonIndex: 0,
          destructiveButtonIndex: 2,
          userInterfaceStyle: 'light',
        },
        (idx) => {
          if (idx === 1) {
            extendSheetRef.current?.open(rental.id, rental.character.name);
          } else if (idx === 2) {
            Alert.alert(
              'Erken bitir',
              `${rental.character.name} ile sohbeti şimdi kapat? İade yok ama hafıza kapsüllenir, ileride tekrar kiralarsan kaldığınız yerden devam edersiniz.`,
              [
                { text: 'Vazgeç', style: 'cancel' },
                {
                  text: 'Bitir',
                  style: 'destructive',
                  onPress: async () => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    const r = await apiRef.current.endRentalEarly(rental.id);
                    if (r.ok) {
                      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                      refresh();
                    } else {
                      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                      Alert.alert('Hata', r.error ?? 'Tekrar dene.');
                    }
                  },
                },
              ],
            );
          }
        },
      );
    },
    [refresh],
  );

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  if (loading) {
    return (
      <View
        style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.page }}
      >
        <Stack.Screen options={{ title: 'Kiralarım' }} />
        <ActivityIndicator color={C.accent} />
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Kiralarım' }} />
      <ScrollView
        style={{ flex: 1, backgroundColor: C.page }}
        contentInsetAdjustmentBehavior="automatic"
      >
        {/* Pending review */}
        {data && data.pendingReview.length > 0 && (
          <Section title="YORUM BEKLEYEN">
            {data.pendingReview.map((r) => (
              <RentalRow
                key={r.id}
                rental={r}
                badge="Yorum bırak"
                badgeColor={C.accent}
                onPress={() => {
                  Haptics.selectionAsync();
                  router.push(`/more/market/review/${r.id}` as any);
                }}
              />
            ))}
          </Section>
        )}

        {/* Active */}
        {data && data.active.length > 0 && (
          <Section title="AKTİF">
            {data.active.map((r) => (
              <RentalRow
                key={r.id}
                rental={r}
                badge="Aktif"
                badgeColor={C.success}
                onPress={() => onActiveRentalPress(r)}
              />
            ))}
          </Section>
        )}

        {/* History */}
        {data && data.history.length > 0 && (
          <Section title="GEÇMİŞ">
            {data.history.map((r) => (
              <RentalRow
                key={r.id}
                rental={r}
                badge={r.rating ? `${r.rating}★` : 'Bitti'}
                badgeColor={C.textMuted}
              />
            ))}
          </Section>
        )}

        {data &&
          data.active.length === 0 &&
          data.pendingReview.length === 0 &&
          data.history.length === 0 && (
            <View style={{ paddingTop: 80, paddingHorizontal: 32, alignItems: 'center' }}>
              <SymbolView name="bag" tintColor={C.textMuted} size={48} />
              <Text style={{ fontFamily: font.bold, fontSize: 18, color: C.text, marginTop: 14 }}>
                Henüz kira yok
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
                Markete git, beğendiğin karakteri kirala.
              </Text>
            </View>
          )}

        <View style={{ height: 60 }} />
      </ScrollView>

      <RentalExtendSheet ref={extendSheetRef} onExtended={() => refresh()} />
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ paddingHorizontal: 20, paddingTop: 20 }}>
      <Text
        style={{
          fontFamily: font.semibold,
          fontSize: 12,
          color: C.textMuted,
          letterSpacing: 0.5,
          paddingHorizontal: 4,
          marginBottom: 8,
        }}
      >
        {title}
      </Text>
      <View style={{ backgroundColor: C.card, borderRadius: 14, overflow: 'hidden' }}>
        {children}
      </View>
    </View>
  );
}

function RentalRow({
  rental,
  badge,
  badgeColor,
  onPress,
}: {
  rental: any;
  badge: string;
  badgeColor: string;
  onPress?: () => void;
}) {
  const Wrapper = onPress ? Pressable : View;
  const props = onPress ? { onPress } : {};
  return (
    <Wrapper {...props}>
      {(state: any) => (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 14,
            paddingVertical: 12,
            gap: 12,
            borderBottomWidth: StyleSheet.hairlineWidth,
            borderBottomColor: C.hairline,
            backgroundColor: state?.pressed ? C.surface : 'transparent',
          }}
        >
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              backgroundColor: C.well,
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
            }}
          >
            {rental.character.avatarUrl ? (
              <Image
                source={{ uri: rental.character.avatarUrl }}
                style={{ width: 44, height: 44 }}
              />
            ) : (
              <SymbolView name="person.fill" tintColor={C.textMuted} size={22} />
            )}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: font.semibold, fontSize: 15, color: C.text }}>
              {rental.character.name}
            </Text>
            <Text
              style={{ fontFamily: font.regular, fontSize: 12, color: C.textMuted, marginTop: 2 }}
            >
              {rental.type === 'outright_buy' ? 'Satın alındı' : 'Kira'}
              {rental.endsAt ? ` · ${new Date(rental.endsAt).toLocaleDateString('tr-TR')}` : ''}
            </Text>
          </View>
          <View
            style={{
              backgroundColor: badgeColor + '22',
              paddingHorizontal: 8,
              paddingVertical: 3,
              borderRadius: 6,
            }}
          >
            <Text style={{ fontFamily: font.semibold, fontSize: 11, color: badgeColor }}>
              {badge}
            </Text>
          </View>
          {onPress && <SymbolView name="chevron.right" tintColor={C.textDim} size={13} />}
        </View>
      )}
    </Wrapper>
  );
}

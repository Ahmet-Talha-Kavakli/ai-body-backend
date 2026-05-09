/**
 * V4.8 Faz E — Favoriler / Wishlist
 */

import { Stack, useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SymbolView } from 'expo-symbols';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { C, font } from '../../../lib/theme';
import { useMarketApi } from '../../../lib/marketplace/marketApi';

export default function WishlistScreen() {
  const router = useRouter();
  const api = useMarketApi();
  const apiRef = useRef(api);
  apiRef.current = api;

  const [wishlist, setWishlist] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const r = await apiRef.current.listWishlist();
    if (r) setWishlist(r.wishlist);
    setLoading(false);
  }, []);

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
        <Stack.Screen options={{ title: 'Favoriler' }} />
        <ActivityIndicator color={C.accent} />
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Favoriler',
          headerRight: () =>
            wishlist.length >= 2 ? (
              <Pressable
                onPress={() => {
                  Haptics.selectionAsync();
                  router.push('/more/market/compare' as any);
                }}
                hitSlop={12}
              >
                <SymbolView name="rectangle.on.rectangle" tintColor={C.accent} size={18} />
              </Pressable>
            ) : null,
        }}
      />
      <ScrollView
        style={{ flex: 1, backgroundColor: C.page }}
        contentInsetAdjustmentBehavior="automatic"
      >
        {wishlist.length === 0 ? (
          <View style={{ paddingTop: 80, paddingHorizontal: 32, alignItems: 'center' }}>
            <SymbolView name="heart" tintColor={C.textMuted} size={48} />
            <Text style={{ fontFamily: font.bold, fontSize: 18, color: C.text, marginTop: 14 }}>
              Favori yok
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
              Karakter detayında kalbe basarak favorilere ekle.
            </Text>
          </View>
        ) : (
          <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
            {wishlist.map((w) => {
              const lowestRent =
                [w.listing.rentPrice7d, w.listing.rentPrice14d, w.listing.rentPrice30d]
                  .filter((p: number | null): p is number => p != null)
                  .sort((a, b) => a - b)[0] ?? null;
              return (
                <Pressable
                  key={w.id}
                  onPress={() => {
                    Haptics.selectionAsync();
                    router.push(`/more/market/listing/${w.listing.id}` as any);
                  }}
                  style={{ marginBottom: 10 }}
                >
                  {({ pressed }) => (
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 14,
                        padding: 12,
                        backgroundColor: C.card,
                        borderRadius: 14,
                        opacity: pressed ? 0.92 : 1,
                      }}
                    >
                      <View
                        style={{
                          width: 56,
                          height: 56,
                          borderRadius: 14,
                          backgroundColor: C.well,
                          alignItems: 'center',
                          justifyContent: 'center',
                          overflow: 'hidden',
                        }}
                      >
                        {w.listing.character.avatarUrl ? (
                          <Image
                            source={{ uri: w.listing.character.avatarUrl }}
                            style={{ width: 56, height: 56 }}
                          />
                        ) : (
                          <SymbolView name="person.fill" tintColor={C.textMuted} size={26} />
                        )}
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontFamily: font.bold, fontSize: 16, color: C.text }}>
                          {w.listing.character.name}
                        </Text>
                        {w.listing.character.bio && (
                          <Text
                            numberOfLines={1}
                            style={{
                              fontFamily: font.regular,
                              fontSize: 12,
                              color: C.textMuted,
                              marginTop: 2,
                            }}
                          >
                            {w.listing.character.bio}
                          </Text>
                        )}
                        {lowestRent && (
                          <Text
                            style={{
                              fontFamily: font.semibold,
                              fontSize: 12,
                              color: C.accent,
                              marginTop: 4,
                            }}
                          >
                            {lowestRent} credit'ten
                          </Text>
                        )}
                      </View>
                      <SymbolView name="chevron.right" tintColor={C.textDim} size={13} />
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>
        )}
        <View style={{ height: 60 }} />
      </ScrollView>
    </>
  );
}

/**
 * V4.8 Faz E — Karakter Karşılaştır
 *
 * Wishlist'ten 2-3 karakter seçip yan yana gösterir.
 * Yaş, kategori, DNA, fiyat, puan, yaratıcı tablosu.
 */

import { Stack, useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { SymbolView } from 'expo-symbols';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { C, font } from '../../../lib/theme';
import { useMarketApi } from '../../../lib/marketplace/marketApi';

const CATEGORY_LABEL: Record<string, string> = {
  friend: 'Arkadaş',
  mentor: 'Mentor',
  romantic: 'Romantik',
  family: 'Aile',
  fantasy: 'Hayali',
  professional: 'Profesyonel',
};

export default function CompareScreen() {
  const router = useRouter();
  const api = useMarketApi();
  const apiRef = useRef(api);
  apiRef.current = api;
  const { width } = useWindowDimensions();

  const [wishlist, setWishlist] = useState<any[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
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

  const onToggle = (listingId: string) => {
    Haptics.selectionAsync();
    setSelected((prev) => {
      if (prev.includes(listingId)) return prev.filter((x) => x !== listingId);
      if (prev.length >= 3) return prev;
      return [...prev, listingId];
    });
  };

  const selectedListings = selected
    .map((id) => wishlist.find((w) => w.listing.id === id)?.listing)
    .filter(Boolean);

  if (loading) {
    return (
      <View
        style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.page }}
      >
        <Stack.Screen options={{ title: 'Karşılaştır' }} />
        <ActivityIndicator color={C.accent} />
      </View>
    );
  }

  if (wishlist.length < 2) {
    return (
      <View
        style={{
          flex: 1,
          padding: 32,
          backgroundColor: C.page,
          paddingTop: 80,
          alignItems: 'center',
        }}
      >
        <Stack.Screen options={{ title: 'Karşılaştır' }} />
        <SymbolView name="rectangle.on.rectangle" tintColor={C.textMuted} size={48} />
        <Text style={{ fontFamily: font.bold, fontSize: 18, color: C.text, marginTop: 14 }}>
          Karşılaştırma için en az 2 favori gerek
        </Text>
        <Text
          style={{
            fontFamily: font.regular,
            fontSize: 14,
            color: C.textMuted,
            marginTop: 6,
            textAlign: 'center',
            lineHeight: 20,
          }}
        >
          Markette beğendiğin karakterleri kalp ile favorilere ekle, sonra burada karşılaştır.
        </Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Karşılaştır' }} />
      <ScrollView
        style={{ flex: 1, backgroundColor: C.page }}
        contentInsetAdjustmentBehavior="automatic"
      >
        {/* Selection bar */}
        <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
          <Text
            style={{
              fontFamily: font.semibold,
              fontSize: 13,
              color: C.textMuted,
              letterSpacing: 0.4,
              marginBottom: 8,
            }}
          >
            EN FAZLA 3 SEÇ
          </Text>
          <View style={{ gap: 8 }}>
            {wishlist.map((w) => {
              const isSelected = selected.includes(w.listing.id);
              const limitHit = !isSelected && selected.length >= 3;
              return (
                <Pressable key={w.id} onPress={() => onToggle(w.listing.id)} disabled={limitHit}>
                  {({ pressed }) => (
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 12,
                        padding: 12,
                        borderRadius: 12,
                        backgroundColor: isSelected ? C.accentSoft : C.card,
                        borderWidth: isSelected ? 2 : StyleSheet.hairlineWidth,
                        borderColor: isSelected ? C.accent : C.hairline,
                        opacity: pressed || limitHit ? (limitHit ? 0.4 : 0.85) : 1,
                      }}
                    >
                      <View
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 10,
                          backgroundColor: C.well,
                          alignItems: 'center',
                          justifyContent: 'center',
                          overflow: 'hidden',
                        }}
                      >
                        {w.listing.character.avatarUrl ? (
                          <Image
                            source={{ uri: w.listing.character.avatarUrl }}
                            style={{ width: 36, height: 36 }}
                          />
                        ) : (
                          <SymbolView name="person.fill" tintColor={C.textMuted} size={18} />
                        )}
                      </View>
                      <Text
                        style={{ flex: 1, fontFamily: font.semibold, fontSize: 14, color: C.text }}
                      >
                        {w.listing.character.name}
                      </Text>
                      <SymbolView
                        name={isSelected ? 'checkmark.circle.fill' : 'circle'}
                        tintColor={isSelected ? C.accent : C.textDim}
                        size={20}
                      />
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Karşılaştırma tablosu */}
        {selectedListings.length >= 2 && (
          <View style={{ marginTop: 24, paddingHorizontal: 16 }}>
            <Text style={{ fontFamily: font.bold, fontSize: 18, color: C.text, marginBottom: 12 }}>
              Karşılaştırma
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                {selectedListings.map((l) => (
                  <CompareCard
                    key={l.id}
                    listing={l}
                    cardWidth={(width - 60) / Math.max(selectedListings.length, 2)}
                    onOpen={() => router.push(`/more/market/listing/${l.id}` as any)}
                  />
                ))}
              </View>
            </ScrollView>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </>
  );
}

function CompareCard({
  listing,
  cardWidth,
  onOpen,
}: {
  listing: any;
  cardWidth: number;
  onOpen: () => void;
}) {
  const lowestRent =
    [listing.rentPrice7d, listing.rentPrice14d, listing.rentPrice30d]
      .filter((p: any): p is number => p != null)
      .sort((a: number, b: number) => a - b)[0] ?? null;

  return (
    <Pressable onPress={onOpen}>
      {({ pressed }) => (
        <View
          style={{
            width: Math.max(180, cardWidth),
            backgroundColor: C.card,
            borderRadius: 16,
            padding: 14,
            opacity: pressed ? 0.92 : 1,
          }}
        >
          <View
            style={{
              width: '100%',
              aspectRatio: 1,
              borderRadius: 14,
              backgroundColor: C.well,
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              marginBottom: 12,
            }}
          >
            {listing.character.avatarUrl ? (
              <Image
                source={{ uri: listing.character.avatarUrl }}
                style={{ width: '100%', height: '100%' }}
                contentFit="cover"
              />
            ) : (
              <SymbolView name="person.fill" tintColor={C.textMuted} size={50} />
            )}
          </View>
          <Text numberOfLines={1} style={{ fontFamily: font.bold, fontSize: 16, color: C.text }}>
            {listing.character.name}
          </Text>
          <Text
            style={{ fontFamily: font.regular, fontSize: 12, color: C.textMuted, marginTop: 2 }}
          >
            {listing.character.age} ·{' '}
            {CATEGORY_LABEL[listing.character.category] ?? listing.character.category}
          </Text>

          <View style={{ marginTop: 12, gap: 8 }}>
            <Row label="DNA" value={String(listing.character.dnaScore ?? '—')} />
            <Row
              label="Puan"
              value={listing.averageRating != null ? listing.averageRating.toFixed(1) : '—'}
            />
            <Row label="Kira" value={String(listing.totalRentals)} />
            <Row label="7g" value={listing.rentPrice7d ? `${listing.rentPrice7d}` : '—'} />
            <Row label="30g" value={listing.rentPrice30d ? `${listing.rentPrice30d}` : '—'} />
            <Row label="Satış" value={listing.buyPrice ? `${listing.buyPrice}` : '—'} />
          </View>
        </View>
      )}
    </Pressable>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
      <Text style={{ fontFamily: font.regular, fontSize: 12, color: C.textMuted }}>{label}</Text>
      <Text style={{ fontFamily: font.semibold, fontSize: 13, color: C.text }}>{value}</Text>
    </View>
  );
}

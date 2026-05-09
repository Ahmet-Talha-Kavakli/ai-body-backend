/**
 * V4.8 Faz E — Market Ana Sayfa (Apple App Store "Today" paterni)
 *
 * Yatay kategoriler + birden fazla section:
 *   - Hero (en üstte, ilk öne çıkan)
 *   - Trending (yatay scroll)
 *   - Yeni (yatay scroll)
 *   - Tümü (dikey grid)
 */

import { Stack, useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { SymbolView } from 'expo-symbols';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import SegmentedControl from '@react-native-segmented-control/segmented-control';
import ContextMenu from 'react-native-context-menu-view';
import { C, font } from '../../../lib/theme';
import { useMarketApi, type MarketListing } from '../../../lib/marketplace/marketApi';
import {
  QuickRentSheet,
  type QuickRentSheetRef,
} from '../../../components/marketplace/QuickRentSheet';
import { DiscoverDeck } from '../../../components/marketplace/DiscoverDeck';

const CATEGORIES: { key: string; label: string; icon: string }[] = [
  { key: 'discover', label: 'Keşfet', icon: 'flame.fill' },
  { key: 'all', label: 'Tümü', icon: 'sparkles' },
  { key: 'friend', label: 'Arkadaş', icon: 'person.2.fill' },
  { key: 'mentor', label: 'Mentor', icon: 'graduationcap.fill' },
  { key: 'romantic', label: 'Romantik', icon: 'heart.fill' },
  { key: 'family', label: 'Aile', icon: 'house.fill' },
  { key: 'fantasy', label: 'Hayali', icon: 'wand.and.stars' },
  { key: 'professional', label: 'Profesyonel', icon: 'briefcase.fill' },
];

const BADGE_LABEL: Record<string, { text: string; color: string }> = {
  rising: { text: 'Yükselişte', color: '#FF9F0A' },
  new: { text: 'Yeni', color: '#5E5CE6' },
  loved: { text: 'En Sevilen', color: '#FF3B30' },
  rare: { text: 'Nadir', color: '#0A84FF' },
};

export default function MarketScreen() {
  const router = useRouter();
  const api = useMarketApi();
  const apiRef = useRef(api);
  apiRef.current = api;

  const [listings, setListings] = useState<MarketListing[]>([]);
  const [credits, setCredits] = useState<number | null>(null);
  const [activeCategory, setActiveCategory] = useState('discover');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const searchQuery = '';
  const quickSheetRef = useRef<QuickRentSheetRef>(null);

  const onLongPress = useCallback((l: MarketListing) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    quickSheetRef.current?.open(l);
  }, []);

  const discoverLoadFeed = useCallback(async () => {
    const data = await apiRef.current.discoverFeed(30);
    return data?.feed ?? [];
  }, []);

  const discoverOnSwipe = useCallback(
    async (l: MarketListing, dir: 'left' | 'right' | 'up') => {
      if (dir === 'right') {
        await apiRef.current.toggleWishlist(l.id);
      } else if (dir === 'left') {
        await apiRef.current.passListing(l.id);
      } else if (dir === 'up') {
        router.push(`/more/market/listing/${l.id}` as any);
      }
    },
    [router],
  );

  const discoverOnUndo = useCallback(async (l: MarketListing, dir: 'left' | 'right' | 'up') => {
    if (dir === 'right') {
      await apiRef.current.toggleWishlist(l.id);
    } else if (dir === 'left') {
      await apiRef.current.undoPass(l.id);
    }
  }, []);

  const discoverOnReset = useCallback(async () => {
    await apiRef.current.resetPasses();
  }, []);

  const discoverOnTap = useCallback(
    (l: MarketListing) => router.push(`/more/market/listing/${l.id}` as any),
    [router],
  );

  const refresh = useCallback(async () => {
    const cat =
      activeCategory === 'all' || activeCategory === 'discover' ? undefined : activeCategory;
    const q = searchQuery.trim() || undefined;
    const [data, creditInfo] = await Promise.all([
      apiRef.current.listListings({ category: cat, sort: 'trending', q, limit: 50 }),
      apiRef.current.credits(),
    ]);
    if (data) setListings(data.listings);
    if (creditInfo) setCredits(creditInfo.balance);
    setLoading(false);
    setRefreshing(false);
  }, [activeCategory, searchQuery]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  const onCategoryPress = (key: string) => {
    Haptics.selectionAsync();
    setActiveCategory(key);
    setLoading(true);
  };

  const onListingPress = (listing: MarketListing) => {
    Haptics.selectionAsync();
    router.push(`/more/market/listing/${listing.id}` as any);
  };

  // Sections
  const featured = listings[0]; // hero
  const trending = listings
    .filter((l) => l.trendingBadge === 'loved' || l.trendingBadge === 'rising')
    .slice(0, 8);
  const newOnes = listings.filter((l) => l.trendingBadge === 'new').slice(0, 8);
  const rest = listings.slice(featured ? 1 : 0);

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Market',
          headerLargeTitle: true,
          headerTransparent: false,
          headerStyle: { backgroundColor: C.page } as any,
          headerLargeTitleStyle: { fontFamily: font.extrabold } as any,
          headerRight: () => (
            <View style={{ flexDirection: 'row', gap: 14, alignItems: 'center' }}>
              <Pressable
                onPress={() => {
                  Haptics.selectionAsync();
                  router.push('/more/market/wishlist' as any);
                }}
                hitSlop={12}
              >
                <SymbolView name="heart" tintColor={C.accent} size={20} />
              </Pressable>
              <Pressable
                onPress={() => {
                  Haptics.selectionAsync();
                  router.push('/more/market/rentals' as any);
                }}
                hitSlop={12}
              >
                <SymbolView name="bag" tintColor={C.accent} size={20} />
              </Pressable>
              <Pressable onPress={() => router.push('/more/market/credits' as any)} hitSlop={12}>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 4,
                    backgroundColor: C.accentSoft,
                    paddingHorizontal: 10,
                    paddingVertical: 5,
                    borderRadius: 12,
                  }}
                >
                  <SymbolView name="bolt.fill" tintColor={C.accent} size={11} />
                  <Text style={{ fontFamily: font.bold, fontSize: 13, color: C.accent }}>
                    {credits ?? '—'}
                  </Text>
                </View>
              </Pressable>
            </View>
          ),
        }}
      />

      <ScrollView
        style={{ flex: 1, backgroundColor: C.page }}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ paddingBottom: 60 }}
        keyboardDismissMode="on-drag"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              refresh();
            }}
            tintColor={C.accent}
          />
        }
      >
        <CategoryStrip active={activeCategory} onPress={onCategoryPress} />

        {activeCategory === 'discover' && !searchQuery ? (
          <DiscoverDeck
            loadFeed={discoverLoadFeed}
            onSwipe={discoverOnSwipe}
            onUndo={discoverOnUndo}
            onResetRequested={discoverOnReset}
            onTap={discoverOnTap}
          />
        ) : loading ? (
          <View style={{ paddingTop: 60, alignItems: 'center' }}>
            <ActivityIndicator color={C.accent} />
          </View>
        ) : listings.length === 0 ? (
          <EmptyState category={activeCategory} />
        ) : (
          <>
            {featured && (
              <FeaturedHero
                listing={featured}
                onPress={() => onListingPress(featured)}
                onLongPress={() => onLongPress(featured)}
              />
            )}
            {trending.length > 0 && (
              <HorizontalSection
                title="Trend"
                listings={trending}
                onPressItem={onListingPress}
                onLongPressItem={onLongPress}
              />
            )}
            {newOnes.length > 0 && (
              <HorizontalSection
                title="Yeni Gelenler"
                listings={newOnes}
                onPressItem={onListingPress}
                onLongPressItem={onLongPress}
              />
            )}
            {rest.length > 0 && (
              <View style={{ paddingTop: 8 }}>
                <SectionTitle text="Tümü" />
                {rest.map((l) => (
                  <CompactCard
                    key={l.id}
                    listing={l}
                    onPress={() => onListingPress(l)}
                    onLongPress={() => onLongPress(l)}
                  />
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>

      <QuickRentSheet
        ref={quickSheetRef}
        onOpenDetail={(id) => router.push(`/more/market/listing/${id}` as any)}
        onDemo={(id) => router.push(`/more/market/demo/${id}` as any)}
        onRented={() => refresh()}
      />
    </>
  );
}

// İlk 5 kategori native UISegmentedControl'da, fazlası "Daha" altında native UIMenu'de.
const PRIMARY_CATEGORIES = CATEGORIES.slice(0, 5);
const OVERFLOW_CATEGORIES = CATEGORIES.slice(5);

function CategoryStrip({ active, onPress }: { active: string; onPress: (k: string) => void }) {
  const overflowActive = OVERFLOW_CATEGORIES.find((c) => c.key === active);
  const primaryIndex = overflowActive ? -1 : PRIMARY_CATEGORIES.findIndex((c) => c.key === active);

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 16,
        paddingTop: 10,
        paddingBottom: 6,
      }}
    >
      <View style={{ flex: 1 }}>
        <SegmentedControl
          values={PRIMARY_CATEGORIES.map((c) => c.label)}
          selectedIndex={primaryIndex >= 0 ? primaryIndex : 0}
          onChange={(e) => {
            const idx = e.nativeEvent.selectedSegmentIndex;
            const cat = PRIMARY_CATEGORIES[idx];
            if (cat && cat.key !== active) onPress(cat.key);
          }}
          fontStyle={{ fontFamily: font.semibold, fontSize: 13 }}
          activeFontStyle={{ fontFamily: font.bold, fontSize: 13, color: '#FFFFFF' }}
          tintColor={C.accent}
        />
      </View>
      <ContextMenu
        actions={OVERFLOW_CATEGORIES.map((c) => ({
          title: c.label,
          systemIcon: c.icon,
          state: active === c.key ? ('on' as const) : ('off' as const),
        }))}
        dropdownMenuMode
        onPress={(e) => {
          const cat = OVERFLOW_CATEGORIES[e.nativeEvent.index];
          if (cat) onPress(cat.key);
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
            paddingHorizontal: 12,
            height: 32,
            borderRadius: 8,
            backgroundColor: overflowActive ? C.accent : '#7676801F',
          }}
        >
          <Text
            style={{
              fontFamily: overflowActive ? font.bold : font.semibold,
              fontSize: 13,
              color: overflowActive ? '#FFFFFF' : C.text,
            }}
          >
            {overflowActive ? overflowActive.label : 'Daha'}
          </Text>
          <SymbolView
            name="chevron.down"
            tintColor={overflowActive ? '#FFFFFF' : C.textMuted}
            size={10}
          />
        </View>
      </ContextMenu>
    </View>
  );
}

function SectionTitle({ text }: { text: string }) {
  return (
    <Text
      style={{
        fontFamily: font.bold,
        fontSize: 22,
        color: C.text,
        paddingHorizontal: 20,
        paddingTop: 18,
        paddingBottom: 10,
        letterSpacing: -0.3,
      }}
    >
      {text}
    </Text>
  );
}

function FeaturedHero({
  listing,
  onPress,
  onLongPress,
}: {
  listing: MarketListing;
  onPress: () => void;
  onLongPress?: () => void;
}) {
  const { width } = useWindowDimensions();
  const cardWidth = width - 32;
  const cardHeight = Math.min(440, cardWidth * 1.15);

  const lowestRent =
    [listing.rentPrice7d, listing.rentPrice14d, listing.rentPrice30d]
      .filter((p): p is number => p != null)
      .sort((a, b) => a - b)[0] ?? null;

  const badge = listing.trendingBadge ? BADGE_LABEL[listing.trendingBadge] : null;

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      style={{ marginHorizontal: 16, marginTop: 6 }}
    >
      {({ pressed }) => (
        <View
          style={{
            width: cardWidth,
            height: cardHeight,
            borderRadius: 24,
            overflow: 'hidden',
            backgroundColor: C.accent,
            opacity: pressed ? 0.92 : 1,
          }}
        >
          {/* Hero image — full bleed */}
          {listing.character.avatarUrl ? (
            <Image
              source={{ uri: listing.character.avatarUrl }}
              style={{ width: '100%', height: '100%', position: 'absolute' }}
              contentFit="cover"
            />
          ) : (
            <View
              style={{
                width: '100%',
                height: '100%',
                position: 'absolute',
                backgroundColor: C.accent,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <SymbolView name="person.fill" tintColor="#FFFFFF44" size={120} />
            </View>
          )}

          {/* Gradient overlay (alttan koyu) */}
          <View
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 0,
              height: '60%',
              backgroundColor: '#00000066',
            }}
          />

          {/* Top — badge */}
          {badge && (
            <View
              style={{
                position: 'absolute',
                top: 16,
                left: 16,
                backgroundColor: badge.color,
                paddingHorizontal: 10,
                paddingVertical: 5,
                borderRadius: 10,
              }}
            >
              <Text
                style={{
                  fontFamily: font.bold,
                  fontSize: 11,
                  color: '#FFFFFF',
                  letterSpacing: 0.4,
                }}
              >
                {badge.text.toUpperCase()}
              </Text>
            </View>
          )}

          {listing.isBoosted && (
            <View
              style={{
                position: 'absolute',
                top: 16,
                right: 16,
                backgroundColor: '#FFCC00',
                paddingHorizontal: 10,
                paddingVertical: 5,
                borderRadius: 10,
              }}
            >
              <Text
                style={{
                  fontFamily: font.bold,
                  fontSize: 11,
                  color: '#1C1C1E',
                  letterSpacing: 0.4,
                }}
              >
                ÖNE ÇIKAN
              </Text>
            </View>
          )}

          {/* Bottom — info */}
          <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: 22 }}>
            <Text
              style={{
                fontFamily: font.extrabold,
                fontSize: 32,
                color: '#FFFFFF',
                letterSpacing: -0.5,
              }}
            >
              {listing.character.name}
            </Text>
            <Text
              style={{ fontFamily: font.medium, fontSize: 15, color: '#FFFFFFCC', marginTop: 4 }}
            >
              {listing.character.age}
              {listing.character.hometown ? ` · ${listing.character.hometown}` : ''}
            </Text>
            {listing.character.bio && (
              <Text
                numberOfLines={2}
                style={{
                  fontFamily: font.regular,
                  fontSize: 14,
                  color: '#FFFFFFAA',
                  marginTop: 10,
                  lineHeight: 19,
                }}
              >
                {listing.character.bio}
              </Text>
            )}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 14 }}>
              {listing.averageRating != null && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                  <SymbolView name="star.fill" tintColor="#FFCC00" size={12} />
                  <Text style={{ fontFamily: font.bold, fontSize: 13, color: '#FFFFFF' }}>
                    {listing.averageRating.toFixed(1)}
                  </Text>
                </View>
              )}
              {lowestRent && (
                <View
                  style={{
                    backgroundColor: '#FFFFFF22',
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                    borderRadius: 8,
                  }}
                >
                  <Text style={{ fontFamily: font.semibold, fontSize: 12, color: '#FFFFFF' }}>
                    {lowestRent} credit'ten
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>
      )}
    </Pressable>
  );
}

function HorizontalSection({
  title,
  listings,
  onPressItem,
  onLongPressItem,
}: {
  title: string;
  listings: MarketListing[];
  onPressItem: (l: MarketListing) => void;
  onLongPressItem?: (l: MarketListing) => void;
}) {
  return (
    <View style={{ paddingTop: 4 }}>
      <SectionTitle text={title} />
      <FlatList
        horizontal
        data={listings}
        keyExtractor={(l) => l.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
        renderItem={({ item }) => (
          <PortraitCard
            listing={item}
            onPress={() => onPressItem(item)}
            onLongPress={() => onLongPressItem?.(item)}
          />
        )}
      />
    </View>
  );
}

function PortraitCard({
  listing,
  onPress,
  onLongPress,
}: {
  listing: MarketListing;
  onPress: () => void;
  onLongPress?: () => void;
}) {
  const lowestRent =
    [listing.rentPrice7d, listing.rentPrice14d, listing.rentPrice30d]
      .filter((p): p is number => p != null)
      .sort((a, b) => a - b)[0] ?? null;

  const badge = listing.trendingBadge ? BADGE_LABEL[listing.trendingBadge] : null;

  return (
    <Pressable onPress={onPress} onLongPress={onLongPress}>
      {({ pressed }) => (
        <View
          style={{
            width: 160,
            borderRadius: 18,
            overflow: 'hidden',
            backgroundColor: C.card,
            opacity: pressed ? 0.9 : 1,
          }}
        >
          <View style={{ width: 160, height: 200, backgroundColor: C.well }}>
            {listing.character.avatarUrl ? (
              <Image
                source={{ uri: listing.character.avatarUrl }}
                style={{ width: 160, height: 200 }}
                contentFit="cover"
              />
            ) : (
              <View
                style={{
                  width: 160,
                  height: 200,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <SymbolView name="person.fill" tintColor={C.textMuted} size={50} />
              </View>
            )}
            {badge && (
              <View
                style={{
                  position: 'absolute',
                  top: 8,
                  left: 8,
                  backgroundColor: badge.color,
                  paddingHorizontal: 7,
                  paddingVertical: 3,
                  borderRadius: 6,
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
                  {badge.text.toUpperCase()}
                </Text>
              </View>
            )}
            {listing.isBoosted && (
              <View
                style={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 3,
                  backgroundColor: '#FFCC00',
                  paddingHorizontal: 6,
                  paddingVertical: 3,
                  borderRadius: 6,
                }}
              >
                <SymbolView name="bolt.fill" tintColor="#1C1C1E" size={9} />
                <Text
                  style={{
                    fontFamily: font.bold,
                    fontSize: 9,
                    color: '#1C1C1E',
                    letterSpacing: 0.3,
                  }}
                >
                  BOOST
                </Text>
              </View>
            )}
          </View>
          <View style={{ padding: 12 }}>
            <Text numberOfLines={1} style={{ fontFamily: font.bold, fontSize: 15, color: C.text }}>
              {listing.character.name}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
              {listing.averageRating != null && (
                <>
                  <SymbolView name="star.fill" tintColor="#FFCC00" size={10} />
                  <Text style={{ fontFamily: font.semibold, fontSize: 11, color: C.text }}>
                    {listing.averageRating.toFixed(1)}
                  </Text>
                </>
              )}
              {lowestRent && (
                <Text style={{ fontFamily: font.regular, fontSize: 11, color: C.textMuted }}>
                  · {lowestRent} cr
                </Text>
              )}
            </View>
          </View>
        </View>
      )}
    </Pressable>
  );
}

function CompactCard({
  listing,
  onPress,
  onLongPress,
}: {
  listing: MarketListing;
  onPress: () => void;
  onLongPress?: () => void;
}) {
  const lowestRent =
    [listing.rentPrice7d, listing.rentPrice14d, listing.rentPrice30d]
      .filter((p): p is number => p != null)
      .sort((a, b) => a - b)[0] ?? null;

  const badge = listing.trendingBadge ? BADGE_LABEL[listing.trendingBadge] : null;

  return (
    <Pressable onPress={onPress} onLongPress={onLongPress}>
      {({ pressed }) => (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 16,
            paddingVertical: 12,
            gap: 14,
            backgroundColor: pressed ? C.surface : 'transparent',
          }}
        >
          <View
            style={{
              width: 60,
              height: 60,
              borderRadius: 14,
              backgroundColor: C.well,
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
            }}
          >
            {listing.character.avatarUrl ? (
              <Image
                source={{ uri: listing.character.avatarUrl }}
                style={{ width: 60, height: 60 }}
              />
            ) : (
              <SymbolView name="person.fill" tintColor={C.textMuted} size={26} />
            )}
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text
                numberOfLines={1}
                style={{ fontFamily: font.bold, fontSize: 16, color: C.text, flexShrink: 1 }}
              >
                {listing.character.name}
              </Text>
              {badge && (
                <View
                  style={{
                    backgroundColor: badge.color + '22',
                    paddingHorizontal: 6,
                    paddingVertical: 1,
                    borderRadius: 5,
                  }}
                >
                  <Text
                    style={{
                      fontFamily: font.bold,
                      fontSize: 9,
                      color: badge.color,
                      letterSpacing: 0.3,
                    }}
                  >
                    {badge.text.toUpperCase()}
                  </Text>
                </View>
              )}
              {listing.isBoosted && (
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 3,
                    backgroundColor: '#FFCC00',
                    paddingHorizontal: 6,
                    paddingVertical: 1,
                    borderRadius: 5,
                  }}
                >
                  <SymbolView name="bolt.fill" tintColor="#1C1C1E" size={9} />
                  <Text
                    style={{
                      fontFamily: font.bold,
                      fontSize: 9,
                      color: '#1C1C1E',
                      letterSpacing: 0.3,
                    }}
                  >
                    BOOST
                  </Text>
                </View>
              )}
            </View>
            {listing.character.bio && (
              <Text
                numberOfLines={1}
                style={{ fontFamily: font.regular, fontSize: 13, color: C.textMuted, marginTop: 2 }}
              >
                {listing.character.bio}
              </Text>
            )}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 6 }}>
              {listing.averageRating != null && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                  <SymbolView name="star.fill" tintColor="#FFCC00" size={10} />
                  <Text style={{ fontFamily: font.semibold, fontSize: 11, color: C.text }}>
                    {listing.averageRating.toFixed(1)}
                  </Text>
                </View>
              )}
              <Text style={{ fontFamily: font.regular, fontSize: 11, color: C.textMuted }}>
                {listing.totalRentals} kira
              </Text>
              {lowestRent && (
                <Text style={{ fontFamily: font.semibold, fontSize: 11, color: C.accent }}>
                  {lowestRent} cr
                </Text>
              )}
            </View>
          </View>
          <SymbolView name="chevron.right" tintColor={C.textDim} size={13} />
        </View>
      )}
    </Pressable>
  );
}

function EmptyState({ category }: { category: string }) {
  return (
    <View style={{ paddingTop: 80, paddingHorizontal: 32, alignItems: 'center' }}>
      <View
        style={{
          width: 80,
          height: 80,
          borderRadius: 22,
          backgroundColor: C.surface,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 16,
        }}
      >
        <SymbolView name="sparkles" tintColor={C.textMuted} size={36} />
      </View>
      <Text style={{ fontFamily: font.bold, fontSize: 18, color: C.text, marginBottom: 6 }}>
        Henüz karakter yok
      </Text>
      <Text
        style={{
          fontFamily: font.regular,
          fontSize: 14,
          color: C.textMuted,
          textAlign: 'center',
          lineHeight: 20,
        }}
      >
        {category === 'all'
          ? 'Bu kategoride henüz aktif listing yok. Yakında!'
          : 'Bu kategoride şu an karakter yok. Başka kategori dene.'}
      </Text>
    </View>
  );
}

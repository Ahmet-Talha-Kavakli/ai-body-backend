/**
 * V4.8 Faz E — Keşfet swipe deck
 *
 * Tinder + Bumble karması. Üst kart swipe edilebilir, arkada 2 kart parallax stack.
 * Kartın altında ayrı detay kapsülü (kategori + özellik chipleri).
 * Sağ alt köşede Geri Al (Rewind) butonu.
 *
 * Reanimated worklet'lerle UI thread'de çalışır.
 */

import { useCallback, useEffect, useImperativeHandle, useRef, useState, forwardRef } from 'react';
import { ActivityIndicator, Pressable, Text, View, useWindowDimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Image } from 'expo-image';
import { SymbolView } from 'expo-symbols';
import * as Haptics from 'expo-haptics';
import { C, font } from '../../lib/theme';
import type { MarketListing } from '../../lib/marketplace/marketApi';

const SWIPE_THRESHOLD_RATIO = 0.28;
const SWIPE_OUT_DURATION = 280;
const SWIPE_BACK_DURATION = 240;
const UP_THRESHOLD = -120;
const STACK_SCALE_STEP = 0.06;
const STACK_TRANSLATE_Y = 14;

export type SwipeDirection = 'left' | 'right' | 'up';

export interface DiscoverDeckRef {
  reload: () => void;
}

interface Props {
  loadFeed: () => Promise<MarketListing[]>;
  onSwipe: (listing: MarketListing, dir: SwipeDirection) => void;
  onTap: (listing: MarketListing) => void;
  onUndo?: (listing: MarketListing, dir: SwipeDirection) => void;
  onResetRequested?: () => Promise<void>;
  onEmpty?: () => void;
}

const CATEGORY_LABEL: Record<string, string> = {
  friend: 'Arkadaş',
  mentor: 'Mentor',
  romantic: 'Romantik',
  family: 'Aile',
  fantasy: 'Hayali',
  professional: 'Profesyonel',
};

export const DiscoverDeck = forwardRef<DiscoverDeckRef, Props>(function DiscoverDeck(
  { loadFeed, onSwipe, onTap, onUndo, onResetRequested, onEmpty },
  ref,
) {
  const [stack, setStack] = useState<MarketListing[]>([]);
  const [history, setHistory] = useState<{ listing: MarketListing; dir: SwipeDirection }[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    const items = await loadFeed();
    setStack(items);
    setHistory([]);
    setLoading(false);
    if (items.length === 0) onEmpty?.();
  }, [loadFeed, onEmpty]);

  useImperativeHandle(ref, () => ({ reload }));

  useEffect(() => {
    reload();
  }, [reload]);

  const handleConsumed = useCallback(
    (listing: MarketListing, dir: SwipeDirection) => {
      onSwipe(listing, dir);
      setStack((prev) => {
        const next = prev.slice(1);
        if (next.length === 0) onEmpty?.();
        return next;
      });
      if (dir !== 'up') {
        setHistory((h) => [...h, { listing, dir }]);
      }
    },
    [onSwipe, onEmpty],
  );

  const undo = useCallback(() => {
    setHistory((h) => {
      const last = h[h.length - 1];
      if (!last) return h;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onUndo?.(last.listing, last.dir);
      setStack((prev) => [last.listing, ...prev]);
      return h.slice(0, -1);
    });
  }, [onUndo]);

  if (loading) {
    return (
      <View style={{ paddingTop: 80, alignItems: 'center' }}>
        <ActivityIndicator color={C.accent} />
      </View>
    );
  }

  if (stack.length === 0) {
    return (
      <DeckEmpty
        onReload={async () => {
          if (onResetRequested) await onResetRequested();
          reload();
        }}
      />
    );
  }

  const top = stack[0];
  const visible = stack.slice(0, 3);

  return (
    <View>
      {/* Deck container — sabit yükseklik, parallax stack burada */}
      <DeckSurface>
        {visible
          .map((listing, idx) => (
            <SwipeCard
              key={listing.id}
              listing={listing}
              stackIndex={idx}
              isTop={idx === 0}
              onConsumed={handleConsumed}
              onTap={onTap}
            />
          ))
          .reverse()}
      </DeckSurface>

      {/* Üst karta ait detay kapsülü */}
      {top && <DetailStrip listing={top} />}

      {/* Geri Al butonu */}
      {history.length > 0 && (
        <View style={{ alignItems: 'center', marginTop: 12 }}>
          <Pressable
            onPress={undo}
            hitSlop={10}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              backgroundColor: C.surface,
              paddingHorizontal: 14,
              paddingVertical: 9,
              borderRadius: 18,
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <SymbolView name="arrow.uturn.backward" tintColor={C.accent} size={13} />
            <Text style={{ fontFamily: font.semibold, fontSize: 13, color: C.accent }}>
              Geri al
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
});

function DeckSurface({ children }: { children: React.ReactNode }) {
  const { width: screenW, height: screenH } = useWindowDimensions();
  const cardW = screenW - 32;
  const cardH = Math.min(screenH * 0.54, 520);

  return (
    <View
      style={{
        height: cardH + STACK_TRANSLATE_Y * 2 + 16,
        marginTop: 8,
        alignItems: 'center',
        justifyContent: 'flex-start',
      }}
    >
      <View style={{ width: cardW, height: cardH, alignItems: 'center' }}>{children}</View>
    </View>
  );
}

interface CardProps {
  listing: MarketListing;
  stackIndex: number;
  isTop: boolean;
  onConsumed: (listing: MarketListing, dir: SwipeDirection) => void;
  onTap: (listing: MarketListing) => void;
}

function SwipeCard({ listing, stackIndex, isTop, onConsumed, onTap }: CardProps) {
  const { width: screenW, height: screenH } = useWindowDimensions();
  const cardW = screenW - 32;
  const cardH = Math.min(screenH * 0.54, 520);
  const threshold = screenW * SWIPE_THRESHOLD_RATIO;

  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const thresholdHapticFired = useRef(false);

  const baseScale = 1 - stackIndex * STACK_SCALE_STEP;
  const baseTranslateY = stackIndex * STACK_TRANSLATE_Y;

  const finishSwipe = useCallback(
    (dir: SwipeDirection) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onConsumed(listing, dir);
    },
    [listing, onConsumed],
  );

  const fireThresholdHaptic = useCallback(() => {
    if (!thresholdHapticFired.current) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      thresholdHapticFired.current = true;
    }
  }, []);

  const resetThresholdHaptic = useCallback(() => {
    thresholdHapticFired.current = false;
  }, []);

  const pan = Gesture.Pan()
    .enabled(isTop)
    .onUpdate((e) => {
      x.value = e.translationX;
      y.value = e.translationY;
      const passed = Math.abs(x.value) > threshold * 0.7 || y.value < UP_THRESHOLD * 0.7;
      if (passed) {
        runOnJS(fireThresholdHaptic)();
      } else {
        runOnJS(resetThresholdHaptic)();
      }
    })
    .onEnd((e) => {
      const goRight = x.value > threshold && Math.abs(x.value) > Math.abs(y.value);
      const goLeft = x.value < -threshold && Math.abs(x.value) > Math.abs(y.value);
      const goUp = y.value < UP_THRESHOLD && Math.abs(y.value) > Math.abs(x.value);

      if (goRight) {
        x.value = withTiming(screenW * 1.4, {
          duration: SWIPE_OUT_DURATION,
          easing: Easing.bezier(0.16, 1, 0.3, 1),
        });
        y.value = withTiming(y.value + e.velocityY * 0.1, { duration: SWIPE_OUT_DURATION });
        runOnJS(finishSwipe)('right');
      } else if (goLeft) {
        x.value = withTiming(-screenW * 1.4, {
          duration: SWIPE_OUT_DURATION,
          easing: Easing.bezier(0.16, 1, 0.3, 1),
        });
        y.value = withTiming(y.value + e.velocityY * 0.1, { duration: SWIPE_OUT_DURATION });
        runOnJS(finishSwipe)('left');
      } else if (goUp) {
        y.value = withTiming(-screenH, {
          duration: SWIPE_OUT_DURATION,
          easing: Easing.bezier(0.16, 1, 0.3, 1),
        });
        runOnJS(finishSwipe)('up');
      } else {
        x.value = withTiming(0, {
          duration: SWIPE_BACK_DURATION,
          easing: Easing.bezier(0.4, 0, 0.2, 1),
        });
        y.value = withTiming(0, {
          duration: SWIPE_BACK_DURATION,
          easing: Easing.bezier(0.4, 0, 0.2, 1),
        });
        runOnJS(resetThresholdHaptic)();
      }
    });

  const tap = Gesture.Tap()
    .enabled(isTop)
    .maxDistance(8)
    .onEnd(() => {
      runOnJS(onTap)(listing);
    });

  const composed = Gesture.Exclusive(pan, tap);

  const cardStyle = useAnimatedStyle(() => {
    const rotate = interpolate(x.value, [-screenW, 0, screenW], [-12, 0, 12], Extrapolation.CLAMP);
    return {
      transform: [
        { translateX: x.value },
        { translateY: y.value + baseTranslateY },
        { rotate: `${rotate}deg` },
        { scale: baseScale },
      ],
    };
  });

  const greenBorderStyle = useAnimatedStyle(() => ({
    opacity: interpolate(x.value, [0, threshold], [0, 1], Extrapolation.CLAMP),
  }));
  const redBorderStyle = useAnimatedStyle(() => ({
    opacity: interpolate(x.value, [-threshold, 0], [1, 0], Extrapolation.CLAMP),
  }));
  const blueBorderStyle = useAnimatedStyle(() => ({
    opacity: interpolate(y.value, [UP_THRESHOLD, 0], [1, 0], Extrapolation.CLAMP),
  }));

  const likeOverlayStyle = useAnimatedStyle(() => ({
    opacity: interpolate(x.value, [threshold * 0.4, threshold], [0, 1], Extrapolation.CLAMP),
  }));
  const passOverlayStyle = useAnimatedStyle(() => ({
    opacity: interpolate(x.value, [-threshold, -threshold * 0.4], [1, 0], Extrapolation.CLAMP),
  }));
  const upOverlayStyle = useAnimatedStyle(() => ({
    opacity: interpolate(y.value, [UP_THRESHOLD, UP_THRESHOLD * 0.4], [1, 0], Extrapolation.CLAMP),
  }));

  return (
    <GestureDetector gesture={composed}>
      <Animated.View
        style={[
          {
            position: 'absolute',
            width: cardW,
            height: cardH,
            borderRadius: 28,
            backgroundColor: C.card,
            shadowColor: '#000',
            shadowOpacity: 0.18,
            shadowRadius: 24,
            shadowOffset: { width: 0, height: 10 },
            elevation: 10,
          },
          cardStyle,
        ]}
      >
        {/* Inner clip layer — image + gradient kart yarıçapı içinde */}
        <View
          style={{
            ...({ position: 'absolute' } as const),
            inset: 0,
            borderRadius: 28,
            overflow: 'hidden',
          }}
        >
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
                backgroundColor: C.accent,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <SymbolView name="person.fill" tintColor="#FFFFFF44" size={120} />
            </View>
          )}

          {/* Alt gradient */}
          <View
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 0,
              height: '50%',
              backgroundColor: '#00000088',
            }}
          />

          {/* Bottom info */}
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
          </View>
        </View>

        {/* Renkli kenarlıklar (swipe yönüne göre opacity'leşir) */}
        {isTop && (
          <>
            <Animated.View
              pointerEvents="none"
              style={[
                {
                  position: 'absolute',
                  inset: 0,
                  borderRadius: 28,
                  borderWidth: 4,
                  borderColor: '#30D158',
                },
                greenBorderStyle,
              ]}
            />
            <Animated.View
              pointerEvents="none"
              style={[
                {
                  position: 'absolute',
                  inset: 0,
                  borderRadius: 28,
                  borderWidth: 4,
                  borderColor: '#FF3B30',
                },
                redBorderStyle,
              ]}
            />
            <Animated.View
              pointerEvents="none"
              style={[
                {
                  position: 'absolute',
                  inset: 0,
                  borderRadius: 28,
                  borderWidth: 4,
                  borderColor: '#5E5CE6',
                },
                blueBorderStyle,
              ]}
            />

            {/* Action label rozetleri */}
            <Animated.View
              pointerEvents="none"
              style={[
                {
                  position: 'absolute',
                  top: 28,
                  left: 22,
                  paddingHorizontal: 14,
                  paddingVertical: 7,
                  borderRadius: 12,
                  backgroundColor: '#30D158',
                  transform: [{ rotate: '-10deg' }],
                  shadowColor: '#30D158',
                  shadowOpacity: 0.5,
                  shadowRadius: 12,
                },
                likeOverlayStyle,
              ]}
            >
              <Text
                style={{
                  fontFamily: font.extrabold,
                  fontSize: 18,
                  color: '#FFFFFF',
                  letterSpacing: 1.5,
                }}
              >
                BEĞEN
              </Text>
            </Animated.View>
            <Animated.View
              pointerEvents="none"
              style={[
                {
                  position: 'absolute',
                  top: 28,
                  right: 22,
                  paddingHorizontal: 14,
                  paddingVertical: 7,
                  borderRadius: 12,
                  backgroundColor: '#FF3B30',
                  transform: [{ rotate: '10deg' }],
                  shadowColor: '#FF3B30',
                  shadowOpacity: 0.5,
                  shadowRadius: 12,
                },
                passOverlayStyle,
              ]}
            >
              <Text
                style={{
                  fontFamily: font.extrabold,
                  fontSize: 18,
                  color: '#FFFFFF',
                  letterSpacing: 1.5,
                }}
              >
                PAS
              </Text>
            </Animated.View>
            <Animated.View
              pointerEvents="none"
              style={[
                {
                  position: 'absolute',
                  top: 28,
                  alignSelf: 'center',
                  paddingHorizontal: 14,
                  paddingVertical: 7,
                  borderRadius: 12,
                  backgroundColor: '#5E5CE6',
                  shadowColor: '#5E5CE6',
                  shadowOpacity: 0.5,
                  shadowRadius: 12,
                },
                upOverlayStyle,
              ]}
            >
              <Text
                style={{
                  fontFamily: font.extrabold,
                  fontSize: 16,
                  color: '#FFFFFF',
                  letterSpacing: 1.5,
                }}
              >
                DETAY
              </Text>
            </Animated.View>
          </>
        )}
      </Animated.View>
    </GestureDetector>
  );
}

function DetailStrip({ listing }: { listing: MarketListing }) {
  const lowestRent =
    [listing.rentPrice7d, listing.rentPrice14d, listing.rentPrice30d]
      .filter((p): p is number => p != null)
      .sort((a, b) => a - b)[0] ?? null;

  const categoryLabel = CATEGORY_LABEL[listing.character.category] ?? null;

  return (
    <View
      style={{
        marginHorizontal: 16,
        marginTop: 14,
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 8,
      }}
    >
      {categoryLabel && <Chip icon="sparkles" label={categoryLabel} />}
      {listing.character.bio && (
        <Chip
          icon="quote.bubble.fill"
          label={
            listing.character.bio.length > 40
              ? `${listing.character.bio.slice(0, 40)}…`
              : listing.character.bio
          }
          flex
        />
      )}
      {listing.averageRating != null && (
        <Chip icon="star.fill" label={listing.averageRating.toFixed(1)} accent />
      )}
      {lowestRent && <Chip icon="bolt.fill" label={`${lowestRent} cr`} accent />}
    </View>
  );
}

function Chip({
  icon,
  label,
  accent = false,
  flex = false,
}: {
  icon: string;
  label: string;
  accent?: boolean;
  flex?: boolean;
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        backgroundColor: accent ? C.accentSoft : C.surface,
        paddingHorizontal: 11,
        paddingVertical: 7,
        borderRadius: 12,
        ...(flex ? { flex: 1, minWidth: 0 } : {}),
      }}
    >
      <SymbolView name={icon as any} tintColor={accent ? C.accent : C.textMuted} size={11} />
      <Text
        numberOfLines={1}
        style={{
          fontFamily: font.semibold,
          fontSize: 12,
          color: accent ? C.accent : C.text,
          flexShrink: 1,
        }}
      >
        {label}
      </Text>
    </View>
  );
}

function DeckEmpty({ onReload }: { onReload: () => void }) {
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
        <SymbolView name="checkmark.circle.fill" tintColor={C.accent} size={36} />
      </View>
      <Text style={{ fontFamily: font.bold, fontSize: 20, color: C.text, marginBottom: 6 }}>
        Şimdilik bu kadar
      </Text>
      <Text
        style={{
          fontFamily: font.regular,
          fontSize: 14,
          color: C.textMuted,
          textAlign: 'center',
          lineHeight: 20,
          marginBottom: 20,
        }}
      >
        Tüm karakterleri gördün. Pas'ladıklarını tekrar görmek istersen baştan başlayabilirsin.
      </Text>
      <Pressable
        onPress={onReload}
        style={{
          backgroundColor: C.accent,
          paddingHorizontal: 24,
          paddingVertical: 12,
          borderRadius: 14,
        }}
      >
        <Text style={{ fontFamily: font.semibold, fontSize: 15, color: '#FFFFFF' }}>
          Baştan başla
        </Text>
      </Pressable>
    </View>
  );
}

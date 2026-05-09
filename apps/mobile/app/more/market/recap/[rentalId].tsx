/**
 * V4.8 Faz F — Kira sonrası özet (Spotify Wrapped paterni)
 *
 * Dikey scroll, her stat dramatik büyük rakam + sade görsel + animasyon.
 * Alt'ta native Share API ile paylaş butonu.
 *
 * Kurallar (CLAUDE.md):
 *   - Pressable callback style YOK
 *   - Reanimated ile sayaç + opacity animasyonu (CLAUDE.md easing/duration tablosu)
 *   - Native Share (UIActivityViewController)
 */

import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  Pressable,
  ScrollView,
  Share,
  Text,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { SymbolView } from 'expo-symbols';
import * as Haptics from 'expo-haptics';
import { C, font } from '../../../../lib/theme';
import { useMarketApi } from '../../../../lib/marketplace/marketApi';

const EASE_SMOOTH = Easing.bezier(0.22, 1, 0.36, 1);

type Recap = {
  character: { id: string; name: string; avatarUrl: string | null };
  durationDays: number;
  totalMessages: number;
  userMessages: number;
  characterMessages: number;
  totalWords: number;
  topWords: { word: string; count: number }[];
  quickReplies: number;
  mostActiveDay: { date: string; count: number } | null;
  firstUserMessage: string | null;
  lastUserMessage: string | null;
};

export default function RentalRecapScreen() {
  const { rentalId } = useLocalSearchParams<{ rentalId: string }>();
  const router = useRouter();
  const api = useMarketApi();
  const apiRef = useRef(api);
  apiRef.current = api;

  const [recap, setRecap] = useState<Recap | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!rentalId) return;
      const data = await apiRef.current.getRentalRecap(rentalId);
      setRecap(data);
      setLoading(false);
    })();
  }, [rentalId]);

  const onShare = async () => {
    if (!recap) return;
    Haptics.selectionAsync();
    try {
      await Share.share({
        message: buildShareText(recap),
      });
    } catch {
      // user cancelled
    }
  };

  if (loading) {
    return (
      <View
        style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.page }}
      >
        <Stack.Screen options={{ title: 'Hatıralarınız', headerBackTitle: 'Geri' }} />
        <ActivityIndicator color={C.accent} />
      </View>
    );
  }

  if (!recap) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: C.page,
          paddingHorizontal: 32,
        }}
      >
        <Stack.Screen options={{ title: 'Hatıralarınız', headerBackTitle: 'Geri' }} />
        <SymbolView name="exclamationmark.triangle" tintColor={C.textMuted} size={36} />
        <Text
          style={{
            fontFamily: font.bold,
            fontSize: 17,
            color: C.text,
            marginTop: 12,
            textAlign: 'center',
          }}
        >
          Özet yüklenemedi
        </Text>
      </View>
    );
  }

  const empty = recap.totalMessages === 0;

  return (
    <>
      <Stack.Screen
        options={{
          title: '',
          headerBackTitle: 'Geri',
          headerStyle: { backgroundColor: C.page } as any,
          headerShadowVisible: false,
          headerRight: () => (
            <Pressable onPress={onShare} hitSlop={12}>
              <SymbolView name="square.and.arrow.up" tintColor={C.accent} size={20} />
            </Pressable>
          ),
        }}
      />
      <ScrollView
        style={{ flex: 1, backgroundColor: C.page }}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ paddingBottom: 80 }}
      >
        {/* Hero — karakter avatar + isim */}
        <Hero character={recap.character} durationDays={recap.durationDays} />

        {empty ? (
          <View style={{ paddingHorizontal: 32, paddingTop: 40, alignItems: 'center' }}>
            <Text
              style={{
                fontFamily: font.regular,
                fontSize: 15,
                color: C.textMuted,
                textAlign: 'center',
                lineHeight: 22,
              }}
            >
              Bu süreçte hiç mesajlaşmamışsınız. İleride tekrar kiralarsan kaldığınız yerden devam
              edersiniz.
            </Text>
          </View>
        ) : (
          <>
            <BigStat
              delay={0}
              label="Mesajlaştınız"
              value={recap.totalMessages}
              suffix="kez"
              accent={C.accent}
              icon="bubble.left.and.bubble.right.fill"
            />

            <BigStat
              delay={200}
              label={`${recap.character.name}'in cevabı`}
              value={recap.quickReplies}
              suffix="kez 30sn altında geldi"
              accent="#30D158"
              icon="bolt.fill"
              hideIfZero
            />

            <BigStat
              delay={400}
              label="Yazdığın kelime"
              value={recap.totalWords}
              suffix=""
              accent="#FF9F0A"
              icon="text.alignleft"
            />

            {recap.topWords.length > 0 && <TopWordsBlock topWords={recap.topWords} />}

            {recap.mostActiveDay && (
              <BigStat
                delay={800}
                label="En çok konuştuğun gün"
                value={recap.mostActiveDay.count}
                suffix="mesaj"
                accent="#5E5CE6"
                icon="calendar"
                subtitle={formatDate(recap.mostActiveDay.date)}
              />
            )}

            {recap.firstUserMessage && (
              <QuoteBlock title="İlk yazdığın" quote={recap.firstUserMessage} accent={C.accent} />
            )}

            {recap.lastUserMessage && recap.lastUserMessage !== recap.firstUserMessage && (
              <QuoteBlock title="Son yazdığın" quote={recap.lastUserMessage} accent="#FF3B30" />
            )}

            {/* Outro */}
            <View style={{ paddingHorizontal: 24, paddingTop: 32, paddingBottom: 12 }}>
              <Text
                style={{
                  fontFamily: font.bold,
                  fontSize: 22,
                  color: C.text,
                  textAlign: 'center',
                  letterSpacing: -0.4,
                  lineHeight: 30,
                }}
              >
                {recap.character.name} ile{'\n'}
                {recap.durationDays} gün geçirdin.
              </Text>
              <Text
                style={{
                  fontFamily: font.regular,
                  fontSize: 14,
                  color: C.textMuted,
                  textAlign: 'center',
                  marginTop: 10,
                  lineHeight: 21,
                }}
              >
                Hatıralarınız kapsüllendi. Tekrar kiralarsan kaldığınız yerden devam.
              </Text>
            </View>

            {/* Share CTA */}
            <View style={{ paddingHorizontal: 20, marginTop: 18 }}>
              <Pressable
                onPress={onShare}
                style={{
                  backgroundColor: C.accent,
                  paddingVertical: 16,
                  borderRadius: 14,
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'row',
                  gap: 8,
                  minHeight: 56,
                }}
              >
                <SymbolView name="square.and.arrow.up" tintColor="#FFFFFF" size={16} />
                <Text style={{ fontFamily: font.bold, fontSize: 16, color: '#FFFFFF' }}>
                  Hatıralarını paylaş
                </Text>
              </Pressable>
            </View>
          </>
        )}
      </ScrollView>
    </>
  );
}

function Hero({
  character,
  durationDays,
}: {
  character: Recap['character'];
  durationDays: number;
}) {
  return (
    <View style={{ alignItems: 'center', paddingTop: 8, paddingBottom: 28 }}>
      <View
        style={{
          width: 120,
          height: 120,
          borderRadius: 60,
          backgroundColor: C.surface,
          overflow: 'hidden',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {character.avatarUrl ? (
          <Image
            source={{ uri: character.avatarUrl }}
            style={{ width: 120, height: 120 }}
            contentFit="cover"
          />
        ) : (
          <SymbolView name="person.fill" tintColor={C.textMuted} size={56} />
        )}
      </View>
      <Text
        style={{
          fontFamily: font.semibold,
          fontSize: 12,
          color: C.textMuted,
          letterSpacing: 0.5,
          textTransform: 'uppercase',
          marginTop: 18,
        }}
      >
        Hatıralarınız
      </Text>
      <Text
        style={{
          fontFamily: font.extrabold,
          fontSize: 32,
          color: C.text,
          letterSpacing: -0.6,
          marginTop: 4,
        }}
      >
        {character.name}
      </Text>
      <Text
        style={{
          fontFamily: font.regular,
          fontSize: 14,
          color: C.textMuted,
          marginTop: 4,
        }}
      >
        {durationDays} gün boyunca
      </Text>
    </View>
  );
}

function BigStat({
  delay,
  label,
  value,
  suffix,
  accent,
  icon,
  subtitle,
  hideIfZero,
}: {
  delay: number;
  label: string;
  value: number;
  suffix: string;
  accent: string;
  icon: string;
  subtitle?: string;
  hideIfZero?: boolean;
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;
  const countAnim = useRef(new Animated.Value(0)).current;
  const [shown, setShown] = useState(0);

  useEffect(() => {
    const id = countAnim.addListener(({ value: v }) => setShown(Math.round(v)));
    return () => countAnim.removeListener(id);
  }, [countAnim]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 480,
        delay,
        easing: EASE_SMOOTH,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 480,
        delay,
        easing: EASE_SMOOTH,
        useNativeDriver: true,
      }),
      Animated.timing(countAnim, {
        toValue: value,
        duration: 1100,
        delay: delay + 200,
        easing: EASE_SMOOTH,
        useNativeDriver: false,
      }),
    ]).start();
  }, [delay, value, opacity, translateY, countAnim]);

  if (hideIfZero && value === 0) return null;

  return (
    <Animated.View
      style={{
        paddingHorizontal: 24,
        paddingTop: 32,
        opacity,
        transform: [{ translateY }],
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
        <SymbolView name={icon as any} tintColor={accent} size={14} />
        <Text
          style={{
            fontFamily: font.semibold,
            fontSize: 12,
            color: accent,
            letterSpacing: 0.4,
            textTransform: 'uppercase',
          }}
        >
          {label}
        </Text>
      </View>
      <Text
        style={{
          fontFamily: font.extrabold,
          fontSize: 64,
          color: C.text,
          letterSpacing: -1.5,
          lineHeight: 70,
        }}
      >
        {shown.toLocaleString('tr-TR')}
      </Text>
      {suffix && (
        <Text
          style={{
            fontFamily: font.regular,
            fontSize: 16,
            color: C.textMuted,
            marginTop: 4,
          }}
        >
          {suffix}
        </Text>
      )}
      {subtitle && (
        <Text
          style={{
            fontFamily: font.semibold,
            fontSize: 14,
            color: C.text,
            marginTop: 6,
          }}
        >
          {subtitle}
        </Text>
      )}
    </Animated.View>
  );
}

function TopWordsBlock({ topWords }: { topWords: { word: string; count: number }[] }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 480,
        delay: 600,
        easing: EASE_SMOOTH,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 480,
        delay: 600,
        easing: EASE_SMOOTH,
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacity, translateY]);

  return (
    <Animated.View
      style={{
        paddingHorizontal: 24,
        paddingTop: 32,
        opacity,
        transform: [{ translateY }],
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 }}>
        <SymbolView name="quote.bubble.fill" tintColor="#FF3B30" size={14} />
        <Text
          style={{
            fontFamily: font.semibold,
            fontSize: 12,
            color: '#FF3B30',
            letterSpacing: 0.4,
            textTransform: 'uppercase',
          }}
        >
          En Çok Geçen Kelimelerin
        </Text>
      </View>
      <View style={{ gap: 10 }}>
        {topWords.map((w, idx) => (
          <View key={w.word} style={{ flexDirection: 'row', alignItems: 'baseline', gap: 12 }}>
            <Text
              style={{
                fontFamily: font.extrabold,
                fontSize: 32,
                color: C.textDim,
                width: 36,
              }}
            >
              {idx + 1}
            </Text>
            <Text
              style={{
                fontFamily: font.bold,
                fontSize: 28,
                color: C.text,
                letterSpacing: -0.5,
                flex: 1,
              }}
            >
              {w.word}
            </Text>
            <Text
              style={{
                fontFamily: font.semibold,
                fontSize: 14,
                color: C.textMuted,
              }}
            >
              {w.count}x
            </Text>
          </View>
        ))}
      </View>
    </Animated.View>
  );
}

function QuoteBlock({ title, quote, accent }: { title: string; quote: string; accent: string }) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration: 600,
      delay: 1000,
      easing: EASE_SMOOTH,
      useNativeDriver: true,
    }).start();
  }, [opacity]);

  return (
    <Animated.View style={{ paddingHorizontal: 24, paddingTop: 32, opacity }}>
      <Text
        style={{
          fontFamily: font.semibold,
          fontSize: 12,
          color: accent,
          letterSpacing: 0.4,
          textTransform: 'uppercase',
          marginBottom: 10,
        }}
      >
        {title}
      </Text>
      <View
        style={{
          backgroundColor: C.card,
          borderRadius: 16,
          paddingHorizontal: 18,
          paddingVertical: 16,
          borderLeftWidth: 4,
          borderLeftColor: accent,
        }}
      >
        <Text
          style={{
            fontFamily: font.medium,
            fontSize: 16,
            color: C.text,
            fontStyle: 'italic',
            lineHeight: 24,
          }}
        >
          “{quote}”
        </Text>
      </View>
    </Animated.View>
  );
}

function buildShareText(recap: Recap): string {
  const lines = [
    `${recap.character.name} ile FitAI'da ${recap.durationDays} gün geçirdim.`,
    '',
    `💬 ${recap.totalMessages.toLocaleString('tr-TR')} mesajlaştık`,
  ];
  if (recap.totalWords > 0) {
    lines.push(`✍️ ${recap.totalWords.toLocaleString('tr-TR')} kelime yazdım`);
  }
  if (recap.quickReplies > 0) {
    lines.push(`⚡ ${recap.quickReplies} kez 30 saniye içinde cevap geldi`);
  }
  if (recap.topWords.length > 0) {
    lines.push(`🔁 En çok dediğim: ${recap.topWords.map((w) => w.word).join(', ')}`);
  }
  lines.push('', 'fitai.app');
  return lines.join('\n');
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'long',
    weekday: 'long',
  });
}

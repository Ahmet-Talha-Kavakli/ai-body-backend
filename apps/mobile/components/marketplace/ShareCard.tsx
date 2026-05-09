/**
 * V4.8 Faz E — Karakter Paylaşım Kartı
 *
 * 1080x1920 dikey kart. Avatar + isim + kategori + DNA + "Tanış" CTA.
 * react-native-view-shot ile PNG'ye çevrilir, expo-sharing ile paylaşılır.
 */

import { forwardRef } from 'react';
import { Image } from 'expo-image';
import { Text, View } from 'react-native';
import { SymbolView } from 'expo-symbols';
import { C, font } from '../../lib/theme';

export interface ShareCardData {
  name: string;
  age: number;
  category: string;
  hometown?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
  dnaScore?: number | null;
  averageRating?: number | null;
  ownerHandle?: string | null;
}

const CATEGORY_LABEL: Record<string, string> = {
  friend: 'Arkadaş',
  mentor: 'Mentor',
  romantic: 'Romantik',
  family: 'Aile',
  fantasy: 'Hayali',
  professional: 'Profesyonel',
};

export const ShareCard = forwardRef<View, { data: ShareCardData }>(({ data }, ref) => {
  const cardWidth = 360;
  const cardHeight = 640;
  return (
    <View
      ref={ref}
      collapsable={false}
      style={{
        width: cardWidth,
        height: cardHeight,
        backgroundColor: C.accent,
        borderRadius: 32,
        overflow: 'hidden',
      }}
    >
      {/* Üst — gradient yerine accent + soft overlay */}
      <View style={{ position: 'absolute', inset: 0, backgroundColor: '#5E5CE6' }} />

      {/* Avatar büyük */}
      <View style={{ alignItems: 'center', paddingTop: 60 }}>
        <View
          style={{
            width: 180,
            height: 180,
            borderRadius: 36,
            backgroundColor: '#FFFFFF22',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            borderWidth: 4,
            borderColor: '#FFFFFF44',
          }}
        >
          {data.avatarUrl ? (
            <Image source={{ uri: data.avatarUrl }} style={{ width: 180, height: 180 }} />
          ) : (
            <SymbolView name="person.fill" tintColor="#FFFFFF99" size={80} />
          )}
        </View>

        {/* İsim */}
        <Text
          style={{
            fontFamily: font.extrabold,
            fontSize: 38,
            color: '#FFFFFF',
            marginTop: 24,
            letterSpacing: -0.6,
          }}
        >
          {data.name}
        </Text>

        {/* Meta */}
        <Text
          style={{
            fontFamily: font.medium,
            fontSize: 16,
            color: '#FFFFFFCC',
            marginTop: 6,
          }}
        >
          {data.age} · {CATEGORY_LABEL[data.category] ?? 'Arkadaş'}
          {data.hometown ? ` · ${data.hometown}` : ''}
        </Text>

        {/* Bio */}
        {data.bio && (
          <Text
            numberOfLines={3}
            style={{
              fontFamily: font.regular,
              fontSize: 15,
              color: '#FFFFFFCC',
              marginTop: 18,
              paddingHorizontal: 32,
              textAlign: 'center',
              lineHeight: 21,
            }}
          >
            {data.bio}
          </Text>
        )}
      </View>

      {/* Stats */}
      <View
        style={{
          position: 'absolute',
          bottom: 110,
          left: 24,
          right: 24,
          flexDirection: 'row',
          backgroundColor: '#FFFFFF15',
          borderRadius: 18,
          paddingVertical: 16,
          justifyContent: 'space-around',
        }}
      >
        {data.dnaScore != null && <Stat label="DNA" value={String(data.dnaScore)} />}
        {data.averageRating != null ? (
          <Stat label="Puan" value={data.averageRating.toFixed(1)} />
        ) : (
          <Stat label="Puan" value="—" />
        )}
        {data.ownerHandle && <Stat label="Yaratıcı" value={`@${data.ownerHandle}`} />}
      </View>

      {/* Footer */}
      <View
        style={{
          position: 'absolute',
          bottom: 28,
          left: 0,
          right: 0,
          alignItems: 'center',
        }}
      >
        <Text
          style={{
            fontFamily: font.bold,
            fontSize: 14,
            color: '#FFFFFF',
            letterSpacing: 0.5,
          }}
        >
          FitAI · Karakter Marketi
        </Text>
      </View>
    </View>
  );
});

ShareCard.displayName = 'ShareCard';

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ alignItems: 'center' }}>
      <Text style={{ fontFamily: font.bold, fontSize: 22, color: '#FFFFFF' }}>{value}</Text>
      <Text style={{ fontFamily: font.regular, fontSize: 11, color: '#FFFFFFAA', marginTop: 2 }}>
        {label}
      </Text>
    </View>
  );
}

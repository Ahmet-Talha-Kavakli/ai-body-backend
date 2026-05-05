/**
 * V4 Faz E — Karakter Profili
 *
 * Karakterin avatar + bio + mood + ilişki skorları + aksiyonlar.
 * WhatsApp profili gibi.
 */

import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@clerk/expo';
import { Ionicons } from '@expo/vector-icons';
import { font, C } from '../../../../lib/theme';
import {
  listCharacters,
  type CharacterListItem,
} from '../../../../src/services/assistant/characters';

const MOOD_LABEL: Record<string, string> = {
  calm: 'Sakin',
  energetic: 'Enerjik',
  thoughtful: 'Düşünceli',
  tired: 'Yorgun',
  happy: 'Mutlu',
  sad: 'Üzgün',
  anxious: 'Endişeli',
  angry: 'Kızgın',
};

const STATUS_LABEL: Record<string, string> = {
  active: 'Aktif',
  cold: 'Soğuk',
  silent: 'Sessiz',
  broken: 'Kırgın',
  recovering: 'Toparlanıyor',
};

function ScoreBar({ label, value, max = 100 }: { label: string; value: number; max?: number }) {
  const percent = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <View style={styles.scoreRow}>
      <View style={styles.scoreLabelRow}>
        <Text style={styles.scoreLabel}>{label}</Text>
        <Text style={styles.scoreValue}>
          {Math.round(value)}/{max}
        </Text>
      </View>
      <View style={styles.scoreTrack}>
        <View style={[styles.scoreFill, { width: `${percent}%` }]} />
      </View>
    </View>
  );
}

export default function CharacterProfileScreen() {
  const router = useRouter();
  const { characterId } = useLocalSearchParams<{ characterId: string }>();
  const { getToken } = useAuth();
  const insets = useSafeAreaInsets();
  const [character, setCharacter] = useState<CharacterListItem | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) return;
      const data = await listCharacters(token);
      const found = data.characters.find((c) => c.id === characterId);
      setCharacter(found ?? null);
    } catch (e) {
      console.error('[character-profile] load fail:', e);
    } finally {
      setLoading(false);
    }
  }, [characterId, getToken]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + 60 }]}>
        <ActivityIndicator size="large" color={C.accent} />
      </View>
    );
  }

  if (!character) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + 60 }]}>
        <Text style={styles.notFound}>Karakter bulunamadı.</Text>
      </View>
    );
  }

  const intimacy = character.relationship?.intimacyDepth ?? 0;
  const intimacyLabel =
    intimacy < 0.2 ? 'Yüzeysel' : intimacy < 0.5 ? 'Gelişen' : intimacy < 0.8 ? 'Yakın' : 'Derin';

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={28} color={C.accent} />
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}>
        {/* Avatar */}
        <View style={styles.avatarBlock}>
          <View style={styles.bigAvatar}>
            <Text style={styles.bigAvatarFallback}>{character.name[0]}</Text>
          </View>
          <Text style={styles.bigName}>{character.name}</Text>
          <Text style={styles.bigSubtitle}>
            {character.age} • {character.archetype.replace('_', ' ')}
          </Text>
          {character.currentMood && (
            <View style={styles.moodPill}>
              <Text style={styles.moodPillText}>
                {MOOD_LABEL[character.currentMood] ?? character.currentMood}
              </Text>
            </View>
          )}
        </View>

        {/* Bio */}
        {character.bio && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Hakkında</Text>
            <Text style={styles.bio}>{character.bio}</Text>
          </View>
        )}

        {/* Şu anki durum */}
        {(character.currentActivity || character.currentLocation) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Şu anda</Text>
            {character.currentActivity && (
              <Text style={styles.line}>• Aktivite: {character.currentActivity}</Text>
            )}
            {character.currentLocation && (
              <Text style={styles.line}>• Yer: {character.currentLocation}</Text>
            )}
          </View>
        )}

        {/* İlişki */}
        {character.relationship && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Aramızdaki bağ</Text>
            <Text style={styles.statusLine}>
              Durum:{' '}
              <Text style={{ fontFamily: font.semibold }}>
                {STATUS_LABEL[character.relationship.status] ?? character.relationship.status}
              </Text>
            </Text>
            <Text style={styles.statusLine}>
              Yakınlık: <Text style={{ fontFamily: font.semibold }}>{intimacyLabel}</Text>
            </Text>
            <View style={{ marginTop: 14 }}>
              <ScoreBar label="Güven" value={character.relationship.trustScore} />
              <ScoreBar label="Sevgi" value={character.relationship.loveScore} />
            </View>
          </View>
        )}

        {/* Aksiyonlar */}
        <View style={styles.section}>
          <Pressable
            onPress={() => router.push(`/(app)/characters/${characterId}`)}
            style={styles.actionBtn}
          >
            <Ionicons name="chatbubble-outline" size={20} color={C.accent} />
            <Text style={styles.actionText}>Sohbeti aç</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  topBar: { paddingHorizontal: 12, paddingVertical: 8 },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarBlock: { alignItems: 'center', paddingHorizontal: 20, paddingVertical: 24 },
  bigAvatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: C.accentSofter,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bigAvatarFallback: { fontFamily: font.bold, fontSize: 48, color: C.accent },
  bigName: {
    fontFamily: font.bold,
    fontSize: 26,
    letterSpacing: -0.5,
    color: '#0A0A0A',
    marginTop: 16,
  },
  bigSubtitle: {
    fontFamily: font.regular,
    fontSize: 15,
    color: '#6B7280',
    marginTop: 4,
  },
  moodPill: {
    marginTop: 10,
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: C.accentSofter,
    borderRadius: 16,
  },
  moodPillText: {
    fontFamily: font.medium,
    fontSize: 13,
    color: C.accent,
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  sectionTitle: {
    fontFamily: font.semibold,
    fontSize: 13,
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  bio: { fontFamily: font.regular, fontSize: 15, color: '#374151', lineHeight: 22 },
  line: { fontFamily: font.regular, fontSize: 15, color: '#374151', marginTop: 4 },
  statusLine: { fontFamily: font.regular, fontSize: 15, color: '#374151', marginTop: 4 },
  scoreRow: { marginTop: 12 },
  scoreLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  scoreLabel: { fontFamily: font.medium, fontSize: 14, color: '#374151' },
  scoreValue: { fontFamily: font.regular, fontSize: 13, color: '#9CA3AF' },
  scoreTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#F3F4F6',
    overflow: 'hidden',
  },
  scoreFill: {
    height: '100%',
    backgroundColor: C.accent,
    borderRadius: 3,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 12,
  },
  actionText: { fontFamily: font.medium, fontSize: 16, color: C.accent },
  notFound: { textAlign: 'center', fontFamily: font.regular, color: '#6B7280' },
});

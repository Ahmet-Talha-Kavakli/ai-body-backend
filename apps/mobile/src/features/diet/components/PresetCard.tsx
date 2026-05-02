import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { font, palette as N } from '../../nutrition/theme';
import type { DietPreset } from '../api/types';

const EVIDENCE_LABEL: Record<string, string> = {
  high: 'Kanıtlı',
  medium: 'Orta',
  low: 'Deneysel',
  strong: 'Kanıtlı',
  moderate: 'Orta',
  weak: 'Deneysel',
};

type Props = {
  preset: DietPreset;
  onPress: () => void;
};

export function PresetCard({ preset, onPress }: Props) {
  return (
    <View
      style={{
        backgroundColor: preset.accentColor + '33',
        borderRadius: 16,
        marginHorizontal: 16,
        marginBottom: 10,
        overflow: 'hidden',
      }}
    >
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.card,
          { opacity: pressed ? 0.88 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] },
        ]}
      >
        <View style={[styles.strip, { backgroundColor: preset.accentColor }]} />

        <View style={styles.content}>
          <View style={styles.top}>
            <View style={styles.textBlock}>
              <Text style={styles.name} numberOfLines={1}>
                {preset.name}
              </Text>
              <Text style={styles.tagline} numberOfLines={2}>
                {preset.tagline}
              </Text>
            </View>
            {preset.thumbnailUrl ? (
              <Image
                source={{ uri: preset.thumbnailUrl }}
                style={styles.thumb}
                contentFit="cover"
              />
            ) : (
              <View style={[styles.thumb, { backgroundColor: preset.accentColor + '33' }]} />
            )}
          </View>

          <View style={styles.meta}>
            <View style={[styles.badge, { backgroundColor: preset.accentColor + '22' }]}>
              <Text style={[styles.badgeText, { color: preset.accentColor }]}>
                {preset.defaultDurationDays} gün
              </Text>
            </View>
            <View style={[styles.badge, { backgroundColor: N.bg.well }]}>
              <Text style={styles.badgeText}>
                {EVIDENCE_LABEL[preset.evidenceLevel] ?? preset.evidenceLevel}
              </Text>
            </View>
            {preset.isPremium && (
              <View style={[styles.badge, { backgroundColor: '#FFD70022' }]}>
                <Text style={[styles.badgeText, { color: '#B8860B' }]}>Premium</Text>
              </View>
            )}
          </View>
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 10,
    shadowColor: '#0F172A',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
    overflow: 'hidden',
  },
  strip: { width: 4 },
  content: { flex: 1, padding: 14 },
  top: { flexDirection: 'row', alignItems: 'flex-start' },
  textBlock: { flex: 1, marginRight: 10 },
  name: { fontFamily: font.bold, fontSize: 15, color: N.text.primary, marginBottom: 3 },
  tagline: { fontFamily: font.regular, fontSize: 12, color: N.text.tertiary, lineHeight: 17 },
  thumb: { width: 56, height: 56, borderRadius: 12 },
  meta: { flexDirection: 'row', gap: 6, marginTop: 10, flexWrap: 'wrap' },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  badgeText: { fontFamily: font.semibold, fontSize: 11, color: N.text.secondary },
});

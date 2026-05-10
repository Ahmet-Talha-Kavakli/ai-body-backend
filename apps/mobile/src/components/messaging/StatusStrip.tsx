/**
 * V4.6 M75 — StatusStrip
 *
 * Sohbet listesi üstünde yatay halka strip.
 * - İlk öğe: "Senin status'ün" (+ veya kullanıcının atışı)
 * - Sonra karakter status'leri (görülmemişler önce, görülmüşler sonra)
 * - Halka rengi: görülmedi → accent gradient, görüldü → gri
 *
 * onPressGroup: viewer'ı açar
 * onPressCreate: create sheet
 */

import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { font, C } from '../../../lib/theme';
import type { StatusGroup } from '../../services/assistant/status';

const RING_SIZE = 64;
const RING_BORDER = 2.5;
const AVATAR_SIZE = RING_SIZE - RING_BORDER * 2 - 4;

interface Props {
  groups: StatusGroup[];
  myAvatarUrl?: string | null;
  onPressGroup: (group: StatusGroup) => void;
  onPressCreate: () => void;
}

function Avatar({ uri, fallback, size }: { uri?: string | null; fallback: string; size: number }) {
  if (uri) {
    return (
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          overflow: 'hidden',
          backgroundColor: '#E3E3E8',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <View
          style={{
            width: size,
            height: size,
            backgroundColor: '#E3E3E8',
          }}
        />
        {/* Image overlay */}
        <View style={StyleSheet.absoluteFill}>
          {/* RN Image; expo-image kullanılırsa burada değişir */}
          {/* @ts-ignore */}
          <ImageWrapper uri={uri} size={size} />
        </View>
      </View>
    );
  }
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: '#7C3AED',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ color: '#FFFFFF', fontSize: size * 0.4, fontFamily: font.semibold }}>
        {fallback}
      </Text>
    </View>
  );
}

function ImageWrapper({ uri, size }: { uri: string; size: number }) {
  // RN built-in Image
  const { Image } = require('react-native') as typeof import('react-native');
  return (
    <Image
      source={{ uri }}
      style={{ width: size, height: size, borderRadius: size / 2 }}
      resizeMode="cover"
    />
  );
}

export function StatusStrip({ groups, myAvatarUrl, onPressGroup, onPressCreate }: Props) {
  const myGroup = useMemo(() => groups.find((g) => g.authorType === 'user'), [groups]);
  const otherGroups = useMemo(() => groups.filter((g) => g.authorType !== 'user'), [groups]);

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.scroll}>
      {/* Senin status'ün */}
      <Pressable
        onPress={() => {
          Haptics.selectionAsync();
          if (myGroup) {
            onPressGroup(myGroup);
          } else {
            onPressCreate();
          }
        }}
        onLongPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPressCreate();
        }}
        style={s.cell}
      >
        <View style={s.ringWrap}>
          {myGroup ? (
            <View style={[s.ring, { borderColor: C.accent }]}>
              <Avatar uri={myAvatarUrl} fallback="S" size={AVATAR_SIZE} />
            </View>
          ) : (
            <View style={[s.ring, s.ringDashed]}>
              <Avatar uri={myAvatarUrl} fallback="S" size={AVATAR_SIZE} />
              <View style={s.plusBadge}>
                <Text style={s.plusText}>+</Text>
              </View>
            </View>
          )}
        </View>
        <Text style={s.label} numberOfLines={1}>
          {myGroup ? 'Senin' : 'Ekle'}
        </Text>
      </Pressable>

      {/* Karakter status'leri */}
      {otherGroups.map((g) => (
        <Pressable
          key={`${g.authorType}:${g.authorId}`}
          onPress={() => {
            Haptics.selectionAsync();
            onPressGroup(g);
          }}
          style={s.cell}
        >
          <View style={s.ringWrap}>
            <View
              style={[
                s.ring,
                {
                  borderColor: g.allViewed ? '#C7C7CC' : C.accent,
                  borderWidth: g.allViewed ? 1.5 : RING_BORDER,
                },
              ]}
            >
              <Avatar
                uri={g.authorAvatarUrl}
                fallback={g.authorName[0] || '?'}
                size={AVATAR_SIZE}
              />
            </View>
          </View>
          <Text style={s.label} numberOfLines={1}>
            {g.authorName}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  scroll: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  cell: {
    width: 72,
    alignItems: 'center',
  },
  ringWrap: {
    width: RING_SIZE,
    height: RING_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    borderWidth: RING_BORDER,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  ringDashed: {
    borderColor: '#C7C7CC',
    borderStyle: 'dashed',
    borderWidth: 1.5,
  },
  plusBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: C.accent,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  plusText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: font.bold,
    lineHeight: 16,
  },
  label: {
    marginTop: 6,
    fontSize: 12,
    color: '#3C3C43',
    fontFamily: font.medium,
    maxWidth: 68,
    textAlign: 'center',
  },
});

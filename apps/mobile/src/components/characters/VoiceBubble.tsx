/**
 * V4.5 Madde 3 — Sesli mesaj baloncuğu (WhatsApp tarzı)
 *
 * ChatBubble container'ı içinde render edilir; kendisi sadece içerik
 * (play btn + waveform + süre). Bubble arka planını parent verir.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, Pressable, Animated, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { playAudio, stopPlayback, setPlaybackRate } from '../../services/assistant/voice';

interface Props {
  audioUrl: string;
  durationMs: number;
  isSelf: boolean;
  accentColor: string; // dolu bar + (Mia tarafında) play btn arkaplan
  inactiveColor: string; // boş bar
  iconColor: string; // play/pause ikon rengi
  playBtnBg: string; // play butonu arka planı
}

const BAR_COUNT = 22;

function generateWavePattern(seed: string): number[] {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const out: number[] = [];
  for (let i = 0; i < BAR_COUNT; i++) {
    h = (h * 1664525 + 1013904223) >>> 0;
    const v = (h % 100) / 100;
    const center = 1 - Math.abs(i - BAR_COUNT / 2) / (BAR_COUNT / 2);
    out.push(0.3 + v * 0.45 + center * 0.25);
  }
  return out;
}

function formatDuration(ms: number): string {
  const total = Math.max(1, Math.round(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export const VoiceBubble: React.FC<Props> = ({
  audioUrl,
  durationMs,
  isSelf,
  accentColor,
  inactiveColor,
  iconColor,
  playBtnBg,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [rate, setRate] = useState<1 | 1.5 | 2>(1);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const wavePattern = useMemo(() => generateWavePattern(audioUrl), [audioUrl]);

  const cycleRate = () => {
    const next: 1 | 1.5 | 2 = rate === 1 ? 1.5 : rate === 1.5 ? 2 : 1;
    setRate(next);
    if (isPlaying) setPlaybackRate(next);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  };

  useEffect(() => {
    return () => {
      stopPlayback().catch(() => {});
    };
  }, []);

  useEffect(() => {
    if (!isPlaying) return;
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: durationMs / rate,
      useNativeDriver: false,
    }).start();
    const id = progressAnim.addListener(({ value }) => setProgress(value));
    return () => {
      progressAnim.removeListener(id);
    };
  }, [isPlaying, durationMs, progressAnim, rate]);

  const togglePlay = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    if (isPlaying) {
      await stopPlayback();
      setIsPlaying(false);
      progressAnim.stopAnimation();
      progressAnim.setValue(0);
      setProgress(0);
      return;
    }
    setIsPlaying(true);
    progressAnim.setValue(0);
    await playAudio(audioUrl, () => {
      setIsPlaying(false);
      progressAnim.setValue(0);
      setProgress(0);
    });
  };

  return (
    <View style={styles.container}>
      <Pressable
        onPress={togglePlay}
        style={{
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: playBtnBg,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons
          name={isPlaying ? 'pause' : 'play'}
          size={16}
          color={iconColor}
          style={isPlaying ? undefined : { marginLeft: 2 }}
        />
      </Pressable>

      <View style={styles.waveform}>
        {wavePattern.map((h, i) => {
          const filled = progress >= (i + 1) / BAR_COUNT;
          return (
            <View
              key={i}
              style={{
                width: 2.5,
                height: 6 + h * 22,
                borderRadius: 1.5,
                backgroundColor: filled ? accentColor : inactiveColor,
              }}
            />
          );
        })}
      </View>

      {/* V4.6 M71 — Hız butonu */}
      <Pressable
        onPress={cycleRate}
        style={{
          paddingHorizontal: 6,
          paddingVertical: 2,
          borderRadius: 8,
          backgroundColor: isSelf ? 'rgba(255,255,255,0.18)' : '#F3F4F6',
          minWidth: 30,
          alignItems: 'center',
        }}
        hitSlop={6}
      >
        <Text
          style={{
            fontSize: 11,
            fontFamily: 'Sora_600SemiBold',
            color: isSelf ? '#FFFFFF' : '#666',
          }}
        >
          {rate}x
        </Text>
      </Pressable>

      <Text style={[styles.duration, { color: isSelf ? 'rgba(255,255,255,0.85)' : '#999' }]}>
        {formatDuration(durationMs)}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    minWidth: 240,
    maxWidth: 280,
    gap: 8,
  },
  waveform: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 30,
    overflow: 'hidden',
  },
  duration: {
    fontSize: 11,
    fontFamily: 'Sora_500Medium',
    minWidth: 28,
    textAlign: 'right',
  },
});

export default VoiceBubble;

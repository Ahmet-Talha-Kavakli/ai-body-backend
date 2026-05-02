import { useRef } from 'react';
import { Animated, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { SymbolView } from 'expo-symbols';
import { font, SLEEP } from './theme';
import { SLEEP_MUSIC, SLEEP_TIMER_OPTIONS, SleepMusicTrack } from './sleepMusicLibrary';

export interface MusicConfig {
  trackId: string | null;
  timerMinutes: number; // 0 = kapalı, -1 = sabaha kadar
}

export default function MusicPicker({
  value,
  onChange,
  onPreview,
  previewingId,
}: {
  value: MusicConfig;
  onChange: (next: MusicConfig) => void;
  onPreview?: (trackId: string | null) => void;
  previewingId?: string | null;
}) {
  const handleSelect = (track: SleepMusicTrack) => {
    Haptics.selectionAsync();
    if (value.trackId === track.id) {
      onChange({ ...value, trackId: null });
      onPreview?.(null);
    } else {
      onChange({ ...value, trackId: track.id });
      onPreview?.(track.id);
    }
  };

  const handleTimer = (minutes: number) => {
    Haptics.selectionAsync();
    onChange({ ...value, timerMinutes: minutes });
  };

  return (
    <View style={st.root}>
      <View style={st.header}>
        <Text style={st.title}>Uyku Müziği</Text>
        <Text style={st.sub}>Bir ses seç, opsiyonel</Text>
      </View>

      <FlatList
        data={SLEEP_MUSIC}
        keyExtractor={(t) => t.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={st.list}
        renderItem={({ item }) => (
          <TrackCard
            track={item}
            selected={value.trackId === item.id}
            previewing={previewingId === item.id}
            onPress={() => handleSelect(item)}
          />
        )}
      />

      {/* Sleep Timer */}
      <View style={st.timerWrap}>
        <Text style={st.timerLabel}>Otomatik kapan</Text>
        <View style={st.timerRow}>
          {SLEEP_TIMER_OPTIONS.map((opt) => {
            const active = value.timerMinutes === opt.minutes;
            return (
              <Pressable
                key={opt.minutes}
                onPress={() => handleTimer(opt.minutes)}
                style={{
                  paddingVertical: 8,
                  paddingHorizontal: 14,
                  borderRadius: 11,
                  backgroundColor: active ? SLEEP.accent : '#F2F2F7',
                  marginRight: 8,
                  marginBottom: 8,
                }}
              >
                <Text
                  style={{
                    fontFamily: font.semibold,
                    fontSize: 13,
                    color: active ? '#fff' : SLEEP.textMuted,
                    letterSpacing: -0.1,
                  }}
                >
                  {opt.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

function TrackCard({
  track,
  selected,
  previewing,
  onPress,
}: {
  track: SleepMusicTrack;
  selected: boolean;
  previewing: boolean;
  onPress: () => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  return (
    <Pressable
      onPressIn={() =>
        Animated.spring(scale, {
          toValue: 0.94,
          useNativeDriver: true,
          tension: 400,
          friction: 14,
        }).start()
      }
      onPressOut={() =>
        Animated.spring(scale, {
          toValue: 1,
          useNativeDriver: true,
          tension: 300,
          friction: 12,
        }).start()
      }
      onPress={onPress}
      style={{ marginRight: 12 }}
    >
      <Animated.View
        style={[
          tc.card,
          {
            transform: [{ scale }],
            backgroundColor: selected ? SLEEP.accent : SLEEP.card,
            borderColor: selected ? SLEEP.accent : SLEEP.border,
          },
        ]}
      >
        <View
          style={[
            tc.emojiWrap,
            { backgroundColor: selected ? 'rgba(255,255,255,0.18)' : SLEEP.accentSoft },
          ]}
        >
          <Text style={{ fontSize: 28 }}>{track.emoji}</Text>
          {previewing && (
            <View style={tc.playingDot}>
              <SymbolView
                name="waveform"
                size={11}
                tintColor="#fff"
                fallback={<Text style={{ color: '#fff', fontSize: 10 }}>♪</Text>}
              />
            </View>
          )}
        </View>
        <Text style={[tc.name, { color: selected ? '#fff' : SLEEP.text }]} numberOfLines={1}>
          {track.name}
        </Text>
        <Text
          style={[tc.desc, { color: selected ? 'rgba(255,255,255,0.78)' : SLEEP.textDim }]}
          numberOfLines={1}
        >
          {track.description}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

const st = StyleSheet.create({
  root: {
    backgroundColor: SLEEP.card,
    borderRadius: 20,
    paddingVertical: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
  },
  header: { paddingHorizontal: 20, marginBottom: 14 },
  title: { fontFamily: font.bold, fontSize: 18, color: SLEEP.text, letterSpacing: -0.3 },
  sub: { fontFamily: font.regular, fontSize: 13, color: SLEEP.textMuted, marginTop: 4 },
  list: { paddingHorizontal: 20, paddingBottom: 6 },
  timerWrap: {
    paddingHorizontal: 20,
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: SLEEP.border,
  },
  timerLabel: { fontFamily: font.semibold, fontSize: 13, color: SLEEP.textMuted, marginBottom: 10 },
  timerRow: { flexDirection: 'row', flexWrap: 'wrap' },
});

const tc = StyleSheet.create({
  card: { width: 130, padding: 14, borderRadius: 18, borderWidth: 1.5 },
  emojiWrap: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  playingDot: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: SLEEP.accentDark,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: SLEEP.card,
  },
  name: { fontFamily: font.bold, fontSize: 14, letterSpacing: -0.2 },
  desc: { fontFamily: font.regular, fontSize: 11, marginTop: 2 },
});

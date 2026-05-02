import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAudioPlayer } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import { SymbolView } from 'expo-symbols';
import { font, SLEEP } from '../_components/theme';
import { useSleepFonts } from '../_components/useSleepFonts';
import {
  Sound,
  SOUND_CATEGORIES,
  SOUNDS,
  SLEEP_TIMER_OPTIONS_SOUNDS,
} from '../_components/soundLibrary';

type CategoryKey = (typeof SOUND_CATEGORIES)[number]['key'];

export default function SeslerScreen() {
  const fontsLoaded = useSleepFonts();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [activeCategory, setActiveCategory] = useState<CategoryKey>('all');
  const [currentSound, setCurrentSound] = useState<Sound | null>(null);
  const [timerMin, setTimerMin] = useState<number>(0);
  const [showTimerSheet, setShowTimerSheet] = useState(false);

  const player = useAudioPlayer(currentSound ? { uri: currentSound.uri } : null);
  const stopTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Player setup — currentSound değişince başlat
  useEffect(() => {
    if (!currentSound || !player) return;
    try {
      player.loop = true;
      player.volume = 0.7;
      player.play();
    } catch {}

    // Sleep timer
    if (timerMin > 0 && stopTimerRef.current === null) {
      stopTimerRef.current = setTimeout(() => {
        try {
          player.pause();
        } catch {}
        setCurrentSound(null);
        stopTimerRef.current = null;
      }, timerMin * 60_000);
    }

    return () => {
      try {
        player.pause();
      } catch {}
      if (stopTimerRef.current) {
        clearTimeout(stopTimerRef.current);
        stopTimerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSound?.id]);

  const filtered = useMemo(() => {
    if (activeCategory === 'all') return SOUNDS;
    return SOUNDS.filter((s) => s.category === activeCategory);
  }, [activeCategory]);

  const togglePlay = (sound: Sound) => {
    Haptics.selectionAsync();
    if (currentSound?.id === sound.id) {
      // aynı ses → durdur
      setCurrentSound(null);
    } else {
      setCurrentSound(sound);
    }
  };

  const handleTimerPick = (min: number) => {
    Haptics.selectionAsync();
    setTimerMin(min);
    setShowTimerSheet(false);
    if (stopTimerRef.current) {
      clearTimeout(stopTimerRef.current);
      stopTimerRef.current = null;
    }
    if (currentSound && min > 0 && player) {
      stopTimerRef.current = setTimeout(() => {
        try {
          player.pause();
        } catch {}
        setCurrentSound(null);
        stopTimerRef.current = null;
      }, min * 60_000);
    }
  };

  if (!fontsLoaded) return <View style={st.root} />;

  return (
    <View style={[st.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={st.header}>
        <Pressable onPress={() => router.back()} hitSlop={14} style={st.backBtn}>
          <SymbolView
            name="chevron.left"
            size={20}
            tintColor={SLEEP.text}
            fallback={<Text>‹</Text>}
          />
        </Pressable>
        <Text style={st.headerTitle}>Sesler</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Kategori chip'leri */}
      <View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={st.chipsRow}
        >
          {SOUND_CATEGORIES.map((cat) => {
            const active = activeCategory === cat.key;
            return (
              <Pressable
                key={cat.key}
                onPress={() => {
                  Haptics.selectionAsync();
                  setActiveCategory(cat.key);
                }}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  paddingHorizontal: 14,
                  paddingVertical: 9,
                  borderRadius: 14,
                  backgroundColor: active ? SLEEP.accent : SLEEP.card,
                  marginRight: 8,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: active ? 0.15 : 0.04,
                  shadowRadius: 6,
                }}
              >
                <Text style={{ fontSize: 14 }}>{cat.emoji}</Text>
                <Text
                  style={{
                    fontFamily: font.semibold,
                    fontSize: 13,
                    color: active ? '#fff' : SLEEP.text,
                    letterSpacing: -0.1,
                  }}
                >
                  {cat.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Sound grid */}
      <FlatList
        data={filtered}
        keyExtractor={(s) => s.id}
        numColumns={2}
        contentContainerStyle={[
          st.grid,
          { paddingBottom: currentSound ? 120 : insets.bottom + 24 },
        ]}
        columnWrapperStyle={{ gap: 12 }}
        renderItem={({ item }) => (
          <SoundCard
            sound={item}
            playing={currentSound?.id === item.id}
            onPress={() => togglePlay(item)}
          />
        )}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        showsVerticalScrollIndicator={false}
      />

      {/* Mini player (alt sticky) */}
      {currentSound && (
        <MiniPlayer
          sound={currentSound}
          timerMin={timerMin}
          onStop={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setCurrentSound(null);
          }}
          onTimer={() => setShowTimerSheet(true)}
          insets={insets}
        />
      )}

      {/* Sleep timer sheet */}
      {showTimerSheet && (
        <Pressable style={st.backdrop} onPress={() => setShowTimerSheet(false)}>
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={[st.sheet, { paddingBottom: insets.bottom + 20 }]}
          >
            <View style={st.sheetHandle} />
            <Text style={st.sheetTitle}>Otomatik Kapan</Text>
            <Text style={st.sheetSub}>Belirlenen sürenin sonunda ses durur</Text>
            <View style={{ marginTop: 16 }}>
              {SLEEP_TIMER_OPTIONS_SOUNDS.map((opt) => {
                const active = timerMin === opt.minutes;
                return (
                  <Pressable
                    key={opt.minutes}
                    onPress={() => handleTimerPick(opt.minutes)}
                    style={{
                      paddingVertical: 16,
                      paddingHorizontal: 16,
                      borderRadius: 14,
                      backgroundColor: active ? SLEEP.accentSoft : 'transparent',
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 12,
                    }}
                  >
                    <View
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: 11,
                        borderWidth: 2,
                        borderColor: active ? SLEEP.accent : SLEEP.border,
                        backgroundColor: active ? SLEEP.accent : 'transparent',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {active && (
                        <SymbolView
                          name="checkmark"
                          size={12}
                          tintColor="#fff"
                          fallback={<Text style={{ color: '#fff', fontSize: 10 }}>✓</Text>}
                        />
                      )}
                    </View>
                    <Text
                      style={{
                        fontFamily: font.semibold,
                        fontSize: 16,
                        color: active ? SLEEP.accent : SLEEP.text,
                      }}
                    >
                      {opt.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </Pressable>
        </Pressable>
      )}
    </View>
  );
}

function SoundCard({
  sound,
  playing,
  onPress,
}: {
  sound: Sound;
  playing: boolean;
  onPress: () => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const ringPulse = useRef(new Animated.Value(0)).current;

  // Çalan kart için pulse halkası
  useEffect(() => {
    if (playing) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(ringPulse, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
            easing: Easing.bezier(0.22, 1, 0.36, 1),
          }),
          Animated.timing(ringPulse, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
      );
      loop.start();
      return () => loop.stop();
    }
    ringPulse.setValue(0);
    return undefined;
  }, [playing]);

  return (
    <Pressable
      onPressIn={() =>
        Animated.spring(scale, {
          toValue: 0.95,
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
      style={cardSt.pressable}
    >
      <Animated.View
        style={[
          cardSt.card,
          {
            transform: [{ scale }],
            backgroundColor: playing ? SLEEP.accent : SLEEP.card,
          },
        ]}
      >
        {/* Pulse halkası — yalnız çalanda */}
        {playing && (
          <Animated.View
            pointerEvents="none"
            style={[
              cardSt.pulseRing,
              {
                opacity: ringPulse.interpolate({ inputRange: [0, 1], outputRange: [0.6, 0] }),
                transform: [
                  {
                    scale: ringPulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.45] }),
                  },
                ],
              },
            ]}
          />
        )}

        <View
          style={[
            cardSt.emojiBg,
            { backgroundColor: playing ? 'rgba(255,255,255,0.18)' : SLEEP.accentSoft },
          ]}
        >
          <Text style={{ fontSize: 32 }}>{sound.emoji}</Text>
          {playing && (
            <View style={cardSt.playingDot}>
              <SymbolView
                name="waveform"
                size={11}
                tintColor="#fff"
                fallback={<Text style={{ color: '#fff', fontSize: 10 }}>♪</Text>}
              />
            </View>
          )}
        </View>

        <Text style={[cardSt.name, { color: playing ? '#fff' : SLEEP.text }]} numberOfLines={1}>
          {sound.name}
        </Text>
        <Text
          style={[cardSt.desc, { color: playing ? 'rgba(255,255,255,0.78)' : SLEEP.textDim }]}
          numberOfLines={1}
        >
          {sound.description}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

function MiniPlayer({
  sound,
  timerMin,
  onStop,
  onTimer,
  insets,
}: {
  sound: Sound;
  timerMin: number;
  onStop: () => void;
  onTimer: () => void;
  insets: { bottom: number };
}) {
  const slideY = useRef(new Animated.Value(80)).current;

  useEffect(() => {
    Animated.timing(slideY, {
      toValue: 0,
      duration: 380,
      useNativeDriver: true,
      easing: Easing.bezier(0.16, 1, 0.3, 1),
    }).start();
  }, []);

  const timerLabel =
    SLEEP_TIMER_OPTIONS_SOUNDS.find((o) => o.minutes === timerMin)?.label ?? 'Kapalı';

  return (
    <Animated.View
      style={[
        playerSt.wrap,
        {
          paddingBottom: insets.bottom + 12,
          transform: [{ translateY: slideY }],
        },
      ]}
    >
      <View style={playerSt.row}>
        <View style={playerSt.emojiWrap}>
          <Text style={{ fontSize: 24 }}>{sound.emoji}</Text>
        </View>

        <View style={{ flex: 1 }}>
          <Text style={playerSt.name} numberOfLines={1}>
            {sound.name}
          </Text>
          <Text style={playerSt.sub} numberOfLines={1}>
            {timerMin > 0 ? `Otomatik kapan: ${timerLabel}` : 'Çalıyor'}
          </Text>
        </View>

        <Pressable onPress={onTimer} hitSlop={10} style={playerSt.iconBtn}>
          <SymbolView name="timer" size={20} tintColor={SLEEP.accent} fallback={<Text>⏱</Text>} />
        </Pressable>
        <Pressable
          onPress={onStop}
          hitSlop={10}
          style={[playerSt.iconBtn, { backgroundColor: SLEEP.accent }]}
        >
          <SymbolView
            name="stop.fill"
            size={16}
            tintColor="#fff"
            fallback={<Text style={{ color: '#fff' }}>■</Text>}
          />
        </Pressable>
      </View>
    </Animated.View>
  );
}

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: SLEEP.page },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
    gap: 8,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: {
    flex: 1,
    fontFamily: font.bold,
    fontSize: 17,
    color: SLEEP.text,
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  chipsRow: { paddingHorizontal: 18, paddingVertical: 8 },
  grid: { paddingHorizontal: 18, paddingTop: 8 },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: SLEEP.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: SLEEP.border,
    alignSelf: 'center',
    marginBottom: 14,
  },
  sheetTitle: { fontFamily: font.bold, fontSize: 18, color: SLEEP.text, letterSpacing: -0.3 },
  sheetSub: { fontFamily: font.regular, fontSize: 13, color: SLEEP.textMuted, marginTop: 4 },
});

const cardSt = StyleSheet.create({
  pressable: { flex: 1 },
  card: {
    flex: 1,
    padding: 14,
    borderRadius: 18,
    minHeight: 150,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    overflow: 'visible',
  },
  pulseRing: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: SLEEP.accent,
  },
  emojiBg: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
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
  name: { fontFamily: font.bold, fontSize: 15, letterSpacing: -0.2 },
  desc: { fontFamily: font.regular, fontSize: 12, marginTop: 2 },
});

const playerSt = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 0,
    backgroundColor: SLEEP.card,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    marginBottom: 8,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  emojiWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: SLEEP.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: { fontFamily: font.bold, fontSize: 14, color: SLEEP.text, letterSpacing: -0.2 },
  sub: { fontFamily: font.regular, fontSize: 11, color: SLEEP.textMuted, marginTop: 2 },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: SLEEP.accentSoft,
  },
});

import { useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { SymbolView } from 'expo-symbols';
import { useEffect } from 'react';
import { font, SLEEP } from './theme';
import NextButton from './NextButton';
import { AlarmConfig } from './AlarmPicker';
import { MusicConfig } from './MusicPicker';
import { SLEEP_MUSIC, SLEEP_TIMER_OPTIONS } from './sleepMusicLibrary';

export default function SummaryStep({
  alarm,
  music,
  wearableConnected,
  onStart,
}: {
  alarm: AlarmConfig;
  music: MusicConfig;
  wearableConnected: boolean;
  onStart: () => void;
}) {
  const fadeIn = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeIn, {
      toValue: 1,
      duration: 480,
      useNativeDriver: true,
      easing: Easing.bezier(0.16, 1, 0.3, 1),
    }).start();
  }, []);

  const selectedTrack = SLEEP_MUSIC.find((t) => t.id === music.trackId) ?? null;
  const timerLabel =
    SLEEP_TIMER_OPTIONS.find((o) => o.minutes === music.timerMinutes)?.label ?? 'Kapalı';

  const sleepDuration = (() => {
    if (!alarm.enabled || !alarm.time) return null;
    const now = new Date();
    const target = new Date();
    target.setHours(alarm.time.getHours(), alarm.time.getMinutes(), 0, 0);
    if (target <= now) target.setDate(target.getDate() + 1);
    const ms = target.getTime() - now.getTime();
    const h = Math.floor(ms / 3_600_000);
    const m = Math.round((ms % 3_600_000) / 60_000);
    return { h, m, target };
  })();

  return (
    <Animated.View
      style={{
        paddingHorizontal: 22,
        paddingTop: 4,
        opacity: fadeIn,
        transform: [
          { translateY: fadeIn.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) },
        ],
      }}
    >
      <View style={st.iconHero}>
        <SymbolView
          name="moon.stars.fill"
          size={48}
          tintColor={SLEEP.accent}
          fallback={<Text style={{ fontSize: 40 }}>🌙</Text>}
        />
      </View>

      <Text style={st.title}>Hazırsın</Text>
      <Text style={st.sub}>
        {sleepDuration
          ? `${sleepDuration.h} saat ${sleepDuration.m} dakika sonra seni uyandıracağım.`
          : 'Telefonunu yatağının yanına bırak ve uyumaya başla.'}
      </Text>

      <View style={st.card}>
        <Row
          icon="alarm.fill"
          label="Alarm"
          value={
            alarm.enabled && alarm.time
              ? `${pad(alarm.time.getHours())}:${pad(alarm.time.getMinutes())}${alarm.smartAlarm ? '  •  Akıllı' : ''}`
              : 'Kapalı'
          }
        />
        <Divider />
        <Row
          icon="music.note"
          label="Müzik"
          value={
            selectedTrack
              ? `${selectedTrack.emoji}  ${selectedTrack.name}  •  ${timerLabel}`
              : 'Yok'
          }
        />
        <Divider />
        <Row
          icon="applewatch"
          label="Akıllı Saat"
          value={wearableConnected ? 'Apple Watch  •  Bağlı' : 'Bağlı değil'}
          muted={!wearableConnected}
        />
      </View>

      <View style={st.tipRow}>
        <SymbolView
          name="lightbulb.fill"
          size={14}
          tintColor={SLEEP.warn}
          fallback={<Text>💡</Text>}
        />
        <Text style={st.tipTxt}>
          Başlamadan önce nabzını ölçeceğim. Parmağını arka kameraya 20 saniye tut.
        </Text>
      </View>

      <View style={{ height: 24 }} />

      <NextButton label="Nabzı Ölç ve Uykuya Başla" onPress={onStart} icon="moon.fill" />
    </Animated.View>
  );
}

function Row({
  icon,
  label,
  value,
  muted,
}: {
  icon: string;
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <View style={rs.row}>
      <View style={rs.iconWrap}>
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <SymbolView
          name={icon as any}
          size={18}
          tintColor={muted ? SLEEP.textDim : SLEEP.accent}
          fallback={<Text>•</Text>}
        />
      </View>
      <Text style={rs.label}>{label}</Text>
      <Text style={[rs.value, muted && { color: SLEEP.textDim }]} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

function Divider() {
  return (
    <View
      style={{
        height: StyleSheet.hairlineWidth,
        backgroundColor: SLEEP.border,
        marginHorizontal: 16,
      }}
    />
  );
}

function pad(n: number) {
  return String(n).padStart(2, '0');
}

const st = StyleSheet.create({
  iconHero: {
    width: 96,
    height: 96,
    borderRadius: 28,
    backgroundColor: SLEEP.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 18,
  },
  title: {
    fontFamily: font.extrabold,
    fontSize: 28,
    color: SLEEP.text,
    letterSpacing: -0.6,
    textAlign: 'center',
  },
  sub: {
    fontFamily: font.regular,
    fontSize: 14,
    color: SLEEP.textMuted,
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 20,
    paddingHorizontal: 8,
  },
  card: {
    backgroundColor: SLEEP.card,
    borderRadius: 20,
    marginTop: 24,
    paddingVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 16,
    paddingHorizontal: 4,
  },
  tipTxt: {
    flex: 1,
    fontFamily: font.regular,
    fontSize: 12,
    color: SLEEP.textMuted,
    lineHeight: 17,
  },
});

const rs = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
    gap: 12,
  },
  iconWrap: { width: 28, alignItems: 'center' },
  label: { fontFamily: font.medium, fontSize: 14, color: SLEEP.textMuted, flex: 1 },
  value: {
    fontFamily: font.semibold,
    fontSize: 14,
    color: SLEEP.text,
    maxWidth: '60%',
    textAlign: 'right',
  },
});

import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Haptics from 'expo-haptics';
import { SymbolView } from 'expo-symbols';
import { font, SLEEP } from './theme';

export interface AlarmConfig {
  enabled: boolean;
  time: Date | null; // saatten alınacak, sonraki uygun günde tetiklenir
  smartAlarm: boolean; // 30dk pencerede light evrede uyandır
}

export default function AlarmPicker({
  value,
  onChange,
}: {
  value: AlarmConfig;
  onChange: (next: AlarmConfig) => void;
}) {
  const [time, setTime] = useState<Date>(() => {
    if (value.time) return value.time;
    const t = new Date();
    t.setHours(7, 0, 0, 0);
    return t;
  });

  const fade = useRef(new Animated.Value(value.enabled ? 1 : 0.4)).current;

  useEffect(() => {
    Animated.timing(fade, {
      toValue: value.enabled ? 1 : 0.45,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [value.enabled]);

  const handleEnabled = (next: boolean) => {
    Haptics.selectionAsync();
    onChange({ ...value, enabled: next, time: next ? time : null });
  };

  const handleTime = (_: unknown, picked?: Date) => {
    if (!picked) return;
    setTime(picked);
    onChange({ ...value, enabled: value.enabled, time: picked });
  };

  const handleSmart = (next: boolean) => {
    Haptics.selectionAsync();
    onChange({ ...value, smartAlarm: next });
  };

  const sleepDuration = useMemo(() => {
    if (!value.enabled) return null;
    const now = new Date();
    const target = new Date();
    target.setHours(time.getHours(), time.getMinutes(), 0, 0);
    if (target <= now) target.setDate(target.getDate() + 1);
    const ms = target.getTime() - now.getTime();
    const h = Math.floor(ms / 3_600_000);
    const m = Math.round((ms % 3_600_000) / 60_000);
    return { h, m };
  }, [time, value.enabled]);

  return (
    <View style={st.root}>
      <View style={st.header}>
        <View style={{ flex: 1 }}>
          <Text style={st.title}>Alarm</Text>
          <Text style={st.sub}>
            {value.enabled
              ? sleepDuration
                ? `${sleepDuration.h}s ${sleepDuration.m}d sonra uyandırırım`
                : 'Uyandırma zamanı'
              : 'Alarm kapalı'}
          </Text>
        </View>
        <Switch
          value={value.enabled}
          onValueChange={handleEnabled}
          trackColor={{ false: '#D1D1D6', true: SLEEP.accent }}
          thumbColor="#fff"
        />
      </View>

      <Animated.View
        style={[st.body, { opacity: fade }]}
        pointerEvents={value.enabled ? 'auto' : 'none'}
      >
        <View style={st.timeWrap}>
          <DateTimePicker
            value={time}
            mode="time"
            display="spinner"
            onChange={handleTime}
            textColor={SLEEP.text}
            themeVariant="light"
            locale="tr-TR"
            style={{ height: 180 }}
          />
        </View>

        <Pressable
          onPress={() => handleSmart(!value.smartAlarm)}
          style={({ pressed }) => [
            st.smartRow,
            {
              opacity: pressed ? 0.7 : 1,
              borderColor: value.smartAlarm ? SLEEP.accent : SLEEP.border,
            },
          ]}
        >
          <View
            style={[
              st.smartIcon,
              { backgroundColor: value.smartAlarm ? SLEEP.accentSoft : '#F2F2F7' },
            ]}
          >
            <SymbolView
              name="sparkles"
              size={20}
              tintColor={value.smartAlarm ? SLEEP.accent : SLEEP.textMuted}
              fallback={<Text>✨</Text>}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={st.smartTitle}>Akıllı Uyandırma</Text>
            <Text style={st.smartSub}>
              30 dk öncesinde hafif uyku evresinde uyandırırım — daha dinç kalkarsın.
            </Text>
          </View>
          <View
            style={[
              st.check,
              {
                backgroundColor: value.smartAlarm ? SLEEP.accent : 'transparent',
                borderColor: value.smartAlarm ? SLEEP.accent : SLEEP.border,
              },
            ]}
          >
            {value.smartAlarm && (
              <SymbolView
                name="checkmark"
                size={12}
                tintColor="#fff"
                fallback={<Text style={{ color: '#fff', fontSize: 11 }}>✓</Text>}
              />
            )}
          </View>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const st = StyleSheet.create({
  root: {
    backgroundColor: SLEEP.card,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  title: { fontFamily: font.bold, fontSize: 18, color: SLEEP.text, letterSpacing: -0.3 },
  sub: { fontFamily: font.regular, fontSize: 13, color: SLEEP.textMuted, marginTop: 4 },
  body: { marginTop: 12 },
  timeWrap: { alignItems: 'center', marginVertical: 4 },
  smartRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    marginTop: 8,
  },
  smartIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  smartTitle: { fontFamily: font.semibold, fontSize: 14, color: SLEEP.text },
  smartSub: {
    fontFamily: font.regular,
    fontSize: 12,
    color: SLEEP.textMuted,
    marginTop: 2,
    lineHeight: 16,
  },
  check: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { SymbolView } from 'expo-symbols';
import * as Battery from 'expo-battery';
import { font } from './theme';

type Status = 'charging' | 'unplugged_low' | 'unplugged_ok' | 'full';

export default function ChargingCard() {
  const [batteryLevel, setBatteryLevel] = useState(1);
  const [batteryState, setBatteryState] = useState<Battery.BatteryState>(
    Battery.BatteryState.UNKNOWN,
  );

  const fade = useRef(new Animated.Value(0)).current;
  const slideY = useRef(new Animated.Value(8)).current;
  const pulse = useRef(new Animated.Value(0)).current;
  const boltScale = useRef(new Animated.Value(1)).current;

  // Battery dinleyicileri
  useEffect(() => {
    let alive = true;
    (async () => {
      const [lvl, state] = await Promise.all([
        Battery.getBatteryLevelAsync(),
        Battery.getBatteryStateAsync(),
      ]);
      if (!alive) return;
      setBatteryLevel(lvl);
      setBatteryState(state);
    })();

    const stateSub = Battery.addBatteryStateListener(({ batteryState: s }) => {
      setBatteryState(s);
    });
    const levelSub = Battery.addBatteryLevelListener(({ batteryLevel: l }) => {
      setBatteryLevel(l);
    });

    return () => {
      alive = false;
      stateSub.remove();
      levelSub.remove();
    };
  }, []);

  const status = getStatus(batteryState, batteryLevel);
  const visible = status !== 'full';

  // Görünürlük animasyonu
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, {
        toValue: visible ? 1 : 0,
        duration: visible ? 480 : 380,
        useNativeDriver: true,
        easing: visible ? Easing.bezier(0.16, 1, 0.3, 1) : Easing.bezier(0.4, 0, 1, 1),
      }),
      Animated.timing(slideY, {
        toValue: visible ? 0 : 8,
        duration: visible ? 480 : 380,
        useNativeDriver: true,
        easing: visible ? Easing.bezier(0.16, 1, 0.3, 1) : Easing.bezier(0.4, 0, 1, 1),
      }),
    ]).start();
  }, [visible]);

  // Pulse — şarjda değilken nazik dikkat çekme
  useEffect(() => {
    if (status === 'unplugged_low') {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, {
            toValue: 1,
            duration: 1400,
            useNativeDriver: false,
            easing: Easing.bezier(0.22, 1, 0.36, 1),
          }),
          Animated.timing(pulse, {
            toValue: 0,
            duration: 1400,
            useNativeDriver: false,
            easing: Easing.bezier(0.22, 1, 0.36, 1),
          }),
        ]),
      );
      loop.start();
      return () => loop.stop();
    }
    pulse.setValue(0);
    return undefined;
  }, [status]);

  // Bolt scale — şarjdayken hafif nefes alır
  useEffect(() => {
    if (status === 'charging') {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(boltScale, {
            toValue: 1.12,
            duration: 900,
            useNativeDriver: true,
            easing: Easing.bezier(0.22, 1, 0.36, 1),
          }),
          Animated.timing(boltScale, {
            toValue: 1,
            duration: 900,
            useNativeDriver: true,
            easing: Easing.bezier(0.22, 1, 0.36, 1),
          }),
        ]),
      );
      loop.start();
      return () => loop.stop();
    }
    boltScale.setValue(1);
    return undefined;
  }, [status]);

  const meta = getMeta(status);

  return (
    <Animated.View
      style={[
        st.outer,
        {
          opacity: fade,
          transform: [{ translateY: slideY }],
        },
      ]}
      pointerEvents="none"
    >
      <BlurView intensity={28} tint="dark" style={st.blur}>
        <Animated.View
          style={[
            st.borderGlow,
            {
              borderColor: pulse.interpolate({
                inputRange: [0, 1],
                outputRange: [meta.borderQuiet, meta.borderActive],
              }),
            },
          ]}
        />

        <View style={st.row}>
          {/* Bolt icon */}
          <View style={[st.iconWrap, { backgroundColor: meta.iconBg }]}>
            <Animated.View style={{ transform: [{ scale: boltScale }] }}>
              <SymbolView
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                name={meta.icon as any}
                size={20}
                tintColor={meta.iconColor}
                fallback={
                  <Text style={{ color: meta.iconColor, fontSize: 18 }}>{meta.fallback}</Text>
                }
              />
            </Animated.View>
          </View>

          {/* Texts */}
          <View style={{ flex: 1 }}>
            <Text style={st.title}>{meta.title}</Text>
            <Text style={st.sub}>{meta.sub(batteryLevel)}</Text>
          </View>

          {/* Pil yüzdesi mini bar */}
          <View style={st.battWrap}>
            <View style={st.battBody}>
              <View
                style={[
                  st.battFill,
                  {
                    width: `${Math.max(6, Math.round(batteryLevel * 100))}%`,
                    backgroundColor: meta.battFill,
                  },
                ]}
              />
            </View>
            <View style={st.battTip} />
            <Text style={st.battPct}>{Math.round(batteryLevel * 100)}%</Text>
          </View>
        </View>
      </BlurView>
    </Animated.View>
  );
}

function getStatus(state: Battery.BatteryState, level: number): Status {
  const charging = state === Battery.BatteryState.CHARGING || state === Battery.BatteryState.FULL;
  if (charging && level >= 0.8) return 'full';
  if (charging) return 'charging';
  if (level < 0.5) return 'unplugged_low';
  return 'unplugged_ok';
}

interface CardMeta {
  title: string;
  sub: (level: number) => string;
  icon: string;
  fallback: string;
  iconBg: string;
  iconColor: string;
  borderQuiet: string;
  borderActive: string;
  battFill: string;
}

function getMeta(status: Status): CardMeta {
  switch (status) {
    case 'charging':
      return {
        title: 'Şarj oluyor',
        sub: (l) => `Pilin yeterli, rahat uyu • %${Math.round(l * 100)}`,
        icon: 'bolt.fill',
        fallback: '⚡',
        iconBg: 'rgba(48, 209, 88, 0.18)',
        iconColor: '#30D158',
        borderQuiet: 'rgba(48, 209, 88, 0.18)',
        borderActive: 'rgba(48, 209, 88, 0.28)',
        battFill: '#30D158',
      };
    case 'unplugged_low':
      return {
        title: 'Telefonunu şarja tak',
        sub: () => 'Tüm gece takip için pilin yetmeyebilir',
        icon: 'bolt.slash.fill',
        fallback: '⚠️',
        iconBg: 'rgba(255, 159, 10, 0.18)',
        iconColor: '#FF9F0A',
        borderQuiet: 'rgba(255, 159, 10, 0.22)',
        borderActive: 'rgba(255, 159, 10, 0.55)',
        battFill: '#FF9F0A',
      };
    case 'unplugged_ok':
      return {
        title: 'Şarja takmayı unutma',
        sub: (l) => `%${Math.round(l * 100)} pil • Sabaha kadar takip için yeterli olmayabilir`,
        icon: 'powerplug.portrait.fill',
        fallback: '🔌',
        iconBg: 'rgba(94, 92, 230, 0.22)',
        iconColor: '#A8A6FF',
        borderQuiet: 'rgba(94, 92, 230, 0.18)',
        borderActive: 'rgba(94, 92, 230, 0.32)',
        battFill: '#A8A6FF',
      };
    default:
      return {
        title: '',
        sub: () => '',
        icon: 'bolt.fill',
        fallback: '⚡',
        iconBg: 'transparent',
        iconColor: '#fff',
        borderQuiet: 'transparent',
        borderActive: 'transparent',
        battFill: '#fff',
      };
  }
}

const st = StyleSheet.create({
  outer: {
    marginHorizontal: 24,
    borderRadius: 18,
    overflow: 'hidden',
  },
  blur: {
    paddingVertical: 14,
    paddingHorizontal: 14,
    backgroundColor: 'rgba(20, 22, 50, 0.55)',
  },
  borderGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 18,
    borderWidth: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: font.bold,
    fontSize: 14,
    color: '#fff',
    letterSpacing: -0.2,
  },
  sub: {
    fontFamily: font.regular,
    fontSize: 11.5,
    color: 'rgba(255,255,255,0.65)',
    marginTop: 2,
    lineHeight: 15,
  },
  battWrap: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  battBody: {
    width: 26,
    height: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
    borderRadius: 3,
    overflow: 'hidden',
    padding: 1.5,
  },
  battFill: {
    height: '100%',
    borderRadius: 1.5,
  },
  battTip: {
    width: 2,
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.4)',
    borderTopRightRadius: 1,
    borderBottomRightRadius: 1,
    marginLeft: -5,
  },
  battPct: {
    fontFamily: font.semibold,
    fontSize: 11,
    color: 'rgba(255,255,255,0.75)',
    minWidth: 30,
    textAlign: 'right',
    marginLeft: 2,
  },
});

import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  Easing,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Svg, { Path } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from 'expo-speech-recognition';

// Doodle pattern — WhatsApp tarzı, subtle arka plan deseni.
// Renk dynamic — AIChatInline'dan accentColor ile override edilir (sağlık pembe, beslenme turuncu).
let DOODLE_COLOR = 'rgba(255, 45, 85, 0.045)';
const DOODLE_STROKE = 1.4;

function hexToRgba(hex: string, alpha: number): string {
  // Eğer zaten rgba/rgb ise olduğu gibi geçir
  if (hex.startsWith('rgb')) return hex;
  const cleaned = hex.replace('#', '');
  const bigint = parseInt(
    cleaned.length === 3
      ? cleaned
          .split('')
          .map((c) => c + c)
          .join('')
      : cleaned,
    16,
  );
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function DoodleHeart({ size = 22 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 21s-7-4.5-9-9.5C1.5 7.5 4 4 7.5 4c2 0 3.5 1 4.5 2.5C13 5 14.5 4 16.5 4c3.5 0 6 3.5 4.5 7.5-2 5-9 9.5-9 9.5z"
        stroke={DOODLE_COLOR}
        strokeWidth={DOODLE_STROKE}
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
}

function DoodleSparkle({ size = 18 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 3l1.5 5.5L19 10l-5.5 1.5L12 17l-1.5-5.5L5 10l5.5-1.5L12 3z"
        stroke={DOODLE_COLOR}
        strokeWidth={DOODLE_STROKE}
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
}

function DoodlePill({ size = 20 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M8 4h8a4 4 0 014 4v8a4 4 0 01-4 4H8a4 4 0 01-4-4V8a4 4 0 014-4z"
        stroke={DOODLE_COLOR}
        strokeWidth={DOODLE_STROKE}
        fill="none"
        transform="rotate(-30 12 12)"
      />
      <Path
        d="M12 4v16"
        stroke={DOODLE_COLOR}
        strokeWidth={DOODLE_STROKE}
        transform="rotate(-30 12 12)"
      />
    </Svg>
  );
}

function DoodleLeaf({ size = 22 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M5 19c0-7 7-14 14-14 0 7-7 14-14 14z"
        stroke={DOODLE_COLOR}
        strokeWidth={DOODLE_STROKE}
        strokeLinejoin="round"
        fill="none"
      />
      <Path d="M5 19c4-4 8-8 14-14" stroke={DOODLE_COLOR} strokeWidth={DOODLE_STROKE} />
    </Svg>
  );
}

function DoodleDrop({ size = 18 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 3s6 7 6 11.5a6 6 0 11-12 0C6 10 12 3 12 3z"
        stroke={DOODLE_COLOR}
        strokeWidth={DOODLE_STROKE}
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
}

function DoodlePlus({ size = 16 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 5v14M5 12h14"
        stroke={DOODLE_COLOR}
        strokeWidth={DOODLE_STROKE + 0.2}
        strokeLinecap="round"
      />
    </Svg>
  );
}

// Pattern wrapper — sabit grid'de scatter ikonlar.
// Düzenli grid + her hücrede rastgele döndürme + farklı ikon → "doodle" hissi.
const DOODLE_ICONS = [DoodleHeart, DoodleSparkle, DoodlePill, DoodleLeaf, DoodleDrop, DoodlePlus];

function DoodlePattern() {
  // Grid: 4 kolon × yeterli satır (ekran boyutuna göre)
  const cols = 4;
  const rows = 14; // ~14 satır = 1100px alan, çoğu ekrana yeter
  const cellW = 100 / cols;

  // Statik scatter: deterministik pseudo-random (her hücrede aynı kombinasyon)
  const cells = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const seed = (r * 31 + c * 17) % 100;
      const Icon = DOODLE_ICONS[(r + c) % DOODLE_ICONS.length]!;
      const offsetX = (seed % 30) - 15; // -15..+15 px shift
      const offsetY = ((seed * 3) % 30) - 15;
      const rotate = ((seed * 7) % 60) - 30; // -30..+30 deg
      const isOdd = (r + c) % 2 === 1;
      cells.push(
        <View
          key={`${r}-${c}`}
          style={{
            position: 'absolute',
            top: r * 80 + offsetY,
            left: `${c * cellW}%`,
            width: `${cellW}%`,
            alignItems: 'center',
            transform: [{ translateX: offsetX }, { rotate: `${rotate}deg` }],
            opacity: isOdd ? 0.85 : 1,
          }}
        >
          <Icon />
        </View>,
      );
    }
  }

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {cells}
    </View>
  );
}

// AI Asistan avatarı — gradient yuvarlak + sparkle SF symbol
function AIAvatar({
  size = 36,
  gradient = ['#FF6482', '#FF2D55', '#C7185F'],
  shadowColor = '#FF2D55',
}: {
  size?: number;
  gradient?: string[];
  shadowColor?: string;
}) {
  const sparkleSize = size * 0.5;
  return (
    <LinearGradient
      colors={gradient as any}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor,
        shadowOpacity: 0.35,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
      }}
    >
      <Svg width={sparkleSize} height={sparkleSize} viewBox="0 0 24 24" fill="none">
        <Path
          d="M12 2.5c.4 0 .75.27.86.66l1.05 3.7a4 4 0 0 0 2.73 2.73l3.7 1.05a.9.9 0 0 1 0 1.72l-3.7 1.05a4 4 0 0 0-2.73 2.73l-1.05 3.7a.9.9 0 0 1-1.72 0l-1.05-3.7a4 4 0 0 0-2.73-2.73l-3.7-1.05a.9.9 0 0 1 0-1.72l3.7-1.05a4 4 0 0 0 2.73-2.73l1.05-3.7a.9.9 0 0 1 .86-.66z"
          fill="#FFFFFF"
        />
      </Svg>
    </LinearGradient>
  );
}

// Apple SF Symbols-style mic.fill icon
function MicIcon({ size = 18, color = '#8E8E93' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 3a3 3 0 0 0-3 3v6a3 3 0 1 0 6 0V6a3 3 0 0 0-3-3z" fill={color} />
      <Path
        d="M5.5 11a.75.75 0 0 1 .75.75 5.75 5.75 0 1 0 11.5 0 .75.75 0 1 1 1.5 0 7.25 7.25 0 0 1-6.5 7.21V21h2.25a.75.75 0 1 1 0 1.5h-6a.75.75 0 1 1 0-1.5h2.25v-2.04a7.25 7.25 0 0 1-6.5-7.21A.75.75 0 0 1 5.5 11z"
        fill={color}
      />
    </Svg>
  );
}

// Çöp kutusu (cancel) ikonu
function TrashIcon({ size = 18, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9 3.5a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 15 3.5V4h4.25a.75.75 0 0 1 0 1.5h-.7l-.95 13.32A2.75 2.75 0 0 1 14.86 21.5H9.14a2.75 2.75 0 0 1-2.74-2.68L5.45 5.5h-.7a.75.75 0 0 1 0-1.5H9v-.5zm1.5 0V4h3v-.5h-3zM7 5.5l.93 13.21c.04.65.58 1.29 1.21 1.29h5.72c.63 0 1.17-.64 1.21-1.29L17 5.5H7z"
        fill={color}
      />
    </Svg>
  );
}

const { height: SCREEN_H } = Dimensions.get('window');

const ACCENT = '#FF2D55';
const REC_RED = '#FF3B30';
const BG = '#F2F2F7';
const CARD = '#FFFFFF';
const TEXT = '#1C1C1E';
const SUBTEXT = '#8E8E93';
const SEP = 'rgba(60,60,67,0.12)';
const BORDER = 'rgba(60,60,67,0.13)';

const EASE_SPRING = Easing.bezier(0.16, 1, 0.3, 1);
const EASE_CLOSE = Easing.bezier(0.4, 0, 1, 1);
const EASE_MICRO = Easing.bezier(0.4, 0, 0.2, 1);

const WAVE_BARS = 34;

export type ChatMsg = { id: string; role: 'user' | 'assistant'; text: string };

// ─── Typing dots ─────────────────────────────────────────────────────────────
function TypingDots() {
  const d1 = useRef(new Animated.Value(0)).current;
  const d2 = useRef(new Animated.Value(0)).current;
  const d3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const make = (val: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(val, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
            easing: Easing.bezier(0.4, 0, 0.6, 1),
          }),
          Animated.timing(val, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
            easing: Easing.bezier(0.4, 0, 0.6, 1),
          }),
          Animated.delay(400),
        ]),
      );
    const a1 = make(d1, 0);
    const a2 = make(d2, 180);
    const a3 = make(d3, 360);
    a1.start();
    a2.start();
    a3.start();
    return () => {
      a1.stop();
      a2.stop();
      a3.stop();
    };
  }, [d1, d2, d3]);

  const dotStyle = (v: Animated.Value) => ({
    opacity: v.interpolate({ inputRange: [0, 1], outputRange: [0.32, 1] }),
    transform: [
      { scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1.15] }) },
      { translateY: v.interpolate({ inputRange: [0, 1], outputRange: [0, -2] }) },
    ],
  });

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', height: 14 }}>
      <Animated.View style={[S.typingDot, dotStyle(d1)]} />
      <Animated.View style={[S.typingDot, dotStyle(d2), { marginLeft: 5 }]} />
      <Animated.View style={[S.typingDot, dotStyle(d3), { marginLeft: 5 }]} />
    </View>
  );
}

// ─── Tek bir waveform bar ────────────────────────────────────────────────────
function WaveBar({ level }: { level: number }) {
  const h = useRef(new Animated.Value(level)).current;
  useEffect(() => {
    Animated.timing(h, {
      toValue: level,
      duration: 130,
      useNativeDriver: false,
      easing: EASE_MICRO,
    }).start();
  }, [level, h]);
  return (
    <Animated.View
      style={{
        width: 2.5,
        marginHorizontal: 1.5,
        height: h,
        backgroundColor: REC_RED,
        borderRadius: 1.25,
      }}
    />
  );
}

// ─── Recording bar (Apple iMessage tarzı) ────────────────────────────────────
function RecordingBar({
  elapsedMs,
  levels,
  cancelProgress,
  onStop,
  onCancel,
  panHandlers,
}: {
  elapsedMs: number;
  levels: number[];
  cancelProgress: Animated.Value;
  onStop: () => void;
  onCancel: () => void;
  panHandlers: any;
}) {
  // Sallanan kırmızı nokta
  const dot = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const a = Animated.loop(
      Animated.sequence([
        Animated.timing(dot, {
          toValue: 0.4,
          duration: 800,
          useNativeDriver: true,
          easing: EASE_MICRO,
        }),
        Animated.timing(dot, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
          easing: EASE_MICRO,
        }),
      ]),
    );
    a.start();
    return () => a.stop();
  }, [dot]);

  const mm = Math.floor(elapsedMs / 60000);
  const ss = Math.floor((elapsedMs % 60000) / 1000);
  const display = `${mm}:${String(ss).padStart(2, '0')}`;

  // İptal ipucu opacity (kayma arttıkça yazı silinir, çöp kutusu büyür)
  const hintOpacity = cancelProgress.interpolate({ inputRange: [0, 1], outputRange: [1, 0] });
  const trashScale = cancelProgress.interpolate({ inputRange: [0, 1], outputRange: [1, 1.25] });
  const barOpacity = cancelProgress.interpolate({ inputRange: [0, 1], outputRange: [1, 0.35] });

  return (
    <View style={S.recWrap}>
      {/* Sol: kırmızı nokta + sayaç */}
      <View style={S.recLeft}>
        <Animated.View style={[S.recDot, { opacity: dot }]} />
        <Text allowFontScaling={false} style={S.recTimer}>
          {display}
        </Text>
      </View>

      {/* Orta: waveform */}
      <Animated.View style={[S.recWave, { opacity: barOpacity }]}>
        {levels.map((lv, i) => (
          <WaveBar key={i} level={lv} />
        ))}
      </Animated.View>

      {/* "← Kaydır iptal" hint */}
      <Animated.View pointerEvents="none" style={[S.recHint, { opacity: hintOpacity }]}>
        <Text allowFontScaling={false} style={S.recHintText}>
          ‹ Kaydır iptal
        </Text>
      </Animated.View>

      {/* Sağ: stop / trash */}
      <View style={S.recRight} {...panHandlers}>
        <Animated.View style={{ transform: [{ scale: trashScale }] }}>
          <Pressable
            onPress={onStop}
            hitSlop={10}
            style={({ pressed }) => [
              S.recStopBtn,
              { opacity: pressed ? 0.85 : 1, transform: [{ scale: pressed ? 0.94 : 1 }] },
            ]}
          >
            {/* cancelProgress yüksekse trash, düşükse stop kutusu */}
            <Animated.View
              style={{
                opacity: cancelProgress.interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: [1, 0, 0],
                }),
              }}
            >
              <View style={S.stopSquare} />
            </Animated.View>
            <Animated.View
              pointerEvents="none"
              style={{
                position: 'absolute',
                opacity: cancelProgress.interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: [0, 0, 1],
                }),
              }}
            >
              <TrashIcon size={18} color="#FFF" />
            </Animated.View>
          </Pressable>
        </Animated.View>
      </View>

      {/* Görünmez geniş alan — pan ile iptal */}
      <View pointerEvents="box-only" style={StyleSheet.absoluteFill} {...panHandlers} />
    </View>
  );
}

// ─── ChatGPT-style mic button (toggle: tap to start/stop) ────────────────────
function ChatGPTMicButton({
  active,
  onToggle,
  disabled,
}: {
  active: boolean;
  onToggle: () => void;
  disabled?: boolean;
}) {
  // Pulse halo (sürekli atan dış halka)
  const halo = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!active) {
      halo.setValue(0);
      return;
    }
    const a = Animated.loop(
      Animated.sequence([
        Animated.timing(halo, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
          easing: EASE_MICRO,
        }),
        Animated.timing(halo, { toValue: 0, duration: 0, useNativeDriver: true }),
      ]),
    );
    a.start();
    return () => a.stop();
  }, [active, halo]);

  // 3 dikey bar — dans loop
  const b1 = useRef(new Animated.Value(0)).current;
  const b2 = useRef(new Animated.Value(0)).current;
  const b3 = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!active) return;
    const make = (v: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(v, {
            toValue: 1,
            duration: 280,
            useNativeDriver: true,
            easing: Easing.bezier(0.4, 0, 0.6, 1),
          }),
          Animated.timing(v, {
            toValue: 0.2,
            duration: 280,
            useNativeDriver: true,
            easing: Easing.bezier(0.4, 0, 0.6, 1),
          }),
        ]),
      );
    const a = make(b1, 0);
    const b = make(b2, 120);
    const c = make(b3, 240);
    a.start();
    b.start();
    c.start();
    return () => {
      a.stop();
      b.stop();
      c.stop();
    };
  }, [active, b1, b2, b3]);

  const haloOpacity = halo.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 0.35, 0] });
  const haloScale = halo.interpolate({ inputRange: [0, 1], outputRange: [1, 1.8] });

  const barStyle = (v: Animated.Value) => ({
    width: 2.5,
    height: 14,
    marginHorizontal: 1.2,
    borderRadius: 1.25,
    backgroundColor: '#FFFFFF',
    transform: [{ scaleY: v.interpolate({ inputRange: [0, 1], outputRange: [0.25, 1] }) }],
  });

  return (
    <Pressable
      onPress={onToggle}
      disabled={disabled}
      hitSlop={10}
      style={({ pressed }) => ({
        width: 32,
        height: 32,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: pressed ? 0.7 : 1,
        transform: [{ scale: pressed ? 0.92 : 1 }],
      })}
    >
      {active && (
        <Animated.View
          style={{
            position: 'absolute',
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: REC_RED,
            opacity: haloOpacity,
            transform: [{ scale: haloScale }],
          }}
        />
      )}
      <View
        style={{
          width: 32,
          height: 32,
          borderRadius: 16,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: active ? REC_RED : 'transparent',
        }}
      >
        {active ? (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              height: 16,
            }}
          >
            <Animated.View style={barStyle(b1)} />
            <Animated.View style={barStyle(b2)} />
            <Animated.View style={barStyle(b3)} />
          </View>
        ) : (
          <MicIcon size={18} color={SUBTEXT} />
        )}
      </View>
    </Pressable>
  );
}

// ─── Apple-style input bar (text + mic/send) ─────────────────────────────────
function NormalInputBar({
  value,
  onChange,
  onSend,
  micActive,
  onMicToggle,
  disabled,
}: {
  value: string;
  onChange: (s: string) => void;
  onSend: () => void;
  micActive: boolean;
  onMicToggle: () => void;
  disabled?: boolean;
}) {
  const hasText = value.trim().length > 0;
  return (
    <View style={S.inputWrap}>
      <TextInput
        placeholder="Mesaj"
        placeholderTextColor={SUBTEXT}
        value={value}
        onChangeText={onChange}
        style={S.textField}
        returnKeyType="send"
        onSubmitEditing={onSend}
        editable={!disabled}
        allowFontScaling={false}
      />

      {hasText ? (
        <Pressable
          onPress={onSend}
          disabled={disabled}
          hitSlop={8}
          style={({ pressed }) => [
            S.sendBtn,
            { backgroundColor: accentColor },
            {
              opacity: disabled ? 0.35 : pressed ? 0.78 : 1,
              transform: [{ scale: pressed ? 0.92 : 1 }],
            },
          ]}
        >
          <Text
            allowFontScaling={false}
            style={{ color: '#FFF', fontSize: 16, fontWeight: '800', lineHeight: 19 }}
          >
            ↑
          </Text>
        </Pressable>
      ) : (
        <ChatGPTMicButton active={micActive} onToggle={onMicToggle} disabled={disabled} />
      )}
    </View>
  );
}

// ─── InputBar — recording state burada yönetiliyor ───────────────────────────
function InputBar({
  value,
  onChange,
  onSend,
  disabled,
  accentColor = ACCENT,
}: {
  value: string;
  onChange: (s: string) => void;
  onSend: () => void;
  disabled?: boolean;
  accentColor?: string;
}) {
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [levels, setLevels] = useState<number[]>(() => Array.from({ length: WAVE_BARS }, () => 4));
  const [permGranted, setPermGranted] = useState<boolean | null>(null);

  const liveTextRef = useRef('');
  const startedAtRef = useRef(0);
  const cancelledRef = useRef(false);
  const recordingRef = useRef(false); // sync flag — race condition için
  const cancelProg = useRef(new Animated.Value(0)).current;
  const fade = useRef(new Animated.Value(0)).current; // 0=normal, 1=recording

  // İzin durumunu component mount olduğunda kontrol et (popup gerekmez)
  useEffect(() => {
    (async () => {
      try {
        const cur = await ExpoSpeechRecognitionModule.getPermissionsAsync();
        if (cur.granted) setPermGranted(true);
      } catch {
        // sessizce geç
      }
    })();
  }, []);

  // Speech events
  useSpeechRecognitionEvent('result', (e: any) => {
    const t = e.results?.[0]?.transcript ?? '';
    liveTextRef.current = t;
    // canlı transcript'i input'a yaz
    if (t) onChange(t);
  });
  useSpeechRecognitionEvent('end', () => {
    console.log('[Mic] end event');
    finalize(false);
  });
  useSpeechRecognitionEvent('error', (e: any) => {
    console.warn('[Mic] error:', e?.error, e?.message);
    finalize(true, e?.message);
  });

  // Sayaç timer
  useEffect(() => {
    if (!recording) {
      setElapsed(0);
      return;
    }
    startedAtRef.current = Date.now();
    const id = setInterval(() => setElapsed(Date.now() - startedAtRef.current), 100);
    return () => clearInterval(id);
  }, [recording]);

  // Waveform fallback simulate (volumechange/result yoksa)
  useEffect(() => {
    if (!recording) return;
    const id = setInterval(() => {
      setLevels((prev) => {
        const next = [...prev.slice(1), 4 + Math.random() * 22];
        return next;
      });
    }, 90);
    return () => clearInterval(id);
  }, [recording]);

  // Crossfade animasyon
  useEffect(() => {
    Animated.timing(fade, {
      toValue: recording ? 1 : 0,
      duration: recording ? 220 : 200,
      useNativeDriver: true,
      easing: recording ? EASE_SPRING : EASE_CLOSE,
    }).start();
  }, [recording, fade]);

  const ensurePermission = async (): Promise<boolean> => {
    try {
      const cur = await ExpoSpeechRecognitionModule.getPermissionsAsync();
      if (cur.granted) {
        setPermGranted(true);
        return true;
      }
      const r = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (r.granted) {
        setPermGranted(true);
        return true;
      }
      Alert.alert(
        'Mikrofon erişimi gerekli',
        'Sesle yazmak için Ayarlar > FitAI üzerinden Mikrofon ve Konuşma Tanıma izinlerini açın.',
      );
      setPermGranted(false);
      return false;
    } catch (e) {
      console.error('[Mic] permission error', e);
      return false;
    }
  };

  const startRecording = async () => {
    if (disabled || recording) return;

    const ok = await ensurePermission();
    if (!ok) return;

    cancelledRef.current = false;
    liveTextRef.current = '';
    cancelProg.setValue(0);
    setLevels(Array.from({ length: WAVE_BARS }, () => 4));

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      startedAtRef.current = Date.now();
      ExpoSpeechRecognitionModule.start({
        lang: 'tr-TR',
        interimResults: true,
        continuous: false,
        requiresOnDeviceRecognition: false,
      } as any);
      recordingRef.current = true;
      setRecording(true);
      console.log('[Mic] recording started');
    } catch (err: any) {
      console.error('[Mic] start error:', err);
      Alert.alert('Sesli kayıt başlatılamadı', err?.message ?? 'Lütfen tekrar deneyin.');
      recordingRef.current = false;
      setRecording(false);
    }
  };

  const stopRecording = () => {
    if (!recordingRef.current) return;
    try {
      ExpoSpeechRecognitionModule.stop();
    } catch (e) {
      console.warn('[Mic] stop err', e);
    }
    // finalize 'end' event'inde tetiklenecek
  };

  const cancelRecording = () => {
    if (!recordingRef.current) return;
    cancelledRef.current = true;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    try {
      ExpoSpeechRecognitionModule.abort();
    } catch {
      try {
        ExpoSpeechRecognitionModule.stop();
      } catch {}
    }
  };

  // 'end' veya 'error' geldiğinde
  const finalize = (errored: boolean, _msg?: string) => {
    if (!recordingRef.current && !errored) return;
    recordingRef.current = false;
    setRecording(false);

    const t = liveTextRef.current.trim();
    if (t.length > 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    liveTextRef.current = '';
  };

  // PanResponder — yukarı/sola kaydırarak iptal
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_e, g) => Math.abs(g.dx) > 4 || Math.abs(g.dy) > 4,
      onPanResponderMove: (_e, g) => {
        // sola kaydır (negatif dx) veya yukarı (negatif dy) — 0..120px arası
        const dist = Math.max(-g.dx, -g.dy, 0);
        const p = Math.min(1, dist / 120);
        cancelProg.setValue(p);
      },
      onPanResponderRelease: (_e, g) => {
        const dist = Math.max(-g.dx, -g.dy, 0);
        if (dist >= 90) {
          cancelRecording();
        } else {
          Animated.timing(cancelProg, {
            toValue: 0,
            duration: 180,
            useNativeDriver: false,
            easing: EASE_CLOSE,
          }).start();
          stopRecording();
        }
      },
      onPanResponderTerminate: () => {
        Animated.timing(cancelProg, {
          toValue: 0,
          duration: 180,
          useNativeDriver: false,
          easing: EASE_CLOSE,
        }).start();
        stopRecording();
      },
    }),
  ).current;

  const toggleMic = () => {
    if (recordingRef.current) stopRecording();
    else startRecording();
  };

  return (
    <NormalInputBar
      value={value}
      onChange={onChange}
      onSend={onSend}
      micActive={recording}
      onMicToggle={toggleMic}
      disabled={disabled}
    />
  );
}

// ─── Bubble list ─────────────────────────────────────────────────────────────
function BubbleList({
  msgs,
  pending,
  listRef,
  contentPadTop,
  contentPadBottom,
  accentColor = ACCENT,
}: {
  msgs: ChatMsg[];
  pending: boolean;
  listRef: React.RefObject<FlatList<ChatMsg> | null>;
  contentPadTop: number;
  contentPadBottom: number;
  accentColor?: string;
}) {
  return (
    <FlatList
      ref={listRef}
      data={msgs}
      keyExtractor={(m) => m.id}
      contentContainerStyle={{
        paddingHorizontal: 12,
        paddingTop: contentPadTop,
        paddingBottom: contentPadBottom,
      }}
      showsVerticalScrollIndicator={false}
      renderItem={({ item }) => (
        <View
          style={[
            S.bubble,
            item.role === 'user' ? S.bubbleUser : S.bubbleAI,
            item.role === 'user' && { backgroundColor: accentColor },
          ]}
        >
          <Text
            allowFontScaling={false}
            style={[S.bubbleText, item.role === 'user' ? S.bubbleTextUser : S.bubbleTextAI]}
          >
            {item.text}
          </Text>
        </View>
      )}
      ListFooterComponent={
        pending ? (
          <View style={[S.bubble, S.bubbleAI, S.typingBubble]}>
            <TypingDots />
          </View>
        ) : null
      }
    />
  );
}

// ─── Mini panel (collapsed) ──────────────────────────────────────────────────
export function AIChatMiniPanel({
  msgs,
  pending,
  aiInput,
  setAiInput,
  onSend,
  onExpand,
  bottomInset,
}: {
  msgs: ChatMsg[];
  pending: boolean;
  aiInput: string;
  setAiInput: (s: string) => void;
  onSend: () => void;
  onExpand: () => void;
  bottomInset: number;
}) {
  const listRef = useRef<FlatList<ChatMsg>>(null);

  const recent = msgs.slice(-1);

  return (
    <View style={[S.miniPanel, { bottom: bottomInset }]}>
      {(recent.length > 0 || pending) && (
        <Pressable onPress={onExpand}>
          <View style={{ maxHeight: 220 }}>
            <BubbleList
              msgs={recent}
              pending={pending}
              listRef={listRef}
              contentPadTop={10}
              contentPadBottom={6}
            />
          </View>
        </Pressable>
      )}
      <View style={S.inputBar}>
        <InputBar value={aiInput} onChange={setAiInput} onSend={onSend} disabled={pending} />
      </View>
    </View>
  );
}

// ─── Full-screen panel (expanded) ────────────────────────────────────────────
export function AIChatFullScreen({
  visible,
  msgs,
  pending,
  aiInput,
  setAiInput,
  onSend,
  onClose,
}: {
  visible: boolean;
  msgs: ChatMsg[];
  pending: boolean;
  aiInput: string;
  setAiInput: (s: string) => void;
  onSend: () => void;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList<ChatMsg>>(null);
  const slide = useRef(new Animated.Value(SCREEN_H)).current;
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;
    Animated.parallel([
      Animated.timing(slide, {
        toValue: 0,
        duration: 480,
        useNativeDriver: true,
        easing: EASE_SPRING,
      }),
      Animated.timing(fade, { toValue: 1, duration: 320, useNativeDriver: true }),
    ]).start();
    setTimeout(() => listRef.current?.scrollToEnd({ animated: false }), 100);
  }, [visible, slide, fade]);

  const close = () => {
    Animated.parallel([
      Animated.timing(slide, {
        toValue: SCREEN_H,
        duration: 380,
        useNativeDriver: true,
        easing: EASE_CLOSE,
      }),
      Animated.timing(fade, { toValue: 0, duration: 260, useNativeDriver: true }),
    ]).start(() => onClose());
  };

  useEffect(() => {
    if (!visible) return;
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 80);
  }, [msgs.length, pending, visible]);

  if (!visible) return null;

  return (
    <Modal transparent animationType="none" visible onRequestClose={close}>
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: '#000',
            opacity: fade.interpolate({ inputRange: [0, 1], outputRange: [0, 0.25] }),
          },
        ]}
      />
      <Animated.View style={[S.fullPanel, { transform: [{ translateY: slide }] }]}>
        {/* Premium arka plan: vertical gradient (üst hafif pembe-gri → alt açık gri) */}
        <LinearGradient
          colors={['#FAF5F8', '#F2F2F7']}
          locations={[0, 0.55]}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
        {/* Avatar arkasında soft halo — kırmızı/pembe radial glow simulasyonu */}
        <View style={S.haloWrap} pointerEvents="none">
          <View style={S.halo} />
          <View style={S.haloInner} />
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
          keyboardVerticalOffset={0}
        >
          {/* Header */}
          <View style={[S.fullHeader, { paddingTop: insets.top + 6 }]}>
            <Pressable
              onPress={close}
              hitSlop={14}
              style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}
            >
              <View style={S.closeBtn}>
                <Text
                  allowFontScaling={false}
                  style={{ fontSize: 18, color: TEXT, fontWeight: '500', lineHeight: 20 }}
                >
                  ✕
                </Text>
              </View>
            </Pressable>
            <View
              style={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
              }}
            >
              <AIAvatar size={34} />
              <View style={{ alignItems: 'flex-start' }}>
                <Text
                  allowFontScaling={false}
                  style={{ fontSize: 16, fontWeight: '600', color: TEXT, letterSpacing: -0.32 }}
                >
                  FitAI Asistan
                </Text>
                <Text
                  allowFontScaling={false}
                  style={{
                    fontSize: 12,
                    color: pending ? ACCENT : '#34C759',
                    marginTop: 1,
                    fontWeight: '500',
                  }}
                >
                  {pending ? 'Yazıyor…' : 'Çevrimiçi'}
                </Text>
              </View>
            </View>
            <View style={{ width: 36 }} />
          </View>

          {/* Mesajlar */}
          <BubbleList
            msgs={msgs}
            pending={pending}
            listRef={listRef}
            contentPadTop={12}
            contentPadBottom={20}
          />

          {/* Input */}
          <View style={[S.inputBar, { paddingBottom: Math.max(insets.bottom, 8) + 6 }]}>
            <InputBar value={aiInput} onChange={setAiInput} onSend={onSend} disabled={pending} />
          </View>
        </KeyboardAvoidingView>
      </Animated.View>
    </Modal>
  );
}

// ─── Inline (tab page) ──────────────────────────────────────────────────────
// Modal'sız tam-ekran sohbet — Asistan tab'ı için.
// AIChatFullScreen ile aynı UI, ama tab navigation içinde page olarak render edilir.
export function AIChatInline({
  msgs,
  pending,
  aiInput,
  setAiInput,
  onSend,
  accentColor = ACCENT,
  accentGradient = ['#FF6482', '#FF2D55', '#C7185F'],
  bgGradient = ['#FAF5F8', '#F2F2F7'],
}: {
  msgs: ChatMsg[];
  pending: boolean;
  aiInput: string;
  setAiInput: (s: string) => void;
  onSend: () => void;
  /** Yardımcı asistan rengi — beslenme için turuncu, sağlık için pembe */
  accentColor?: string;
  /** Avatar gradient (üç durak) */
  accentGradient?: string[];
  /** Sayfa arka plan gradient'i (iki durak) */
  bgGradient?: string[];
}) {
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList<ChatMsg>>(null);

  // Doodle rengini accent'e göre güncelle (module-level var, render anında atanır)
  DOODLE_COLOR = hexToRgba(accentColor, 0.045);

  useEffect(() => {
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 80);
  }, [msgs.length, pending]);

  return (
    <View style={S.inlineRoot}>
      {/* Premium arka plan: vertical gradient (üst hafif pembe-gri → alt açık gri) */}
      <LinearGradient
        colors={bgGradient as any}
        locations={[0, 0.55]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      {/* WhatsApp tarzı doodle pattern */}
      <DoodlePattern />
      {/* Avatar arkasında soft halo — accentColor'a göre */}
      <View style={S.haloWrap} pointerEvents="none">
        <View style={[S.halo, { backgroundColor: hexToRgba(accentColor, 0.06) }]} />
        <View style={[S.haloInner, { backgroundColor: hexToRgba(accentColor, 0.05) }]} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
        keyboardVerticalOffset={0}
      >
        {/* Header — close butonu yok (tab page) */}
        <View style={[S.fullHeader, { paddingTop: insets.top + 6 }]}>
          <View
            style={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
            }}
          >
            <AIAvatar size={34} gradient={accentGradient} shadowColor={accentColor} />
            <View style={{ alignItems: 'flex-start' }}>
              <Text
                allowFontScaling={false}
                style={{ fontSize: 16, fontWeight: '600', color: TEXT, letterSpacing: -0.32 }}
              >
                FitAI Asistan
              </Text>
              <Text
                allowFontScaling={false}
                style={{
                  fontSize: 12,
                  color: pending ? accentColor : '#34C759',
                  marginTop: 1,
                  fontWeight: '500',
                }}
              >
                {pending ? 'Yazıyor…' : 'Çevrimiçi'}
              </Text>
            </View>
          </View>
        </View>

        {/* Mesajlar */}
        <BubbleList
          msgs={msgs}
          pending={pending}
          listRef={listRef}
          contentPadTop={12}
          contentPadBottom={20}
          accentColor={accentColor}
        />

        {/* Input */}
        <View style={[S.inputBar, { paddingBottom: Math.max(insets.bottom, 8) + 6 }]}>
          <InputBar
            value={aiInput}
            onChange={setAiInput}
            onSend={onSend}
            disabled={pending}
            accentColor={accentColor}
          />
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const S = StyleSheet.create({
  // Mini panel
  miniPanel: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: 'rgba(242,242,247,0.97)',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: SEP,
  },

  // Full panel
  fullPanel: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: BG,
    overflow: 'hidden',
  },
  inlineRoot: {
    flex: 1,
    backgroundColor: BG,
    overflow: 'hidden',
  },
  fullHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingBottom: 10,
    backgroundColor: 'rgba(250,245,248,0.78)',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: SEP,
  },
  // Halo — avatar arkasında "yayılan ışık" hissi.
  // Gerçek radial gradient RN'de yok; iç içe iki büyük şeffaf daire kullanıyoruz.
  haloWrap: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  halo: {
    width: 480,
    height: 480,
    borderRadius: 240,
    backgroundColor: 'rgba(255,45,85,0.06)',
  },
  haloInner: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(255,45,85,0.05)',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(118,118,128,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Bubbles
  bubble: {
    maxWidth: '78%',
    marginBottom: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 20,
  },
  bubbleUser: {
    alignSelf: 'flex-end',
    backgroundColor: ACCENT,
    borderBottomRightRadius: 5,
  },
  bubbleAI: {
    alignSelf: 'flex-start',
    backgroundColor: CARD,
    borderBottomLeftRadius: 5,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  bubbleText: { fontSize: 15, lineHeight: 21 },
  bubbleTextUser: { color: '#FFF', fontWeight: '500' },
  bubbleTextAI: { color: TEXT },

  typingBubble: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    minWidth: 56,
  },
  typingDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#8E8E93',
  },

  // Normal input bar (Apple-style)
  inputBar: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 10,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: CARD,
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: BORDER,
    paddingLeft: 16,
    paddingRight: 4,
    paddingVertical: 4,
    minHeight: 40,
  },
  textField: {
    flex: 1,
    fontSize: 16,
    color: TEXT,
    paddingVertical: Platform.OS === 'ios' ? 8 : 4,
    paddingRight: 6,
    maxHeight: 120,
  },
  sendBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  micIdleBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },

  // Recording bar
  recWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CARD,
    borderRadius: 24,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: BORDER,
    paddingLeft: 14,
    paddingRight: 4,
    height: 48,
    overflow: 'hidden',
  },
  recLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 64,
  },
  recDot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: REC_RED,
    marginRight: 7,
  },
  recTimer: {
    color: REC_RED,
    fontSize: 15,
    fontWeight: '500',
    fontVariant: ['tabular-nums'],
    minWidth: 36,
  },
  recWave: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    paddingHorizontal: 6,
  },
  recHint: {
    position: 'absolute',
    left: 0,
    right: 56,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  recHintText: {
    color: SUBTEXT,
    fontSize: 13,
    fontWeight: '500',
    backgroundColor: 'rgba(255,255,255,0.0)',
  },
  recRight: {
    width: 44,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recStopBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: REC_RED,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopSquare: {
    width: 13,
    height: 13,
    borderRadius: 2,
    backgroundColor: '#FFFFFF',
  },
});

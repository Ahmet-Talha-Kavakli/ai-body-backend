/**
 * Sesli mod — ChatGPT voice mode tarzı.
 * Akış: bas/bırak → Whisper STT → backend stream → TTS → otomatik çal.
 * Dolu ekran, ortada animasyonlu küre, durum metni altta.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@clerk/expo';
import { SymbolView } from 'expo-symbols';
import * as Haptics from 'expo-haptics';
import * as FileSystem from 'expo-file-system/legacy';
import {
  AudioModule,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioPlayer,
  RecordingPresets,
} from 'expo-audio';
import { Canvas, Circle, Group, BlurMask } from '@shopify/react-native-skia';
import { font, SLEEP, API_URL } from '../tracking/uyku/_components/theme';
import { streamAssistantMessage } from './_streamClient';

type VoiceState = 'idle' | 'recording' | 'transcribing' | 'thinking' | 'speaking';

export default function VoiceScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { getToken } = useAuth();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [profileName, setProfileName] = useState('Asistan');
  const [state, setState] = useState<VoiceState>('idle');
  const [transcript, setTranscript] = useState('');
  const [aiText, setAiText] = useState('');
  const [error, setError] = useState<string | null>(null);

  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const player = useAudioPlayer();

  // Pulse animasyonu (kürede)
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let loop: Animated.CompositeAnimation | null = null;
    if (state === 'recording' || state === 'speaking') {
      loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, {
            toValue: 1,
            duration: 700,
            useNativeDriver: true,
            easing: Easing.bezier(0.22, 1, 0.36, 1),
          }),
          Animated.timing(pulse, {
            toValue: 0,
            duration: 700,
            useNativeDriver: true,
            easing: Easing.bezier(0.4, 0, 1, 1),
          }),
        ]),
      );
      loop.start();
    } else {
      pulse.setValue(0);
    }
    return () => {
      loop?.stop();
    };
  }, [state, pulse]);

  // Mikrofon izni + audio mode
  useEffect(() => {
    (async () => {
      try {
        const perm = await AudioModule.requestRecordingPermissionsAsync();
        if (!perm.granted) {
          setError('Mikrofon izni gerekli');
          return;
        }
        await setAudioModeAsync({
          playsInSilentMode: true,
          allowsRecording: true,
        });
      } catch (e) {
        console.error('[voice/perm]', e);
        setError('Ses sistemi kurulamadı');
      }
    })();
  }, []);

  // Profil ismi
  useEffect(() => {
    (async () => {
      try {
        const tk = await getToken();
        const res = await fetch(`${API_URL}/api/assistant/profile`, {
          headers: { Authorization: `Bearer ${tk}` },
        });
        if (res.ok) {
          const data = await res.json();
          if (data.profile?.name) setProfileName(data.profile.name);
        }
      } catch {}
    })();
  }, [getToken]);

  const startRecording = useCallback(async () => {
    if (state !== 'idle') return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setError(null);
      setTranscript('');
      setAiText('');
      // Eğer çalıyor olabilir, durdur
      try {
        player.pause();
      } catch {}
      await recorder.prepareToRecordAsync();
      recorder.record();
      setState('recording');
    } catch (e) {
      console.error('[voice/record/start]', e);
      setError('Kayıt başlamadı');
    }
  }, [state, recorder, player]);

  const stopRecording = useCallback(async () => {
    if (state !== 'recording') return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await recorder.stop();
      const uri = recorder.uri;
      if (!uri) {
        setError('Kayıt boş');
        setState('idle');
        return;
      }
      setState('transcribing');

      // 1) Whisper'a gönder
      const tk = await getToken();
      const formData = new FormData();
      // expo-audio uri'si .m4a; OpenAI mp3/m4a/wav kabul eder
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      formData.append('file', { uri, name: 'audio.m4a', type: 'audio/m4a' } as any);

      const trRes = await fetch(`${API_URL}/api/assistant/voice/transcribe`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${tk}` },
        body: formData,
      });
      if (!trRes.ok) {
        setError('Yazıya dökülemedi');
        setState('idle');
        return;
      }
      const trData = await trRes.json();
      const text = (trData.text ?? '').trim();
      if (!text) {
        setError('Bir şey duyamadım');
        setState('idle');
        return;
      }
      setTranscript(text);
      setState('thinking');

      // 2) AI stream
      let aiAccumulated = '';
      await streamAssistantMessage({
        url: `${API_URL}/api/assistant/conversations/${id}/stream`,
        token: tk ?? '',
        content: text,
        onEvent: (event) => {
          if (event.type === 'text_delta') {
            aiAccumulated += event.text;
            setAiText(aiAccumulated);
          }
          if (event.type === 'done') {
            aiAccumulated = event.finalText;
            setAiText(aiAccumulated);
          }
        },
        onError: (e) => {
          console.error('[voice/stream]', e);
          setError('Cevap alınamadı');
          setState('idle');
        },
      });

      if (!aiAccumulated.trim()) {
        setState('idle');
        return;
      }

      // 3) TTS
      setState('speaking');
      const ttsRes = await fetch(`${API_URL}/api/assistant/voice/speak`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tk}`,
        },
        body: JSON.stringify({ text: aiAccumulated, voice: 'nova' }),
      });
      if (!ttsRes.ok) {
        setError('Ses üretilemedi');
        setState('idle');
        return;
      }
      // mp3'ü FileSystem'a yaz, expo-audio uri ile çal
      const arr = await ttsRes.arrayBuffer();
      const base64 = arrayBufferToBase64(arr);
      const fileUri = `${FileSystem.cacheDirectory}voice_${Date.now()}.mp3`;
      await FileSystem.writeAsStringAsync(fileUri, base64, {
        encoding: FileSystem.EncodingType.Base64,
      });
      player.replace({ uri: fileUri });
      player.play();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      console.error('[voice/stop]', e);
      setError('Bir sorun oldu');
      setState('idle');
    }
  }, [state, recorder, getToken, id, player]);

  // Player bitince idle'a dön
  useEffect(() => {
    const sub = player.addListener('playbackStatusUpdate', (status) => {
      if (status.didJustFinish) {
        setState('idle');
      }
    });
    return () => sub.remove();
  }, [player]);

  const stateLabel = (() => {
    switch (state) {
      case 'recording':
        return 'Dinliyorum...';
      case 'transcribing':
        return 'Yazıya döküyorum...';
      case 'thinking':
        return 'Düşünüyorum...';
      case 'speaking':
        return 'Konuşuyorum...';
      default:
        return 'Tıkla, konuş.';
    }
  })();

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[st.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <View style={st.header}>
          <Pressable onPress={() => router.back()} hitSlop={14} style={st.backBtn}>
            <SymbolView
              name="chevron.down"
              size={22}
              tintColor={SLEEP.text}
              fallback={<Text style={{ fontSize: 18 }}>⌄</Text>}
            />
          </Pressable>
          <Text style={st.headerTitle}>{profileName}</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Orta — küre */}
        <View style={st.center}>
          <VoiceOrb state={state} pulse={pulse} />
          <Text style={st.stateLabel}>{stateLabel}</Text>
          {transcript ? (
            <Text style={st.transcript} numberOfLines={3}>
              "{transcript}"
            </Text>
          ) : null}
          {aiText && state !== 'speaking' ? null : null}
          {error ? <Text style={st.error}>{error}</Text> : null}
        </View>

        {/* Alt — kontrol */}
        <View style={st.controls}>
          <Pressable
            onPressIn={startRecording}
            onPressOut={stopRecording}
            disabled={state !== 'idle' && state !== 'recording'}
            style={({ pressed }) => ({
              width: 88,
              height: 88,
              borderRadius: 44,
              backgroundColor: state === 'recording' ? '#FF3B30' : SLEEP.accent,
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: state === 'recording' ? '#FF3B30' : SLEEP.accent,
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: pressed ? 0.6 : 0.4,
              shadowRadius: 18,
              transform: [{ scale: pressed ? 0.96 : 1 }],
              opacity:
                state === 'transcribing' || state === 'thinking' || state === 'speaking' ? 0.5 : 1,
            })}
          >
            {state === 'transcribing' || state === 'thinking' ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <SymbolView
                name={state === 'recording' ? 'stop.fill' : 'mic.fill'}
                size={32}
                tintColor="#fff"
                fallback={<Text style={{ color: '#fff', fontSize: 28 }}>🎙</Text>}
              />
            )}
          </Pressable>
          <Text style={st.hint}>Basılı tut ve konuş</Text>
        </View>
      </View>
    </>
  );
}

function VoiceOrb({ state, pulse }: { state: VoiceState; pulse: Animated.Value }) {
  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.15] });
  const isActive =
    state === 'recording' ||
    state === 'speaking' ||
    state === 'thinking' ||
    state === 'transcribing';

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Canvas style={{ width: 220, height: 220 }}>
        <Group>
          <Circle cx={110} cy={110} r={92} color={isActive ? SLEEP.accent : '#D1D1D6'}>
            <BlurMask blur={28} style="solid" />
          </Circle>
          <Circle cx={110} cy={110} r={70} color={isActive ? '#7D5FFF' : SLEEP.accentSoft} />
          <Circle cx={110} cy={110} r={50} color="#FFFFFF" opacity={0.25} />
        </Group>
      </Canvas>
    </Animated.View>
  );
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  // eslint-disable-next-line no-undef
  return globalThis.btoa(binary);
}

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: SLEEP.page },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8 },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: {
    flex: 1,
    fontFamily: font.semibold,
    fontSize: 16,
    color: SLEEP.text,
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  stateLabel: {
    fontFamily: font.semibold,
    fontSize: 17,
    color: SLEEP.text,
    marginTop: 28,
    letterSpacing: -0.3,
  },
  transcript: {
    fontFamily: font.regular,
    fontSize: 14,
    color: SLEEP.textMuted,
    marginTop: 14,
    textAlign: 'center',
    lineHeight: 20,
    fontStyle: 'italic',
  },
  error: { fontFamily: font.medium, fontSize: 13, color: SLEEP.danger, marginTop: 12 },
  controls: { alignItems: 'center', paddingBottom: 24, gap: 10 },
  hint: { fontFamily: font.regular, fontSize: 12, color: SLEEP.textDim },
});

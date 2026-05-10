/**
 * V4.5 Madde 3 — Mobile voice service (expo-audio)
 *
 * Recorder hook ile chat screen'de yönetiliyor — bu dosya sadece
 * permission, upload ve playback yardımcılarını içerir.
 */

import {
  setAudioModeAsync,
  setIsAudioActiveAsync,
  createAudioPlayer,
  requestRecordingPermissionsAsync,
} from 'expo-audio';
import { API_URL } from '../../../lib/theme';

export interface RecordedAudio {
  uri: string;
  durationMs: number;
}

export interface TranscribeResult {
  audioUrl: string;
  transcript: string;
  durationSec: number;
  durationMs: number;
  tone: {
    wordsPerSecond: number;
    paceLabel: string;
    pauseCount: number;
    hesitationLevel: string;
    intensityHint: string;
    summary: string;
  };
}

export async function ensureMicPermission(): Promise<boolean> {
  const res = await requestRecordingPermissionsAsync();
  return res.granted;
}

export async function prepareRecordingMode(): Promise<void> {
  await setAudioModeAsync({
    allowsRecording: true,
    playsInSilentMode: true,
  });
  await setIsAudioActiveAsync(true);
}

export async function preparePlaybackMode(): Promise<void> {
  await setAudioModeAsync({
    allowsRecording: false,
    playsInSilentMode: true,
  });
}

/**
 * Backend'e yolla, transcript + ton dön.
 */
export async function uploadAndTranscribe(
  token: string,
  characterId: string,
  audio: RecordedAudio,
): Promise<TranscribeResult> {
  const form = new FormData();
  form.append('audio', {
    uri: audio.uri,
    name: `voice-${Date.now()}.m4a`,
    type: 'audio/m4a',
  } as any);

  const res = await fetch(`${API_URL}/api/assistant/characters/${characterId}/voice/transcribe`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  if (!res.ok) {
    const err = await res.text().catch(() => '');
    throw new Error(`transcribe failed: ${res.status} ${err}`);
  }
  return res.json();
}

// === Playback ===

let activePlayer: any = null;

export async function playAudio(url: string, onFinish?: () => void): Promise<any | null> {
  await stopPlayback();
  try {
    await preparePlaybackMode();
    const player = createAudioPlayer({ uri: url });
    activePlayer = player;
    if (onFinish) {
      const sub = player.addListener('playbackStatusUpdate', (status: any) => {
        if (status?.didJustFinish) {
          onFinish();
          stopPlayback().catch(() => {});
          sub?.remove?.();
        }
      });
    }
    player.play();
    return player;
  } catch (e) {
    return null;
  }
}

export async function stopPlayback(): Promise<void> {
  if (!activePlayer) return;
  try {
    activePlayer.pause();
    activePlayer.remove?.();
  } catch {}
  activePlayer = null;
}

/**
 * V4.6 M71 — Aktif player için playback rate set et (1, 1.5, 2)
 */
export function setPlaybackRate(rate: number): void {
  if (!activePlayer) return;
  try {
    activePlayer.setPlaybackRate?.(rate);
  } catch {}
}

/**
 * V4.6 M71 — Aktif player'ı belirli bir saniyeye al (scrub)
 */
export function seekPlayback(seconds: number): void {
  if (!activePlayer) return;
  try {
    activePlayer.seekTo?.(seconds);
  } catch {}
}

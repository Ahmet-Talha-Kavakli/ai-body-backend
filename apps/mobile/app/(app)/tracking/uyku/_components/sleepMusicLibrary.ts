/**
 * Yerel uyku müzik kütüphanesi.
 *
 * `uri` — uzak ses (CC0). expo-audio loop ile çalar.
 * `localAsset` — opsiyonel: assets/sounds/sleep/<id>.mp3 dosyası varsa offline çalar.
 *
 * v1.1: backend SleepMusicTrack modelinden senkron edilebilir.
 */

export type SleepMusicCategory =
  | 'rain'
  | 'white_noise'
  | 'brown_noise'
  | 'nature'
  | 'piano'
  | 'lofi'
  | 'heartbeat'
  | 'wave';

export interface SleepMusicTrack {
  id: string;
  name: string;
  category: SleepMusicCategory;
  durationSec: number;
  uri: string;
  emoji: string;
  description: string;
}

// Pixabay & Freesound CC0 — uzun loop'lu ambient kaynaklar.
// NOT: Production'da kendi CDN'inize kopyalayın (rate-limit ve uptime).
export const SLEEP_MUSIC: SleepMusicTrack[] = [
  {
    id: 'rain',
    name: 'Yağmur',
    category: 'rain',
    durationSec: 600,
    uri: 'https://cdn.pixabay.com/audio/2022/03/15/audio_1d6c1e88c2.mp3',
    emoji: '🌧️',
    description: 'Pencerede sakin yağmur',
  },
  {
    id: 'white_noise',
    name: 'Beyaz Gürültü',
    category: 'white_noise',
    durationSec: 600,
    uri: 'https://cdn.pixabay.com/audio/2022/10/13/audio_852efd6b6e.mp3',
    emoji: '🌫️',
    description: 'Düz spektrum, derin uyku',
  },
  {
    id: 'brown_noise',
    name: 'Kahverengi Gürültü',
    category: 'brown_noise',
    durationSec: 600,
    uri: 'https://cdn.pixabay.com/audio/2023/09/05/audio_cefac17b67.mp3',
    emoji: '🟤',
    description: 'Düşük frekans, beyne huzur',
  },
  {
    id: 'forest',
    name: 'Orman',
    category: 'nature',
    durationSec: 600,
    uri: 'https://cdn.pixabay.com/audio/2022/03/10/audio_6a76b7c73c.mp3',
    emoji: '🌲',
    description: 'Kuş sesi ve yaprak hışırtısı',
  },
  {
    id: 'wave',
    name: 'Okyanus',
    category: 'wave',
    durationSec: 600,
    uri: 'https://cdn.pixabay.com/audio/2022/03/15/audio_5db9e3f46d.mp3',
    emoji: '🌊',
    description: 'Sahile vuran dalgalar',
  },
  {
    id: 'piano',
    name: 'Sakin Piyano',
    category: 'piano',
    durationSec: 600,
    uri: 'https://cdn.pixabay.com/audio/2022/05/27/audio_1808fbf07a.mp3',
    emoji: '🎹',
    description: 'Yumuşak melodi',
  },
  {
    id: 'lofi',
    name: 'Lo-fi',
    category: 'lofi',
    durationSec: 600,
    uri: 'https://cdn.pixabay.com/audio/2023/07/30/audio_e0908e8569.mp3',
    emoji: '🎧',
    description: 'Düşük tempo, hipnotik',
  },
  {
    id: 'heartbeat',
    name: 'Kalp Atışı',
    category: 'heartbeat',
    durationSec: 600,
    uri: 'https://cdn.pixabay.com/audio/2022/02/22/audio_d0c6ff1bdd.mp3',
    emoji: '❤️',
    description: 'Anne karnındaki gibi',
  },
];

export const SLEEP_TIMER_OPTIONS = [
  { label: 'Kapalı', minutes: 0 },
  { label: '15 dk', minutes: 15 },
  { label: '30 dk', minutes: 30 },
  { label: '45 dk', minutes: 45 },
  { label: '1 saat', minutes: 60 },
  { label: 'Sabaha kadar', minutes: -1 },
];

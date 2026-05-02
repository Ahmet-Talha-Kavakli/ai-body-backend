/**
 * Beyaz gürültü + ambians sesleri — Araçlar/Sesler sayfası için.
 * Tüm dosyalar Freesound'dan indirilmiş CC0 sesler, Supabase storage'a yüklü.
 */

export type SoundCategory =
  | 'yagmur'
  | 'doga'
  | 'gurultu'
  | 'muzik'
  | 'ev'
  | 'asmr'
  | 'sehir'
  | 'cocuk';

export interface Sound {
  id: string;
  name: string;
  category: SoundCategory;
  emoji: string;
  description: string;
  uri: string;
  durationSec: number;
}

export const SOUND_CATEGORIES: Array<{ key: SoundCategory | 'all'; label: string; emoji: string }> =
  [
    { key: 'all', label: 'Hepsi', emoji: '✨' },
    { key: 'yagmur', label: 'Yağmur', emoji: '🌧️' },
    { key: 'doga', label: 'Doğa', emoji: '🌿' },
    { key: 'gurultu', label: 'Gürültü', emoji: '🌫️' },
    { key: 'muzik', label: 'Müzik', emoji: '🎵' },
    { key: 'ev', label: 'Ev', emoji: '🏠' },
    { key: 'asmr', label: 'ASMR', emoji: '👂' },
    { key: 'sehir', label: 'Şehir', emoji: '🚆' },
    { key: 'cocuk', label: 'Çocuk', emoji: '👶' },
  ];

const BASE = 'https://bollxgwrevnwjhnzdwcb.supabase.co/storage/v1/object/public/sleep-sounds';

export const SOUNDS: Sound[] = [
  // YAĞMUR (4)
  {
    id: 'rain_light',
    name: 'Hafif Yağmur',
    category: 'yagmur',
    emoji: '🌦️',
    description: 'Cama düşen damlalar',
    uri: `${BASE}/rain_light.mp3`,
    durationSec: 120,
  },
  {
    id: 'rain_storm',
    name: 'Fırtına',
    category: 'yagmur',
    emoji: '⛈️',
    description: 'Uzaktan gürleyen',
    uri: `${BASE}/rain_storm.mp3`,
    durationSec: 230,
  },
  {
    id: 'rain_roof',
    name: 'Çatıda Yağmur',
    category: 'yagmur',
    emoji: '🏠',
    description: 'Sıcak ve güvenli',
    uri: `${BASE}/rain_roof.mp3`,
    durationSec: 32,
  },
  {
    id: 'rain_forest',
    name: 'Ormanda Yağmur',
    category: 'yagmur',
    emoji: '🌲',
    description: 'Yapraklara düşen',
    uri: `${BASE}/rain_forest.mp3`,
    durationSec: 124,
  },

  // DOĞA (6)
  {
    id: 'forest',
    name: 'Orman',
    category: 'doga',
    emoji: '🌲',
    description: 'Kuş ve yapraklar',
    uri: `${BASE}/forest.mp3`,
    durationSec: 257,
  },
  {
    id: 'ocean',
    name: 'Okyanus',
    category: 'doga',
    emoji: '🌊',
    description: 'Sahile vuran dalgalar',
    uri: `${BASE}/ocean.mp3`,
    durationSec: 215,
  },
  {
    id: 'stream',
    name: 'Dere',
    category: 'doga',
    emoji: '💧',
    description: 'Akan su sesi',
    uri: `${BASE}/stream.mp3`,
    durationSec: 87,
  },
  {
    id: 'wind',
    name: 'Rüzgar',
    category: 'doga',
    emoji: '🍃',
    description: 'Sakin esinti',
    uri: `${BASE}/wind.mp3`,
    durationSec: 301,
  },
  {
    id: 'birds',
    name: 'Kuş Sesi',
    category: 'doga',
    emoji: '🐦',
    description: 'Sabah konseri',
    uri: `${BASE}/birds.mp3`,
    durationSec: 434,
  },
  {
    id: 'fireplace',
    name: 'Şömine',
    category: 'doga',
    emoji: '🔥',
    description: 'Çıtırdayan ateş',
    uri: `${BASE}/fireplace.mp3`,
    durationSec: 102,
  },

  // GÜRÜLTÜ (4)
  {
    id: 'white',
    name: 'Beyaz Gürültü',
    category: 'gurultu',
    emoji: '⬜',
    description: 'Düz spektrum',
    uri: `${BASE}/white.mp3`,
    durationSec: 62,
  },
  {
    id: 'pink',
    name: 'Pembe Gürültü',
    category: 'gurultu',
    emoji: '🌸',
    description: 'Yumuşak frekans',
    uri: `${BASE}/pink.mp3`,
    durationSec: 508,
  },
  {
    id: 'brown',
    name: 'Kahverengi',
    category: 'gurultu',
    emoji: '🟤',
    description: 'Düşük frekans',
    uri: `${BASE}/brown.mp3`,
    durationSec: 30,
  },
  {
    id: 'fan',
    name: 'Vantilatör',
    category: 'gurultu',
    emoji: '💨',
    description: 'Sürekli hum',
    uri: `${BASE}/fan.mp3`,
    durationSec: 60,
  },

  // MÜZİK (5)
  {
    id: 'piano',
    name: 'Sakin Piyano',
    category: 'muzik',
    emoji: '🎹',
    description: 'Yumuşak melodi',
    uri: `${BASE}/piano.mp3`,
    durationSec: 86,
  },
  {
    id: 'lofi',
    name: 'Lo-fi',
    category: 'muzik',
    emoji: '🎧',
    description: 'Düşük tempo',
    uri: `${BASE}/lofi.mp3`,
    durationSec: 128,
  },
  {
    id: 'ambient',
    name: 'Ambient Pad',
    category: 'muzik',
    emoji: '🎼',
    description: 'Hipnotik dokular',
    uri: `${BASE}/ambient.mp3`,
    durationSec: 88,
  },
  {
    id: 'guitar',
    name: 'Klasik Gitar',
    category: 'muzik',
    emoji: '🎸',
    description: 'Akustik teller',
    uri: `${BASE}/guitar.mp3`,
    durationSec: 70,
  },
  {
    id: 'harp',
    name: 'Harp',
    category: 'muzik',
    emoji: '🪕',
    description: 'Eteric ve hafif',
    uri: `${BASE}/harp.mp3`,
    durationSec: 110,
  },

  // EV (3)
  {
    id: 'clock',
    name: 'Saat Tik-Tak',
    category: 'ev',
    emoji: '⏰',
    description: 'Eski duvar saati',
    uri: `${BASE}/clock.mp3`,
    durationSec: 55,
  },
  {
    id: 'washer',
    name: 'Çamaşır Makinesi',
    category: 'ev',
    emoji: '🌀',
    description: 'Ritmik ses',
    uri: `${BASE}/washer.mp3`,
    durationSec: 33,
  },
  {
    id: 'ac',
    name: 'Klima',
    category: 'ev',
    emoji: '❄️',
    description: 'Sürekli akış',
    uri: `${BASE}/ac.mp3`,
    durationSec: 43,
  },

  // ASMR (3)
  {
    id: 'whisper',
    name: 'Fısıltı',
    category: 'asmr',
    emoji: '🤫',
    description: 'Sakin nefes',
    uri: `${BASE}/whisper.mp3`,
    durationSec: 408,
  },
  {
    id: 'paper',
    name: 'Kağıt Hışırtısı',
    category: 'asmr',
    emoji: '📜',
    description: 'Hassas dokunuş',
    uri: `${BASE}/paper.mp3`,
    durationSec: 55,
  },
  {
    id: 'purring',
    name: 'Kedi Mırıltısı',
    category: 'asmr',
    emoji: '🐱',
    description: 'Sıcacık titreşim',
    uri: `${BASE}/purring.mp3`,
    durationSec: 533,
  },

  // ŞEHİR (2)
  {
    id: 'train',
    name: 'Tren',
    category: 'sehir',
    emoji: '🚆',
    description: 'Vagonda yolculuk',
    uri: `${BASE}/train.mp3`,
    durationSec: 158,
  },
  {
    id: 'cafe',
    name: 'Kafe',
    category: 'sehir',
    emoji: '☕',
    description: 'Uzak gevezelik',
    uri: `${BASE}/cafe.mp3`,
    durationSec: 143,
  },

  // ÇOCUK (3)
  {
    id: 'heartbeat',
    name: 'Kalp Atışı',
    category: 'cocuk',
    emoji: '❤️',
    description: 'Anne karnındaki gibi',
    uri: `${BASE}/heartbeat.mp3`,
    durationSec: 38,
  },
  {
    id: 'lullaby',
    name: 'Ninni',
    category: 'cocuk',
    emoji: '🌙',
    description: 'Yumuşak melodi',
    uri: `${BASE}/lullaby.mp3`,
    durationSec: 60,
  },
  {
    id: 'cradle',
    name: 'Beşik Sallanma',
    category: 'cocuk',
    emoji: '🛏️',
    description: 'Ritmik salınım',
    uri: `${BASE}/cradle.mp3`,
    durationSec: 20,
  },
];

export const SLEEP_TIMER_OPTIONS_SOUNDS = [
  { label: 'Kapalı', minutes: 0 },
  { label: '15 dk', minutes: 15 },
  { label: '30 dk', minutes: 30 },
  { label: '60 dk', minutes: 60 },
  { label: 'Sabaha', minutes: -1 },
];
